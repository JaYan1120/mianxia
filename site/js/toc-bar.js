/* 眠夏 · 移动端吸顶目录条
   默认只显示当前章节，不自动展开；面板只在读者点击后打开。
   同时被动态站（app.js）和静态站（static.js）调用：window.MianxiaTocBar.setup()。
   返回清理函数；页面切换时必须调用。 */
(function () {
  'use strict';

  function setup() {
    const root = document.querySelector('[data-toc-sticky]');
    if (!root) return null;
    const bar = root.querySelector('[data-toc-toggle]');
    const panel = root.querySelector('[data-toc-panel]');
    const now = root.querySelector('[data-toc-now]');
    const count = root.querySelector('[data-toc-count]');
    if (!bar || !panel || !now) return null;

    const links = Array.from(panel.querySelectorAll('[data-toc-sticky-link]'));
    const headings = links.map((link) => document.getElementById(link.dataset.tocStickyLink)).filter(Boolean);
    if (!headings.length) return null;

    const header = document.querySelector('.site-header');
    let shown = false;
    let open = false;
    let frame = 0;

    const headerHeight = () => (header ? header.getBoundingClientRect().height : 0);
    const barHeight = () => Math.round(bar.getBoundingClientRect().height) || 40;

    function renderNow(index) {
      if (index < 0) {
        now.textContent = '本文 ' + headings.length + ' 节';
        if (count) count.textContent = '';
        return;
      }
      now.textContent = headings[index].textContent.trim();
      if (count) count.textContent = (index + 1) + ' / ' + headings.length;
    }

    function closePanel(restoreFocus) {
      if (!open) return;
      open = false;
      root.classList.remove('is-open');
      bar.setAttribute('aria-expanded', 'false');
      const mask = root.querySelector('.toc-sticky-mask');
      if (mask) mask.remove();
      document.documentElement.classList.remove('toc-open');
      document.body.classList.remove('toc-open');
      document.removeEventListener('keydown', onKeydown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      if (restoreFocus) bar.focus({ preventScroll: true });
    }

    function openPanel() {
      if (open) return;
      open = true;
      root.classList.add('is-open');
      bar.setAttribute('aria-expanded', 'true');
      const mask = document.createElement('div');
      mask.className = 'toc-sticky-mask';
      mask.setAttribute('aria-hidden', 'true');
      root.insertBefore(mask, panel);
      document.documentElement.classList.add('toc-open');
      document.body.classList.add('toc-open');
      document.addEventListener('keydown', onKeydown, true);
      document.addEventListener('pointerdown', onPointerDown, true);
    }

    function onKeydown(event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closePanel(true);
    }

    function onPointerDown(event) {
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (!path.includes(root)) closePanel(false);
    }

    function setShown(next) {
      if (shown === next) return;
      shown = next;
      root.classList.toggle('is-shown', shown);
      if (!shown) closePanel(false);
    }

    function measure() {
      frame = 0;
      if (window.matchMedia('(min-width: 1061px)').matches) {
        setShown(false);
        closePanel(false);
        return;
      }
      const edge = headerHeight();
      const firstTop = headings[0].getBoundingClientRect().top;
      if (!shown && firstTop < edge - 4) setShown(true);
      else if (shown && firstTop > edge + 28) setShown(false);

      const activeEdge = edge + (shown ? barHeight() : 0) + 24;
      let index = -1;
      for (let i = 0; i < headings.length; i += 1) {
        if (headings[i].getBoundingClientRect().top <= activeEdge) index = i;
        else break;
      }
      links.forEach((link, i) => link.classList.toggle('is-active', i === index));
      renderNow(index);
    }

    function schedule() {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    }

    bar.addEventListener('click', () => {
      if (open) closePanel(true);
      else openPanel();
    });

    panel.addEventListener('click', (event) => {
      const link = event.target.closest('[data-toc-sticky-link]');
      if (!link) return;
      event.preventDefault();
      const target = document.getElementById(link.dataset.tocStickyLink);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - (headerHeight() + barHeight() + 16);
        window.scrollTo({ top, behavior: 'smooth' });
      }
      closePanel(false);
    });

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();

    return function cleanup() {
      if (frame) window.cancelAnimationFrame(frame);
      closePanel(false);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.documentElement.classList.remove('toc-open');
      document.body.classList.remove('toc-open');
    };
  }

  window.MianxiaTocBar = { setup: setup };
})();
