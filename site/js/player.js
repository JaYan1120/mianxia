'use strict';

(() => {
  const root = document.querySelector('[data-music-player]');
  if (!root) return;

  const STORAGE = {
    track: 'mianxia:music:track',
    time: 'mianxia:music:time',
    volume: 'mianxia:music:volume',
    muted: 'mianxia:music:muted',
    sort: 'mianxia:music:sort',
    mode: 'mianxia:music:mode',
    side: 'mianxia:music:side',
    pos: 'mianxia:music:pos',
    autoHide: 'mianxia:music:autohide',
    order: 'mianxia:music:order'
  };

  const MARGIN = 8;
  // 与 CSS 的 --music-peek 保持一致：收起时藏进屏幕的距离
  const PEEK_DISTANCE = 28;

  const MODES = [
    { id: 'list', label: '列表循环', icon: 'repeat' },
    { id: 'one', label: '单曲循环', icon: 'repeat' },
    { id: 'random', label: '随机播放', icon: 'shuffle' },
    { id: 'off', label: '顺序播放', icon: 'order' }
  ];

  const icons = {
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    prev: '<path d="M6 5v14M18 6l-9 6 9 6Z"/>',
    next: '<path d="M18 5v14M6 6l9 6-9 6Z"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    volume: '<path d="M4 10v4h4l5 4V6l-5 4ZM17 9a5 5 0 0 1 0 6M19.5 6.5a9 9 0 0 1 0 11"/>',
    repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    order: '<path d="M4 6h16M4 12h16M4 18h16M18 4l2 2-2 2M18 16l2 2-2 2"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    'volume-off': '<path d="M4 10v4h4l5 4V6l-5 4Z"/><path d="m16 9 5 6M21 9l-5 6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.4 4.3M6.4 6.5A17 17 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'
  };

  const svg = (name, size = 17) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.music}</svg>`;

  root.innerHTML = `
    <audio class="music-audio" data-music-audio preload="metadata"></audio>
    <button type="button" class="music-fab" data-music-fab aria-label="打开播放器" aria-expanded="false">${svg('music', 22)}</button>
    <div class="music-player-card">
      <button type="button" class="music-hide-toggle" data-music-hide-toggle aria-pressed="true" title="自动收起：开"></button>
      <button type="button" class="music-close" data-music-close aria-label="收起播放器" title="收起播放器">${svg('close', 14)}</button>
      <div class="music-player-main">
        <button type="button" class="music-disc" data-music-toggle title="播放 / 暂停" aria-label="播放 / 暂停">${svg('music', 19)}</button>
        <div class="music-info">
          <strong data-music-title>还没有歌曲</strong>
          <span data-music-artist>添加一首歌，让这里响起来</span>
        </div>
        <div class="music-controls">
          <button type="button" class="music-control" data-music-prev title="上一首" aria-label="上一首">${svg('prev', 15)}</button>
          <button type="button" class="music-play" data-music-play title="播放" aria-label="播放">${svg('play', 15)}</button>
          <button type="button" class="music-control" data-music-next title="下一首" aria-label="下一首">${svg('next', 15)}</button>
          <button type="button" class="music-control" data-music-list-toggle title="播放列表" aria-label="播放列表" aria-expanded="false">${svg('list', 16)}</button>
        </div>
      </div>
      <div class="music-progress-row">
        <span data-music-current>0:00</span>
        <input class="music-seek" type="range" min="0" max="0" step="0.1" value="0" aria-label="播放进度">
        <span data-music-duration>0:00</span>
      </div>
      <div class="music-extra">
        <button type="button" class="music-mode" data-music-mode title="切换循环模式" aria-label="切换循环模式">
          <span class="music-mode-icon" data-music-mode-icon>${svg('repeat', 13)}</span>
          <span data-music-mode-label>列表循环</span>
        </button>
        <div class="music-volume">
          <button type="button" class="music-mute" data-music-mute aria-pressed="false" title="静音" aria-label="静音">${svg('volume', 14)}</button>
          <input type="range" min="0" max="1" step="0.01" value="0.5" aria-label="音量">
        </div>
        <span data-music-count>0 首</span>
      </div>
    </div>
    <div class="music-playlist" data-music-playlist hidden>
      <div class="music-playlist-head">
        <strong>播放列表</strong>
        <span data-music-playlist-count>0 首</span>
        <button type="button" class="music-sort" data-music-sort aria-pressed="false" title="按歌名排序（A→Z）">A→Z</button>
        <button type="button" class="music-playlist-close" data-music-playlist-close aria-label="关闭播放列表">${svg('close', 14)}</button>
      </div>
      <div class="music-tracks" data-music-tracks></div>
    </div>
  `;

  const audio = root.querySelector('[data-music-audio]');
  const titleNode = root.querySelector('[data-music-title]');
  const artistNode = root.querySelector('[data-music-artist]');
  const playButton = root.querySelector('[data-music-play]');
  const toggleButton = root.querySelector('[data-music-toggle]');
  const prevButton = root.querySelector('[data-music-prev]');
  const nextButton = root.querySelector('[data-music-next]');
  const listToggle = root.querySelector('[data-music-list-toggle]');
  const playlist = root.querySelector('[data-music-playlist]');
  const tracksNode = root.querySelector('[data-music-tracks]');
  const seek = root.querySelector('.music-seek');
  const currentTimeNode = root.querySelector('[data-music-current]');
  const durationNode = root.querySelector('[data-music-duration]');
  const countNode = root.querySelector('[data-music-count]');
  const playlistCountNode = root.querySelector('[data-music-playlist-count]');
  const modeButton = root.querySelector('[data-music-mode]');
  const modeIcon = root.querySelector('[data-music-mode-icon]');
  const modeLabel = root.querySelector('[data-music-mode-label]');
  const volumeInput = root.querySelector('.music-volume input');
  const muteButton = root.querySelector('[data-music-mute]');
  const sortButton = root.querySelector('[data-music-sort]');
  const fabButton = root.querySelector('[data-music-fab]');
  const closeButton = root.querySelector('[data-music-close]');
  const hideToggle = root.querySelector('[data-music-hide-toggle]');
  const embedded = Array.isArray(window.__MIANXIA_MUSIC__) ? window.__MIANXIA_MUSIC__ : null;
  const mediaSession = 'mediaSession' in navigator ? navigator.mediaSession : null;
  const mediaAlbum = document.querySelector('meta[property="og:site_name"]')?.content || '眠夏';

  let songs = [];
  let currentIndex = -1;
  let pendingSeek = 0;
  let lastTimeSave = 0;
  let mode = 'list';
  let playerOpen = false;
  let side = 'right';
  let peeking = false;
  let peekTimer = null;
  let suppressFabClick = false;
  let dragState = null;
  let offsetBottom = null;
  let autoHide = true;
  let revealOnlyClick = false;
  let muted = false;
  let currentVolume = 0.5;
  let sortMode = 'manual';
  let randomHistory = [];
  let lastMediaPositionUpdate = 0;
  const lastPointer = { x: -1, y: -1 };
  let viewBox = null;

  const normalizeSongs = (list) => (Array.isArray(list) ? list : [])
    .filter((song) => song && song.title && song.url)
    .map((song) => ({
      id: String(song.id || song.url),
      title: String(song.title),
      artist: String(song.artist || ''),
      url: String(song.url)
    }));

  const formatTime = (seconds) => {
    const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  };

  const readStorage = (key, fallback = '') => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const sideInset = () => (window.matchMedia('(max-width: 640px)').matches ? 10 : 20);

  const hoverCapable = () => window.matchMedia('(hover: hover)').matches;

  // 收起时的实际位移 = 贴边距离 + 半隐藏距离（与 CSS 的 --music-side / --music-peek 对应）
  // 收起时的位移 = 元素到屏幕边缘的距离 + 半隐藏距离。
  // 站点在 html 上用了 scrollbar-gutter，fixed 元素的包含块比窗口窄，所以必须实测。
  const peekShiftFor = (dir) => {
    const box = viewBox || { left: 0, right: window.innerWidth, bottom: window.innerHeight };
    const edge = dir === 'right' ? Math.max(0, window.innerWidth - box.right) : Math.max(0, box.left);
    return edge + sideInset() + PEEK_DISTANCE;
  };

  const measureViewBox = () => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;visibility:hidden;pointer-events:none;z-index:-1';
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    probe.remove();
    viewBox = { left: rect.left, right: rect.right, bottom: rect.bottom };
    root.style.setProperty('--music-peek-shift-right', `${peekShiftFor('right')}px`);
    root.style.setProperty('--music-peek-shift-left', `${peekShiftFor('left')}px`);
  };

  const headerHeight = () => {
    const raw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
    return Number.isFinite(raw) && raw > 0 ? raw : 72;
  };

  // 纵向位置以「距视口底部的距离」保存：打开卡片时高度变大，卡片向上展开，底边保持不动。
  const applyPosition = () => {
    if (offsetBottom == null) {
      root.style.removeProperty('--music-bottom');
      return;
    }
    if (root.hidden) return;
    const height = root.offsetHeight || 0;
    const viewBottom = viewBox ? viewBox.bottom : window.innerHeight;
    const max = Math.max(MARGIN, viewBottom - height - headerHeight() - MARGIN);
    const bottom = Math.round(Math.min(max, Math.max(MARGIN, offsetBottom)));
    root.style.setProperty('--music-bottom', `${bottom}px`);
  };

  const applySavedOrder = () => {
    if (songs.length < 2) return;
    let ids = [];
    try { ids = JSON.parse(readStorage(STORAGE.order, '[]')); } catch { return; }
    if (!Array.isArray(ids) || !ids.length) return;
    const positions = new Map(ids.map((id, index) => [String(id), index]));
    songs.sort((a, b) => {
      const ai = positions.has(a.id) ? positions.get(a.id) : Number.MAX_SAFE_INTEGER;
      const bi = positions.has(b.id) ? positions.get(b.id) : Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
  };

  const saveOrder = () => {
    try {
      localStorage.setItem(STORAGE.order, JSON.stringify(songs.map((song) => song.id)));
    } catch { /* ignore */ }
  };

  const saveTrack = () => {
    if (currentIndex < 0 || !songs[currentIndex]) return;
    try {
      localStorage.setItem(STORAGE.track, songs[currentIndex].id);
      localStorage.setItem(STORAGE.time, String(audio.currentTime || 0));
    } catch { /* ignore */ }
  };

  const updateMediaMetadata = () => {
    if (!mediaSession) return;
    const song = songs[currentIndex];
    if (!song) {
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
      return;
    }
    if ('MediaMetadata' in window) {
      mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || '未知艺术家',
        album: mediaAlbum
      });
    }
    updateMediaPlaybackState();
    updateMediaPosition(true);
  };

  const updateMediaPlaybackState = () => {
    if (!mediaSession) return;
    mediaSession.playbackState = !songs.length ? 'none' : (audio.paused || audio.ended ? 'paused' : 'playing');
  };

  const updateMediaPosition = (force = false) => {
    if (!mediaSession || !('setPositionState' in mediaSession)) return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const now = Date.now();
    if (!force && now - lastMediaPositionUpdate < 900) return;
    lastMediaPositionUpdate = now;
    try {
      mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(Math.max(audio.currentTime || 0, 0), audio.duration)
      });
    } catch { /* ignore unsupported state */ }
  };

  const updatePlayButton = () => {
    const playing = !audio.paused && !audio.ended;
    playButton.innerHTML = svg(playing ? 'pause' : 'play', 15);
    playButton.setAttribute('aria-label', playing ? '暂停' : '播放');
    playButton.title = playing ? '暂停' : '播放';
    root.classList.toggle('is-playing', playing);
    updateMediaPlaybackState();
  };

  const currentMode = () => MODES.find((item) => item.id === mode) || MODES[0];

  const renderMode = () => {
    const info = currentMode();
    if (modeLabel) modeLabel.textContent = info.label;
    if (modeIcon) {
      modeIcon.innerHTML = `${svg(info.icon, 13)}${mode === 'one' ? '<i class="music-mode-badge">1</i>' : ''}`;
    }
    if (modeButton) {
      modeButton.title = `循环模式：${info.label}（点击切换）`;
      modeButton.setAttribute('aria-label', `循环模式：${info.label}`);
    }
    audio.loop = mode === 'one';
  };

  const cycleMode = () => {
    const index = MODES.findIndex((item) => item.id === mode);
    mode = MODES[(index + 1) % MODES.length].id;
    randomHistory = [];
    try { localStorage.setItem(STORAGE.mode, mode); } catch { /* ignore */ }
    renderMode();
  };

  const setPeeking = (value) => {
    const next = Boolean(value) && autoHide && !playerOpen && !dragState;
    peeking = next;
    root.classList.toggle('is-peeking', next);
  };

  const schedulePeek = (delay = 800) => {
    clearTimeout(peekTimer);
    if (!autoHide || playerOpen || dragState || !songs.length) return;
    peekTimer = setTimeout(() => {
      if (!autoHide || playerOpen || dragState) return;
      // 鼠标还在播放器上、或停在收起后会被它盖住的边缘条上，就稍后再试（触摸屏没有 hover，直接收起）
      if (hoverCapable() && (root.matches(':hover') || nearPlayer())) {
        schedulePeek(700);
        return;
      }
      setPeeking(true);
    }, delay);
  };

  // 指针还停在「收起后会被它盖住的那条边」上就不收起，否则元素滑出去又滑回来会来回抖
  const nearPlayer = () => {
    if (lastPointer.x < 0) return false;
    const rect = root.getBoundingClientRect();
    const pad = MARGIN;
    const shift = peekShiftFor(root.dataset.side);
    const leftPad = root.dataset.side === 'left' ? shift : 0;
    const rightPad = root.dataset.side === 'right' ? shift : 0;
    return lastPointer.x >= rect.left - leftPad - pad &&
      lastPointer.x <= rect.right + rightPad + pad &&
      lastPointer.y >= rect.top - pad &&
      lastPointer.y <= rect.bottom + pad;
  };

  const renderAutoHide = () => {
    if (!hideToggle) return;
    hideToggle.innerHTML = svg(autoHide ? 'eye' : 'eye-off', 13);
    hideToggle.classList.toggle('is-off', !autoHide);
    hideToggle.setAttribute('aria-pressed', String(autoHide));
    const label = autoHide ? '自动收起：开（移开后藏一半，移入滑出）' : '自动收起：关（一直完整显示）';
    hideToggle.title = label;
    hideToggle.setAttribute('aria-label', label);
  };

  // 有些点击会当场重绘并移除被点的节点（喇叭、循环模式图标、歌单行），
  // 此时 root.contains(event.target) 为 false，会被误判成"点在播放器外面"而关掉卡片。
  // 用事件派发时定下的 composedPath 判断，节点是否已被移除都不影响。
  const eventInside = (event, node) => {
    if (!node) return false;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
    if (path && path.length) return path.includes(node);
    return node.contains(event.target);
  };

  const setPlayerOpen = (open) => {
    playerOpen = Boolean(open);
    root.classList.toggle('is-open', playerOpen);
    if (fabButton) {
      fabButton.setAttribute('aria-expanded', String(playerOpen));
      fabButton.setAttribute('aria-label', playerOpen ? '收起播放器' : '打开播放器');
    }
    if (playerOpen) {
      clearTimeout(peekTimer);
      setPeeking(false);
      applyPosition();
    } else {
      playlist.hidden = true;
      listToggle.setAttribute('aria-expanded', 'false');
      root.classList.remove('is-list-open');
      applyPosition();
      schedulePeek(800);
    }
  };

  // 播放器被拖到顶部时，列表向上弹会超出视口，改为向下展开
  const positionPlaylist = () => {
    root.classList.remove('is-list-below');
    if (playlist.hidden) return;
    if (playlist.getBoundingClientRect().top < MARGIN) root.classList.add('is-list-below');
  };

  const randomIndex = () => {
    if (songs.length < 2) return 0;
    const recent = new Set(randomHistory.slice(-Math.min(4, songs.length - 1)));
    const candidates = songs
      .map((_, index) => index)
      .filter((index) => index !== currentIndex && !recent.has(index));
    const pool = candidates.length ? candidates : songs.map((_, index) => index).filter((index) => index !== currentIndex);
    return pool[Math.floor(Math.random() * pool.length)] ?? 0;
  };

  const stepIndex = (direction) => {
    if (!songs.length) return 0;
    if (currentIndex < 0) return direction > 0 ? 0 : songs.length - 1;
    if (mode === 'random' && songs.length > 1) {
      if (direction < 0 && randomHistory.length) return randomHistory.pop();
      return randomIndex();
    }
    return ((currentIndex + direction) % songs.length + songs.length) % songs.length;
  };

  const renderNow = () => {
    const song = songs[currentIndex];
    if (!song) {
      titleNode.textContent = '还没有歌曲';
      artistNode.textContent = '添加一首歌，让这里响起来';
      updateMediaMetadata();
      return;
    }
    titleNode.textContent = song.title;
    artistNode.textContent = song.artist || '未知艺术家';
    titleNode.title = song.title;
    updateMediaMetadata();
  };

  const moveSong = (from, direction) => {
    const to = from + direction;
    if (to < 0 || to >= songs.length) return;
    const currentId = songs[currentIndex] && songs[currentIndex].id;
    const [moved] = songs.splice(from, 1);
    songs.splice(to, 0, moved);
    if (currentId) currentIndex = songs.findIndex((song) => song.id === currentId);
    randomHistory = [];
    if (sortMode !== 'manual') {
      sortMode = 'manual';
      try { localStorage.setItem(STORAGE.sort, 'manual'); } catch { /* ignore */ }
    }
    saveOrder();
    renderPlaylist();
  };

  const renderPlaylist = () => {
    const scrollTop = tracksNode.scrollTop;
    tracksNode.innerHTML = '';
    countNode.textContent = `${songs.length} 首`;
    playlistCountNode.textContent = `${songs.length} 首`;
    songs.forEach((song, index) => {
      const row = document.createElement('div');
      row.className = 'music-track-row';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'music-track';
      button.classList.toggle('is-active', index === currentIndex);
      button.innerHTML = `<span class="music-track-index">${String(index + 1).padStart(2, '0')}</span><span class="music-track-copy"><strong></strong><small></small></span>`;
      button.querySelector('strong').textContent = song.title;
      button.querySelector('small').textContent = song.artist || '未知艺术家';
      button.addEventListener('click', () => {
        if (index === currentIndex) {
          togglePlay();
        } else {
          selectTrack(index, { autoplay: true });
        }
      });

      const moveControls = document.createElement('span');
      moveControls.className = 'music-track-move';
      const up = document.createElement('button');
      up.type = 'button';
      up.className = 'music-track-move-btn';
      up.disabled = index === 0;
      up.setAttribute('aria-label', `上移 ${song.title}`);
      up.title = '上移';
      up.innerHTML = svg('up', 12);
      up.addEventListener('click', (event) => {
        event.stopPropagation();
        moveSong(index, -1);
      });
      const down = document.createElement('button');
      down.type = 'button';
      down.className = 'music-track-move-btn';
      down.disabled = index === songs.length - 1;
      down.setAttribute('aria-label', `下移 ${song.title}`);
      down.title = '下移';
      down.innerHTML = svg('down', 12);
      down.addEventListener('click', (event) => {
        event.stopPropagation();
        moveSong(index, 1);
      });
      moveControls.append(up, down);
      row.append(button, moveControls);
      tracksNode.appendChild(row);
    });
    tracksNode.scrollTop = scrollTop;
    renderSort();
  };

  const titleCollator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' });

  const renderSort = () => {
    if (!sortButton) return;
    sortButton.setAttribute('aria-pressed', String(sortMode === 'az'));
    sortButton.classList.toggle('is-active', sortMode === 'az');
    sortButton.disabled = songs.length < 2;
    sortButton.title = sortMode === 'az' ? '已按歌名排序（A→Z），点击恢复自定义顺序' : '按歌名排序（A→Z）';
  };

  const sortByTitle = () => {
    if (songs.length < 2) return;
    const currentId = songs[currentIndex] && songs[currentIndex].id;
    songs.sort((a, b) => titleCollator.compare(a.title, b.title));
    if (currentId) currentIndex = songs.findIndex((song) => song.id === currentId);
    randomHistory = [];
    saveOrder();
  };

  const setSortMode = (next) => {
    sortMode = next === 'az' ? 'az' : 'manual';
    try { localStorage.setItem(STORAGE.sort, sortMode); } catch { /* ignore */ }
    if (sortMode === 'az') sortByTitle();
    renderSort();
    renderPlaylist();
  };

  const updateTimeline = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    seek.max = String(duration || 0);
    seek.value = String(Math.min(audio.currentTime || 0, duration || 0));
    currentTimeNode.textContent = formatTime(audio.currentTime);
    durationNode.textContent = duration ? formatTime(duration) : '0:00';
  };

  const selectTrack = (index, options = {}) => {
    if (!songs.length) return;
    const normalized = ((index % songs.length) + songs.length) % songs.length;
    const song = songs[normalized];
    if (!song) return;
    const previousIndex = currentIndex;
    const wasPlaying = !audio.paused && !audio.ended;
    if (mode === 'random' && !options.fromHistory && previousIndex >= 0 && previousIndex !== normalized) {
      randomHistory.push(previousIndex);
      if (randomHistory.length > 30) randomHistory.shift();
    }
    audio.pause();
    currentIndex = normalized;
    pendingSeek = Math.max(0, Number(options.time) || 0);
    audio.loop = mode === 'one';
    audio.src = song.url;
    audio.load();
    renderNow();
    renderPlaylist();
    updatePlayButton();
    try {
      localStorage.setItem(STORAGE.track, song.id);
      localStorage.setItem(STORAGE.time, String(pendingSeek));
    } catch { /* ignore */ }
    if (options.autoplay || (options.keepPlaying && wasPlaying)) {
      audio.play().catch(() => {
        artistNode.textContent = '点击播放开始收听';
        updatePlayButton();
      });
    }
  };

  const togglePlay = () => {
    if (!songs.length) return;
    if (currentIndex < 0) {
      selectTrack(0, { autoplay: true });
      return;
    }
    if (audio.paused || audio.ended) {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => {
        artistNode.textContent = '点击播放开始收听';
        updatePlayButton();
      });
    } else {
      audio.pause();
    }
  };

  const setSongs = (list, options = {}) => {
    const previousId = songs[currentIndex] && songs[currentIndex].id;
    const wasPlaying = !audio.paused && !audio.ended;
    const previousTime = audio.currentTime || 0;
    songs = normalizeSongs(list);
    applySavedOrder();
    if (sortMode === 'az') sortByTitle();
    randomHistory = [];
    root.hidden = songs.length === 0;
    if (songs.length) applyPosition();
    if (!songs.length) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      currentIndex = -1;
      setPlayerOpen(false);
      renderNow();
      renderPlaylist();
      updateTimeline();
      updatePlayButton();
      return;
    }

    const savedId = previousId || readStorage(STORAGE.track);
    const foundIndex = songs.findIndex((song) => song.id === savedId);
    const keepSame = previousId && songs.some((song) => song.id === previousId);
    if (keepSame && previousId) {
      currentIndex = songs.findIndex((song) => song.id === previousId);
      renderNow();
      renderPlaylist();
      if (wasPlaying && audio.paused) audio.play().catch(() => {});
      schedulePeek(1800);
      return;
    }
    const restoreTime = foundIndex > -1 ? Number(readStorage(STORAGE.time, '0')) || 0 : 0;
    selectTrack(foundIndex > -1 ? foundIndex : 0, { time: restoreTime, autoplay: false });
    schedulePeek(1800);
  };

  const loadSongs = async () => {
    if (embedded) {
      setSongs(embedded);
      return;
    }
    try {
      const response = await fetch('/api/music', { credentials: 'same-origin' });
      const data = response.ok ? await response.json() : { songs: [] };
      setSongs(data.songs || []);
    } catch {
      setSongs([]);
    }
  };

  const DEFAULT_VOLUME = 0.5;
  const readStoredVolume = () => {
    try {
      const raw = localStorage.getItem(STORAGE.volume);
      if (raw === null || raw === '') return DEFAULT_VOLUME;
      const value = Number(raw);
      return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : DEFAULT_VOLUME;
    } catch {
      return DEFAULT_VOLUME;
    }
  };
  const applyAudioVolume = () => { audio.volume = muted ? 0 : currentVolume; };
  const renderMute = () => {
    if (!muteButton) return;
    muteButton.innerHTML = svg(muted ? 'volume-off' : 'volume', 14);
    muteButton.classList.toggle('is-muted', muted);
    muteButton.setAttribute('aria-pressed', String(muted));
    const label = muted ? '取消静音' : '静音';
    muteButton.title = label;
    muteButton.setAttribute('aria-label', label);
  };
  const syncVolume = () => {
    applyAudioVolume();
    // 静音时滑块归零，但 currentVolume 保留原值，解除静音时原样恢复
    volumeInput.value = String(muted ? 0 : currentVolume);
    volumeInput.setAttribute('aria-valuetext', muted ? '已静音' : Math.round(currentVolume * 100) + '%');
    renderMute();
  };
  const setVolume = (value) => {
    currentVolume = Math.min(1, Math.max(0, Number.isFinite(value) ? value : DEFAULT_VOLUME));
    muted = false;
    try {
      localStorage.setItem(STORAGE.volume, String(currentVolume));
      localStorage.setItem(STORAGE.muted, '0');
    } catch { /* ignore */ }
    syncVolume();
  };
  const toggleMute = () => {
    muted = !muted;
    if (!muted && currentVolume === 0) {
      currentVolume = DEFAULT_VOLUME;
      try { localStorage.setItem(STORAGE.volume, String(currentVolume)); } catch { /* ignore */ }
    }
    try { localStorage.setItem(STORAGE.muted, muted ? '1' : '0'); } catch { /* ignore */ }
    syncVolume();
  };

  currentVolume = readStoredVolume();
  muted = readStorage(STORAGE.muted, '0') === '1';
  syncVolume();
  audio.addEventListener('loadedmetadata', applyAudioVolume);
  audio.addEventListener('play', applyAudioVolume);

  side = readStorage(STORAGE.side, 'right') === 'left' ? 'left' : 'right';
  root.dataset.side = side;

  try {
    const storedPos = JSON.parse(readStorage(STORAGE.pos, 'null'));
    const storedBottom = storedPos ? Number(storedPos.bottom) : NaN;
    if (Number.isFinite(storedBottom)) offsetBottom = Math.max(0, Math.round(storedBottom));
  } catch { /* ignore */ }

  autoHide = readStorage(STORAGE.autoHide, '1') !== '0';
  renderAutoHide();
  measureViewBox();

  sortMode = readStorage(STORAGE.sort, 'manual') === 'az' ? 'az' : 'manual';
  renderSort();

  const storedMode = readStorage(STORAGE.mode, 'list');
  mode = MODES.some((item) => item.id === storedMode) ? storedMode : 'list';
  renderMode();

  audio.addEventListener('loadedmetadata', () => {
    if (pendingSeek > 0 && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(pendingSeek, Math.max(0, audio.duration - 0.25));
      pendingSeek = 0;
    }
    updateTimeline();
    updateMediaPosition(true);
  });
  audio.addEventListener('durationchange', updateTimeline);
  audio.addEventListener('timeupdate', () => {
    updateTimeline();
    updateMediaPosition();
    const now = Date.now();
    if (now - lastTimeSave > 4000) {
      lastTimeSave = now;
      saveTrack();
    }
  });
  audio.addEventListener('seeked', () => updateMediaPosition(true));
  audio.addEventListener('ratechange', () => updateMediaPosition(true));
  audio.addEventListener('play', () => {
    updatePlayButton();
    saveTrack();
  });
  audio.addEventListener('pause', () => {
    updatePlayButton();
    saveTrack();
  });
  audio.addEventListener('ended', () => {
    if (!songs.length) return;
    if (mode === 'one') {
      audio.currentTime = 0;
      audio.play().catch(() => updatePlayButton());
      return;
    }
    if (mode === 'off') {
      updatePlayButton();
      return;
    }
    if (mode === 'random') {
      selectTrack(stepIndex(1), { autoplay: true });
      return;
    }
    const next = currentIndex >= songs.length - 1 ? 0 : currentIndex + 1;
    selectTrack(next, { autoplay: true });
  });
  audio.addEventListener('error', () => {
    if (!songs.length) return;
    artistNode.textContent = '音频加载失败';
    updatePlayButton();
  });

  seek.addEventListener('input', () => {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(Number(seek.value) || 0, audio.duration);
    updateTimeline();
    updateMediaPosition(true);
  });
  volumeInput.addEventListener('input', () => setVolume(Number(volumeInput.value)));
  volumeInput.addEventListener('change', () => setVolume(Number(volumeInput.value)));
  if (muteButton) muteButton.addEventListener('click', toggleMute);

  const clearDragStyles = () => {
    root.style.left = '';
    root.style.right = '';
    root.style.top = '';
    root.style.bottom = '';
  };

  const finishFabDrag = (event) => {
    if (!dragState) return;
    const state = dragState;
    dragState = null;
    root.classList.remove('is-dragging');
    try {
      if (fabButton.hasPointerCapture?.(state.pointerId)) fabButton.releasePointerCapture(state.pointerId);
    } catch { /* ignore */ }
    if (!state.moved) {
      // 只是点了一下：清掉按下时临时写入的 left/top，位置仍由 data-side + --music-bottom 决定
      clearDragStyles();
      return;
    }
    const rect = root.getBoundingClientRect();
    const box = viewBox || { left: 0, right: window.innerWidth };
    const nextSide = rect.left + rect.width / 2 < (box.left + box.right) / 2 ? 'left' : 'right';
    side = nextSide;
    root.dataset.side = side;
    offsetBottom = Math.round(window.innerHeight - (rect.top + rect.height));
    clearDragStyles();
    applyPosition();
    revealOnlyClick = false;
    try {
      localStorage.setItem(STORAGE.side, side);
      localStorage.setItem(STORAGE.pos, JSON.stringify({ side, bottom: offsetBottom }));
    } catch { /* ignore */ }
    suppressFabClick = true;
    setTimeout(() => { suppressFabClick = false; }, 450);
    schedulePeek(900);
  };

  const startFabDrag = (event) => {
    if (playerOpen || (event.pointerType === 'mouse' && event.button !== 0)) return;
    clearTimeout(peekTimer);
    revealOnlyClick = peeking && !hoverCapable();
    const wasPeeking = peeking;
    // 半隐藏时按下：把隐藏的那一段先结算掉，left/top 用「不含位移」的布局位置
    const peekOffset = wasPeeking ? (side === 'right' ? peekShiftFor('right') : -peekShiftFor('left')) : 0;
    if (wasPeeking) root.style.transition = 'none';
    const rect = root.getBoundingClientRect();
    const layoutLeft = rect.left - peekOffset;
    root.style.left = `${layoutLeft}px`;
    root.style.right = 'auto';
    root.style.top = `${rect.top}px`;
    root.style.bottom = 'auto';
    setPeeking(false);
    if (wasPeeking) requestAnimationFrame(() => { root.style.transition = ''; });
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: layoutLeft,
      startTop: rect.top,
      headerH: headerHeight(),
      moved: false
    };
    try { fabButton.setPointerCapture(event.pointerId); } catch { /* ignore */ }
  };

  const moveFab = (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) < 6) return;
    if (!dragState.moved) {
      dragState.moved = true;
      root.classList.add('is-dragging');
      clearTimeout(peekTimer);
      setPeeking(false);
    }
    if (event.cancelable) event.preventDefault();
    const width = root.offsetWidth || 56;
    const height = root.offsetHeight || 56;
    // 横向夹紧用 CSS 里的贴边距离（桌面 20 / 窄屏 10），松手吸附到侧边时不会突跳
    const inset = sideInset();
    const box = viewBox || { left: 0, right: window.innerWidth, bottom: window.innerHeight };
    const maxLeft = Math.max(box.left + inset, box.right - width - inset);
    const minTop = dragState.headerH + MARGIN;
    const maxTop = Math.max(minTop, box.bottom - height - MARGIN);
    const left = Math.min(maxLeft, Math.max(box.left + inset, dragState.startLeft + dx));
    const top = Math.min(maxTop, Math.max(minTop, dragState.startTop + dy));
    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
  };

  if (fabButton) {
    fabButton.addEventListener('pointerdown', startFabDrag);
    // 悬停进入整个播放器（包括只露一半的按钮）就滑出，离开 800ms 后收起
    root.addEventListener('pointerenter', () => {
      if (playerOpen || dragState) return;
      clearTimeout(peekTimer);
      setPeeking(false);
    });
    root.addEventListener('pointerleave', () => {
      if (!playerOpen && !dragState) schedulePeek(800);
    });
    // 键盘 Tab 进入也滑出，焦点离开再收起
    root.addEventListener('focusin', () => {
      clearTimeout(peekTimer);
      setPeeking(false);
    });
    root.addEventListener('focusout', (event) => {
      if (event.relatedTarget && root.contains(event.relatedTarget)) return;
      if (!playerOpen && !dragState) schedulePeek(800);
    });
    fabButton.addEventListener('click', () => {
      if (suppressFabClick) {
        suppressFabClick = false;
        return;
      }
      const revealOnly = revealOnlyClick;
      revealOnlyClick = false;
      setPeeking(false);
      if (revealOnly) {
        // 触摸屏没有 hover：第一下只滑出，2.5 秒内没再点就重新收起
        schedulePeek(2500);
        return;
      }
      setPlayerOpen(true);
    });
    fabButton.addEventListener('dragstart', (event) => event.preventDefault());
    window.addEventListener('pointermove', moveFab);
    window.addEventListener('pointerup', finishFabDrag);
    window.addEventListener('pointercancel', finishFabDrag);
  }

  window.addEventListener('pointermove', (event) => {
    lastPointer.x = event.clientX;
    lastPointer.y = event.clientY;
  }, { passive: true });

  let positionFrame = 0;
  window.addEventListener('resize', () => {
    if (positionFrame) return;
    positionFrame = requestAnimationFrame(() => {
      positionFrame = 0;
      measureViewBox();
      applyPosition();
    });
  });

  playButton.addEventListener('click', togglePlay);
  toggleButton.addEventListener('click', togglePlay);
  if (closeButton) {
    closeButton.addEventListener('click', () => setPlayerOpen(false));
  }
  if (hideToggle) {
    hideToggle.addEventListener('click', () => {
      autoHide = !autoHide;
      try { localStorage.setItem(STORAGE.autoHide, autoHide ? '1' : '0'); } catch { /* ignore */ }
      renderAutoHide();
      if (!autoHide) {
        clearTimeout(peekTimer);
        setPeeking(false);
      } else {
        schedulePeek(800);
      }
    });
  }
  if (modeButton) modeButton.addEventListener('click', cycleMode);
  prevButton.addEventListener('click', () => selectTrack(stepIndex(-1), { autoplay: true, fromHistory: true }));
  nextButton.addEventListener('click', () => selectTrack(stepIndex(1), { autoplay: true }));
  if (sortButton) {
    sortButton.addEventListener('click', () => setSortMode(sortMode === 'az' ? 'manual' : 'az'));
  }
  listToggle.addEventListener('click', () => {
    const next = playlist.hidden;
    playlist.hidden = !next;
    listToggle.setAttribute('aria-expanded', String(next));
    root.classList.toggle('is-list-open', next);
    if (next) positionPlaylist();
  });
  root.querySelector('[data-music-playlist-close]').addEventListener('click', () => {
    playlist.hidden = true;
    listToggle.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-list-open');
  });
  document.addEventListener('click', (event) => {
    if (!playerOpen || eventInside(event, root)) return;
    setPlayerOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && playerOpen) setPlayerOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (playlist.hidden || eventInside(event, root)) return;
    playlist.hidden = true;
    listToggle.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-list-open');
  });

  window.MianxiaPlayer = {
    refresh: loadSongs,
    setSongs: (list) => setSongs(list),
    getSongs: () => songs.slice()
  };

  if (mediaSession) {
    const setHandler = (action, handler) => {
      try { mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
    };
    setHandler('play', () => {
      if (!songs.length) return;
      if (currentIndex < 0) selectTrack(0, { autoplay: true });
      else audio.play().catch(() => updatePlayButton());
    });
    setHandler('pause', () => audio.pause());
    setHandler('previoustrack', () => {
      if (songs.length) selectTrack(stepIndex(-1), { autoplay: true, fromHistory: true });
    });
    setHandler('nexttrack', () => {
      if (songs.length) selectTrack(stepIndex(1), { autoplay: true });
    });
    setHandler('seekbackward', (details = {}) => {
      audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
      updateMediaPosition(true);
    });
    setHandler('seekforward', (details = {}) => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 10;
      audio.currentTime = Math.min(duration, audio.currentTime + (details.seekOffset || 10));
      updateMediaPosition(true);
    });
    setHandler('seekto', (details = {}) => {
      if (!Number.isFinite(details.seekTime)) return;
      if (details.fastSeek && typeof audio.fastSeek === 'function') audio.fastSeek(details.seekTime);
      else audio.currentTime = details.seekTime;
      updateMediaPosition(true);
    });
    setHandler('stop', () => {
      audio.pause();
      audio.currentTime = 0;
      updateMediaPosition(true);
    });
  }

  loadSongs();
})();
