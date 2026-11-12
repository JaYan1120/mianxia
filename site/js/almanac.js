/**
 * 首页「今日宜忌」小组件。
 *
 * 数据优先走本地服务 /api/almanac（服务端已做缓存与兜底），
 * 静态导出（GitHub Pages）没有本地服务时直接请求外部老黄历接口。
 * 两者都失败时保留页面里原来的「星期X · 宜记录」，并用上一次成功的缓存顶上。
 */

const ENDPOINT = 'https://cn.apihz.cn/api/time/getday.php?id=88888888&key=88888888';
const CACHE_KEY = 'mianxia:almanac:v1';
const REQUEST_TIMEOUT = 7000;

let inflight = null;

function pad2(value) {
  return String(value).padStart(2, '0');
}

function localDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function escapeText(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value == null ? '' : value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(raw) {
  const id = String(raw || '');
  if (/^\d{8}$/.test(id)) return `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
  return '';
}

function normalize(payload) {
  if (!payload || typeof payload !== 'object') return null;
  // 本地服务返回的已经是规整结构
  if (payload.ok === true && Array.isArray(payload.yi) && Array.isArray(payload.ji)) {
    return {
      date: payload.date || '',
      weekday: payload.weekday || '',
      lunar: payload.lunar || '',
      ganzhi: payload.ganzhi || '',
      chongsha: payload.chongsha || '',
      yi: payload.yi,
      ji: payload.ji
    };
  }
  // 外部接口原始结构
  if (Number(payload.code) === 200) {
    const yi = splitList(payload.yi);
    const ji = splitList(payload.ji);
    if (!yi.length && !ji.length) return null;
    return {
      date: formatDate(payload.id),
      weekday: payload.xingqi ? `星期${payload.xingqi}` : '',
      lunar: `${payload.nyue || ''}${payload.nri || ''}`.trim(),
      ganzhi: [payload.YEARGANZHI || payload.ganzhinian, payload.ganzhiyue, payload.ganzhiri].filter(Boolean).join(' '),
      chongsha: payload.xiangchong || payload.DAYCHONGDESC || '',
      yi,
      ji
    };
  }
  return null;
}

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.yi) || !Array.isArray(parsed.ji)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* 隐私模式下忽略 */
  }
}

function itemsMarkup(items) {
  if (!items.length) return '—';
  return items
    .map((item) => `<span class="almanac-item">${escapeText(item)}</span>`)
    .join('<i class="almanac-sep">·</i>');
}

function linesMarkup(data) {
  return `<span class="almanac-line"><b class="almanac-tag almanac-tag-yi">宜</b><span class="almanac-text">${itemsMarkup(data.yi)}</span></span>`
    + `<span class="almanac-line"><b class="almanac-tag almanac-tag-ji">忌</b><span class="almanac-text">${itemsMarkup(data.ji)}</span></span>`;
}

function apply(node, data) {
  const lines = node.querySelector('[data-almanac-lines]');
  if (!lines) return;
  lines.innerHTML = linesMarkup(data);
  node.classList.add('is-ready');
  const detail = [
    data.lunar ? `农历${data.lunar}` : '',
    data.ganzhi,
    data.chongsha
  ].filter(Boolean).join(' · ');
  if (detail) node.title = detail;
  node.setAttribute(
    'aria-label',
    `今日宜忌：宜 ${data.yi.join('、') || '无'}；忌 ${data.ji.join('、') || '无'}`
  );
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    cache: 'no-store'
  });
  return res;
}

function staticRoot() {
  return (document.body && document.body.getAttribute('data-root')) || '';
}

function isStaticSite() {
  return Boolean(document.body && document.body.hasAttribute('data-page'));
}

async function loadFromStaticYear(date) {
  if (!isStaticSite()) return null;
  const [year, month] = date.split('-');
  try {
    const res = await fetchJson(`${staticRoot()}data/almanac/${year}-${month}.json`);
    if (!res.ok) return null;
    const payload = await res.json();
    const record = payload && payload.days ? payload.days[date] : null;
    return record ? normalize(record) : null;
  } catch {
    return null;
  }
}

async function loadAlmanac(date) {
  // 1. 本地服务（桌面端 / 本地预览）：服务端已按整年算好，直接取当天那条
  try {
    const res = await fetchJson(`/api/almanac?date=${encodeURIComponent(date)}`);
    if (res.ok) {
      const data = normalize(await res.json());
      if (data) return data;
    } else if (/json/i.test(res.headers.get('content-type') || '')) {
      // 本地服务在但拒绝了请求：不再直连外部，避免无意义的外网请求和 CSP 报错
      return null;
    }
  } catch {
    /* 没有本地服务，继续 */
  }
  // 2. 静态导出（GitHub Pages）：读构建时生成的整月数据，离线也能用
  const fromYear = await loadFromStaticYear(date);
  if (fromYear) return fromYear;
  // 3. 最后一招：直连外部老黄历（只认今天，用于跨年还没重新生成的情况）
  try {
    const res = await fetchJson(ENDPOINT);
    if (!res.ok) return null;
    return normalize(await res.json());
  } catch {
    return null;
  }
}

export function hydrateAlmanac(root = document) {
  const node = root.querySelector('[data-almanac]');
  if (!node || node.dataset.almanacReady === '1') return;
  node.dataset.almanacReady = '1';

  // 先把上次成功的结果铺上，避免首屏空白和布局跳动
  const today = localDateKey();
  const cached = readCache();
  if (cached && cached.date === today) apply(node, cached);

  if (!inflight) {
    inflight = loadAlmanac(today).finally(() => { inflight = null; });
  }
  inflight.then((data) => {
    if (!data) return;
    apply(node, data);
    writeCache(data);
  }).catch(() => { /* 保留缓存或原来的「星期X · 宜记录」 */ });
}
