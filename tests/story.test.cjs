const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('story.js','utf8')+'\n'+fs.readFileSync('locales.js','utf8');
const {chars,score,profiles,ui}=vm.runInNewContext(source+';({chars:characters,score:scoreProfile,profiles,ui})');
function checkLocale(value){if(!value||typeof value!=='object')return;if('en' in value){for(const lang of ['en','ru','ro'])assert.ok(typeof value[lang]==='string'&&value[lang].length>0,lang);}else Object.values(value).forEach(checkLocale);}
test('all dialogue, contexts, choices, categories, and UI have three languages',()=>{checkLocale(chars);checkLocale(ui);checkLocale(profiles);assert.equal(chars.length,4);assert.equal(new Set(chars.map(c=>c.id)).size,4);assert.equal(chars.flatMap(c=>c.questions).length,8);for(const c of chars)for(const q of c.questions){assert.ok(q.context);assert.equal(q.a.length,4);for(const a of q.a){assert.ok(profiles.some(p=>p.id===a[1]));assert.ok(profiles.some(p=>p.id===a[2]));}}});
test('every complete answer path produces exactly 24 points and percentages totalling 100',()=>{for(let path=0;path<4**8;path++){let n=path;const answers={};for(const c of chars)c.questions.forEach((q,i)=>{answers[c.id+i]={index:n%4};n=Math.floor(n/4);});const result=score(answers);assert.equal(result.answered,8);assert.equal(result.rows.reduce((s,r)=>s+r.points,0),24);assert.equal(result.rows.reduce((s,r)=>s+r.percent,0),100);for(const r of result.rows)assert.ok(r.percent>=0&&r.percent<=100);}});
test('empty, partial, and invalid responses do not fabricate points',()=>{assert.equal(score({}).rows.reduce((s,r)=>s+r.percent,0),0);const partial=score({mara0:{index:0},ada0:{index:99}});assert.equal(partial.answered,1);assert.equal(partial.rows.find(p=>p.id==='evidence').percent,100);});
