/**
 * 首页「今日星座」小组件。
 *
 * 运势不依赖任何外部接口：12 星座的文案库写在这里，按「星座 + 日期」做确定性生成。
 * 同一天、同一星座，刷新多少次结果都一样；换一天或换星座才会变。
 *
 * 这样桌面端、本地预览、GitHub Pages 静态站用的是同一份代码，
 * 不需要服务端代理，也不会因为第三方接口挂掉而变空。
 */

export const DEFAULT_SIGN = 'scorpio';

export const SIGNS = [
  { key: 'aries', name: '白羊座', symbol: '♈', range: '3.21 – 4.19', element: '火象' },
  { key: 'taurus', name: '金牛座', symbol: '♉', range: '4.20 – 5.20', element: '土象' },
  { key: 'gemini', name: '双子座', symbol: '♊', range: '5.21 – 6.21', element: '风象' },
  { key: 'cancer', name: '巨蟹座', symbol: '♋', range: '6.22 – 7.22', element: '水象' },
  { key: 'leo', name: '狮子座', symbol: '♌', range: '7.23 – 8.22', element: '火象' },
  { key: 'virgo', name: '处女座', symbol: '♍', range: '8.23 – 9.22', element: '土象' },
  { key: 'libra', name: '天秤座', symbol: '♎', range: '9.23 – 10.23', element: '风象' },
  { key: 'scorpio', name: '天蝎座', symbol: '♏', range: '10.24 – 11.22', element: '水象' },
  { key: 'sagittarius', name: '射手座', symbol: '♐', range: '11.23 – 12.21', element: '火象' },
  { key: 'capricorn', name: '摩羯座', symbol: '♑', range: '12.22 – 1.19', element: '土象' },
  { key: 'aquarius', name: '水瓶座', symbol: '♒', range: '1.20 – 2.18', element: '风象' },
  { key: 'pisces', name: '双鱼座', symbol: '♓', range: '2.19 – 3.20', element: '水象' }
];

/** 每天的一句话运势，与星座无关，靠日期和星座共同取模来打散。 */
const DAILY_LINES = [
  '今天适合把节奏放慢半拍，让事情自己浮出水面。',
  '直觉比分析更先到达答案，先相信第一反应。',
  '有一件拖着的小事，今天做掉会比想象中轻松。',
  '适合整理：桌面、相册，还有心里那点没说完的话。',
  '会收到一个迟到的回复，不必急着解读它。',
  '今天的耐心是稀缺资源，留给值得的人。',
  '换一条路线回家，会撞见一点意外的好心情。',
  '灵感来得碎片化，先记下来，别急着拼完整。',
  '适合把一件旧事重新做一遍，会有新的手感。',
  '今天说话前多停一秒，能省下很多解释。',
  '有人会主动靠近，你的回应可以温柔一点。',
  '该拒绝的事，今天拒绝得比平时更容易。',
  '身体比情绪更诚实，累了就早点收工。',
  '适合完成小而具体的事，成就感比大计划更解渴。',
  '会有一个瞬间觉得“这样就很好”，记住它。',
  '今天的运气藏在细节里：一杯热水、一句问候。',
  '计划可以留一道缝，让偶然走进来。',
  '别在深夜做决定，答案在明天的光里。',
  '适合和久没联系的人说一句话，不必有目的。',
  '今天适合少说多做，行动会替你解释。',
  '有点想折腾，但先问问自己是不是真的需要。',
  '会有人误解你，不用急着澄清，时间会补上。',
  '适合把注意力放回自己身上，读几页书，走一段路。',
  '今天的小确幸来自“按时吃饭”这种朴素的事。',
  '该花的钱花，该省的心省。',
  '情绪会有起伏，允许它经过，不必留住它。',
  '适合把一个大目标拆成明天就能开始的第一步。',
  '会碰到一点阻力，那多半是在提醒你换个角度。',
  '今天适合原谅一个人，尤其可能是自己。',
  '慢一点没关系，你并没有落后。',
  '今天适合把一句放不下的话，写成能放下的样子。',
  '想见的人就见，想说的话就说，今天不流行含蓄。'
];

