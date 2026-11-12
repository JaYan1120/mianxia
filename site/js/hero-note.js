/**
 * 首页「今日宜忌 / 今日星座」切换器。
 *
 * 同一个卡片里放两个面板：默认看黄历，点「星座」就换成星座运势。
 * 选择记在 localStorage，下次打开还是上次那个；不自动轮换，避免视线被拉走。
 *
 * 星座面板本身（文案、评分、换星座）由 horoscope.js 负责，
 * 这里只管切换、开合详情浮层和键盘/焦点行为。
 */

import { mountHoroscope } from './horoscope.js';

const MODE_KEY = 'mianxia:hero-note:v1';
const MODES = ['almanac', 'horoscope'];

function readMode() {
  try {
    const value = window.localStorage.getItem(MODE_KEY);
    return MODES.includes(value) ? value : '';
  } catch {
    return '';
  }
}

function writeMode(mode) {
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* 隐私模式下忽略 */
  }
}

export function hydrateHeroNote(root = document) {
  const node = root.querySelector('[data-hero-note]');
  if (!node || node.dataset.heroNoteReady === '1') return;
  node.dataset.heroNoteReady = '1';

  // 上一次渲染如果留下了挂在 body 上的浮层（比如刚切过路由），先清掉
  root.querySelectorAll('body > .horo-card').forEach((el) => el.remove());

  const hasHoroscope = node.dataset.horoscopeEnabled === '1';
  const tabs = Array.from(node.querySelectorAll('[data-note-tab]'));
  const panels = Array.from(node.querySelectorAll('[data-note-panel]'));
  const detailButton = node.querySelector('[data-note-detail]');
  const card = node.querySelector('[data-horoscope-card]');
  const line = node.querySelector('[data-horoscope-line]');
  const horoscope = hasHoroscope ? mountHoroscope(node) : null;

  if (!hasHoroscope) {
    // 站主关掉了星座：保证黄历面板可见，详情按钮始终隐藏
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.notePanel !== 'almanac';
    });
    if (detailButton) detailButton.hidden = true;
    return;
  }

  let mode = 'almanac';
  let open = false;
  // 浮层方向在一次打开里保持不变：切换星座 / 展开选择器只改高度，不来回翻
  let side = 'above';
  let sideLocked = false;

  function applyMode(next, { persist = true } = {}) {
    mode = MODES.includes(next) ? next : 'almanac';
    if (persist) writeMode(mode);
    tabs.forEach((tab) => {
      const active = tab.dataset.noteTab === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.notePanel !== mode;
    });
    if (detailButton) detailButton.hidden = mode !== 'horoscope';
    node.dataset.noteMode = mode;
    if (mode !== 'horoscope') closeCard({ restoreFocus: false });
  }

  function noteMetrics() {
    const rect = node.getBoundingClientRect();
    // 顶部不要压到吸顶导航，否则导航图标会盖在卡片上
    const headerHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--header-h')
    ) || 0;
    return {
      rect,
      headerHeight,
      above: rect.top - headerHeight - 16,
      below: window.innerHeight - rect.bottom - 16
    };
  }

  // 默认朝上；只有上方实在放不下（离顶部很近）才翻到下面
  function chooseSide(height) {
    const { above, below } = noteMetrics();
    if (above >= Math.min(height, 220)) return 'above';
    return below > above && below >= 200 ? 'below' : 'above';
  }

  /**
   * 浮层挂在 body 上、用 fixed 定位：这样不会被 hero 的层叠上下文压住，
   * 也不会因为祖先 transform 动画把 fixed 变成相对定位。
   */
  function positionCard() {
    if (!card || !open) return;
    if (!node.isConnected) {
      abandonCard();
      return;
    }
    const { rect, headerHeight, above, below } = noteMetrics();

    if (!sideLocked) {
      card.style.maxHeight = '';
      side = chooseSide(card.offsetHeight);
      sideLocked = true;
    }

    const available = Math.max(
      160,
      Math.min(side === 'above' ? above : below, window.innerHeight - 32)
    );
    card.classList.toggle('is-below', side === 'below');
    card.style.maxHeight = `${available}px`;
    card.style.width = `${rect.width}px`;
    card.style.left = `${rect.left}px`;

    // 先按限制后的高度量一次，再决定贴到卡片上方还是下方
    const height = card.getBoundingClientRect().height;
    card.style.top = side === 'above'
      ? `${Math.max(headerHeight + 8, rect.top - 8 - height)}px`
      : `${rect.bottom + 8}px`;
  }

  function portalCard() {
    if (card.parentElement !== document.body) document.body.appendChild(card);
    card.classList.add('is-floating');
  }

  function restoreCard() {
    card.classList.remove('is-floating', 'is-below');
    card.style.cssText = '';
    if (card.parentElement === document.body) node.appendChild(card);
  }

  function abandonCard() {
    open = false;
    card.hidden = true;
    card.remove();
    if (detailButton) detailButton.setAttribute('aria-expanded', 'false');
  }

  function setOpen(next) {
    if (!card) return;
    open = Boolean(next) && mode === 'horoscope';
    card.hidden = !open;
    node.classList.toggle('is-open', open);
    if (detailButton) detailButton.setAttribute('aria-expanded', String(open));
    if (open) {
      portalCard();
      sideLocked = false;
      horoscope?.closePicker();
      requestAnimationFrame(positionCard);
    } else {
      restoreCard();
    }
  }

  function closeCard(options = {}) {
    if (!open) return;
    setOpen(false, options);
    if (options.restoreFocus !== false) {
      if (detailButton && !detailButton.hidden) detailButton.focus({ preventScroll: true });
      else if (line) line.focus({ preventScroll: true });
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => applyMode(tab.dataset.noteTab));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      if (!next) return;
      applyMode(next.dataset.noteTab);
      next.focus({ preventScroll: true });
    });
  });

  if (detailButton) {
    detailButton.addEventListener('click', () => {
      setOpen(!open);
    });
  }

  if (line) {
    line.addEventListener('click', () => {
      setOpen(!open);
      if (!open) line.focus({ preventScroll: true });
    });
  }

  if (card) {
    card.addEventListener('click', (event) => {
      // 星座卡会整体重绘（换星座 / 展开选择器），重绘后 target 已经脱离文档，
      // 不拦下冒泡的话会被下面的「点外面关闭」误判成点了页面空白。
      event.stopPropagation();
      if (event.target.closest('[data-horo-close]')) {
        closeCard();
        return;
      }
      // 展开/收起星座选择器会改变高度，按当前方向重新贴合
      requestAnimationFrame(positionCard);
    });
    // 浮层里的按钮不触发「点外面关闭」
    card.addEventListener('mousedown', (event) => event.stopPropagation());
  }

  document.addEventListener('click', (event) => {
    if (!open) return;
    if (node.contains(event.target)) return;
    if (card && card.contains(event.target)) return;
    closeCard({ restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      closeCard();
    }
  });

  // 浮层挂在 body 上，页面滚动时要跟着卡片走；卡片被滚出视野就收起
  window.addEventListener('scroll', () => {
    if (!open) return;
    const rect = node.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      closeCard({ restoreFocus: false });
      return;
    }
    requestAnimationFrame(positionCard);
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!open) return;
    sideLocked = false;
    requestAnimationFrame(positionCard);
  });

  // 首页重新渲染（切路由）时，旧浮层可能还挂在 body 上
  document.addEventListener('mianxia:page-ready', () => {
    if (open && !node.isConnected) abandonCard();
  });

  applyMode(readMode() || 'almanac', { persist: false });
}

/** 静态站与首页重新渲染后，手动刷新一次星座面板（数据不变时基本无副作用）。 */
export function refreshHeroNote(root = document) {
  const node = root.querySelector('[data-hero-note]');
  if (node) delete node.dataset.heroNoteReady;
  hydrateHeroNote(root);
}
