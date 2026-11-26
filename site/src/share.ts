/* Story-sized share cards (1080x1920) drawn on a canvas, shared as image files where possible */
const W = 1080;
const H = 1920;
const BG = '#0a0a0c';
const FG = '#ece8e1';
const MUTED = '#85817a';
const ACCENT = '#ff8a3d';
const SERIF = '"Instrument Serif", Georgia, serif';
const SANS = '"Inter Tight", system-ui, sans-serif';

type Ctx = CanvasRenderingContext2D & {letterSpacing?: string};

async function fontsReady() {
  const f = (document as Document & {fonts?: FontFaceSet}).fonts;
  if (!f) return;
  try {
    await Promise.all([f.load(`120px ${SERIF}`), f.load(`italic 120px ${SERIF}`), f.load(`500 40px ${SANS}`), f.load(`600 40px ${SANS}`)]);
  } catch {
    /* draw with fallbacks */
  }
}

const loadImg = (src: string) =>
  new Promise<HTMLImageElement | null>((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });

function wrap(ctx: Ctx, text: string, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function spaced(ctx: Ctx, px: number) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

/* background: the site's spotlight falling from Pip's antenna bulb */
function stage(ctx: Ctx) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 260, 10, W / 2, 900, 1100);
  glow.addColorStop(0, 'rgba(255, 196, 140, 0.30)');
  glow.addColorStop(0.45, 'rgba(255, 150, 90, 0.07)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 18, 180);
  ctx.lineTo(W / 2 + 18, 180);
  ctx.lineTo(W + 260, H);
  ctx.lineTo(-260, H);
  ctx.closePath();
  ctx.fill();
  const bulb = ctx.createRadialGradient(W / 2, 180, 0, W / 2, 180, 90);
  bulb.addColorStop(0, 'rgba(255, 244, 230, 1)');
  bulb.addColorStop(0.12, 'rgba(255, 210, 160, 0.9)');
  bulb.addColorStop(0.4, 'rgba(255, 138, 61, 0.25)');
  bulb.addColorStop(1, 'rgba(255, 138, 61, 0)');
  ctx.fillStyle = bulb;
  ctx.fillRect(W / 2 - 90, 90, 180, 180);
}

function header(ctx: Ctx, label: string) {
  ctx.textAlign = 'center';
  ctx.fillStyle = FG;
  ctx.font = `400 64px ${SERIF}`;
  spaced(ctx, 0);
  ctx.fillText('Pip Explains', W / 2, 360);
  ctx.fillStyle = MUTED;
  ctx.font = `500 26px ${SANS}`;
  spaced(ctx, 6);
  ctx.fillText(label.toUpperCase(), W / 2, 420);
  spaced(ctx, 0);
}

function footer(ctx: Ctx, line: string) {
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(236, 232, 225, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, H - 250);
  ctx.lineTo(W - 140, H - 250);
  ctx.stroke();
  ctx.fillStyle = FG;
  ctx.font = `500 34px ${SANS}`;
  ctx.fillText(line, W / 2, H - 180);
  ctx.fillStyle = MUTED;
  ctx.font = `500 22px ${SANS}`;
  spaced(ctx, 3);
  ctx.fillText('YOUTUBE @PIPEXPLAINSFACTS  ·  INSTAGRAM @PIP.EXPLAINSFACTS', W / 2, H - 128);
  spaced(ctx, 0);
}

