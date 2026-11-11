'use strict';

(() => {
  const root = document.querySelector('[data-music-player]');
  if (!root) return;

  const STORAGE = {
    track: 'mianxia:music:track',
    time: 'mianxia:music:time',
    volume: 'mianxia:music:volume',
    mode: 'mianxia:music:mode'
  };

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
    order: '<path d="M4 6h16M4 12h16M4 18h16M18 4l2 2-2 2M18 16l2 2-2 2"/>'
  };

  const svg = (name, size = 17) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.music}</svg>`;

  root.innerHTML = `
    <div class="music-player-card">
      <audio data-music-audio preload="metadata"></audio>
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
        <label class="music-volume">
          ${svg('volume', 14)}
          <input type="range" min="0" max="1" step="0.01" value="0.7" aria-label="音量">
        </label>
        <span data-music-count>0 首</span>
      </div>
    </div>
    <div class="music-playlist" data-music-playlist hidden>
      <div class="music-playlist-head">
        <strong>播放列表</strong>
        <span data-music-playlist-count>0 首</span>
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
  const embedded = Array.isArray(window.__MIANXIA_MUSIC__) ? window.__MIANXIA_MUSIC__ : null;

  let songs = [];
  let currentIndex = -1;
  let pendingSeek = 0;
  let lastTimeSave = 0;
  let mode = 'list';

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

  const saveTrack = () => {
    if (currentIndex < 0 || !songs[currentIndex]) return;
    try {
      localStorage.setItem(STORAGE.track, songs[currentIndex].id);
      localStorage.setItem(STORAGE.time, String(audio.currentTime || 0));
    } catch { /* ignore */ }
  };

  const updatePlayButton = () => {
    const playing = !audio.paused && !audio.ended;
    playButton.innerHTML = svg(playing ? 'pause' : 'play', 15);
    playButton.setAttribute('aria-label', playing ? '暂停' : '播放');
    playButton.title = playing ? '暂停' : '播放';
    root.classList.toggle('is-playing', playing);
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
    try { localStorage.setItem(STORAGE.mode, mode); } catch { /* ignore */ }
    renderMode();
  };

  const randomIndex = () => {
    if (songs.length < 2) return 0;
    let next = currentIndex;
    while (next === currentIndex) next = Math.floor(Math.random() * songs.length);
    return next;
  };

  const stepIndex = (direction) => {
    if (!songs.length) return 0;
    if (currentIndex < 0) return direction > 0 ? 0 : songs.length - 1;
    if (mode === 'random' && songs.length > 1) return randomIndex();
    return ((currentIndex + direction) % songs.length + songs.length) % songs.length;
  };

  const renderNow = () => {
    const song = songs[currentIndex];
    if (!song) {
      titleNode.textContent = '还没有歌曲';
      artistNode.textContent = '添加一首歌，让这里响起来';
      return;
    }
    titleNode.textContent = song.title;
    artistNode.textContent = song.artist || '未知艺术家';
    titleNode.title = song.title;
  };

  const renderPlaylist = () => {
    tracksNode.innerHTML = '';
    countNode.textContent = `${songs.length} 首`;
    playlistCountNode.textContent = `${songs.length} 首`;
    songs.forEach((song, index) => {
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
      tracksNode.appendChild(button);
    });
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
    const wasPlaying = !audio.paused && !audio.ended;
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
    root.hidden = songs.length === 0;
    if (!songs.length) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      currentIndex = -1;
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
      return;
    }
    const restoreTime = foundIndex > -1 ? Number(readStorage(STORAGE.time, '0')) || 0 : 0;
    selectTrack(foundIndex > -1 ? foundIndex : 0, { time: restoreTime, autoplay: false });
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

  const storedVolume = (() => {
    try {
      const value = Number(localStorage.getItem(STORAGE.volume));
      return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.7;
    } catch {
      return 0.7;
    }
  })();
  audio.volume = storedVolume;
  volumeInput.value = String(storedVolume);

  const storedMode = readStorage(STORAGE.mode, 'list');
  mode = MODES.some((item) => item.id === storedMode) ? storedMode : 'list';
  renderMode();

  audio.addEventListener('loadedmetadata', () => {
    if (pendingSeek > 0 && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(pendingSeek, Math.max(0, audio.duration - 0.25));
      pendingSeek = 0;
    }
    updateTimeline();
  });
  audio.addEventListener('durationchange', updateTimeline);
  audio.addEventListener('timeupdate', () => {
    updateTimeline();
    const now = Date.now();
    if (now - lastTimeSave > 4000) {
      lastTimeSave = now;
      saveTrack();
    }
  });
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
  });
  volumeInput.addEventListener('input', () => {
    const value = Math.min(1, Math.max(0, Number(volumeInput.value) || 0));
    audio.volume = value;
    try { localStorage.setItem(STORAGE.volume, String(value)); } catch { /* ignore */ }
  });
  playButton.addEventListener('click', togglePlay);
  toggleButton.addEventListener('click', togglePlay);
  if (modeButton) modeButton.addEventListener('click', cycleMode);
  prevButton.addEventListener('click', () => selectTrack(stepIndex(-1), { autoplay: true }));
  nextButton.addEventListener('click', () => selectTrack(stepIndex(1), { autoplay: true }));
  listToggle.addEventListener('click', () => {
    const next = playlist.hidden;
    playlist.hidden = !next;
    listToggle.setAttribute('aria-expanded', String(next));
    root.classList.toggle('is-list-open', next);
  });
  root.querySelector('[data-music-playlist-close]').addEventListener('click', () => {
    playlist.hidden = true;
    listToggle.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-list-open');
  });
  document.addEventListener('click', (event) => {
    if (playlist.hidden || root.contains(event.target)) return;
    playlist.hidden = true;
    listToggle.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-list-open');
  });

  window.MianxiaPlayer = {
    refresh: loadSongs,
    setSongs: (list) => setSongs(list),
    getSongs: () => songs.slice()
  };

  loadSongs();
})();
