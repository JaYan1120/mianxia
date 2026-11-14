(() => {
  'use strict';

  const ROOT_SELECTOR = '#article-body, .article-cover';
  const IMAGE_SELECTOR = '#article-body img, .article-cover img';
  const MAX_SCALE = 5;
  const ZOOM_STEP = 1.25;

  let lightbox = null;
  let lastFocus = null;
  let sourceImage = null;
  let stage = null;
  let media = null;
  let zoomLabel = null;
  let zoom = { scale: 1, x: 0, y: 0 };
  let inerted = [];
  let pointers = new Map();
  let drag = null;
  let pinch = null;
  let suppressClick = false;
  let lastTap = { time: 0, x: 0, y: 0 };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') document.documentElement.classList.add('keyboard-nav');
  }, true);
  document.addEventListener('pointerdown', () => {
    document.documentElement.classList.remove('keyboard-nav');
  }, true);

  const escapeHtml = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    area.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  function addCopyButtons(scope = document) {
    scope.querySelectorAll('#article-body pre').forEach((pre) => {
      if (pre.dataset.copyReady === '1' || pre.closest('.reading-lightbox')) return;
      pre.dataset.copyReady = '1';
      const code = pre.querySelector('code');
      const source = (code ? code.textContent : pre.textContent) || '';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reading-code-copy';
      button.textContent = '复制';
      button.setAttribute('aria-label', '复制代码');
      button.addEventListener('click', async () => {
        try {
          await copyText(source);
          button.textContent = '已复制';
          button.classList.add('is-copied');
          setTimeout(() => {
            button.textContent = '复制';
            button.classList.remove('is-copied');
          }, 1600);
        } catch {
          button.textContent = '复制失败';
          setTimeout(() => { button.textContent = '复制'; }, 1600);
        }
      });
      pre.appendChild(button);
    });
  }

  function addImageBehavior(scope = document) {
    scope.querySelectorAll(IMAGE_SELECTOR).forEach((img) => {
      if (img.dataset.readerReady === '1') return;
      img.dataset.readerReady = '1';
      if (!img.closest('.article-cover')) img.loading = 'lazy';
      img.decoding = 'async';
      img.classList.add('reader-zoomable');
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `查看大图：${img.alt || '文章图片'}`);
    });
  }

  function limits() {
    if (!stage || !media) return { min: 1, max: 1, baseW: 1, baseH: 1, stageW: 1, stageH: 1 };
    const baseW = media.offsetWidth || 1;
    const baseH = media.offsetHeight || 1;
    const natural = media.naturalWidth ? media.naturalWidth / baseW : 0;
    const max = Math.max(2, Math.min(MAX_SCALE, natural || 2));
    return { min: 1, max, baseW, baseH, stageW: stage.clientWidth, stageH: stage.clientHeight };
  }

  function commit(next) {
    if (!lightbox || !media) return;
    const { min, max, baseW, baseH, stageW, stageH } = limits();
    const scale = clamp(next.scale, min, max);
    const maxX = Math.max(0, (baseW * scale - stageW) / 2);
    const maxY = Math.max(0, (baseH * scale - stageH) / 2);
    zoom = {
      scale,
      x: clamp(next.x || 0, -maxX, maxX),
      y: clamp(next.y || 0, -maxY, maxY)
    };
    const transformed = zoom.scale > 1.001;
    media.style.transform = transformed
      ? `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`
      : '';
    lightbox.classList.toggle('is-zoomed', transformed);
    media.style.cursor = transformed ? (drag && drag.moved ? 'grabbing' : 'grab') : 'zoom-in';
    if (zoomLabel) zoomLabel.textContent = Math.round(zoom.scale * 100) + '%';
  }

  function stagePoint(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2
    };
  }

  function zoomAt(clientX, clientY, targetScale) {
    const { min, max } = limits();
    const scale = clamp(targetScale, min, max);
    const point = stagePoint(clientX, clientY);
    const factor = scale / zoom.scale;
    commit({
      scale,
      x: point.x - factor * (point.x - zoom.x),
      y: point.y - factor * (point.y - zoom.y)
    });
  }

  function centerZoom(targetScale) {
    const rect = stage.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, targetScale);
  }

  function toggleZoom(clientX, clientY) {
    if (zoom.scale > 1.001) {
      commit({ scale: 1, x: 0, y: 0 });
      return;
    }
    const { max } = limits();
    zoomAt(clientX, clientY, Math.min(max, 2.5));
  }

  function actualSize() {
    const { baseW, min, max } = limits();
    const ratio = media && media.naturalWidth ? media.naturalWidth / baseW : 1;
    const rect = stage.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, clamp(ratio, min, max));
  }

  function focusables() {
    if (!lightbox) return [];
    return [...lightbox.querySelectorAll('button')].filter((el) => !el.disabled && el.offsetParent !== null);
  }

  function cycleFocus(backwards) {
    const list = focusables();
    if (!list.length) return;
    const index = list.indexOf(document.activeElement);
    const next = index < 0
      ? (backwards ? list.length - 1 : 0)
      : (index + (backwards ? -1 : 1) + list.length) % list.length;
    list[next].focus({ preventScroll: true });
  }

  function onKeyDown(event) {
    if (!lightbox) return;
    const key = event.key;
    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
      return;
    }
    if (key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      cycleFocus(event.shiftKey);
      return;
    }
    if (key === '+' || key === '=' || key === 'Add') {
      event.preventDefault();
      event.stopPropagation();
      centerZoom(zoom.scale * ZOOM_STEP);
      return;
    }
    if (key === '-' || key === '_' || key === 'Subtract') {
      event.preventDefault();
      event.stopPropagation();
      centerZoom(zoom.scale / ZOOM_STEP);
      return;
    }
    if (key === '0') {
      event.preventDefault();
      event.stopPropagation();
      commit({ scale: 1, x: 0, y: 0 });
      return;
    }
    // 大图打开时不允许页面快捷键（Ctrl+K 搜索、Escape 关浮层等）穿透
    event.stopPropagation();
  }

  function onWheel(event) {
    if (!lightbox) return;
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0018);
    zoomAt(event.clientX, event.clientY, zoom.scale * factor);
  }

  function onPointerDown(event) {
    if (!lightbox) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        scale: zoom.scale,
        x: zoom.x,
        y: zoom.y,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2
      };
      drag = null;
    } else if (pointers.size === 1) {
      drag = { x: event.clientX, y: event.clientY, startX: zoom.x, startY: zoom.y, moved: false };
    }
    try { stage.setPointerCapture(event.pointerId); } catch { /* ignore */ }
  }

  function onPointerMove(event) {
    if (!lightbox || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const { min, max } = limits();
      const scale = clamp(pinch.scale * (dist / pinch.dist), min, max);
      const start = stagePoint(pinch.cx, pinch.cy);
      const point = stagePoint(cx, cy);
      const factor = scale / pinch.scale;
      commit({
        scale,
        x: point.x - factor * (start.x - pinch.x),
        y: point.y - factor * (start.y - pinch.y)
      });
      return;
    }
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
    if (zoom.scale > 1.001) {
      commit({ scale: zoom.scale, x: drag.startX + dx, y: drag.startY + dy });
    }
  }

  function onPointerUp(event) {
    if (!pointers.has(event.pointerId)) return;
    const wasPinch = Boolean(pinch);
    const moved = drag ? drag.moved : false;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      if (moved || wasPinch) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
      } else if (event.pointerType === 'touch') {
        const now = Date.now();
        const near = Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30;
        if (now - lastTap.time < 320 && near) {
          lastTap = { time: 0, x: 0, y: 0 };
          toggleZoom(event.clientX, event.clientY);
        } else {
          lastTap = { time: now, x: event.clientX, y: event.clientY };
        }
      }
      drag = null;
      if (media) media.style.cursor = zoom.scale > 1.001 ? 'grab' : 'zoom-in';
    }
    try { stage.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
  }

  function onOverlayClick(event) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (event.target.closest('.reading-lightbox-toolbar, .reading-lightbox-close')) return;
    if (event.target === media) return;
    if (event.detail > 1) return;
    closeLightbox();
  }

  function lockScroll(locked) {
    document.documentElement.classList.toggle('reader-lightbox-open', locked);
    document.body.classList.toggle('reader-lightbox-open', locked);
  }

  function inertBackground(node) {
    inerted = [...document.body.children]
      .filter((el) => el !== node && el.nodeType === 1)
      .map((el) => ({ el, value: Boolean(el.inert) }));
    inerted.forEach((entry) => { entry.el.inert = true; });
  }

  function closeLightbox() {
    if (!lightbox) return;
    const node = lightbox;
    const focusTarget = sourceImage && sourceImage.isConnected
      ? sourceImage
      : (lastFocus && lastFocus.isConnected ? lastFocus : null);
    lightbox = null;
    document.removeEventListener('keydown', onKeyDown, true);
    pointers.clear();
    drag = null;
    pinch = null;
    suppressClick = false;
    node.classList.remove('is-open');
    lockScroll(false);
    inerted.forEach((entry) => { entry.el.inert = entry.value; });
    inerted = [];
    media = null;
    stage = null;
    zoomLabel = null;
    zoom = { scale: 1, x: 0, y: 0 };
    node.remove();
    lastFocus = null;
    sourceImage = null;
    if (focusTarget && document.contains(focusTarget)) {
      focusTarget.focus({ preventScroll: true });
    }
  }

  function openLightbox(img) {
    if (lightbox) closeLightbox();
    lastFocus = document.activeElement;
    sourceImage = img;
    const node = document.createElement('div');
    node.className = 'reading-lightbox';
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-modal', 'true');
    node.setAttribute('aria-label', '查看大图');
    const src = escapeHtml(img.currentSrc || img.src);
    const alt = escapeHtml(img.alt || '');
    node.innerHTML = `
      <button type="button" class="reading-lightbox-close" aria-label="关闭大图">×</button>
      <div class="reading-lightbox-stage">
        <figure class="reading-lightbox-figure">
          <img class="reading-lightbox-img" src="${src}" alt="${alt}" draggable="false" decoding="async">
          ${img.alt ? `<figcaption class="reading-lightbox-caption">${escapeHtml(img.alt)}</figcaption>` : ''}
        </figure>
      </div>
      <div class="reading-lightbox-toolbar" role="group" aria-label="缩放">
        <button type="button" data-lightbox-zoom="out" aria-label="缩小">−</button>
        <output class="reading-lightbox-zoom" aria-live="polite">100%</output>
        <button type="button" data-lightbox-zoom="in" aria-label="放大">+</button>
        <button type="button" data-lightbox-zoom="actual" aria-label="按原始像素显示">1:1</button>
      </div>`;
    document.body.appendChild(node);
    lightbox = node;
    stage = node.querySelector('.reading-lightbox-stage');
    media = node.querySelector('.reading-lightbox-img');
    zoomLabel = node.querySelector('.reading-lightbox-zoom');
    zoom = { scale: 1, x: 0, y: 0 };
    lockScroll(true);
    inertBackground(node);
    document.addEventListener('keydown', onKeyDown, true);

    node.addEventListener('click', onOverlayClick);
    node.querySelector('.reading-lightbox-close').addEventListener('click', closeLightbox);
    node.querySelectorAll('[data-lightbox-zoom]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = button.dataset.lightboxZoom;
        if (action === 'in') centerZoom(zoom.scale * ZOOM_STEP);
        else if (action === 'out') centerZoom(zoom.scale / ZOOM_STEP);
        else if (action === 'actual') actualSize();
      });
    });
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('dblclick', (event) => {
      event.preventDefault();
      toggleZoom(event.clientX, event.clientY);
    });
    media.addEventListener('load', () => { if (lightbox) commit(zoom); });

    requestAnimationFrame(() => node.classList.add('is-open'));
    const close = node.querySelector('.reading-lightbox-close');
    close.focus({ preventScroll: true });
    setTimeout(() => { if (lightbox) close.focus({ preventScroll: true }); }, 30);
  }

  function enhance() {
    addCopyButtons();
    addImageBehavior();
  }

  document.addEventListener('click', (event) => {
    const img = event.target.closest('.reader-zoomable');
    if (!img || !img.closest(ROOT_SELECTOR)) return;
    if (img.closest('a')) return;
    event.preventDefault();
    openLightbox(img);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.reader-zoomable')) {
      event.preventDefault();
      openLightbox(event.target);
    }
  });

  document.addEventListener('mianxia:page-ready', () => {
    if (lightbox) closeLightbox();
  });

  window.MianxiaReading = { enhance, openLightbox, closeLightbox, isOpen: () => Boolean(lightbox) };
  document.addEventListener('mianxia:page-ready', enhance);
  window.addEventListener('load', enhance);
  enhance();
  if ('MutationObserver' in window) {
    new MutationObserver(() => {
      if (document.querySelector('#article-body, .article-cover')) enhance();
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