/* Pip's portrait with pupils drawn in (the site's loops have live eyes, so the stills are blank) */
async function portrait(ctx: Ctx, cx: number, cy: number, r: number) {
  const img = await loadImg('/media/host.jpg');
  if (!img) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const s = (r * 2) / 1080;
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  const eye = (ex: number, ey: number) => {
    const x = cx - r + ex * s;
    const y = cy - r + (ey - 6) * s;
    ctx.fillStyle = '#2b2a6b';
    ctx.beginPath();
    ctx.arc(x, y, 62 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1446';
    ctx.beginPath();
    ctx.arc(x, y, 40 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 20 * s, y - 22 * s, 20 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x + 18 * s, y + 20 * s, 9 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  eye(396, 788);
  eye(684, 788);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255, 196, 140, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.stroke();
}

const site = () => (location.host ? location.host.replace(/^www\./, '') : 'pipexplains');

export async function scoreCard(o: {set: number; score: number; results: boolean[]; streak: number; verdict: string}) {
  await fontsReady();
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d') as Ctx;
  stage(ctx);
  header(ctx, `Fact or myth · Set No. ${o.set}`);
  await portrait(ctx, W / 2, 700, 170);
  ctx.textAlign = 'center';
  ctx.fillStyle = FG;
  ctx.font = `400 300px ${SERIF}`;
  const big = `${o.score}`;
  const bw = ctx.measureText(big).width;
  ctx.font = `italic 400 170px ${SERIF}`;
  const sw = ctx.measureText('/5').width;
  const x0 = W / 2 - (bw + sw) / 2;
  ctx.textAlign = 'left';
  ctx.font = `400 300px ${SERIF}`;
  ctx.fillText(big, x0, 1210);
  ctx.fillStyle = ACCENT;
  ctx.font = `italic 400 170px ${SERIF}`;
  ctx.fillText('/5', x0 + bw + 6, 1210);
  // results row
  const gap = 104;
  const startX = W / 2 - (gap * (o.results.length - 1)) / 2;
  o.results.forEach((ok, i) => {
    const x = startX + i * gap;
    ctx.beginPath();
    ctx.arc(x, 1320, 26, 0, Math.PI * 2);
    if (ok) {
      ctx.fillStyle = ACCENT;
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(236, 232, 225, 0.45)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = FG;
  ctx.font = `italic 400 76px ${SERIF}`;
  ctx.fillText(o.verdict, W / 2, 1480);
  ctx.fillStyle = MUTED;
  ctx.font = `500 28px ${SANS}`;
  spaced(ctx, 5);
  ctx.fillText(`STREAK ${o.streak} ${o.streak === 1 ? 'DAY' : 'DAYS'}  ·  CAN YOU BEAT IT?`, W / 2, 1560);
  spaced(ctx, 0);
  footer(ctx, `Play today’s set at ${site()}`);
  return c;
}

export async function answerCard(o: {no: string; field: string; question: string; answer: string}) {
  await fontsReady();
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d') as Ctx;
  stage(ctx);
  header(ctx, `Question No. ${o.no} · ${o.field}`);
  await portrait(ctx, W / 2, 640, 130);
  ctx.textAlign = 'center';
  ctx.fillStyle = FG;
  let size = 104;
  ctx.font = `400 ${size}px ${SERIF}`;
  let q = wrap(ctx, o.question, 860);
  while (q.length > 4 && size > 70) {
    size -= 8;
    ctx.font = `400 ${size}px ${SERIF}`;
    q = wrap(ctx, o.question, 860);
  }
  let y = 900;
  q.forEach((l) => {
    ctx.fillText(l, W / 2, y);
    y += size * 0.98;
  });
  ctx.fillStyle = ACCENT;
  ctx.fillRect(W / 2 - 40, y + 10, 80, 3);
  y += 100;
  ctx.fillStyle = 'rgba(236, 232, 225, 0.82)';
  ctx.font = `400 40px ${SANS}`;
  wrap(ctx, o.answer, 820)
    .slice(0, 9)
    .forEach((l) => {
      ctx.fillText(l, W / 2, y);
      y += 58;
    });
  footer(ctx, `More answers at ${site()}`);
  return c;
}

export const toFile = (c: HTMLCanvasElement, name: string) =>
  new Promise<File | null>((res) => c.toBlob((b) => res(b ? new File([b], name, {type: 'image/png'}) : null), 'image/png'));

/* share an already-prepared file (keeps the user gesture intact on iOS), else download it */
export async function shareFile(file: File, text: string) {
  const nav = navigator as Navigator & {canShare?: (d: ShareData) => boolean};
  if (nav.canShare && nav.share && nav.canShare({files: [file]})) {
    try {
      await nav.share({files: [file], text});
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}
