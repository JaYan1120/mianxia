(() => {
  'use strict';

  const ROOT_SELECTOR = '#article-body, .article-cover';
  const IMAGE_SELECTOR = '#article-body img, .article-cover img';
  let lightbox = null;
  let lastFocus = null;

  const escapeHtml = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

  function closeLightbox() {
    if (!lightbox) return;
    const node = lightbox;
    lightbox = null;
    node.classList.remove('is-open');
    document.body.classList.remove('reader-lightbox-open');
    node.remove();
    if (lastFocus && document.contains(lastFocus)) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function openLightbox(img) {
    if (lightbox) closeLightbox();
    lastFocus = document.activeElement;
    const node = document.createElement('div');
    node.className = 'reading-lightbox';
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-modal', 'true');
    node.setAttribute('aria-label', '查看大图');
    node.innerHTML = `
      <button type="button" class="reading-lightbox-close" aria-label="关闭大图">×</button>
      <figure class="reading-lightbox-figure">
        <img src="${escapeHtml(img.currentSrc || img.src)}" alt="${escapeHtml(img.alt || '')}">
        ${img.alt ? `<figcaption>${escapeHtml(img.alt)}</figcaption>` : ''}
      </figure>`;
    document.body.appendChild(node);
    document.body.classList.add('reader-lightbox-open');
    lightbox = node;
    requestAnimationFrame(() => node.classList.add('is-open'));
    const close = node.querySelector('.reading-lightbox-close');
    close.focus({ preventScroll: true });
    setTimeout(() => close.focus({ preventScroll: true }), 30);
    node.addEventListener('click', (event) => {
      if (event.target === node) closeLightbox();
    });
    close.addEventListener('click', closeLightbox);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        close.focus();
      }
    });
  }

  function onEscape(event) {
    if (event.key === 'Escape' && lightbox) {
      event.preventDefault();
      closeLightbox();
    }
  }

  document.addEventListener('click', (event) => {
    const img = event.target.closest('.reader-zoomable');
    if (!img || !img.closest(ROOT_SELECTOR)) return;
    if (img.closest('a')) return;
    event.preventDefault();
    openLightbox(img);
  });

  document.addEventListener('keydown', (event) => {
    onEscape(event);
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.reader-zoomable')) {
      event.preventDefault();
      openLightbox(event.target);
    }
  });
  window.addEventListener('keydown', onEscape);

  function enhance() {
    addCopyButtons();
    addImageBehavior();
  }

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
