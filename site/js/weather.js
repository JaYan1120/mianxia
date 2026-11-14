/**
 * 首页「今日天气」小组件。
 *
 * 默认只显示作者所在地（站点设置里配好的经纬度），不碰访客的位置、不发额外请求；
 * 访客点「换成我这里」才请求浏览器定位，成功后记住，并可以再点一次换回作者的天气。
 *
 * 取数：
 *  - 本地服务 / 桌面端：走 /api/weather（服务端代理，CSP 只允许 self）
 *  - 静态站（GitHub Pages）：直接请求 Open-Meteo（CORS 允许），定位反查走 BigDataCloud
 */

const CACHE_KEY = 'mianxia:weather:v1';
const LOCATION_KEY = 'mianxia:weather:loc:v1';
const WEATHER_TTL = 30 * 60 * 1000;
const LOCATION_TTL = 10 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT = 16000;

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const REVERSE_GEOCODE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const WEATHER_CODES = {
  0: { label: '晴', icon: 'clear' },
  1: { label: '大部晴朗', icon: 'clear' },
  2: { label: '多云', icon: 'partly' },
  3: { label: '阴', icon: 'cloud' },
  45: { label: '雾', icon: 'fog' },
  48: { label: '雾凇', icon: 'fog' },
  51: { label: '毛毛雨', icon: 'drizzle' },
  53: { label: '毛毛雨', icon: 'drizzle' },
  55: { label: '毛毛雨', icon: 'drizzle' },
  56: { label: '冻毛毛雨', icon: 'drizzle' },
  57: { label: '冻毛毛雨', icon: 'drizzle' },
  61: { label: '小雨', icon: 'rain' },
  63: { label: '中雨', icon: 'rain' },
  65: { label: '大雨', icon: 'rain' },
  66: { label: '冻雨', icon: 'rain' },
  67: { label: '冻雨', icon: 'rain' },
  71: { label: '小雪', icon: 'snow' },
  73: { label: '中雪', icon: 'snow' },
  75: { label: '大雪', icon: 'snow' },
  77: { label: '米雪', icon: 'snow' },
  80: { label: '阵雨', icon: 'rain' },
  81: { label: '阵雨', icon: 'rain' },
  82: { label: '强阵雨', icon: 'rain' },
  85: { label: '阵雪', icon: 'snow' },
  86: { label: '阵雪', icon: 'snow' },
  95: { label: '雷阵雨', icon: 'thunder' },
  96: { label: '雷暴冰雹', icon: 'thunder' },
  99: { label: '雷暴冰雹', icon: 'thunder' }
};

const GLYPHS = {
  clear: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'clear-night': '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>',
  partly: '<circle cx="8" cy="8" r="2.6"/><path d="M8 2.4v1.4M2.4 8h1.4M3.6 3.6l1 1M12.4 3.6l-1 1"/><path d="M17.5 20H7a3.5 3.5 0 0 1-.4-7 5 5 0 0 1 9.6-1.4A4.2 4.2 0 0 1 17.5 20Z"/>',
  cloud: '<path d="M17.5 20H7a3.5 3.5 0 0 1-.4-7 5 5 0 0 1 9.6-1.4A4.2 4.2 0 0 1 17.5 20Z"/>',
  fog: '<path d="M4 8h9a3 3 0 0 1 0 6H4M6 18h14M8 4h10"/>',
  drizzle: '<path d="M17.5 15H7a3.5 3.5 0 0 1-.4-7 5 5 0 0 1 9.6-1.4A4.2 4.2 0 0 1 17.5 15Z"/><path d="M9 19v1M14 19v1"/>',
  rain: '<path d="M17.5 15H7a3.5 3.5 0 0 1-.4-7 5 5 0 0 1 9.6-1.4A4.2 4.2 0 0 1 17.5 15Z"/><path d="M8.5 18l-1 3M13 18l-1 3M17 18l-1 3"/>',
  snow: '<path d="M17.5 15H7a3.5 3.5 0 0 1-.4-7 5 5 0 0 1 9.6-1.4A4.2 4.2 0 0 1 17.5 15Z"/><path d="M8 19h.01M12 20h.01M16 19h.01"/>',
  thunder: '<path d="M17.5 15H7a3.5 3.5 0 0 1-.4-7 5 5 0 0 1 9.6-1.4A4.2 4.2 0 0 1 17.5 15Z"/><path d="m12.5 16-2 4h3l-2 4"/>'
};

