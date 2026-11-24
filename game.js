/* THE EXAMINED LIFE: engine. Story content lives in data.js. */
(() => {
const $ = id => document.getElementById(id);
const canvas = $('world'), ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const art = makeArt(ctx);
const W = 384, H = 240, SAVE_KEY = 'examined-life-v1', SPEED = 92;
const PLAYER_LOOK = {skin:'#f0c8a0', hair:'#5a3d2b', style:'short', top:'#4f7cc4', bottom:'#3a3550', extras:['belt:#f2d14b']};

/* ---------------- State ---------------- */
const fresh = () => ({v:1, name:'Wanderer', zone:'square', x:11*16+8, y:11*16+14, dir:'up', items:[], flags:{}, quests:{}, answers:{}, eggs:{}, met:{}, seen:{}, counters:{}, time:0, started:false});
let S = fresh();
let muted = false;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
function save() { store.set(SAVE_KEY, JSON.stringify(S)); }
function load() {
  try {
    const d = JSON.parse(store.get(SAVE_KEY));
    if (!d || d.v !== 1 || !ZONES[d.zone]) return null;
    const s = Object.assign(fresh(), d);
    for (const [q, i] of Object.entries(s.answers)) if (!QUESTIONS[q] || !QUESTIONS[q].o[i]) delete s.answers[q];
    s.items = s.items.filter(i => ITEMS[i]);
    return s;
  } catch { return null; }
}
muted = store.get('examined-life-muted') === '1';

/* Game API handed to the story scripts in data.js */
const g = {
  has: i => S.items.includes(i),
  flag: f => !!S.flags[f],
  quest: id => S.quests[id],
  answered: q => q in S.answers,
  thoughts: () => Object.keys(S.answers).length,
  counter: id => { const n = S.counters[id] || 0; S.counters[id] = n + 1; return n; },
  topWorldview: () => computeResults(S.answers, QUESTIONS, WORLDVIEWS).ranked[0].name,
  get name() { return S.name; },
};

/* ---------------- Zone & entities ---------------- */
let zone, map, entities = [], staticLayer = null, animTiles = [];
function npcEntities(zid) {
  return Object.entries(NPCS).filter(([, n]) => n.zone === zid).map(([id, n]) => ({id, ...n, w:n.w || (n.kind === 'none' ? AREA[id]?.[2] || 1 : 1), h:n.h || (n.kind === 'none' ? AREA[id]?.[3] || 1 : 1), ox:AREA[id]?.[0] ?? n.x, oy:AREA[id]?.[1] ?? n.y, dir:n.facing || 'down'}));
}
/* Multi-tile interaction areas for invisible objects: [x, y, w, h] */
const AREA = {fountain:[10,6,4,3], gate:[18,1,2,1], chalk:[2,1,4,1], shadows:[4,1,16,1], shelf:[16,1,7,7], mirror:[10,2,4,1]};

function enterZone(id, at, noSave) {
  S.zone = id; zone = ZONES[id]; map = zone.map;
  if (at) { S.x = at[0] * 16 + 8; S.y = at[1] * 16 + 14; }
  entities = npcEntities(id);
  buildStatic();
  $('zoneName').textContent = zone.name;
  hud();
  if (!noSave) save();
}
function buildStatic() {
  staticLayer = document.createElement('canvas'); staticLayer.width = W; staticLayer.height = H;
  const sctx = staticLayer.getContext('2d'); const sart = makeArt(sctx);
  const P = PALETTES[S.zone]; animTiles = [];
  for (let ty = 0; ty < 15; ty++) for (let tx = 0; tx < 24; tx++) {
    const ch = map[ty][tx];
    if (ANIMATED.has(ch)) { animTiles.push([ch, tx, ty]); sart.tile('.', tx * 16, ty * 16, P, tx, ty, S.zone, map, 0, S.flags); }
    else sart.tile(ch, tx * 16, ty * 16, P, tx, ty, S.zone, map, 0, S.flags);
  }
}
const tileAt = (px, py) => { const tx = Math.floor(px / 16), ty = Math.floor(py / 16); return (map[ty] || '')[tx] || '#'; };
function solidAt(px, py) {
  const ch = tileAt(px, py);
  if (ch === 'G') return !S.flags.gateFixed;
  if (SOLID.has(ch)) return true;
  for (const e of entities) {
    if (e.kind === 'none' || e.kind === 'owl' || e.kind === 'jar' || e.kind === 'trolley' || e.kind === 'ship') continue;
    const ex = e.x * 16 + 8, ey = e.y * 16 + 14;
    if (px > ex - 6 && px < ex + 6 && py > ey - 7 && py < ey + 1) return true;
  }
  return false;
}
function blocked(x, y) { return solidAt(x - 4, y - 4) || solidAt(x + 4, y - 4) || solidAt(x - 4, y) || solidAt(x + 4, y); }
function facingEntity() {
  const d = {up:[0, -1], down:[0, 1], left:[-1, 0], right:[1, 0]}[S.dir];
  const fx = S.x + d[0] * 11, fy = S.y - 4 + d[1] * 11;
  let best = null, bd = 1e9;
  for (const e of entities) {
    const x0 = e.ox * 16 - 3, y0 = e.oy * 16 - 3, x1 = x0 + e.w * 16 + 6, y1 = y0 + e.h * 16 + 6;
    if (fx >= x0 && fx <= x1 && fy >= y0 && fy <= y1) {
      const dd = Math.hypot(fx - (x0 + x1) / 2, fy - (y0 + y1) / 2);
      if (dd < bd) { bd = dd; best = e; }
    }
  }
  return best;
}

/* ---------------- Input ---------------- */
const held = {};
let dialogKey = null, paused = true;
const KEY = {ArrowUp:'up', w:'up', W:'up', ArrowDown:'down', s:'down', S:'down', ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right',
  z:'ok', Z:'ok', e:'ok', E:'ok', Enter:'ok', ' ':'ok', x:'back', X:'back', Escape:'back', Shift:'back', q:'menu', Q:'menu', Tab:'menu', m:'map', M:'map', v:'mute', V:'mute'};
window.addEventListener('keydown', ev => {
  if (ev.target.tagName === 'INPUT' && ev.key !== 'Enter') return;
  const k = KEY[ev.key];
  if (!k) return;
  if (['up', 'down', 'left', 'right', 'ok', 'menu', 'map'].includes(k) || ev.key === ' ') ev.preventDefault();
  audioUnlock();
  if (k === 'mute' && !dialogKey) { toggleMute(); return; }
  if (!ev.repeat) press(k);
  if (['up', 'down', 'left', 'right'].includes(k)) held[k] = true;
});
window.addEventListener('keyup', ev => { const k = KEY[ev.key]; if (k) held[k] = false; });
window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
function press(k) {
  if (dialogKey) { dialogKey(k); return; }
  if (!$('journal').hidden) { if (k === 'menu' || k === 'back') closeJournal(); else if (k === 'map') { closeJournal(); openMap(); } return; }
  if (!$('worldMap').hidden) { if (k === 'map' || k === 'back') closeMap(); else if (k === 'menu') { closeMap(); openJournal(); } return; }
  if (!$('results').hidden || !$('title').hidden) return;
  if (paused) return;
  if (k === 'ok') interact();
  if (k === 'menu') openJournal();
  if (k === 'map') openMap();
}

/* ---------------- Audio (tiny blips) ---------------- */
let actx = null;
function audioUnlock() { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
function blip(freq = 300, len = .04, type = 'square', vol = .025) {
  if (muted || !actx) return;
  try { const o = actx.createOscillator(), gn = actx.createGain(); o.type = type; o.frequency.value = freq; gn.gain.value = vol; gn.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + len); o.connect(gn).connect(actx.destination); o.start(); o.stop(actx.currentTime + len); } catch {}
}
function jingle(notes) { notes.forEach((f, i) => setTimeout(() => blip(f, .12, 'triangle', .04), i * 90)); }
function toggleMute() { muted = !muted; store.set('examined-life-muted', muted ? '1' : '0'); toast(muted ? 'Sound off' : 'Sound on'); $('muteBtn').textContent = muted ? 'Sound: off' : 'Sound: on'; }

/* ---------------- Dialogue box ---------------- */
const box = $('dialog'), textEl = $('dtext'), nameEl = $('dname'), optsEl = $('dopts'), portrait = $('portrait');
const pctx = portrait.getContext('2d'); const part = makeArt(pctx);
const fill = s => String(s).replace(/\{name\}/g, S.name);

function drawPortrait(who) {
  pctx.clearRect(0, 0, 32, 32);
  if (!who) return false;
  const t = performance.now();
  if (who.kind === 'human') part.human(16, 28, who.look, {sitting:false, dir:'down'});
  else if (who.kind === 'barrel') part.special('barrel', 14, 30, t, who);
  else if (who.kind === 'none') return false;
  else part.special(who.kind, 16, 28, t, who);
  return true;
}

function showBox() {
  // Like Undertale: if you're standing in the lower half, the box moves to the top so you can see who you're talking to.
  if (box.hidden) box.classList.toggle('top', S.y > H * 0.55);
  box.hidden = false; paused = true;
}
function hideBox() { box.hidden = true; dialogKey = null; optsEl.innerHTML = ''; textEl.textContent = ''; paused = false; }

function say(raw, who) {
  return new Promise(resolve => {
    const narr = raw.startsWith('* ');
    const text = fill(raw);
    showBox();
    optsEl.innerHTML = ''; optsEl.hidden = true;
    const hasP = !narr && drawPortrait(who);
    portrait.hidden = !hasP;
    nameEl.textContent = !narr && who ? who.name : '';
    nameEl.hidden = narr || !who;
    box.classList.toggle('narration', narr);
    let i = 0, done = false;
    textEl.textContent = '';
    $('dmore').hidden = true;
    const pitch = (who && who.blip) || 300;
    const step = () => {
      if (done) return;
      i = Math.min(text.length, i + 1);
      textEl.textContent = text.slice(0, i);
      if (i % 2 === 0 && /\w/.test(text[i - 1])) blip(narr ? 180 : pitch + Math.random() * 30);
      if (i >= text.length) { done = true; $('dmore').hidden = false; return; }
      const c = text[i - 1];
      setTimeout(step, '.!?'.includes(c) ? 110 : ',;:'.includes(c) ? 60 : 16);
    };
    step();
    const advance = () => {
      if (!done) { done = true; textEl.textContent = text; $('dmore').hidden = false; return; }
      dialogKey = null; box.onclick = null; resolve();
    };
    dialogKey = k => { if (k === 'ok' || k === 'back') advance(); };
    box.onclick = ev => { if (!ev.target.closest('.opt')) advance(); };
  });
}

function choose(labels, {cancel = false, prompt = null, dim = []} = {}) {
  return new Promise(resolve => {
    showBox();
    box.onclick = null;
    $('dmore').hidden = true;
    if (prompt !== null) { textEl.textContent = fill(prompt); box.classList.add('narration'); portrait.hidden = true; nameEl.hidden = true; }
    optsEl.hidden = false; optsEl.innerHTML = '';
    let sel = 0;
    const btns = labels.map((l, i) => {
      const b = document.createElement('button');
      b.className = 'opt' + (dim[i] ? ' dim' : ''); b.type = 'button';
      b.innerHTML = '<span class="cur" aria-hidden="true">▶</span><span></span>';
      b.lastChild.textContent = fill(l);
      b.onclick = ev => { ev.stopPropagation(); finish(i); };
      b.onmouseenter = () => mark(i);
      optsEl.append(b); return b;
    });
    const mark = i => { sel = i; btns.forEach((b, j) => b.classList.toggle('sel', j === i)); btns[i].scrollIntoView({block:'nearest'}); };
    const finish = i => { blip(660, .06, 'square', .03); dialogKey = null; optsEl.innerHTML = ''; optsEl.hidden = true; resolve(i); };
    mark(0);
    dialogKey = k => {
      if (k === 'up') { mark((sel - 1 + btns.length) % btns.length); blip(440, .03); }
      if (k === 'down') { mark((sel + 1) % btns.length); blip(440, .03); }
      if (k === 'ok') finish(sel);
      if (k === 'back' && cancel) finish(-1);
    };
  });
}

function askName() {
  return new Promise(resolve => {
    showBox();
    box.classList.add('narration'); portrait.hidden = true; nameEl.hidden = true; $('dmore').hidden = true;
    textEl.textContent = '* What is your name? (Enter to confirm)';
    optsEl.hidden = false;
    optsEl.innerHTML = '<input id="nameInput" maxlength="14" autocomplete="off" spellcheck="false" aria-label="Your name"><button class="opt sel" type="button" id="nameOk"><span class="cur">▶</span><span>That\'s me</span></button>';
    const inp = $('nameInput'); inp.value = ''; inp.placeholder = 'Wanderer';
    // Ignore keystrokes left over from skipping through the previous line (e.g. a fast "zz").
    const t0 = performance.now();
    inp.addEventListener('input', () => { if (performance.now() - t0 < 350) inp.value = ''; });
    setTimeout(() => inp.focus(), 30);
    const done = () => {
      const v = inp.value.trim().replace(/[<>]/g, '').slice(0, 14) || 'Wanderer';
      dialogKey = null; optsEl.innerHTML = ''; optsEl.hidden = true; canvas.focus(); resolve(v);
    };
    $('nameOk').onclick = done;
    dialogKey = k => { if (k === 'ok') done(); };
  });
}

/* ---------------- Script runner ---------------- */
let busy = false;
async function run(steps, who) {
  if (typeof steps === 'function') steps = steps(g);
  for (let step of steps || []) {
    if (typeof step === 'function') { await run(step(g), who); continue; }
    if (Array.isArray(step)) { await run(step, who); continue; }
    if (typeof step === 'string') { await say(step, who); continue; }
    if (step.ask) {
      const q = QUESTIONS[step.ask];
      if (!q || step.ask in S.answers) continue;
      const asker = NPCS[q.by] || who;
      await say(q.q, asker);
      const i = await choose(q.o.map(o => o.t));
      S.answers[step.ask] = i;
      save();
      const c = thoughtCounts();
      const n = c.got;
      const msg = c.townGot === c.townTotal && c.lhGot === 0
        ? `✧ All ${c.townTotal} town thoughts found! The final ${c.lhTotal} are in the lighthouse.`
        : n === MIN_THOUGHTS
          ? '✧ The mirror in the lighthouse is ready for you.'
          : `✧ A thought settles. (${n})`;
      toast(msg);
      jingle([523, 659]);
      hud();
      if (q.o[i].r) await run(q.o[i].r, asker);
      continue;
    }
    if (step.give) { if (!S.items.includes(step.give)) S.items.push(step.give); jingle([392, 523, 659]); await say(`* You got: ${ITEMS[step.give].name}.`); continue; }
    if (step.take) { S.items = S.items.filter(i => i !== step.take); continue; }
    if (step.set) { S.flags[step.set] = true; if (step.set === 'gateFixed') buildStatic(); continue; }
    if (step.quest) { if (!S.quests[step.quest]) { S.quests[step.quest] = 'active'; toast(`New quest: ${QUESTS[step.quest].title}`); jingle([440, 554]); } continue; }
    if (step.done) { S.quests[step.done] = 'done'; toast(`Quest complete: ${QUESTS[step.done].title}`); jingle([523, 659, 784]); continue; }
    if (step.egg) { if (!S.eggs[step.egg]) { S.eggs[step.egg] = true; toast(`Secret found: ${EGGS[step.egg]} (${Object.keys(S.eggs).length}/${Object.keys(EGGS).length})`); jingle([784, 988]); } continue; }
    if (step.nameInput) {
      S.name = await askName();
      const egg = NAME_EGGS[S.name.toLowerCase()];
      if (egg) { await say('* ' + egg); S.eggs.name = true; toast(`Secret found: ${EGGS.name}`); }
      else await say(`* ${S.name}. Yes, that feels right. Mostly.`);
      continue;
    }
    if (step.reveal) { await reveal(); continue; }
  }
}

async function interact() {
  const e = facingEntity();
  if (!e || busy) return;
  busy = true; for (const k in held) held[k] = false;
  if (e.kind === 'human' && !e.facing) e.dir = S.x < e.x * 16 + 2 ? 'left' : S.x > e.x * 16 + 14 ? 'right' : S.y < e.y * 16 + 8 ? 'up' : 'down';
  try {
    if (e.topics) await conversation(e);
    else await run(e.talk, e);
  } finally {
    hideBox(); busy = false; save(); hud(); canvas.focus();
  }
}

async function conversation(e) {
  if (!S.met[e.id]) { S.met[e.id] = true; await run(e.hello, e); }
  else await say(e.hi[Math.floor(Math.random() * e.hi.length)], e);
  for (;;) {
    const topics = e.topics.filter(t => !t.when || t.when(g));
    const key = t => e.id + ':' + t.label;
    const labels = topics.map(t => (t.ask && t.ask in S.answers ? '✓ ' : '') + t.label).concat(['Goodbye']);
    const dim = topics.map(t => S.seen[key(t)] && !(t.fresh && t.fresh(g))).concat([false]);
    drawPortrait(e);
    const i = await choose(labels, {cancel:true, prompt:`* ${e.name}${e.title ? ', ' + e.title : ''}. What do you say?`, dim});
    if (i < 0 || i === topics.length) { await say(['See you around.', 'Take care, {name}.', 'Until next time.'][Math.floor(Math.random() * 3)], e); return; }
    const t = topics[i];
    S.seen[key(t)] = true;
    if (t.ask && t.ask in S.answers) { await run(t.again || ['We\'ve talked about that, {name}. I\'m still thinking about what you said.'], e); continue; }
    await run(t.script || [], e);
    if (t.ask) await run([{ask:t.ask}], e);
    if (t.after) await run(t.after, e);
    save(); hud();
  }
}

/* ---------------- Toasts, HUD, journal ---------------- */
function toast(msg) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  $('toasts').append(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100);
}
function thoughtCounts() {
  const all = Object.entries(QUESTIONS);
  const lh = all.filter(([, q]) => q.by === 'keeper');
  const town = all.filter(([, q]) => q.by !== 'keeper');
  const lhGot = lh.filter(([id]) => id in S.answers).length;
  const townGot = town.filter(([id]) => id in S.answers).length;
  return {total:all.length, townTotal:town.length, lhTotal:lh.length, got:townGot + lhGot, townGot, lhGot};
}
function hud() {
  const c = thoughtCounts(), n = c.got;
  $('thoughts').textContent = `✧ ${n} thought${n === 1 ? '' : 's'}`;
  $('thoughts').title = c.townGot === c.townTotal && c.lhGot < c.lhTotal
    ? `All ${c.townTotal} town thoughts found! The final ${c.lhTotal} thoughts are in the lighthouse.`
    : n >= MIN_THOUGHTS
      ? `Enough for the mirror (${c.townGot}/${c.townTotal} in town, ${c.lhGot}/${c.lhTotal} in lighthouse).`
      : `The mirror needs ${MIN_THOUGHTS} (${c.townGot}/${c.townTotal} in town; final ${c.lhTotal} are in the lighthouse).`;
  $('thoughts').classList.toggle('ready', n >= MIN_THOUGHTS);
}
function openJournal() {
  paused = true;
  const c = thoughtCounts();
  const q = Object.entries(QUESTS).filter(([id]) => S.quests[id] || id === 'mirror');
  const quests = q.map(([id, d]) => {
    const done = S.quests[id] === 'done' || (id === 'mirror' && S.flags.finished);
    return `<li class="${done ? 'done' : ''}"><b>${done ? '✓' : '◇'} ${d.title}</b>${done ? '' : `<span>${esc(d.hint(g))}</span>`}</li>`;
  }).join('');
  const items = S.items.length ? S.items.map(i => `<li><b>${ITEMS[i].name}</b><span>${esc(ITEMS[i].desc)}</span></li>`).join('') : '<li class="muted">Your pockets are empty. Philosophically, so is everything.</li>';
  const met = Object.keys(S.met).length, people = Object.values(NPCS).filter(n => n.topics).length;
  const lhNote = c.townGot === c.townTotal && c.lhGot < c.lhTotal
    ? `<p class="ready-note">✧ You have found all ${c.townTotal} thoughts in town! The final ${c.lhTotal} thoughts are with the Keeper in the lighthouse.</p>`
    : c.lhGot < c.lhTotal
      ? `<p class="muted"><small>Note: the final ${c.lhTotal} of ${c.total} thoughts are asked by the Keeper inside the lighthouse.</small></p>`
      : '';
  $('jbody').innerHTML = `
    <section><h3>Quests</h3><ul class="jlist">${quests}</ul></section>
    <section><h3>Pockets</h3><ul class="jlist">${items}</ul></section>
    <section class="stats"><h3>Progress</h3>
      <p>✧ Thoughts: <b>${c.got}/${c.total}</b> <small>(${c.townGot}/${c.townTotal} in town · ${c.lhGot}/${c.lhTotal} in the lighthouse · mirror needs ${MIN_THOUGHTS})</small></p>
      ${lhNote}
      <p>People met: <b>${met}/${people}</b> · Secrets: <b>${Object.keys(S.eggs).length}/${Object.keys(EGGS).length}</b></p>
    </section>
    ${S.flags.finished ? '<button id="jresults" class="btn primary">See your reflection again</button>' : ''}`;
  if (S.flags.finished) $('jresults').onclick = () => { closeJournal(); showResults(); };
  $('journal').hidden = false; $('jclose').focus();
}
function closeJournal() { $('journal').hidden = true; paused = false; canvas.focus(); }

const MAP_LAYOUT = [
  {id:'cave', note:'via Forest NW'},
  {id:'temple', note:'north of Square'},
  {id:'lighthouse', note:'NE gate · final 3 ✧'},
  {id:'forest', note:'west of Square'},
  {id:'square', note:'town centre'},
  {id:'market', note:'east of Square'},
  {id:'lab', note:'Square NW door'},
  {id:'cafe', note:'south of Square'},
];
const CHAR_KINDS = new Set(['human', 'barrel', 'spirit', 'dog']);
function npcThoughts(id) {
  const qs = Object.entries(QUESTIONS).filter(([, q]) => q.by === id);
  return {total:qs.length, done:qs.filter(([qid]) => qid in S.answers).length};
}
function openMap() {
  paused = true;
  const c = thoughtCounts();
  $('mpos').textContent = `You are in: ${ZONES[S.zone].name}`;
  const cards = MAP_LAYOUT.map(slot => {
    const z = ZONES[slot.id], here = slot.id === S.zone;
    const locked = slot.id === 'lighthouse' && !S.flags.gateFixed;
    const chars = Object.entries(NPCS).filter(([, n]) => n.zone === slot.id && CHAR_KINDS.has(n.kind));
    const list = chars.map(([id, n]) => {
      const t = npcThoughts(id);
      const cls = t.total === 0 ? '' : t.done < t.total ? 'more' : 'done';
      const badge = t.total === 0 ? '·' : t.done < t.total ? `✧ ${t.done}/${t.total}` : `✓ ${t.done}/${t.total}`;
      return `<li class="mnpc ${cls}"><span>${esc(n.name)}</span><span class="ms">${badge}</span></li>`;
    }).join('');
    const tag = here ? '● YOU' : locked ? 'locked' : slot.note;
    return `<div class="mzone${here ? ' here' : ''}${locked ? ' locked' : ''}"><div class="mzh"><b>${esc(z.name)}</b><span class="mtag">${tag}</span></div><ul class="mnpcs">${list}</ul></div>`;
  }).join('');
  const mini = `<div class="mmini"><div class="mzh"><b>${esc(ZONES[S.zone].name)}</b><span class="mtag">live map</span></div><canvas id="miniMap" width="144" height="90" aria-label="Current area map"></canvas></div>`;
  const lhBanner = c.townGot === c.townTotal && c.lhGot < c.lhTotal
    ? `<p class="ready-note">✧ All ${c.townTotal} town thoughts found! Head to the Lighthouse (NE gate) for the final ${c.lhTotal} thoughts.</p>` : '';
  $('mbody').innerHTML = `
    <div class="mgrid">${cards}${mini}</div>
    ${lhBanner}
    <div class="mlegend">
      <span><b class="lg-you">●</b> You</span>
      <span><b class="lg-more">✧</b> Thoughts remaining</span>
      <span><b class="lg-done">✓</b> All thoughts heard</span>
      <span><b>·</b> Townsperson</span>
      <span>Final ${c.lhTotal} thoughts are in the Lighthouse</span>
    </div>`;
  drawMiniMap($('miniMap'));
  $('worldMap').hidden = false; $('mclose').focus();
}
function drawMiniMap(cv) {
  const m = cv.getContext('2d'), T = 6;
  m.fillStyle = '#181524'; m.fillRect(0, 0, cv.width, cv.height);
  for (let ty = 0; ty < 15; ty++) for (let tx = 0; tx < 24; tx++) {
    const ch = map[ty][tx];
    if (ch === 'G') m.fillStyle = S.flags.gateFixed ? '#4b7a52' : '#9e3b3b';
    else if (ch === '~' || ch === 'F') m.fillStyle = '#2d5a88';
    else if (SOLID.has(ch)) m.fillStyle = '#2f2b40';
    else if (ch === ',' || ch === 'R') m.fillStyle = '#474157';
    else m.fillStyle = '#222634';
    m.fillRect(tx * T, ty * T, T, T);
  }
  for (const ex of zone.exits) {
    m.fillStyle = '#5bb88a55';
    m.fillRect(ex.x * T, ex.y * T, ex.w * T, ex.h * T);
  }
  for (const e of entities) {
    if (!CHAR_KINDS.has(e.kind)) continue;
    const t = npcThoughts(e.id);
    m.fillStyle = t.total === 0 ? '#a9a3b8' : t.done < t.total ? '#f2c14e' : '#8fd3a8';
    m.fillRect(e.x * T + 1, e.y * T + 1, T - 2, T - 2);
  }
  const px = Math.round(S.x / 16 * T), py = Math.round((S.y - 4) / 16 * T);
  m.fillStyle = '#ffffff'; m.fillRect(px - 3, py - 3, 6, 6);
  m.fillStyle = '#ff5252'; m.fillRect(px - 2, py - 2, 4, 4);
}
function closeMap() { $('worldMap').hidden = true; paused = false; canvas.focus(); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));

