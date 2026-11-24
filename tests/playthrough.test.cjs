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

test('gus shows a fresh topic with wrench and un-dims gate topic when thoughts suffice', () => {
  const gus = D.NPCS.gus;
  const gNoWrench = {flag: () => false, has: () => false, thoughts: () => D.MIN_THOUGHTS};
  const gateTopic = gus.topics.find(t => t.label.includes('gate'));
  assert.ok(gateTopic.when(gNoWrench));
  assert.ok(gateTopic.fresh(gNoWrench));
  const gWithWrench = {flag: () => false, has: i => i === 'wrench', thoughts: () => 1};
  const wrenchTopic = gus.topics.find(t => t.label.includes('wrench'));
  assert.ok(wrenchTopic && wrenchTopic.when(gWithWrench));
  assert.ok(!gateTopic.when(gWithWrench));
});

test('presentation route reaches MIN_THOUGHTS, opens lighthouse, and completes mirror', () => {
  const S = {items:[], flags:{}, quests:{}, answers:{}, eggs:{}, counters:{}, revealed:false, name:'Presenter'};
  const g = {
    has: i => S.items.includes(i), flag: f => !!S.flags[f], quest: q => S.quests[q], answered: q => q in S.answers,
    thoughts: () => Object.keys(S.answers).length, counter: id => { const n = S.counters[id] || 0; S.counters[id] = n + 1; return n; },
    topWorldview: () => computeResults(S.answers, D.QUESTIONS, D.WORLDVIEWS).ranked[0].name, name: 'Presenter',
  };
  const run = steps => {
    if (typeof steps === 'function') steps = steps(g);
    for (const st of steps || []) {
      if (typeof st === 'function') { run(st(g)); continue; }
      if (Array.isArray(st)) { run(st); continue; }
      if (typeof st === 'string') continue;
      if (st.ask) { if (!(st.ask in S.answers)) { const q = D.QUESTIONS[st.ask]; S.answers[st.ask] = 0; run(q.o[0].r); } }
      if (st.give && !S.items.includes(st.give)) S.items.push(st.give);
      if (st.take) S.items = S.items.filter(i => i !== st.take);
      if (st.set) S.flags[st.set] = true;
      if (st.quest && !S.quests[st.quest]) S.quests[st.quest] = 'active';
      if (st.done) S.quests[st.done] = 'done';
      if (st.reveal) S.revealed = true;
    }
  };
  const talkTopic = (npcId, label) => {
    const npc = D.NPCS[npcId];
    const t = npc.topics.find(x => x.label === label && (!x.when || x.when(g)));
    assert.ok(t, `topic "${label}" available on ${npcId}`);
    run(t.script || []);
    if (t.ask) run([{ask:t.ask}]);
    if (t.after) run(t.after);
  };
  talkTopic('gus', 'What\'s wrong with the gate?');
  talkTopic('quark', 'Can I borrow Gus\'s wrench?');
  talkTopic('quark', 'Why does anything exist?');
  talkTopic('quark', 'If we\'re just atoms, does anything matter?');
  talkTopic('gus', 'Here\'s your wrench!');
  assert.ok(S.flags.gateFixed, 'gate opened');
  talkTopic('gus', 'What is truth, Gus?');
  talkTopic('gus', 'Do you believe in anything?');
  talkTopic('mira', 'How do you stay so calm?');
  talkTopic('mira', 'What if someone is rude to you?');
  talkTopic('dio', 'Would you like a house?');
  talkTopic('dio', 'What do you think of rules?');
  talkTopic('anselm', 'What do you believe?');
  talkTopic('kiri', 'Who am I?');
  talkTopic('kiri', 'How do I find peace?');
  assert.equal(g.thoughts(), D.MIN_THOUGHTS, 'exact minimum thoughts reached before lighthouse');
  run(D.NPCS.keeper.talk);
  assert.ok(S.flags.ready, 'keeper unlocks mirror');
  run(D.NPCS.mirror.talk);
  assert.ok(S.revealed, 'mirror reveal reached');
});
