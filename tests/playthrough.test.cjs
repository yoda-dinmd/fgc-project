/* Plays the story logic end to end with a tiny script runner that mirrors game.js:
   talks to everyone, tries every topic, always picks answer `pick`. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data.js');
const {computeResults} = require('../scoring.js');

function play(pick) {
  const S = {items:[], flags:{}, quests:{}, answers:{}, eggs:{}, counters:{}, revealed:false, name:'Tester'};
  const g = {
    has: i => S.items.includes(i), flag: f => !!S.flags[f], quest: q => S.quests[q], answered: q => q in S.answers,
    thoughts: () => Object.keys(S.answers).length, counter: id => { const n = S.counters[id] || 0; S.counters[id] = n + 1; return n; },
    topWorldview: () => computeResults(S.answers, D.QUESTIONS, D.WORLDVIEWS).ranked[0].name, name: 'Tester',
  };
  const run = steps => {
    if (typeof steps === 'function') steps = steps(g);
    for (const st of steps || []) {
      if (typeof st === 'function') { run(st(g)); continue; }
      if (Array.isArray(st)) { run(st); continue; }
      if (typeof st === 'string') continue;
      if (st.ask) { if (!(st.ask in S.answers)) { const q = D.QUESTIONS[st.ask]; const i = typeof pick === 'function' ? pick(q) : Math.min(pick, q.o.length - 1); S.answers[st.ask] = i; run(q.o[i].r); } }
      if (st.give) { assert.ok(D.ITEMS[st.give]); if (!S.items.includes(st.give)) S.items.push(st.give); }
      if (st.take) { assert.ok(S.items.includes(st.take), `took ${st.take} without having it`); S.items = S.items.filter(i => i !== st.take); }
      if (st.set) S.flags[st.set] = true;
      if (st.quest && !S.quests[st.quest]) S.quests[st.quest] = 'active';
      if (st.done) S.quests[st.done] = 'done';
      if (st.egg) S.eggs[st.egg] = true;
      if (st.reveal) S.revealed = true;
    }
  };
  const order = Object.keys(D.NPCS);
  for (let round = 0; round < 12; round++) {
    for (const id of order) {
      const n = D.NPCS[id];
      if (id === 'mirror' || id === 'keeper') continue;
      if (n.topics) { run(n.hello); for (const t of n.topics) if (!t.when || t.when(g)) { run(t.script || []); if (t.ask) run([{ask:t.ask}]); if (t.after) run(t.after); } }
      else run(n.talk);
    }
  }
  run(D.NPCS.keeper.talk); run(D.NPCS.mirror.talk);
  return S;
}

test('the whole game can be completed', () => {
  const S = play(0);
  assert.ok(S.flags.gateFixed, 'gate fixed');
  for (const q of ['gate', 'book', 'acorn', 'petition', 'coffee', 'cave']) assert.equal(S.quests[q], 'done', q);
  assert.equal(Object.keys(S.answers).length, Object.keys(D.QUESTIONS).length, 'every question asked');
  assert.ok(S.revealed, 'mirror reveal reached');
  const eggs = Object.keys(D.EGGS).filter(e => e !== 'name');
  for (const e of eggs) assert.ok(S.eggs[e], `egg ${e}`);
});

test('completable with every answer choice', () => {
  for (const pick of [1, 2, 3, 5]) { const S = play(pick); assert.ok(S.revealed, `pick ${pick}`); }
});

test('the keeper refuses with too few thoughts', () => {
  const S = {answers:{}, flags:{}};
  const g = {thoughts: () => 3, flag: f => !!S.flags[f]};
  const steps = D.NPCS.keeper.talk(g);
  assert.ok(!JSON.stringify(steps).includes('keeper_good'));
});
