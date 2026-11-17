(() => {
  try {
    const pref = localStorage.getItem('mianxia:theme') || document.documentElement.dataset.initialTheme || 'light';
    const resolved = pref === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : (pref === 'dark' ? 'dark' : 'light');
    document.documentElement.dataset.theme = resolved;
    const skin = localStorage.getItem('mianxia:skin') || document.documentElement.dataset.initialSkin;
    if (skin) document.documentElement.dataset.skin = skin;
  } catch { /* ignore */ }
})();
