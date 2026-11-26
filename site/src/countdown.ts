import {$$, reduced} from './core';

/* New films go out every day at 7:00 PM India time (13:30 UTC). Change here if the schedule moves. */
export const RELEASE_UTC = {h: 13, m: 30};

export function nextRelease(now = new Date()) {
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), RELEASE_UTC.h, RELEASE_UTC.m));
  if (t.getTime() <= now.getTime()) t.setUTCDate(t.getUTCDate() + 1);
  return t;
}

/* every .countdown shows HH:MM:SS with digits that roll as they change */
export function initCountdowns() {
  const els = $$('.countdown');
  if (!els.length) return;
  const slots = els.map((el) => {
    el.textContent = '';
    el.setAttribute('aria-label', 'time until the next film');
    return Array.from({length: 8}, (_, i) => {
      const s = document.createElement('span');
      s.className = i === 2 || i === 5 ? 'cd__sep' : 'cd__d';
      s.textContent = i === 2 || i === 5 ? ':' : '0';
      el.appendChild(s);
      return s;
    });
  });
  const pad = (n: number) => String(n).padStart(2, '0');
  const tick = () => {
    let s = Math.max(0, Math.floor((nextRelease().getTime() - Date.now()) / 1000));
    const h = Math.floor(s / 3600);
    s -= h * 3600;
    const str = `${pad(h)}:${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    slots.forEach((list) =>
      list.forEach((span, i) => {
        if (span.textContent === str[i]) return;
        span.textContent = str[i];
        if (!reduced && span.isConnected && span.offsetParent) span.animate([{transform: 'translateY(-55%)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 420, easing: 'cubic-bezier(.16,1,.3,1)'});
      }),
    );
  };
  tick();
  window.setInterval(tick, 1000);
}
