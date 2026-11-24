const {test} = require('node:test');
const assert = require('node:assert/strict');
const {WORLDVIEWS, QUESTIONS} = require('../data.js');
const {computeResults} = require('../scoring.js');

test('no answers gives zero affinity everywhere', () => {
  const r = computeResults({}, QUESTIONS, WORLDVIEWS);
  assert.equal(r.count, 0);
  assert.ok(r.list.every(w => w.affinity === 0));
});

test('invalid answers are ignored', () => {
  const r = computeResults({nope:0, mira_storm:99}, QUESTIONS, WORLDVIEWS);
  assert.equal(r.count, 0);
});

test('always picking a worldview\'s answers puts it on top', () => {
  for (const w of WORLDVIEWS) {
    const answers = {};
    for (const [qid, q] of Object.entries(QUESTIONS)) {
      let best = 0;
      q.o.forEach((o, i) => { if ((o.s[w.id] || 0) > (q.o[best].s[w.id] || 0)) best = i; });
      answers[qid] = best;
    }
    const r = computeResults(answers, QUESTIONS, WORLDVIEWS);
    assert.equal(r.ranked[0].id, w.id, `${w.id} lost to ${r.ranked[0].id}`);
    assert.ok(r.list.every(x => x.affinity >= 0 && x.affinity < 1));
  }
});