let activeRequest = null;

function glyphMarkup(name, size = 15) {
  const body = GLYPHS[name] || GLYPHS.cloud;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function isStaticSite() {
  return Boolean(document.body && document.body.hasAttribute('data-page'));
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 隐私模式下忽略 */
  }
}

function readLocation() {
  const saved = readJson(LOCATION_KEY);
  if (!saved || !Number.isFinite(Number(saved.lat)) || !Number.isFinite(Number(saved.lon))) return null;
  if (Date.now() - Number(saved.at || 0) > LOCATION_TTL) return null;
  return saved;
}

function saveLocation(place) {
  writeJson(LOCATION_KEY, {
    lat: round2(place.lat),
    lon: round2(place.lon),
    city: place.city || '',
    province: place.province || '',
    at: Date.now()
  });
}

function clearLocation() {
  try {
    window.localStorage.removeItem(LOCATION_KEY);
  } catch {
    /* 忽略 */
  }
}

function readCacheEntry(lat, lon, allowStale = true) {
  const cached = readJson(CACHE_KEY);
  if (!cached || cached.key !== lat + "," + lon) return null;
  const age = Date.now() - Number(cached.at || 0);
  if (!allowStale && age > WEATHER_TTL) return null;
  return { data: cached.data || null, stale: age > WEATHER_TTL };
}

function readCache(lat, lon) {
  const hit = readCacheEntry(lat, lon, false);
  return hit && hit.data;
}

function writeCache(lat, lon, data) {
  writeJson(CACHE_KEY, { key: `${lat},${lon}`, at: Date.now(), data });
}