/** 每个星座的专属提醒，短、具体，避免那种“今天运气不错”的空话。 */
const SIGN_NOTES = {
  aries: [
    '冲劲很好，但今天适合先看一眼地图。',
    '别人的慢，不是对你的否定。',
    '把“马上”改成“今天之内”，会松很多。',
    '火气上来的时候，先喝口水再开口。'
  ],
  taurus: [
    '你守着的秩序值得被尊重，但不必守住每一件小事。',
    '改变一件小事就够，不用推翻全部。',
    '味道、触感、温度，今天多照顾自己一点。',
    '慢不是问题，停在原地才是。'
  ],
  gemini: [
    '想法很多，挑一个落到地上。',
    '今天适合问问题，而不是急着给答案。',
    '话说三遍会失真，重要的事说一遍。',
    '你的好奇心是礼物，别用它来逃避。'
  ],
  cancer: [
    '今天适合把家收拾成想待的样子。',
    '别人的情绪不是你的责任。',
    '想念就说出口，不丢人。',
    '先照顾自己的胃和睡眠。'
  ],
  leo: [
    '被看见很简单，难的是被理解。',
    '今天不必表演，真实就够。',
    '分享一件小事，会有人认真听。',
    '骄傲可以留着，硬撑不必。'
  ],
  virgo: [
    '完成比完美重要，今天尤其。',
    '别人的方式也能到达终点。',
    '允许自己犯错一次，记一笔就好。',
    '身体的疲惫，别用计划去填。'
  ],
  libra: [
    '犹豫的时候，先问“我想”，而不是“应该”。',
    '今天适合把话说清楚，而不是说漂亮。',
    '你的平衡感很好，也允许自己歪一下。',
    '别为了不冷场而答应。'
  ],
  scorpio: [
    '别把试探当成沟通。',
    '你看到的比说出来的多，这很珍贵，但别什么都咽下去。',
    '信任可以先给一点点，再决定给多少。',
    '深水里的东西，也可以浮上来晒太阳。'
  ],
  sagittarius: [
    '想出发就出发，哪怕只是去城郊。',
    '今天适合把玩笑收一收，有人当真了。',
    '远方很好，脚下这段路也值得。',
    '自由不是没有牵挂，是有得选。'
  ],
  capricorn: [
    '今天适合承认：我也有想被照顾的时候。',
    '工作之外，留一件没用但开心的事。',
    '你的稳，是别人敢靠近的理由。',
    '别用“以后”推迟“现在”。'
  ],
  aquarius: [
    '你的不同不需要解释。',
    '今天适合把奇怪的想法说给一个人听。',
    '距离感不是冷淡，记得留一扇门。',
    '规则可以改，但先说清楚。'
  ],
  pisces: [
    '今天适合把梦写成字，哪怕只有三行。',
    '别人的故事，别全背在自己身上。',
    '直觉很准，但要落到具体的一步。',
    '允许自己融不进某个场面。'
  ]
};

const LUCKY_COLORS = [
  { name: '朱砂', hex: '#b45138' },
  { name: '靛青', hex: '#3b5b7a' },
  { name: '松针绿', hex: '#4c6b52' },
  { name: '藤黄', hex: '#d4a24e' },
  { name: '藕荷', hex: '#b98a9a' },
  { name: '月白', hex: '#e8e6df' },
  { name: '赭石', hex: '#a85c32' },
  { name: '竹青', hex: '#7f9d8a' },
  { name: '琥珀', hex: '#c98a3c' },
  { name: '黛蓝', hex: '#2f3a52' }
];

const DIRECTIONS = ['东', '南', '西', '北', '东南', '西南', '东北', '西北'];

/** 星座版「宜」：都是能当天做完的小事，不写空话。 */
const YI_LIST = [
  '独处', '散步', '早睡', '整理', '读书', '写日记', '复盘', '断舍离', '下厨', '发呆',
  '晒太阳', '换个座位', '主动开口', '把话说清', '留白', '慢一点', '运动', '泡茶', '听歌', '收尾',
  '拒绝', '示弱', '尝新', '把话说软', '记账', '清洗', '远眺', '拥抱', '请教', '定计划'
];