/* ---------------- Loop ---------------- */
let last = performance.now(), fade = 0, fading = null, walkT = 0;
function update(dt) {
  if (!paused && !busy && !fading) {
    S.time += dt;
    let dx = (held.right ? 1 : 0) - (held.left ? 1 : 0), dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (dx || dy) {
      if (dy) S.dir = dy < 0 ? 'up' : 'down'; if (dx && !dy) S.dir = dx < 0 ? 'left' : 'right';
      const len = Math.hypot(dx, dy), v = SPEED * dt / 1000;
      const nx = S.x + dx / len * v, ny = S.y + dy / len * v;
      if (!blocked(nx, S.y)) S.x = nx;
      if (!blocked(S.x, ny)) S.y = ny;
      walkT += dt;
      const tx = Math.floor(S.x / 16), ty = Math.floor((S.y - 3) / 16);
      for (const ex of zone.exits) if (tx >= ex.x && tx < ex.x + ex.w && ty >= ex.y && ty < ex.y + ex.h) { go(ex.to, ex.at); break; }
    } else walkT = 0;
  }
}
function go(to, at) {
  fading = {to, at, t:0};
  blip(220, .08, 'triangle', .03);
}
function render(t) {
  ctx.drawImage(staticLayer, 0, 0);
  const P = PALETTES[S.zone];
  for (const [ch, tx, ty] of animTiles) art.tile(ch, tx * 16, ty * 16, P, tx, ty, S.zone, map, t, S.flags);
  if (S.zone === 'cave') drawShadows(t);
  const drawables = entities.filter(e => e.kind !== 'none').map(e => ({y:e.y * 16 + 14, e}));
  drawables.push({y:S.y, player:true});
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) {
    if (d.player) { const f = walkT ? (Math.floor(walkT / 140) % 4 === 1 ? 1 : Math.floor(walkT / 140) % 4 === 3 ? 2 : 0) : 0; art.human(Math.round(S.x), Math.round(S.y), PLAYER_LOOK, {frame:f, dir:S.dir}); continue; }
    const e = d.e, cx = e.x * 16 + 8, fy = e.y * 16 + 14;
    if (e.kind === 'human') {
      const frame = e.id === 'syd' ? (Math.floor(t / 300) % 2 ? 1 : 2) : 0;
      art.human(cx, fy, e.look, {sitting:e.sitting, dir:e.dir, frame});
    } else art.special(e.kind, cx, fy, t, e);
  }
  // interaction hint
  if (!busy && !paused) {
    const e = facingEntity();
    if (e) { const b = Math.floor(t / 250) % 2; const hx = e.kind === 'none' ? S.x : e.x * 16 + 8, hy = e.kind === 'none' ? S.y - 24 : e.y * 16 - (e.kind === 'owl' ? 16 : 8); art.R(hx - 2, hy - 3 + b, 5, 1, '#fff7d6'); art.R(hx - 1, hy - 2 + b, 3, 1, '#fff7d6'); art.R(hx, hy - 1 + b, 1, 1, '#fff7d6'); }
  }
  if (zone.dark) darkness(t);
  if (zone.night) { ctx.fillStyle = '#0a103033'; ctx.fillRect(0, 0, W, H); }
  if (fading) { ctx.fillStyle = `rgba(8,8,14,${Math.min(1, fade)})`; ctx.fillRect(0, 0, W, H); }
}
function drawShadows(t) {
  const shapes = [
    [[0,0,6,3],[1,-2,1,2],[3,-2,1,2],[5,1,2,1]],            // rabbit
    [[0,0,7,2],[-3,-2,3,2],[7,-2,3,2],[3,-1,1,1]],          // bird
    [[0,0,7,5],[7,1,2,1],[8,0,1,1],[-2,1,2,2],[2,-1,3,1]],  // teapot
  ];
  ctx.fillStyle = '#2a1d16cc';
  shapes.forEach((sh, i) => {
    const x = 70 + ((t / 40 + i * 90) % 240), y = 22 + Math.sin(t / 500 + i) * 2;
    for (const [a, b, w, h] of sh) ctx.fillRect(Math.round(x + a * 2), Math.round(y + b * 2), w * 2, h * 2);
  });
}
let darkCanvas = null;
function darkness(t) {
  if (!darkCanvas) { darkCanvas = document.createElement('canvas'); darkCanvas.width = W; darkCanvas.height = H; }
  const d = darkCanvas.getContext('2d');
  d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H); d.fillStyle = 'rgba(6,4,3,.88)'; d.fillRect(0, 0, W, H);
  d.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r) => { const gr = d.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.fillRect(x - r, y - r, r * 2, r * 2); };
  hole(11 * 16 + 8, 6 * 16 + 8, 110 + Math.sin(t / 90) * 4); hole(S.x, S.y - 8, 40); hole(12 * 16, 15 * 16, 50);
  ctx.drawImage(darkCanvas, 0, 0);
  ctx.fillStyle = `rgba(247,140,40,${.05 + Math.sin(t / 120) * .02})`; ctx.fillRect(0, 0, W, H);
}
function frame(now) {
  const dt = Math.min(50, now - last); last = now;
  if (fading) {
    fading.t += dt; fade = fading.t < 220 ? fading.t / 220 : 1 - (fading.t - 220) / 220;
    if (fading.t >= 220 && !fading.swapped) { fading.swapped = true; enterZone(fading.to, fading.at); }
    if (fading.t >= 440) { fading = null; fade = 0; }
  }
  update(dt);
  if (zone) render(now);
  requestAnimationFrame(frame);
}