function authorPlace(node) {
  const lat = Number(node.dataset.lat);
  const lon = Number(node.dataset.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat: round2(lat),
    lon: round2(lon),
    city: node.dataset.city || '',
    province: node.dataset.province || ''
  };
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const temperature = Number(payload.temperature);
  if (!Number.isFinite(temperature)) return null;
  const code = Number(payload.code);
  const meta = WEATHER_CODES[code] || { label: '多云', icon: 'cloud' };
  const feels = Number(payload.apparentTemperature);
  const isDay = payload.isDay !== false;
  return {
    temperature: Math.round(temperature),
    apparentTemperature: Number.isFinite(feels) ? Math.round(feels) : null,
    code,
    label: payload.label || meta.label,
    icon: payload.icon || (!isDay && meta.icon === 'clear' ? 'clear-night' : meta.icon),
    city: String(payload.city || ''),
    province: String(payload.province || '')
  };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchWeatherDirect(place) {
  const target = `${OPEN_METEO}?latitude=${place.lat}&longitude=${place.lon}`
    + '&current=temperature_2m,apparent_temperature,weather_code,is_day'
    + '&timezone=auto&forecast_days=1';
  const data = await fetchJson(target);
  const current = data && data.current;
  if (!current) return null;
  return normalizePayload({
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    code: current.weather_code,
    isDay: Number(current.is_day) !== 0,
    city: place.city,
    province: place.province
  });
}

async function fetchWeather(place) {
  const cached = readCache(place.lat, place.lon);
  if (cached) return cached;
  let data = null;
  if (!isStaticSite()) {
    const params = new URLSearchParams({ lat: String(place.lat), lon: String(place.lon) });
    if (place.city) params.set('city', place.city);
    if (place.province) params.set('province', place.province);
    try {
      const payload = await fetchJson(`/api/weather?${params.toString()}`);
      data = normalizePayload(place.city ? { ...payload, city: place.city, province: place.province } : payload);
    } catch {
      data = null;
    }
  }
  // 本地/桌面端有 /api/weather，直连外部会被 CSP 拦；只有静态站才走直连
  if (!data && isStaticSite()) {
    try {
      data = await fetchWeatherDirect(place);
    } catch {
      data = null;
    }
  }
  if (data) {
    writeCache(place.lat, place.lon, data);
    return data;
  }
  // 网络失败时保留上次成功的结果（可能已过期），至少还能显示度数
  const stale = readCacheEntry(place.lat, place.lon, true);
  return stale && stale.data ? { ...stale.data, stale: true } : null;
}

async function reverseGeocode(lat, lon) {
  try {
    const data = await fetchJson(
      `${REVERSE_GEOCODE}?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
    );
    return {
      city: String(data.city || data.locality || '').replace(/(市|区|县)$/u, ''),
      province: String(data.principalSubdivision || '')
        .replace(/(维吾尔自治区|壮族自治区|回族自治区|特别行政区|自治区|省|市)$/u, '')
    };
  } catch {
    return { city: '', province: '' };
  }
}

// 显示成「广东佛山」；直辖市的省和市同名时只显示一次
function placeLabel(place) {
  if (!place) return '';
  const city = String(place.city || '');
  const province = String(place.province || '');
  if (city && province && province !== city) return `${province}${city}`;
  return city || province;
}

function withLabel(data, place) {
  return { ...data, city: placeLabel(place) || data.city || '' };
}

function render(node, data, mode, options = {}) {
  if (!node || !data) return;
  const iconNode = node.querySelector('[data-weather-icon]');
  const cityNode = node.querySelector('[data-weather-city]');
  const labelNode = node.querySelector('[data-weather-label]');
  const tempNode = node.querySelector('[data-weather-temp]');
  const feelsNode = node.querySelector('[data-weather-feels]');
  const toggle = node.querySelector('[data-weather-toggle]');

  if (iconNode) iconNode.innerHTML = glyphMarkup(data.icon);
  if (cityNode) cityNode.textContent = data.city || '';
  if (labelNode) labelNode.textContent = data.label || '';
  if (tempNode) tempNode.textContent = `${data.temperature}°`;
  if (feelsNode) {
    const show = data.apparentTemperature !== null
      && Math.abs(data.apparentTemperature - data.temperature) >= 2;
    feelsNode.textContent = show ? `· 体感 ${data.apparentTemperature}°` : '';
    feelsNode.hidden = !show;
  }
  if (toggle) toggle.textContent = mode === 'mine' ? '换成作者的天气' : '换成我这里';
  node.dataset.mode = mode;
  node.classList.add('is-ready');
  node.classList.toggle('is-stale', Boolean(options.stale));
  if (options.stale) showNote(node, '天气数据可能不是最新');
  else hideNote(node);
  node.hidden = false;

  const aria = [data.city, data.label, `${data.temperature} 度`].filter(Boolean).join('，');
  node.setAttribute('aria-label', `今日天气：${aria}`);
}

function hideNote(node) {
  const note = node.querySelector('[data-weather-note]');
  if (!note) return;
  clearTimeout(showNote.timer);
  note.hidden = true;
  note.textContent = '';
}

function showNote(node, text, sticky = false) {
  const note = node.querySelector('[data-weather-note]');
  if (!note) return;
  note.textContent = text;
  note.hidden = false;
  clearTimeout(showNote.timer);
  if (sticky) return;
  showNote.timer = setTimeout(() => {
    note.hidden = true;
    note.textContent = '';
  }, 5200);
}

function setBusy(node, busy) {
  const toggle = node.querySelector('[data-weather-toggle]');
  if (!toggle) return;
  toggle.disabled = busy;
  toggle.textContent = busy
    ? '定位中…'
    : (node.dataset.mode === 'mine' ? '换成作者的天气' : '换成我这里');
}

function currentPlace(node) {
  const saved = readLocation();
  if (saved) {
    return {
      place: {
        lat: round2(saved.lat),
        lon: round2(saved.lon),
        city: saved.city || '',
        province: saved.province || ''
      },
      mode: 'mine'
    };
  }
  const author = authorPlace(node);
  return author ? { place: author, mode: 'author' } : null;
}

let retryTimer = null;
let retryNode = null;

function cancelRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  retryNode = null;
}

function scheduleRetry(node, delay = 60000) {
  if (retryTimer) clearTimeout(retryTimer);
  retryNode = node;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    const target = retryNode;
    retryNode = null;
    if (target && target.isConnected) refresh(target).catch(() => {});
  }, delay);
}

async function refresh(node) {
  const current = currentPlace(node);
  if (!current) {
    node.hidden = true;
    return;
  }
  const { place, mode } = current;
  if (!node.classList.contains('is-ready')) {
    const cached = readCacheEntry(place.lat, place.lon, true);
    if (cached && cached.data) render(node, withLabel(cached.data, place), mode, { stale: cached.stale });
  }
  const data = await fetchWeather(place);
  if (!data) {
    // 上游不可用时不要隐藏组件：保留城市和「—°」，并自动重试
    node.hidden = false;
    node.dataset.mode = mode;
    node.classList.add('is-stale');
    node.setAttribute('aria-label', '今日天气：' + (placeLabel(place) || '当前位置') + '，暂时取不到');
    const toggle = node.querySelector('[data-weather-toggle]');
    if (toggle) {
      toggle.disabled = false;
      toggle.textContent = mode === 'mine' ? '换成作者的天气' : '换成我这里';
    }
    showNote(node, '天气暂时取不到，稍后自动重试', true);
    scheduleRetry(node);
    return;
  }
  render(node, withLabel(data, place), mode, { stale: !!data.stale });
  if (data.stale) scheduleRetry(node, 120000);
  else cancelRetry();
}

async function requestMyLocation(node) {
  if (!window.isSecureContext) {
    showNote(node, '浏览器要求 HTTPS 才能定位');
    return;
  }
  if (!navigator.geolocation) {
    showNote(node, '这个浏览器不支持定位');
    return;
  }
  setBusy(node, true);
  let settled = false;
  const watchdog = setTimeout(() => {
    if (settled) return;
    settled = true;
    setBusy(node, false);
    showNote(node, '定位没有响应');
  }, 15000);
  navigator.geolocation.getCurrentPosition(async (position) => {
    if (settled) return;
    settled = true;
    clearTimeout(watchdog);
    try {
      const lat = round2(position.coords.latitude);
      const lon = round2(position.coords.longitude);
      let names = { city: '', province: '' };
      if (isStaticSite()) {
        names = await reverseGeocode(lat, lon);
      } else {
        try {
          const payload = await fetchJson('/api/weather?lat=' + lat + '&lon=' + lon);
          names = { city: payload.city || '', province: payload.province || '' };
        } catch {
          names = { city: '', province: '' };
        }
      }
      const place = { lat, lon, city: names.city, province: names.province };
      const data = await fetchWeather(place);
      if (!data) {
        showNote(node, '暂时取不到这边的天气');
        scheduleRetry(node);
        return;
      }
      // 只有真正取到这里的天气才记住位置，避免下次打开停在一个取不到的地方
      saveLocation(place);
      render(node, withLabel(data, place), 'mine', { stale: !!data.stale });
      if (data.stale) scheduleRetry(node, 120000);
      else cancelRetry();
    } catch {
      showNote(node, '暂时取不到这边的天气');
      scheduleRetry(node);
    } finally {
      setBusy(node, false);
    }
  }, (error) => {
    if (settled) return;
    settled = true;
    clearTimeout(watchdog);
    setBusy(node, false);
    showNote(node, error && error.code === 1 ? '没有授权定位' : '定位没成功');
  }, { timeout: 12000, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false });
}

export function hydrateWeather(root = document) {
  const node = root.querySelector('[data-weather]');
  if (!node || node.dataset.weatherReady === '1') return;
  node.dataset.weatherReady = '1';

  const toggle = node.querySelector('[data-weather-toggle]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      if (node.dataset.mode === 'mine') {
        clearLocation();
        refresh(node);
        return;
      }
      requestMyLocation(node);
    });
  }

  // 先用上次的结果铺上，避免首屏空白
  const current = currentPlace(node);
  if (current) {
    const cached = readCacheEntry(current.place.lat, current.place.lon, true);
    if (cached && cached.data) render(node, withLabel(cached.data, current.place), current.mode, { stale: cached.stale });
  }

  if (!activeRequest) {
    activeRequest = refresh(node)
      .catch(() => {})
      .finally(() => { activeRequest = null; });
  }
  window.addEventListener('online', () => {
    refresh(node).catch(() => {});
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && node.classList.contains('is-stale')) {
      refresh(node).catch(() => {});
    }
  });
}