/** 星座版「忌」：具体到行为，避免「忌冲动」这种正确但没用的提醒。 */
const JI_LIST = [
  '熬夜', '逞强', '内耗', '翻旧账', '硬撑', '过度解释', '讨好', '比价', '冲动下单', '深夜emo',
  '反复确认', '赌气', '自我否定', '久坐', '刷手机', '熬夜刷剧', '抢话', '较真', '过度计划', '猜忌',
  '空腹喝咖啡', '替人决定', '把话说满', '回头找人', '硬碰硬', '翻旧聊天', '钻牛角尖', '一口气做完', '逞口舌', '忽略身体'
];

/** 今日关键词：两个字的调性词，配合一句话运势一起看。 */
const KEYWORD_LIST = [
  '收敛', '专注', '舒展', '留白', '沉淀', '轻装', '笃定', '松弛', '清醒', '温柔',
  '克制', '热烈', '安静', '笃行', '慢热', '通透', '自洽', '轻盈', '扎根', '向上',
  '回望', '出发', '落地', '呼吸'
];

const SCORE_LABELS = [
  { key: 'overall', name: '综合' },
  { key: 'love', name: '爱情' },
  { key: 'career', name: '事业' },
  { key: 'money', name: '财运' },
  { key: 'health', name: '健康' }
];

const STORAGE_SIGN = 'mianxia:horoscope:sign:v1';

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function dateLabel(date = new Date()) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function signByKey(key) {
  return SIGNS.find((item) => item.key === key) || null;
}

/** 存储里的值可能来自旧版本或被改坏，统一收敛到合法星座。 */
export function normalizeSign(value) {
  return signByKey(String(value || '').trim()) ? String(value).trim() : '';
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** 小而稳定的伪随机数：同一种子每次得到同一串数。 */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length) % list.length];
}

function score(random) {
  return 56 + Math.floor(random() * 44);
}

/** 从列表里不重复地抽 count 个。 */
function drawDistinct(random, list, count) {
  const pool = list.slice();
  const picked = [];
  while (picked.length < count && pool.length) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return picked;
}

/**
 * 抽某一天的全部数据。
 * 抽取顺序不要随便动：先一句话/提醒/五项指数/幸运三项，再抽后加的宜忌和关键词，
 * 这样以后加内容不会把已有的运势、指数、幸运色全打乱。
 */
function drawFortune(signKey, date) {
  const day = localDateKey(date);
  const random = createRandom(hashString(`${signKey}|${day}|mianxia`));
  const headline = pick(random, DAILY_LINES);
  const note = pick(random, SIGN_NOTES[signKey]);
  const love = score(random);
  const career = score(random);
  const money = score(random);
  const health = score(random);
  const average = Math.round((love + career + money + health) / 4);
  const overall = Math.max(50, Math.min(99, average + Math.round((random() - 0.4) * 10)));
  const lucky = {
    color: pick(random, LUCKY_COLORS),
    number: 1 + Math.floor(random() * 9),
    direction: pick(random, DIRECTIONS)
  };
  const yi = drawDistinct(random, YI_LIST, 2);
  const ji = drawDistinct(random, JI_LIST, 2);
  const keywords = drawDistinct(random, KEYWORD_LIST, random() < 0.4 ? 3 : 2);
  return {
    day,
    headline,
    note,
    scores: { overall, love, career, money, health },
    lucky,
    yi,
    ji,
    keywords
  };
}

export function dailyHoroscope(signKey, date = new Date()) {
  const sign = signByKey(signKey) || signByKey(DEFAULT_SIGN);
  const today = drawFortune(sign.key, date);
  // 顺便算昨天的综合指数，用来显示「较昨日 ↑↓」
  const yesterdayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  const yesterday = drawFortune(sign.key, yesterdayDate);
  return {
    sign: sign.key,
    name: sign.name,
    symbol: sign.symbol,
    range: sign.range,
    element: sign.element,
    date: today.day,
    headline: today.headline,
    note: today.note,
    scores: today.scores,
    trend: { delta: today.scores.overall - yesterday.scores.overall },
    lucky: today.lucky,
    yi: today.yi,
    ji: today.ji,
    keywords: today.keywords
  };
}