/* ---------------- Title & intro ---------------- */
function title() {
  const saved = load();
  $('continueBtn').hidden = !saved || !saved.started;
  $('title').hidden = false; paused = true;
  $('newBtn').onclick = async () => {
    audioUnlock();
    if (saved && saved.started && !confirm('Start a new game? Your current progress will be replaced.')) return;
    S = fresh(); store.del(SAVE_KEY);
    $('title').hidden = true; enterZone('square');
    busy = true;
    try { await run(INTRO); } finally { hideBox(); busy = false; }
    S.started = true; save(); hud(); canvas.focus();
  };
  $('continueBtn').onclick = () => { audioUnlock(); S = saved; $('title').hidden = true; enterZone(S.zone); paused = false; canvas.focus(); toast(`Welcome back, ${S.name}.`); };
}

/* ---------------- The reveal ---------------- */
async function reveal() {
  S.flags.finished = true; save();
  await say('* You step up to the mirror.');
  await say('* The fog thins. Slowly, a face appears.');
  await say('* It is yours. For the first time, you can see it clearly.');
  jingle([392, 494, 587, 784]);
  hideBox();
  showResults();
}

function showResults() {
  paused = true;
  const res = computeResults(S.answers, QUESTIONS, WORLDVIEWS);
  const top = res.ranked[0], pct = w => Math.round(w.affinity * 100);
  const byWv = Object.fromEntries(Object.entries(NPCS).filter(([, n]) => n.secret).map(([id, n]) => [n.secret, {id, ...n}]));
  const mins = Math.max(1, Math.round(S.time / 60000));
  const questsDone = Object.values(S.quests).filter(s => s === 'done').length;
  const card = (w, i) => { const n = byWv[w.id]; return `<article class="wv"><p class="rank">#${i + 1} · ${pct(w)}%</p><h3>${w.name}</h3><p class="aka">${w.aka}</p><p>${w.blurb}</p><p class="small">Kindred spirit: <b>${n.name}</b>, ${n.title}. Read: ${w.thinkers}.</p></article>`; };
  $('rbody').innerHTML = `
    <p class="eyebrow">THE MIRROR SHOWS</p>
    <h2 class="rtitle">${esc(S.name)}, you lean towards <span>${top.name}</span></h2>
    <p class="lede">${top.blurb}</p>
    <div class="rgrid">
      <figure class="radarwrap"><canvas id="radar" width="660" height="560" aria-label="Radar chart of your affinity with 16 worldviews"></canvas><div id="rtip" class="rtip" hidden></div>
        <figcaption>Your affinity with each worldview: the share of points you chose out of those on offer. Hover a point for details.</figcaption></figure>
      <div class="rtop">${res.ranked.slice(0, 3).map(card).join('')}</div>
    </div>
    <h3 class="sec">All sixteen, ranked</h3>
    <ol class="bars">${res.ranked.map(w => `<li><span class="bl">${w.name}</span><span class="bt"><span style="width:${pct(w)}%"></span></span><span class="bv">${pct(w)}%</span></li>`).join('')}</ol>
    <h3 class="sec">The secret cast</h3>
    <p class="small">Every character you met was secretly a worldview. Did you guess?</p>
    <ul class="cast">${WORLDVIEWS.map(w => { const n = byWv[w.id]; const metIt = S.met[n.id]; return `<li class="${metIt ? '' : 'unmet'}"><b>${n.name}</b> <span>${n.title}</span> <i>${w.name}</i>${metIt ? '' : ' <small>(you never met)</small>'}</li>`; }).join('')}</ul>
    <h3 class="sec">Your journey</h3>
    <p class="stats">${res.count} thoughts · ${questsDone}/6 quests · ${Object.keys(S.eggs).length}/${Object.keys(EGGS).length} secrets · about ${mins} min</p>
    <details><summary>How was this worked out?</summary>
      <p>Each answer quietly gave 2 points to one worldview and 1 to a related one. Some worldviews come up in more questions than others, so each score is the points you gave it divided by the points that were on offer for it (plus ${SMOOTHING}, so a worldview that came up only once can't hit 100%). Your answers:</p>
      <ol class="answers">${Object.entries(S.answers).map(([q, i]) => { const Q = QUESTIONS[q], o = Q.o[i]; return `<li><span>${esc(fill(Q.q))}</span><b>“${esc(o.t)}”</b><small>${Object.entries(o.s).map(([w, p]) => `${WORLDVIEWS.find(x => x.id === w).name} +${p}`).join(' · ')}</small></li>`; }).join('')}</ol>
    </details>
    <p class="disclaimer">This is a game for reflection, not a scientific personality test. Real people mix many views, and each worldview here is simplified to fit in a sentence. Treat the result as something to discuss, not as a label.</p>
    <div class="ractions"><button class="btn primary" id="rkeep">Keep exploring</button><button class="btn" id="rsave">Save as text</button><button class="btn" id="rnew">New game</button></div>`;
  $('results').hidden = false; $('results').scrollTop = 0;
  drawRadar(res);
  $('rkeep').onclick = () => { $('results').hidden = true; paused = false; canvas.focus(); };
  $('rnew').onclick = () => { if (confirm('Start over? This clears your progress.')) { store.del(SAVE_KEY); location.reload(); } };
  $('rsave').onclick = () => {
    const lines = [`THE EXAMINED LIFE: ${S.name}'s reflection`, '', `Top worldview: ${top.name} (${top.aka})`, top.blurb, '', 'Ranking:', ...res.ranked.map((w, i) => `${String(i + 1).padStart(2)}. ${w.name.padEnd(16)} ${pct(w)}%`), '', 'Answers:', ...Object.entries(S.answers).map(([q, i]) => `- ${fill(QUESTIONS[q].q)}\n  > ${QUESTIONS[q].o[i].t}`), '', 'A game for reflection, not a scientific test.'];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], {type:'text/plain'})); a.download = `reflection-${S.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('rkeep').focus({preventScroll:true});
  $('results').scrollTop = 0;
}

function drawRadar(res) {
  const c = $('radar'), x = c.getContext('2d'), N = res.list.length, cx = 330, cy = 280, Rm = 180;
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink').trim(), muted = css.getPropertyValue('--muted').trim(), line = css.getPropertyValue('--line').trim(), accent = css.getPropertyValue('--accent').trim(), panel = css.getPropertyValue('--panel').trim();
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / N;
  const pts = res.list.map((w, i) => ({w, a:ang(i), r:Rm * Math.min(1, w.affinity)}));
  let p = 0;
  const draw = () => {
    x.clearRect(0, 0, 660, 560);
    x.lineWidth = 1; x.strokeStyle = line;
    for (const f of [.25, .5, .75, 1]) { x.beginPath(); for (let i = 0; i <= N; i++) { const a = ang(i % N); x.lineTo(cx + Math.cos(a) * Rm * f, cy + Math.sin(a) * Rm * f); } x.stroke(); }
    for (let i = 0; i < N; i++) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ang(i)) * Rm, cy + Math.sin(ang(i)) * Rm); x.stroke(); }
    x.fillStyle = muted; x.font = '12px VT323, monospace';
    for (const f of [.5, 1]) x.fillText(`${f * 100}%`, cx + 4, cy - Rm * f + 12);
    x.beginPath(); pts.forEach(q => x.lineTo(cx + Math.cos(q.a) * q.r * p, cy + Math.sin(q.a) * q.r * p)); x.closePath();
    x.fillStyle = accent + '40'; x.fill(); x.strokeStyle = accent; x.lineWidth = 2; x.stroke();
    pts.forEach(q => { x.beginPath(); x.arc(cx + Math.cos(q.a) * q.r * p, cy + Math.sin(q.a) * q.r * p, 4, 0, 7); x.fillStyle = accent; x.fill(); x.lineWidth = 2; x.strokeStyle = panel; x.stroke(); });
    x.font = '19px VT323, monospace'; x.fillStyle = ink;
    pts.forEach(q => { const lx = cx + Math.cos(q.a) * (Rm + 16), ly = cy + Math.sin(q.a) * (Rm + 16); x.textAlign = Math.abs(Math.cos(q.a)) < .2 ? 'center' : Math.cos(q.a) > 0 ? 'left' : 'right'; x.textBaseline = Math.abs(Math.sin(q.a)) < .2 ? 'middle' : Math.sin(q.a) > 0 ? 'top' : 'bottom'; x.fillText(q.w.short, lx, ly); });
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  };
  const anim = () => { p = Math.min(1, p + .03); draw(); if (p < 1) requestAnimationFrame(anim); };
  anim();
  const tip = $('rtip');
  c.onpointermove = ev => {
    const b = c.getBoundingClientRect(), mx = (ev.clientX - b.left) * 660 / b.width, my = (ev.clientY - b.top) * 560 / b.height;
    const d = Math.hypot(mx - cx, my - cy); if (d < 30 || d > Rm + 60) { tip.hidden = true; return; }
    let a = Math.atan2(my - cy, mx - cx) + Math.PI / 2; if (a < 0) a += 2 * Math.PI;
    const q = pts[Math.round(a / (2 * Math.PI / N)) % N];
    tip.hidden = false; tip.innerHTML = `<b>${q.w.name}</b><br>${Math.round(q.w.affinity * 100)}% · ${q.w.earned}/${q.w.offered} pts`;
    tip.style.left = (ev.clientX - b.left + 12) + 'px'; tip.style.top = (ev.clientY - b.top + 12) + 'px';
  };
  c.onpointerleave = () => { tip.hidden = true; };
}

/* ---------------- Touch controls ---------------- */
document.querySelectorAll('[data-key]').forEach(b => {
  const k = b.dataset.key;
  const down = ev => { ev.preventDefault(); audioUnlock(); if (['up', 'down', 'left', 'right'].includes(k)) held[k] = true; press(k); b.classList.add('on'); };
  const up = () => { if (k in held) held[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
});
$('journalBtn').onclick = () => { if (!busy && $('title').hidden) { if (!$('worldMap').hidden) closeMap(); openJournal(); } };
$('jclose').onclick = closeJournal;
$('mapBtn').onclick = () => { if (!busy && $('title').hidden) { if (!$('journal').hidden) closeJournal(); if ($('worldMap').hidden) openMap(); else closeMap(); } };
$('mclose').onclick = closeMap;
$('muteBtn').onclick = toggleMute;
$('muteBtn').textContent = muted ? 'Sound: off' : 'Sound: on';

/* ---------------- Boot ---------------- */
enterZone('square', null, true);
title();
requestAnimationFrame(frame);
window.__game = {S: () => S, g, run, enterZone, computeResults};
})();
