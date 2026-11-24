/* Hidden scoring. Each answer gives points to worldviews (2 = main, 1 = secondary).
   Some worldviews appear in more answer options than others, so raw points would be
   biased. Instead, a worldview's affinity is:

       points earned / (points that were on offer for it in the questions you answered + SMOOTHING)

   SMOOTHING keeps a worldview that appeared only once or twice from jumping to 100%. */
const SMOOTHING = 2;

function computeResults(answers, questions, worldviews) {
  const earned = {}, offered = {};
  for (const w of worldviews) { earned[w.id] = 0; offered[w.id] = 0; }
  let count = 0;
  for (const [qid, index] of Object.entries(answers || {})) {
    const q = questions[qid];
    const opt = q && q.o[index];
    if (!opt) continue;
    count++;
    // "offered" = the best you could have scored for each worldview on this question
    const best = {};
    for (const o of q.o) for (const [w, p] of Object.entries(o.s)) best[w] = Math.max(best[w] || 0, p);
    for (const [w, p] of Object.entries(best)) if (w in offered) offered[w] += p;
    for (const [w, p] of Object.entries(opt.s)) if (w in earned) earned[w] += p;
  }
  const list = worldviews.map(w => ({
    ...w,
    earned: earned[w.id],
    offered: offered[w.id],
    affinity: offered[w.id] ? earned[w.id] / (offered[w.id] + SMOOTHING) : 0,
  }));
  const ranked = [...list].sort((a, b) => b.affinity - a.affinity || b.earned - a.earned);
  return {count, list, ranked};
}

if (typeof module !== 'undefined') module.exports = {computeResults, SMOOTHING};
