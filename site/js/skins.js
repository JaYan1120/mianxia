/* 主题（skin）定义与选择卡片：动态站、静态站、设置页共用一份，挂 window.MianxiaSkins。 */
(function () {
  var SKINS = [
    { id: 'paper', name: '暖纸', note: '米色纸 · 赭红' },
    { id: 'glass', name: '液态玻璃', note: '柔光 · 玻璃卡片' },
    { id: 'dusk', name: '暮色', note: '落日 · 暖纸' },
    { id: 'moon', name: '月夜', note: '墨蓝 · 月色' },
    { id: 'bloom', name: '花信', note: '粉白 · 柔光' }
  ];
  var VARIANTS = [];
  SKINS.forEach(function (skin) {
    ['light', 'dark'].forEach(function (theme) {
      VARIANTS.push({ id: skin.id, name: skin.name, note: skin.note, theme: theme });
    });
  });
  function themeLabel(theme) { return theme === 'dark' ? '深色' : '浅色'; }
  function cardMarkup(variant, activeId, activeTheme) {
    var active = variant.id === activeId && variant.theme === activeTheme;
    return '<button type="button" class="skin-card' + (active ? ' is-active' : '') + '"' +
      ' data-skin-pick="' + variant.id + '" data-skin-theme="' + variant.theme + '"' +
      ' aria-pressed="' + (active ? 'true' : 'false') + '"' +
      ' aria-label="' + variant.name + '（' + themeLabel(variant.theme) + '）">' +
      '<span class="skin-thumb" data-variant="' + variant.id + '-' + variant.theme + '" aria-hidden="true">' +
      '<i class="skin-bar"></i><i class="skin-block"></i><i class="skin-block"></i></span>' +
      '<span class="skin-meta"><b>' + variant.name + '</b><small>' + themeLabel(variant.theme) + '</small></span>' +
      '</button>';
  }
  function cardsMarkup(activeId, activeTheme) {
    return VARIANTS.map(function (v) { return cardMarkup(v, activeId, activeTheme); }).join('');
  }
  function current() {
    var root = document.documentElement;
    var skin = root.dataset.skin || 'paper';
    var theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    return { skin: skin, theme: theme };
  }
  function paint(container) {
    if (!container) return;
    var state = current();
    container.innerHTML = cardsMarkup(state.skin, state.theme);
  }
  window.MianxiaSkins = { SKINS: SKINS, VARIANTS: VARIANTS, cardsMarkup: cardsMarkup, paint: paint, current: current };
})();