function escapeText(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function trendMarkup(delta) {
  if (typeof delta !== 'number') return '';
  if (delta > 0) return `<i class="horo-trend is-up" title="综合指数较昨日">↑${delta}</i>`;
  if (delta < 0) return `<i class="horo-trend is-down" title="综合指数较昨日">↓${Math.abs(delta)}</i>`;
  return '<i class="horo-trend is-flat" title="综合指数较昨日">持平</i>';
}

function meterMarkup(data) {
  return SCORE_LABELS.map(({ key, name }) => `
    <span class="horo-meter">
      <span class="horo-meter-name">${name}</span>
      <i class="horo-meter-track"><b style="width:${data.scores[key]}%"></b></i>
      <em class="horo-meter-value">${data.scores[key]}${key === 'overall' ? trendMarkup(data.trend && data.trend.delta) : ''}</em>
    </span>`).join('');
}

function pickerMarkup(current, open) {
  return `
    <div class="horo-picker" data-horo-picker ${open ? '' : 'hidden'}>
      <p class="horo-picker-hint">选择你的星座，只保存在这台设备上。</p>
      <div class="horo-picker-grid">
        ${SIGNS.map((sign) => `
          <button type="button" class="horo-pick ${sign.key === current ? 'is-active' : ''}" data-horo-pick="${sign.key}" aria-pressed="${sign.key === current}">
            <span class="horo-pick-symbol" aria-hidden="true">${sign.symbol}</span>
            <b>${sign.name.replace('座', '')}</b>
            <small>${sign.range}</small>
          </button>`).join('')}
      </div>
    </div>`;
}

function lineMarkup(data) {
  return `
    <span class="horo-chip"><span class="horo-chip-symbol" aria-hidden="true">${data.symbol}</span>${escapeText(data.name)}</span>
    <span class="horo-summary">${escapeText(data.headline)}</span>
    <span class="horo-open-hint" aria-hidden="true" title="综合指数">${data.scores.overall}</span>`;
}

function cardMarkup(data, { authorSign, pickerOpen }) {
  const isAuthor = data.sign === authorSign;
  const author = signByKey(authorSign);
  return `
    <div class="horo-card-head">
      <span class="horo-card-symbol" aria-hidden="true">${data.symbol}</span>
      <span class="horo-card-id">
        <b>${escapeText(data.name)}</b>
        <small>${escapeText(data.range)} · ${escapeText(data.element)}</small>
      </span>
      <time class="horo-card-date" datetime="${data.date}">${dateLabel(new Date(`${data.date}T00:00:00`))}</time>
      <button type="button" class="horo-close" data-horo-close aria-label="关闭运势卡">✕</button>
    </div>
    <p class="horo-headline">${escapeText(data.headline)}</p>
    <div class="horo-tags">${(data.keywords || []).map((word) => `<span class="horo-tag">${escapeText(word)}</span>`).join('')}</div>
    <div class="horo-meters">${meterMarkup(data)}</div>
    <p class="horo-tip"><b>今日提醒</b>${escapeText(data.note)}</p>
    <div class="horo-yiji">
      <span class="horo-yiji-line"><b class="horo-yiji-tag">宜</b><span class="horo-yiji-text">${(data.yi || []).map(escapeText).join(' · ')}</span></span>
      <span class="horo-yiji-line is-ji"><b class="horo-yiji-tag">忌</b><span class="horo-yiji-text">${(data.ji || []).map(escapeText).join(' · ')}</span></span>
    </div>
    <div class="horo-lucky">
      <span class="horo-lucky-item">幸运色<em class="horo-swatch" style="background:${data.lucky.color.hex}"></em>${escapeText(data.lucky.color.name)}</span>
      <span class="horo-lucky-item">幸运数字<b>${data.lucky.number}</b></span>
      <span class="horo-lucky-item">幸运方位<b>${escapeText(data.lucky.direction)}</b></span>
    </div>
    <div class="horo-card-foot">
      <button type="button" class="horo-switch" data-horo-switch aria-expanded="${pickerOpen ? 'true' : 'false'}">
        ${isAuthor
          ? '换成我的星座'
          : `恢复${author ? escapeText(author.name) : '作者的星座'}`}
      </button>
      <span class="horo-foot-note">${isAuthor ? '默认展示站点作者的星座' : '只保存在你的浏览器里'}</span>
    </div>
    ${pickerMarkup(data.sign, pickerOpen)}`;
}

/**
 * 把星座面板接到首页的 hero-note 上。
 * 返回的对象只负责「渲染 / 换星座」，开合浮层由 hero-note.js 控制。
 */
export function mountHoroscope(node) {
  const lineEl = node.querySelector('[data-horoscope-line]');
  const cardEl = node.querySelector('[data-horoscope-card]');
  if (!lineEl || !cardEl) return null;

  const authorSign = normalizeSign(node.dataset.authorSign) || DEFAULT_SIGN;
  let sign = readStoredSign() || authorSign;
  let pickerOpen = false;
  let dateKey = localDateKey();
  let data = dailyHoroscope(sign);

  function render() {
    if (data.date !== dateKey) {
      dateKey = localDateKey();
      data = dailyHoroscope(sign);
    }
    lineEl.innerHTML = lineMarkup(data);
    cardEl.innerHTML = cardMarkup(data, { authorSign, pickerOpen });
    lineEl.setAttribute(
      'aria-label',
      `${data.name}今日运势：${data.headline}综合指数 ${data.scores.overall}`
    );
  }

  function setSign(next, { persist = true } = {}) {
    const normalized = normalizeSign(next);
    if (!normalized) return;
    sign = normalized;
    if (persist) writeStoredSign(sign);
    pickerOpen = false;
    data = dailyHoroscope(sign);
    render();
    cardEl.scrollTop = 0;
  }

  /** 选择器展开后卡片可能超出可视高度，把选择器滚到卡片内可见位置。 */
  function revealPicker() {
    const picker = cardEl.querySelector('[data-horo-picker]');
    if (!picker) return;
    // 两帧之后再滚：hero-note 会在下一帧里设置 max-height，那时才真正出现滚动区
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const current = cardEl.querySelector('[data-horo-picker]');
        if (!current) return;
        cardEl.scrollTop = Math.max(0, current.offsetTop - 12);
      });
    });
  }

  cardEl.addEventListener('click', (event) => {
    if (event.target.closest('[data-horo-switch]')) {
      pickerOpen = !pickerOpen;
      render();
      if (pickerOpen) revealPicker();
      const focusTarget = pickerOpen
        ? cardEl.querySelector('.horo-pick.is-active')
        : cardEl.querySelector('[data-horo-switch]');
      focusTarget?.focus({ preventScroll: true });
      return;
    }
    const pick = event.target.closest('[data-horo-pick]');
    if (pick) {
      setSign(pick.dataset.horoPick);
      cardEl.querySelector('[data-horo-switch]')?.focus({ preventScroll: true });
    }
  });

  // 跨过零点时换一份新运势
  const onVisible = () => {
    if (document.hidden) return;
    if (localDateKey() !== dateKey) {
      data = dailyHoroscope(sign);
      render();
    }
  };
  document.addEventListener('visibilitychange', onVisible);

  render();

  return {
    get sign() { return sign; },
    get authorSign() { return authorSign; },
    setSign,
    render,
    closePicker() {
      if (!pickerOpen) return;
      pickerOpen = false;
      render();
    }
  };
}

export function readStoredSign() {
  try {
    return normalizeSign(window.localStorage.getItem(STORAGE_SIGN));
  } catch {
    return '';
  }
}

export function writeStoredSign(sign) {
  try {
    window.localStorage.setItem(STORAGE_SIGN, sign);
  } catch {
    /* 隐私模式下忽略 */
  }
}
