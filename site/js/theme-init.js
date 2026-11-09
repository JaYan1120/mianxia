(() => {
  try {
    const pref = localStorage.getItem('mianxia:theme') || document.documentElement.dataset.initialTheme || 'light';
    const resolved = pref === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : (pref === 'dark' ? 'dark' : 'light');
    document.documentElement.dataset.theme = resolved;
  } catch { /* ignore */ }
})();
