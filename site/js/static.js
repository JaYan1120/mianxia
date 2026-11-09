(() => {
  'use strict';

  const body = document.body;
  const root = body.dataset.root || '';
  const page = body.dataset.page || '';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const themeKey = 'mianxia:theme';
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function toast(message, type = 'default') {
    const rootNode = $('#toast-root');
    if (!rootNode) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const iconChar = type === 'success' ? '✓' : type === 'error' ? '!' : '✦';
    el.innerHTML = `<span class="toast-icon">${iconChar}</span><span class="toast-message">${escapeHtml(message)}</span>`;
    rootNode.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 240);
    }, 2800);
  }

  function resolvedTheme(pref) {
    if (pref === 'auto') return systemDark.matches ? 'dark' : 'light';
    return pref === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(pref, persist = false) {
    const next = ['light', 'dark', 'auto'].includes(pref) ? pref : 'light';
    if (persist) {
      try { localStorage.setItem(themeKey, next); } catch { /* ignore */ }
    }
    const resolved = resolvedTheme(next);
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePref = next;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#151412' : '#f4eddf');
  }

  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(themeKey); } catch { /* ignore */ }
    applyTheme(stored || document.documentElement.dataset.initialTheme || 'light');
    $$('[data-static-theme]').forEach((button) => {
      button.addEventListener('click', () => {
        const current = document.documentElement.dataset.theme;
        applyTheme(current === 'dark' ? 'light' : 'dark', true);
      });
    });
    systemDark.addEventListener('change', () => {
      try {
        if (localStorage.getItem(themeKey) === 'auto') applyTheme('auto');
      } catch { /* ignore */ }
    });
  }

  function initHeader() {
    const update = () => {
      const header = $('#site-header');
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 16);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function lockBody(locked) {
    body.classList.toggle('modal-open', locked);
  }

  function openOverlay(overlay) {
    if (!overlay) return;
    closeOverlays(overlay);
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    lockBody(true);
    const focusTarget = overlay.querySelector('input, button:not([data-static-close])');
    if (focusTarget) setTimeout(() => focusTarget.focus({ preventScroll: true }), 80);
  }

  function closeOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (!$$('.modal-overlay.is-open').length) lockBody(false);
  }

  function closeOverlays(except) {
    $$('.modal-overlay.is-open').forEach((overlay) => {
      if (overlay !== except) closeOverlay(overlay);
    });
  }

  function initOverlays() {
    $$('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('mousedown', (event) => {
        if (event.target === overlay) closeOverlay(overlay);
      });
    });
    $$('[data-static-menu]').forEach((button) => {
      button.addEventListener('click', () => openOverlay($('#static-menu')));
    });
    $$('[data-static-search]').forEach((button) => {
      button.addEventListener('click', () => {
        openOverlay($('#static-search'));
        setTimeout(() => $('#static-search-input')?.focus(), 100);
      });
    });
    $$('[data-static-close]').forEach((button) => {
      button.addEventListener('click', () => closeOverlay(button.closest('.modal-overlay')));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeOverlays();
    });
  }

  let searchPromise = null;
  let searchItems = null;
  let activeResult = -1;

  function loadSearchIndex() {
    if (!searchPromise) {
      searchPromise = fetch(`${root}search-index.json`, { cache: 'no-cache' })
        .then((response) => {
          if (!response.ok) throw new Error('搜索索引加载失败');
          return response.json();
        })
        .then((items) => {
          searchItems = Array.isArray(items) ? items : [];
          return searchItems;
        });
    }
    return searchPromise;
  }

  function highlight(text, query) {
    const safe = escapeHtml(text || '');
    if (!query) return safe;
    try {
      return safe.replace(new RegExp(`(${escapeRegExp(query)})`, 'gi'), '<mark>$1</mark>');
    } catch {
      return safe;
    }
  }

  function resultMarkup(item, query, active = false) {
    const cover = item.cover
      ? (/^(https?:|data:)/i.test(item.cover) ? item.cover : `${root}${item.cover.replace(/^\//, '')}`)
      : '';
    return `<a class="search-result ${active ? 'is-active' : ''}" href="${root}post/${encodeURIComponent(item.id)}/">
      <span class="search-result-cover">${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy">` : '<span class="mini-fallback">眠</span>'}</span>
      <span class="search-result-copy">
        <span class="search-result-meta">${escapeHtml(item.category || '随笔')} · ${escapeHtml(item.date || '')}</span>
        <strong>${highlight(item.title, query)}</strong>
        <small>${highlight(item.excerpt || '', query)}</small>
      </span>
      <span class="search-result-arrow">↗</span>
    </a>`;
  }

  function renderSearchDefault() {
    const box = $('#static-search-results');
    if (!box) return;
    const items = searchItems || [];
    const counts = new Map();
    for (const item of items) {
      for (const tag of item.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    box.innerHTML = `<div class="search-suggest">
      <div class="search-label">常写的标签</div>
      <div class="tag-cloud">${tags.map(([tag, count]) => `<button type="button" class="tag-pill" data-static-search-tag="${escapeHtml(tag)}"><span>${escapeHtml(tag)}</span><em>${count}</em></button>`).join('') || '<p class="side-empty">暂无标签</p>'}</div>
      <div class="search-label">最近更新</div>
      ${items.slice(0, 3).map((item) => resultMarkup(item, '')).join('') || '<p class="side-empty">还没有文章</p>'}
    </div>`;
    bindSearchTagButtons();
  }

  function renderSearch(query) {
    const box = $('#static-search-results');
    if (!box) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      renderSearchDefault();
      return;
    }
    const matches = searchItems.filter((item) => {
      const haystack = [item.title, item.excerpt, item.category, ...(item.tags || []), item.text].join(' ').toLowerCase();
      return haystack.includes(q);
    }).slice(0, 9);
    activeResult = 0;
    if (!matches.length) {
      box.innerHTML = `<div class="search-empty"><span>眠</span><h3>没有找到相关的文字</h3><p>试试更短的关键词，或者浏览全部归档。</p><a href="${root}archive/" class="btn btn-outline btn-sm">去归档看看</a></div>`;
      return;
    }
    box.innerHTML = `<div class="search-count">找到 ${matches.length} 篇相关笔记</div><div class="search-list">${matches.map((item, index) => resultMarkup(item, query, index === 0)).join('')}</div>`;
  }

  function bindSearchTagButtons() {
    $$('[data-static-search-tag]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = $('#static-search-input');
        if (!input) return;
        input.value = button.dataset.staticSearchTag || '';
        renderSearch(input.value);
        input.focus();
      });
    });
  }

  function initSearch() {
    const input = $('#static-search-input');
    if (!input) return;
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        loadSearchIndex().then(() => renderSearch(input.value)).catch(() => {
          const box = $('#static-search-results');
          if (box) box.innerHTML = '<div class="search-empty"><h3>搜索索引暂时不可用</h3><p>请稍后刷新页面再试。</p></div>';
        });
      }, 100);
    });
    input.addEventListener('keydown', (event) => {
      const items = $$('.search-result');
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        activeResult = Math.min(items.length - 1, activeResult + 1);
        items.forEach((item, index) => item.classList.toggle('is-active', index === activeResult));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        activeResult = Math.max(0, activeResult - 1);
        items.forEach((item, index) => item.classList.toggle('is-active', index === activeResult));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const target = items[activeResult] || items[0];
        if (target) window.location.href = target.href;
      }
    });
    const opener = $('[data-static-search]');
    if (opener) {
      opener.addEventListener('click', () => {
        loadSearchIndex().then(() => {
          if (!input.value) renderSearchDefault();
        }).catch(() => {});
      });
    }
    window.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openOverlay($('#static-search'));
        setTimeout(() => input.focus(), 100);
      }
    });
  }

  function initFilters() {
    const posts = $$('[data-static-post]');
    if (!posts.length) return;
    const empty = $('#static-filter-empty');
    const categoryButtons = $$('[data-filter-category]');
    let activeCategory = 'all';
    const apply = () => {
      let visible = 0;
      posts.forEach((post) => {
        const show = activeCategory === 'all' || post.dataset.category === activeCategory;
        post.hidden = !show;
        if (show) visible += 1;
      });
      categoryButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.filterCategory === activeCategory));
      if (empty) empty.hidden = visible > 0;
    };
    categoryButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.filterCategory || 'all';
        apply();
      });
    });
    const sort = $('#static-sort');
    const grid = $('.post-grid');
    if (sort && grid) {
      sort.addEventListener('change', () => {
        const cards = $$('[data-static-post]', grid);
        const mode = sort.value;
        cards.sort((a, b) => {
          if (mode === 'popular') return Number(b.dataset.views || 0) - Number(a.dataset.views || 0);
          const av = Number(a.dataset.date || 0);
          const bv = Number(b.dataset.date || 0);
          return mode === 'oldest' ? av - bv : bv - av;
        });
        cards.forEach((card) => grid.appendChild(card));
      });
    }
  }

  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.04 });
    items.forEach((item) => observer.observe(item));
  }

  function initPostPage() {
    if (page !== 'post') return;
    const bar = $('.reading-progress span');
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const links = $$('[data-toc-link]');
    const headings = links.map((link) => document.getElementById(link.dataset.tocLink)).filter(Boolean);
    if ('IntersectionObserver' in window && headings.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => link.classList.toggle('is-active', link.dataset.tocLink === entry.target.id));
        });
      }, { rootMargin: '-100px 0px -68% 0px' });
      headings.forEach((heading) => observer.observe(heading));
    }
    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const target = document.getElementById(link.dataset.tocLink);
        if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
      });
    });
  }

  function initActions() {
    $$('[data-scroll-latest]').forEach((button) => {
      button.addEventListener('click', () => {
        const latest = $('#latest');
        if (latest) latest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    $$('[data-static-copy]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast('链接已复制', 'success');
        } catch {
          toast('复制失败，请手动复制地址栏', 'error');
        }
      });
    });
    $$('[data-static-share]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (navigator.share) {
          try { await navigator.share({ title: document.title, url: window.location.href }); } catch { /* cancelled */ }
        } else {
          try {
            await navigator.clipboard.writeText(window.location.href);
            toast('链接已复制', 'success');
          } catch { toast('分享失败', 'error'); }
        }
      });
    });
    $$('[data-static-backtop]').forEach((button) => {
      button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    });
  }

  initTheme();
  initHeader();
  initOverlays();
  initSearch();
  initFilters();
  initReveal();
  initPostPage();
  initActions();
})();
