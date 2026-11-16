'use strict';

// 跑马灯的「正在听」跟着播放器走。播放器是经典脚本，这里也用经典脚本 + 全局，
// 静态站用 file:// 打开时才不会因为 ES module / 动态 import 被拦。
(() => {
  const EMPTY_TITLE = '此刻没有声音';
  const EMPTY_ARTIST = '放一首歌，这里会跟着走';

  const readPlayer = () => {
    const titleNode = document.querySelector('[data-music-title]');
    const artistNode = document.querySelector('[data-music-artist]');
    const title = titleNode ? String(titleNode.textContent || '').replace(/\s+/g, ' ').trim() : '';
    const artist = artistNode ? String(artistNode.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if (!title || title === '还没有歌曲') return null;
    return { title, artist };
  };

  const write = (node, value) => {
    if (node.textContent === value) return;
    node.textContent = value;
  };

  const paint = () => {
    const titles = document.querySelectorAll('[data-ticker-now-title]');
    if (!titles.length) return;
    const now = readPlayer();
    const title = now ? now.title : EMPTY_TITLE;
    const artist = now ? now.artist : EMPTY_ARTIST;
    titles.forEach((node) => write(node, title));
    document.querySelectorAll('[data-ticker-now-artist]').forEach((node) => write(node, artist));
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    const run = () => {
      scheduled = false;
      paint();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 16);
  };

  const watch = () => {
    paint();
    // 播放器换歌：标题/歌手节点文字变化
    const titleNode = document.querySelector('[data-music-title]');
    if (titleNode && typeof MutationObserver === 'function') {
      const observer = new MutationObserver(schedule);
      observer.observe(titleNode, { childList: true, characterData: true, subtree: true });
      const artistNode = document.querySelector('[data-music-artist]');
      if (artistNode) observer.observe(artistNode, { childList: true, characterData: true, subtree: true });
    }
    // 动态站换页会重建整个 #app，跑马灯是后渲染的，所以还要盯着新节点
    if (typeof MutationObserver === 'function') {
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }
  };

  window.MianxiaTicker = { paint };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, { once: true });
  else watch();
  document.addEventListener('mianxia:page-ready', schedule);
})();
