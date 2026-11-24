const {test} = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data.js');
const {SOLID} = require('../sprites.js');

const walk = (z, x, y) => { const ch = D.ZONES[z].map[y]?.[x]; return ch !== undefined && !SOLID.has(ch); };
const inExit = (z, x, y) => D.ZONES[z].exits.some(e => x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h);

test('every zone map is 24x15', () => {
  for (const [id, z] of Object.entries(D.ZONES)) {
    assert.equal(z.map.length, 15, id);
    z.map.forEach((r, i) => assert.equal(r.length, 24, `${id} row ${i}`));
  }
});

test('exits lead to real zones and land on walkable tiles outside exits', () => {
  for (const [id, z] of Object.entries(D.ZONES)) for (const e of z.exits) {
    assert.ok(D.ZONES[e.to], `${id} -> ${e.to}`);
    const [x, y] = e.at;
    assert.ok(walk(e.to, x, y), `${id} -> ${e.to} spawn ${x},${y} is solid`);
    assert.ok(!inExit(e.to, x, y), `${id} -> ${e.to} spawn ${x},${y} is inside an exit`);
  }
});

test('characters stand on walkable tiles', () => {
  const onFurniture = new Set(['none', 'owl', 'jar', 'trolley', 'ship']);
  for (const [id, n] of Object.entries(D.NPCS)) {
    assert.ok(D.ZONES[n.zone], id);
    if (!onFurniture.has(n.kind)) assert.ok(walk(n.zone, n.x, n.y), `${id} at ${n.x},${n.y} is on a solid tile`);
  }
});

test('questions are well formed and use known worldviews', () => {
  const ids = new Set(D.WORLDVIEWS.map(w => w.id));
  for (const [qid, q] of Object.entries(D.QUESTIONS)) {
    assert.ok(D.NPCS[q.by], `${qid} asker`);
    assert.ok(q.o.length >= 2 && q.o.length <= 6, qid);
    for (const o of q.o) for (const w of Object.keys(o.s)) assert.ok(ids.has(w), `${qid}: ${w}`);
  }
});

test('every question is reachable from some script', () => {
  const src = Object.values(D.NPCS).map(n => JSON.stringify(n, (k, v) => typeof v === 'function' ? v.toString() : v)).join('\n');
  for (const qid of Object.keys(D.QUESTIONS)) assert.ok(src.includes(`'${qid}'`) || src.includes(`"${qid}"`), `${qid} is never asked`);
});

test('each worldview has a secret character and enough answer options', () => {
  for (const w of D.WORLDVIEWS) {
    assert.ok(Object.values(D.NPCS).some(n => n.secret === w.id), `${w.id} has no character`);
    const main = Object.values(D.QUESTIONS).flatMap(q => q.o).filter(o => o.s[w.id] === 2).length;
    assert.ok(main >= 6, `${w.id} is the main answer only ${main} times`);
  }
});

test('referenced items, quests and eggs exist', () => {
  const src = Object.values(D.NPCS).map(n => JSON.stringify(n, (k, v) => typeof v === 'function' ? v.toString() : v)).join('\n');
  for (const [, kind, id] of src.matchAll(/(give|take|quest|done|egg)\s*:\s*\\?['"](\w+)/g)) {
    const table = {give:D.ITEMS, take:D.ITEMS, quest:D.QUESTS, done:D.QUESTS, egg:D.EGGS}[kind];
    assert.ok(table[id], `${kind}:${id}`);
  }
});
