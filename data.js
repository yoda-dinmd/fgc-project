/* ==========================================================================
   THE EXAMINED LIFE: all story content lives in this file.

   Script steps (used in `talk`, `hello`, topic `script`, etc.):
     'Some text'           the current character says it ({name} = player name)
     '* Some text'         narration, no speaker
     {ask:'questionId'}    asks a QUESTIONS entry (the scored, hidden part)
     {give:'item'}         player receives an item (see ITEMS)
     {take:'item'}         player hands an item over
     {set:'flag'}          sets a story flag
     {quest:'id'}          starts a quest   {done:'id'} completes it
     {egg:'id'}            marks an easter egg as found (see EGGS)
     g => [...steps]       a function for conditional dialogue
   ========================================================================== */

const WORLDVIEWS = [
  {id:'naturalism', name:'Naturalism', aka:'Atheism / scientific naturalism', short:'Naturalism', npc:'quark',
   blurb:'You trust what can be tested. The universe runs on natural laws, and for you that makes it more astonishing, not less.',
   thinkers:'Democritus, David Hume, Charles Darwin, Bertrand Russell'},
  {id:'theism', name:'Theism', aka:'Belief in a personal God', short:'Theism', npc:'anselm',
   blurb:'You sense a purpose and a Someone behind the world. Faith, for you, is a relationship that gives life its direction.',
   thinkers:'Augustine, Anselm of Canterbury, Thomas Aquinas, Søren Kierkegaard'},
  {id:'existentialism', name:'Existentialism', aka:'Existence precedes essence', short:'Existentialism', npc:'remy',
   blurb:'Nobody hands you a purpose. You become who you are through your choices, and you take responsibility for them.',
   thinkers:'Jean-Paul Sartre, Simone de Beauvoir, Søren Kierkegaard, Friedrich Nietzsche'},
  {id:'nihilism', name:'Nihilism', aka:'No built-in meaning', short:'Nihilism', npc:'raven',
   blurb:'You suspect that values and meanings are not written into the universe. It is a bleak view, and an honest starting point.',
   thinkers:'Friedrich Nietzsche (as a diagnosis), Ivan Turgenev, Emil Cioran'},
  {id:'stoicism', name:'Stoicism', aka:'Control what you can', short:'Stoicism', npc:'mira',
   blurb:'You separate what is up to you from what is not, and keep your calm about the second kind. Virtue first, weather second.',
   thinkers:'Epictetus, Seneca, Marcus Aurelius, Zeno of Citium'},
  {id:'hedonism', name:'Epicureanism', aka:'Hedonism of the wise kind', short:'Epicurean', npc:'bella',
   blurb:'Pleasure matters, but the calm, simple, shared kind: good bread, good friends, no needless fears.',
   thinkers:'Epicurus, Lucretius, Aristippus, Michel de Montaigne'},
  {id:'utilitarianism', name:'Utilitarianism', aka:'The greatest good', short:'Utilitarian', npc:'tally',
   blurb:'You judge actions by their consequences: more wellbeing and less suffering, counted fairly for everyone.',
   thinkers:'Jeremy Bentham, John Stuart Mill, Peter Singer'},
  {id:'deontology', name:'Kantian Ethics', aka:'Deontology: duty and principle', short:'Kantian', npc:'ought',
   blurb:'Some things are right or wrong regardless of outcome. Keep promises, tell the truth, and never treat people as mere tools.',
   thinkers:'Immanuel Kant, W. D. Ross, Christine Korsgaard'},
  {id:'buddhism', name:'Buddhism', aka:'Impermanence and letting go', short:'Buddhist', npc:'kiri',
   blurb:'Everything changes, including the "self". Suffering comes from clinging, and peace from seeing clearly and letting go.',
   thinkers:'Siddhartha Gautama, Nagarjuna, Thich Nhat Hanh'},
  {id:'pantheism', name:'Pantheism', aka:'God is nature', short:'Pantheism', npc:'sylva',
   blurb:'The sacred is not outside the world; it is the world. Forests, stars and you are all part of one divine whole.',
   thinkers:'Baruch Spinoza, Heraclitus, Ralph Waldo Emerson'},
  {id:'pragmatism', name:'Pragmatism', aka:'True is what works', short:'Pragmatism', npc:'gus',
   blurb:'You test ideas by what they do in practice. A belief that works, helps and holds up in use earns your trust.',
   thinkers:'William James, Charles S. Peirce, John Dewey'},
  {id:'skepticism', name:'Skepticism', aka:'Agnosticism and doubt', short:'Skepticism', npc:'hume',
   blurb:'You hold your conclusions loosely and ask for evidence, especially on the big unanswerable questions.',
   thinkers:'Pyrrho, Sextus Empiricus, David Hume, Thomas Huxley'},
  {id:'absurdism', name:'Absurdism', aka:'Rebel, laugh, keep pushing', short:'Absurdism', npc:'syd',
   blurb:'We want meaning; the universe stays silent. Instead of despair, you answer with defiance, humour and a full life.',
   thinkers:'Albert Camus, Franz Kafka (as a mood), Thomas Nagel'},
  {id:'collectivism', name:'Collectivism', aka:'Marxism and solidarity', short:'Collectivism', npc:'rosa',
   blurb:'People are shaped by their communities and are stronger together. Fairness means sharing work and its rewards.',
   thinkers:'Karl Marx, Rosa Luxemburg, Peter Kropotkin'},
  {id:'libertarianism', name:'Libertarianism', aka:'Individual liberty', short:'Libertarian', npc:'penny',
   blurb:'Your life, your choices, your property. You are wary of anyone, from kings to committees, who decides for you.',
   thinkers:'John Locke, Robert Nozick, John Stuart Mill (On Liberty)'},
  {id:'cynicism', name:'Cynicism', aka:'The ancient kind: live simply', short:'Cynicism', npc:'dio',
   blurb:'You see through status, luxury and polite pretence. Real freedom is needing very little and saying what is true.',
   thinkers:'Diogenes of Sinope, Antisthenes, Crates of Thebes'},
];

/* Every scored question. Points are hidden from the player during play.
   Each option: t = what the player says, s = points, r = the reply (script). */
const QUESTIONS = {
  // ---------- Village Square ----------
  mira_storm:{by:'mira', q:'Let me ask you something. A hailstorm flattens the garden you spent all summer on. What do you do first?', o:[
    {t:'Breathe, accept it, and replant what I can.', s:{stoicism:2, buddhism:1}, r:['The storm was never yours. The replanting is. You have the right idea.']},
    {t:'Find out exactly why it happened, so I can protect it next time.', s:{naturalism:2, pragmatism:1}, r:['A sensible gardener. Just don\'t let the "why" eat the whole spring.']},
    {t:'Trust that there\'s some reason for it, even if I can\'t see it.', s:{stoicism:2, theism:1}, r:['Many good gardeners do. The soil doesn\'t mind who you thank.']},
    {t:'Get angry. Then eat cake about it.', s:{absurdism:2, hedonism:1}, r:['Ha! Honest. The cake was never the problem. The anger, sometimes.']},
  ]},
  mira_insult:{by:'mira', q:'Another one. A stranger insults you in the street. Loudly. With hand gestures. What then?', o:[
    {t:'Their words are their business. My reaction is mine.', s:{stoicism:2, deontology:1}, r:['Exactly. An insult is only a noise until you agree to be hurt by it.']},
    {t:'Insult them back, but better. With footnotes.', s:{cynicism:2, existentialism:1}, r:['Oh dear. Dio would be proud. Don\'t tell him I said that.']},
    {t:'Ask what\'s wrong. Maybe they\'re having an awful day.', s:{buddhism:2, utilitarianism:1}, r:['Kind. Most anger is just pain wearing a loud coat.']},
    {t:'Laugh. A grown adult yelling at a stranger is hilarious.', s:{absurdism:2, cynicism:1}, r:['It is, rather. The universe has a sense of humour, and so should we.']},
  ]},
  gus_map:{by:'gus', q:'Here\'s my puzzle. A map gets you home every single time, but it\'s drawn completely wrong. Is it a good map?', o:[
    {t:'If it gets me home, it\'s a good map.', s:{pragmatism:2, utilitarianism:1}, r:['That\'s what I say! Truth is what does the job.']},
    {t:'No. A map should match the territory, even if that\'s harder.', s:{naturalism:2, deontology:1}, r:['Fair. Accuracy has a way of paying off when the road changes.']},
    {t:'Every map is wrong somehow. Nobody sees the real territory.', s:{skepticism:2, buddhism:1}, r:['Huh. Then I\'ve been fixing the wrong maps my whole life. Fun.']},
    {t:'Maps are for people afraid of getting lost. I\'d wander.', s:{absurdism:2, existentialism:1}, r:['Can\'t argue with that. Well, I can. I won\'t. Busy.']},
  ]},
  gus_belief:{by:'gus', q:'One I chew on at lunch. A belief makes you happier and kinder, but there\'s no proof for it. Should you believe it?', o:[
    {t:'If it helps me live better, sure.', s:{pragmatism:2, theism:1}, r:['That\'s how I see it. Beliefs are tools. Use the ones that build.']},
    {t:'No. I should only believe what the evidence supports.', s:{naturalism:2, skepticism:1}, r:['Tough standard. Doc Quark would hand you a lab coat.']},
    {t:'Faith isn\'t about being useful. It\'s true or it isn\'t.', s:{theism:2, deontology:1}, r:['Huh. So it\'s not a tool, it\'s a... foundation. I can respect a foundation.']},
    {t:'Nobody gets to tell me what to believe, useful or not.', s:{libertarianism:2, existentialism:1}, r:['Ha. Fair enough. Your head, your workshop.']},
  ]},
  dio_house:{by:'dio', q:'Answer quick. A stranger offers you a huge house, but you must keep up appearances forever: fancy dinners, nice clothes, polite lies.', o:[
    {t:'No thanks. I\'d rather be free and own nothing.', s:{cynicism:2, buddhism:1}, r:['HA! There\'s room in the barrel. Not much. But some.']},
    {t:'Yes! A comfy house, good food... I can survive the dinners.', s:{hedonism:2, pragmatism:1}, r:['Enjoy your cushions. They will own you within a week.']},
    {t:'Only if I can share it with people who need a home.', s:{collectivism:2, utilitarianism:1}, r:['Hmph. Clever. You\'d turn the palace into a barrel for many.']},
    {t:'I\'d take it, then make my own rules inside it.', s:{libertarianism:2, existentialism:1}, r:['A free person in a gilded cage. Let me know how that goes.']},
  ]},
  dio_rules:{by:'dio', q:'Society says: wear shoes, say please, don\'t eat in the market square. Which of those rules are real?', o:[
    {t:'None. They\'re just habits wearing a costume.', s:{cynicism:2, nihilism:1}, r:['Correct! I ate soup in the market yesterday. The sky did not fall.']},
    {t:'The rules that respect other people. Those matter.', s:{deontology:2, collectivism:1}, r:['Respect, yes. Shoes, no. We are halfway to agreeing.']},
    {t:'Whichever ones actually make life go better.', s:{utilitarianism:2, pragmatism:1}, r:['So you\'d test each rule like Gus tests a hinge. Sensible. Boring, but sensible.']},
    {t:'I\'d follow them and stay calm. They cost me nothing.', s:{stoicism:2, absurdism:1}, r:['The gardener\'s answer. She wears shoes, you know. Tragic.']},
  ]},

  // ---------- Laboratory ----------
  quark_origin:{by:'quark', q:'Little survey for my research. Why do you think the universe exists at all?', o:[
    {t:'Physics. Big Bang, natural laws, nobody behind the curtain.', s:{naturalism:2, nihilism:1}, r:['That\'s where the evidence points, as far as I can tell. And it\'s still the best story ever written.']},
    {t:'Someone created it on purpose.', s:{theism:2, stoicism:1}, r:['Noted. A lot of great scientists believed that too. Newton, for one. He also put needles in his eye, so.']},
    {t:'The universe IS the sacred thing. It didn\'t need a maker.', s:{pantheism:2, buddhism:1}, r:['Ooh. Nature as the divine itself. Einstein liked that idea. I\'m writing it down.']},
    {t:'We can\'t know. I\'ll suspend judgement.', s:{skepticism:2, absurdism:1}, r:['A careful answer. Annoyingly careful. The best kind.']},
  ]},
  quark_coin:{by:'quark', q:'One experiment, then the wrench is yours. A coin lands heads ten times in a row. What\'s going on?', o:[
    {t:'Probably chance. Flip it a thousand more times and check.', s:{skepticism:2, naturalism:1}, r:['Yes! More data! You\'d make a great lab assistant.']},
    {t:'It\'s a sign. Things happen for a reason.', s:{pantheism:2, theism:1}, r:['Mm. Ten heads in a row happens about once in a thousand tries. Signs are... very common, then.']},
    {t:'Who cares? Bet on heads and enjoy the streak.', s:{pragmatism:2, hedonism:1}, r:['Statistically questionable. Spiritually, I get it.']},
    {t:'Maybe the coin is rigged. Maybe I am. Maybe coins aren\'t real.', s:{absurdism:2, skepticism:1}, r:['Please don\'t talk to the brain in the jar. It gets ideas.']},
  ]},
  quark_love:{by:'quark', q:'My students ask this at 2 a.m. If we\'re "just" atoms, does love still mean anything?', o:[
    {t:'Of course. Atoms arranged as love are still love.', s:{naturalism:2, existentialism:1}, r:['That\'s my answer too. Knowing how a rainbow works doesn\'t make it less beautiful.']},
    {t:'Only if there\'s more to us than atoms, like a soul.', s:{theism:2, deontology:1}, r:['That\'s a big "if", and I can\'t measure souls. I can\'t rule them out with a ruler either.']},
    {t:'Meaning is what we make. Atoms are just the canvas.', s:{existentialism:2, absurdism:1}, r:['The universe provides the paint. You do the painting. I like that.']},
    {t:'Not really. It\'s chemistry pretending to be poetry.', s:{nihilism:2, cynicism:1}, r:['Oof. Cold. Accurate chemistry, though. Maybe less accurate poetry.']},
  ]},

  // ---------- Temple ----------
  anselm_stars:{by:'anselm', q:'May I ask what you think? When you look up at the stars at night, what do you feel?', o:[
    {t:'That someone made all of this, and made it with love.', s:{theism:2, collectivism:1}, r:['Then we see the same sky, friend. Welcome.']},
    {t:'Wonder. But I think it\'s physics, not a person.', s:{naturalism:2, pantheism:1}, r:['Wonder is the start of every prayer and every experiment. We\'re cousins, you and I.']},
    {t:'Small. Tiny. Like nothing I do matters.', s:{nihilism:2, absurdism:1}, r:['Small, yes. But the small things are often what is most loved. Come by any time.']},
    {t:'That I\'m part of them. Same stuff, same story.', s:{pantheism:2, buddhism:1}, r:['Sylva in the forest would hug you for that. Gently. With moss.']},
  ]},
  anselm_evil:{by:'anselm', q:'You\'ve earned a hard question. If God is good, why is there so much suffering in the world?', o:[
    {t:'Maybe suffering has a reason we can\'t see yet.', s:{theism:2, stoicism:1}, r:['That is what I hope, on my good days. On my bad days I just hope.']},
    {t:'That\'s exactly why I don\'t believe there\'s a God.', s:{naturalism:2, skepticism:1}, r:['It is the strongest argument against my faith. I respect you for saying it plainly.']},
    {t:'Suffering comes from craving and clinging. Work on that.', s:{buddhism:2, stoicism:1}, r:['You sound like my friend Kiri in the garden. She is very irritating when she is right.']},
    {t:'Whatever the reason, our job is to reduce it. Now.', s:{utilitarianism:2, collectivism:1}, r:['Amen to that, whatever we believe. Let\'s both get to work.']},
  ]},
  kiri_self:{by:'kiri', q:'Tell me. When you say "I", who is that?', o:[
    {t:'My soul. The part of me that never changes.', s:{theism:2, deontology:1}, r:['Mm. Brother Anselm would nod. I will nod too. Different nod.']},
    {t:'My brain and body. A very complicated animal.', s:{naturalism:2, pragmatism:1}, r:['A complicated animal asking who it is. That is a beautiful animal.']},
    {t:'A river: memories, moods, habits. Always changing. No fixed "me".', s:{buddhism:2, pantheism:1}, r:['...Yes. The river does not need to be one thing to keep flowing.']},
    {t:'Whoever I choose to become. I\'m a project, not a thing.', s:{existentialism:2, libertarianism:1}, r:['A project. Then be gentle with the project. It is still under construction.']},
  ]},
  kiri_peace:{by:'kiri', q:'And what would make you truly at peace?', o:[
    {t:'Wanting less. Letting go.', s:{buddhism:2, cynicism:1}, r:['Then you are already less heavy than when you came in.']},
    {t:'Getting what I want, and enjoying it.', s:{hedonism:2, libertarianism:1}, r:['And after you get it, you will want the next thing. Watch that, kindly.']},
    {t:'Accepting whatever comes, and doing my part.', s:{stoicism:2, deontology:1}, r:['A steady mind. Like a rock in the stream. Rocks also need rest.']},
    {t:'Knowing everyone around me is okay.', s:{collectivism:2, utilitarianism:1}, r:['A wide heart. That is the beginning of compassion.']},
  ]},

  // ---------- Forest ----------
  sylva_forest:{by:'sylva', q:'Tell me, little walker. What is a forest for?', o:[
    {t:'Nothing. It just is. That\'s what makes it sacred.', s:{pantheism:2, buddhism:1}, r:['Rustle rustle! Yes! You are speaking Tree!']},
    {t:'For us: wood, food, clean air. Use it wisely.', s:{pragmatism:2, utilitarianism:1}, r:['Hm. Wisely is the important word. Remember it next time you hold an axe.']},
    {t:'God made it, and we\'re here to look after it.', s:{theism:2, deontology:1}, r:['A caretaker. I\'ll take it. The monk sends me candles sometimes.']},
    {t:'For whoever owns it to decide.', s:{libertarianism:2, pragmatism:1}, r:['Owns? OWNS? The trees would like a word. A very slow word.']},
  ]},
  sylva_after:{by:'sylva', q:'One last question, for the acorn\'s sake. When a person dies, where do they go?', o:[
    {t:'Back into everything. Like a leaf into the soil.', s:{pantheism:2, naturalism:1}, r:['Into the roots, the rain, the next spring. Nothing is ever really lost.']},
    {t:'Somewhere else. To God, or a heaven.', s:{theism:2, deontology:1}, r:['Then I hope it has trees. I\'d hate to be a heaven without trees.']},
    {t:'Nowhere. The lights just go out.', s:{nihilism:2, naturalism:1}, r:['Mm. Like a candle. But a candle still lit the room while it burned.']},
    {t:'Around again. Another life, another turn of the wheel.', s:{buddhism:2, pantheism:1}, r:['Round and round, like seasons. I like that very much.']},
  ]},
  syd_meaning:{by:'syd', q:'Real talk. The universe gives no reasons for anything. What do you do about it?', o:[
    {t:'Laugh, keep pushing, and live fully anyway.', s:{absurdism:2, existentialism:1}, r:['YES! Rebellion through cardio!']},
    {t:'Make my own reasons. That\'s my job, not the universe\'s.', s:{existentialism:2, libertarianism:1}, r:['Love that. The café guy would say the same, but with more sighing.']},
    {t:'It does have reasons. We just can\'t see them yet.', s:{stoicism:2, theism:1}, r:['Oh, an optimist! Hey, maybe the hill is part of a plan. Weird plan. Steep.']},
    {t:'Then nothing matters. Stop pushing. Lie down.', s:{nihilism:2, cynicism:1}, r:['I tried that for a century. Very relaxing. Very, very boring.']},
  ]},
  syd_help:{by:'syd', q:'Aw, you want to help? But if you push, is it still MY boulder? Should you help someone who chose their struggle?', o:[
    {t:'Yes. People should help each other carry things.', s:{collectivism:2, utilitarianism:1}, r:['Okay, but you push the left side. The left side is the heavy side. Every side is the heavy side.']},
    {t:'No. It\'s your rock and your choice. I respect that.', s:{libertarianism:2, existentialism:1}, r:['Respect! You get it. My rock. My hill. My weird little life.']},
    {t:'Only if helping actually makes things better overall.', s:{utilitarianism:2, pragmatism:1}, r:['Good news: it doesn\'t! It rolls back either way. Ha!']},
    {t:'I\'ll grab snacks and cheer you on instead.', s:{hedonism:2, absurdism:1}, r:['A fan! I\'ve never had a fan! PUSH! PUSH! ...I\'m cheering for myself now.']},
  ]},
  raven_left:{by:'raven', q:'So if nothing has any built-in meaning... what\'s even left?', o:[
    {t:'Nothing. That\'s the honest answer.', s:{nihilism:2, cynicism:1}, r:['Finally. Someone who gets it. ...That\'s, like, nice. In a bleak way.']},
    {t:'Freedom. If nothing is given, everything\'s up to me.', s:{existentialism:2, absurdism:1}, r:['Ugh, that\'s weirdly inspiring. Stop it.']},
    {t:'Everything is connected. That IS the meaning.', s:{pantheism:2, buddhism:1}, r:['Everything is connected. Including my boots? ...Okay, that\'s kind of nice.']},
    {t:'Each other. People still laugh and hurt. That\'s enough.', s:{collectivism:2, utilitarianism:1}, r:['...Okay. That one got me a bit. Don\'t tell anyone.']},
  ]},
  raven_cave:{by:'raven', q:'You went in the cave?! Okay. So... what\'s the truth, then?', o:[
    {t:'Shadows. Everything we see could be a shadow of something realer.', s:{skepticism:2, theism:1}, r:['That\'s the creepiest thing anyone\'s ever said to me. I love it.']},
    {t:'A fire and some shadows. No deep secret.', s:{naturalism:2, nihilism:1}, r:['See? Overrated. Like everything. Except my boots.']},
    {t:'That I decide what\'s real for me.', s:{existentialism:2, libertarianism:1}, r:['Main-character energy. Annoying. Effective.']},
    {t:'That it\'s nicer outside. I went back to the sun.', s:{hedonism:2, pragmatism:1}, r:['Ew. The sun. ...Was it nice, though?']},
  ]},
  pell_sun:{by:'pell', q:'You came from... out there? They say there\'s a "sun". Is it really better than the shadows?', o:[
    {t:'Much better. You deserve the truth, even if it\'s scary.', s:{deontology:2, naturalism:1}, r:['The truth... I\'ll think about it. My neck is very stiff. Maybe soon.']},
    {t:'If you\'re happy here, maybe stay.', s:{hedonism:2, libertarianism:1}, r:['Oh good. The teapot shadow is about to come back. It\'s my favourite.']},
    {t:'I can\'t be sure my world isn\'t just another cave.', s:{skepticism:2, buddhism:1}, r:['A cave outside the cave? Caves all the way up? ...I need to lie down.']},
    {t:'It\'s all shadows of something. Pick the ones that help you.', s:{pragmatism:2, absurdism:1}, r:['Useful shadows. Yes. The rabbit one helps me sleep.']},
  ]},

  // ---------- Market ----------
  bella_afternoon:{by:'bella', q:'Quick quiz from the oven! A perfect afternoon is...', o:[
    {t:'Good food, good friends, nothing to worry about.', s:{hedonism:2, collectivism:1}, r:['Correct! Ding! That\'s the whole recipe for life, really.']},
    {t:'Finishing something hard I set out to do.', s:{pragmatism:2, existentialism:1}, r:['A builder! Then eat something after. Builders forget to eat.']},
    {t:'Helping out somewhere it\'s really needed.', s:{collectivism:2, deontology:1}, r:['Aw. Then come help me knead dough on Tuesdays. Kidding! Mostly.']},
    {t:'Sitting still, wanting nothing at all.', s:{buddhism:2, cynicism:1}, r:['Wanting nothing? Not even a little bun? ...Fine. Very peaceful. Suspicious, but peaceful.']},
  ]},
  bella_croissant:{by:'bella', q:'Here, a fresh croissant, still warm! Would you eat it now, or keep it for someone else?', o:[
    {t:'Now! Life is short and it\'s warm.', s:{hedonism:2, absurdism:1}, r:['* You eat the croissant. It is perfect. Briefly, nothing else exists.', 'Ha! Here, have another one. This one is for sharing, though!']},
    {t:'I\'ll save it for someone who needs it more.', s:{utilitarianism:2, collectivism:1}, r:['What a sweetheart. Take it, find a hungry somebody.']},
    {t:'Whatever. It\'s just a croissant.', s:{nihilism:2, stoicism:1}, r:['JUST a croissant? Seventy-two layers of butter, JUST a croissant? Take it and think about what you said.']},
    {t:'How much? I\'ll pay. I don\'t like owing anyone.', s:{libertarianism:2, deontology:1}, r:['Ha! Mr. Penny\'s been talking to you. It\'s free, silly. Take it.']},
  ]},
  penny_tax:{by:'penny', q:'A question for the customer! Should people be forced to pay taxes to help strangers?', o:[
    {t:'No. Helping should be a choice, not a law.', s:{libertarianism:2, existentialism:1}, r:['Splendid! A free mind! Have a coupon. It\'s for nothing, but it\'s yours.']},
    {t:'Yes. We all owe something to the society that raised us.', s:{collectivism:2, deontology:1}, r:['Hmph. You\'ve been talking to Rosa. I can smell the solidarity on you.']},
    {t:'Yes, if it does the most good for the most people.', s:{utilitarianism:2, pragmatism:1}, r:['Ah, the accountant\'s answer. Tally would hug you, if he hugged.']},
    {t:'Money is an illusion anyway.', s:{cynicism:2, buddhism:1}, r:['An ILLUSION? Then you won\'t mind giving me all of yours. No? Thought so.']},
  ]},
  penny_petition:{by:'penny', q:'Rosa\'s petition! Ha. Before I sign anything: who should decide how long people work?', o:[
    {t:'Each worker and their boss. A free deal.', s:{libertarianism:2, pragmatism:1}, r:['Precisely! ...Drat, that means I should respect the deal the workers want. Fine.']},
    {t:'The workers, together. They do the work.', s:{collectivism:2, utilitarianism:1}, r:['Ugh. Persuasive. Very persuasive. Annoyingly persuasive.']},
    {t:'The law: clear rules that apply to everyone equally.', s:{deontology:2, collectivism:1}, r:['Rules for all, including me? ...Fair is fair, I suppose.']},
    {t:'Whatever keeps people healthiest and happiest.', s:{hedonism:2, utilitarianism:1}, r:['Happy workers sell more buns. That\'s just arithmetic.']},
  ]},
  rosa_group:{by:'rosa', q:'Tell me straight. What matters more: the group, or the individual?', o:[
    {t:'The group. We\'re nothing without each other.', s:{collectivism:2, pantheism:1}, r:['Solidarity! I knew I liked you.']},
    {t:'The individual. Groups can crush people.', s:{libertarianism:2, existentialism:1}, r:['They can. That\'s why a union has to be people, not just a banner. Good point.']},
    {t:'Neither. Whatever makes the most people happiest.', s:{utilitarianism:2, pragmatism:1}, r:['Tally\'s answer! Fine. Fair. Very, very fair. Calculator-fair.']},
    {t:'Both are made up. There\'s just people, doing stuff.', s:{cynicism:2, skepticism:1}, r:['People doing stuff. Huh. That\'s basically my whole job description.']},
  ]},
  trolley:{by:'tally', q:'My model railway! A runaway trolley is heading for five tiny wooden people. Pull the lever and it hits one tiny wooden person instead. Do you pull it?', o:[
    {t:'Pull it. One loss is better than five.', s:{utilitarianism:2, pragmatism:1}, r:['Five minus one. The numbers agree with you. I find that very comforting.']},
    {t:'No. I won\'t choose to kill someone, even to save more.', s:{deontology:2, theism:1}, r:['Clerk Ought would stamp that with "CORRECT". I would stamp it with "...hm".']},
    {t:'It isn\'t in my control. I\'d stay calm and accept what happens.', s:{stoicism:2, buddhism:1}, r:['Very serene. The five wooden people are less serene.']},
    {t:'Is this really the only choice? I\'d look for another way.', s:{pragmatism:2, skepticism:1}, r:['You want to... question the trolley problem? I\'ve never considered that. I need a moment.']},
  ]},
  tally_lie:{by:'tally', q:'Second calculation. Lying to a friend would make them happier. Do you lie?', o:[
    {t:'Yes, if it makes things better overall.', s:{utilitarianism:2, hedonism:1}, r:['Plus three happiness units. Minus one guilt unit. Net positive!']},
    {t:'No. Lying is wrong, full stop.', s:{deontology:2, theism:1}, r:['A firm principle. Ms. Ought would like you. Ms. Ought likes nobody.']},
    {t:'Depends on the friend and the lie. I\'d judge in the moment.', s:{pragmatism:2, existentialism:1}, r:['Case by case. Very hard to put in a spreadsheet. I respect it anyway.']},
    {t:'I\'d tell the truth, bluntly. Comfort is overrated.', s:{cynicism:2, stoicism:1}, r:['Ouch. Minus five happiness units. Plus one honesty unit. I\'m not sure of the exchange rate.']},
  ]},
  ought_promise:{by:'ought', q:'Form 7B: Promises. You promised to meet a friend, but a far more fun invitation comes along. Do you go?', o:[
    {t:'No. A promise is a promise.', s:{deontology:2, stoicism:1}, r:['Correct. Stamped. Filed. You may proceed.']},
    {t:'Yes, if the fun outweighs my friend\'s disappointment.', s:{utilitarianism:2, hedonism:1}, r:['You are... calculating friendship. Please see Mr. Tally. Window 3.']},
    {t:'I\'d ask my friend. Rules can bend between people who trust each other.', s:{pragmatism:2, collectivism:1}, r:['Consent from the affected party. Irregular, but... acceptable.']},
    {t:'Yes. Life\'s short, and I go where I want.', s:{hedonism:2, libertarianism:1}, r:['Form denied. Please take a number and reflect upon it.']},
  ]},
  ought_tool:{by:'ought', q:'Form 12: Dignity. Is it ever acceptable to use a person merely as a tool, if it helps many others?', o:[
    {t:'Never. People are ends in themselves, not tools.', s:{deontology:2, theism:1}, r:['...That is the finest sentence I have heard all year. I may frame it.']},
    {t:'Sometimes. The greater good can require hard choices.', s:{utilitarianism:2, collectivism:1}, r:['That reasoning is how many terrible forms get approved. Proceed with caution.']},
    {t:'Everyone uses everyone. At least admit it.', s:{cynicism:2, nihilism:1}, r:['That is a description, not a justification. Next!']},
    {t:'Only if they freely agreed to it.', s:{libertarianism:2, deontology:1}, r:['Consent. Then they are not merely a tool. Approved.']},
  ]},

  // ---------- Café & Library ----------
  remy_nature:{by:'remy', q:'So tell me. Is there a "human nature" you were born with? A purpose you are supposed to fulfil?', o:[
    {t:'No. We exist first, and then we define ourselves.', s:{existentialism:2, libertarianism:1}, r:['Exactement. You are nothing yet, and that is your whole freedom.']},
    {t:'Yes. God made us for a purpose.', s:{theism:2, deontology:1}, r:['Then your life is a letter already addressed. Mine is a blank envelope. We both still have to post it.']},
    {t:'Yes, but it\'s biology: genes, instincts, evolution.', s:{naturalism:2, pragmatism:1}, r:['The body has its habits, yes. But you can still choose what to do with an instinct.']},
    {t:'Purpose? We\'re accidents with homework.', s:{absurdism:2, nihilism:1}, r:['*He laughs into his scarf.* Accidents with homework. I am stealing this.']},
  ]},
  remy_coffee:{by:'remy', q:'Ah. You chose to bring me this. Why? Truly?', o:[
    {t:'Because I decided to. That\'s reason enough.', s:{existentialism:2, absurdism:1}, r:['A free act! Sartre would weep. I am weeping. It\'s the steam.']},
    {t:'Because it\'s kind, and kindness is a duty.', s:{deontology:2, theism:1}, r:['Duty. So serious. And yet the coffee is warm. Merci.']},
    {t:'It made you happier and cost me little. Good deal.', s:{utilitarianism:2, pragmatism:1}, r:['An economist of kindness. Very well. My happiness has increased by one coffee.']},
    {t:'Honestly? I\'m collecting conversations for a lighthouse.', s:{pragmatism:2, cynicism:1}, r:['Ha! Honest bad faith. That\'s rare. I approve.']},
  ]},
  hume_god:{by:'hume', q:'Off the record. Does God exist? Give me your verdict.', o:[
    {t:'Yes.', s:{theism:2, stoicism:1}, r:['A firm yes. Noted in pencil. I note everything in pencil.']},
    {t:'No.', s:{naturalism:2, nihilism:1}, r:['A firm no. Also in pencil. Pencils are the only honest tool.']},
    {t:'Insufficient evidence either way. Case stays open.', s:{skepticism:2, pragmatism:1}, r:['Now THAT is a detective\'s answer. Want a hat?']},
    {t:'Wrong question. Everything is divine, or nothing is.', s:{pantheism:2, buddhism:1}, r:['That\'s... hm. You\'ve changed the question on me. Clever suspect.']},
  ]},
  hume_sure:{by:'hume', q:'So the dog had the acorn. But did the dog TAKE it? How sure are you?', o:[
    {t:'Certain. The pawprints don\'t lie.', s:{naturalism:2, deontology:1}, r:['Evidence-led. Good. Though I once met a very dishonest pawprint.']},
    {t:'Sure enough to close the case. Good enough is good enough.', s:{pragmatism:2, utilitarianism:1}, r:['Case closed! Paperwork filed! Lunch acquired!']},
    {t:'Not sure at all. Maybe someone framed him.', s:{skepticism:2, cynicism:1}, r:['Now you\'re thinking like me. Which is to say: badly sleeping.']},
    {t:'Who cares? He\'s a dog. Forgive him.', s:{buddhism:2, theism:1}, r:['Mercy over certainty. That\'s not detective work. But it\'s not bad work.']},
  ]},

  // ---------- Lighthouse (final three) ----------
  keeper_good:{by:'keeper', q:'First. What makes a life good?', o:[
    {t:'Joy, with people I love.', s:{hedonism:2, collectivism:1}},
    {t:'Doing what\'s right, even when it costs me.', s:{deontology:2, stoicism:1}},
    {t:'Becoming who I chose to be.', s:{existentialism:2, libertarianism:1}},
    {t:'Inner peace, and letting go.', s:{buddhism:2, stoicism:1}},
    {t:'Making the world measurably better.', s:{utilitarianism:2, pragmatism:1}},
    {t:'Living close to God.', s:{theism:2, pantheism:1}},
  ]},
  keeper_end:{by:'keeper', q:'Second. What happens when the light goes out?', o:[
    {t:'Nothing. And that\'s okay.', s:{naturalism:2, stoicism:1}},
    {t:'Nothing. And that\'s terrible.', s:{nihilism:2, absurdism:1}},
    {t:'I\'ll meet my Maker.', s:{theism:2, deontology:1}},
    {t:'I return to the whole.', s:{pantheism:2, buddhism:1}},
    {t:'Nobody knows, and I\'m fine not knowing.', s:{skepticism:2, pragmatism:1}},
    {t:'I\'ll be too busy living to worry.', s:{absurdism:2, hedonism:1}},
  ]},
  keeper_world:{by:'keeper', q:'Last. If you could change one thing about the world?', o:[
    {t:'Fewer rules. More freedom.', s:{libertarianism:2, cynicism:1}},
    {t:'Share everything more fairly.', s:{collectivism:2, utilitarianism:1}},
    {t:'Less stuff. Less pretending.', s:{cynicism:2, buddhism:1}},
    {t:'More curiosity, more evidence.', s:{naturalism:2, skepticism:1}},
    {t:'Fix what\'s broken, one thing at a time.', s:{pragmatism:2, collectivism:1}},
    {t:'Nothing. The world is what it is.', s:{stoicism:2, nihilism:1}},
  ]},
};

const ITEMS = {
  wrench:   {name:'Gus\'s Wrench', desc:'Heavy, slightly rusty. Labelled "PROPERTY OF GUS. TRUE BECAUSE IT WORKS."'},
  book:     {name:'Prayer Book', desc:'Brother Anselm\'s. The margins are full of tiny notes and one doodle of a cat.'},
  croissant:{name:'Croissant', desc:'Warm, flaky, seventy-two layers of butter. Smells like a good decision.'},
  acorn:    {name:'Special Acorn', desc:'Someday it will be the oldest tree in the world. Currently slightly damp.'},
  petition: {name:'Petition', desc:'"For a shorter working day." Three signatures and one drawing of a fist.'},
  signed:   {name:'Signed Petition', desc:'Now signed by Mr. Penny, in very reluctant cursive.'},
  coffee:   {name:'Black Coffee', desc:'Black as the void. Slightly warmer than the void.'},
  leaf:     {name:'Golden Leaf', desc:'A gift from Sylva. "Not valuable. Precious. Those are different."'},
};

const QUESTS = {
  gate:     {title:'The Rusty Gate', hint:g => g.has('wrench') ? 'Bring the wrench back to Gus in the square.' : 'Gus needs his wrench back. Dr. Quark borrowed it (laboratory, square).'},
  book:     {title:'The Lost Prayer Book', hint:g => g.has('book') ? 'Return the prayer book to Brother Anselm (temple, north).' : 'Brother Anselm thinks he left his book at the library (south of the square).'},
  acorn:    {title:'The Case of the Missing Acorn', hint:g => g.flag('acornBack') ? 'Tell Inspector Hume (café) the case is solved.' : g.has('acorn') ? 'Return the acorn to Sylva (forest, west).' : 'Somebody took Sylva\'s acorn. A muddy pawprint was found nearby...'},
  petition: {title:'Solidarity, Please', hint:g => g.has('signed') ? 'Bring the signed petition back to Rosa (market).' : 'Get Mr. Penny (market) to sign Rosa\'s petition.'},
  coffee:   {title:'Black Like the Void', hint:g => g.has('coffee') ? 'Bring the coffee to Rémy (café).' : 'Rémy wants a black coffee. The barista refuses to serve him.'},
  cave:     {title:'The Dare', hint:g => g.flag('caveSeen') ? 'Tell Raven (forest) what you saw in the cave.' : 'Raven dares you to go into the cave in the forest\'s north-west.'},
  mirror:   {title:'Who Are You?', hint:g => !g.flag('gateFixed') ? 'The lighthouse gate (top-right of the square) is rusted shut.' : g.thoughts() < MIN_THOUGHTS ? `Talk with people. The mirror needs ${MIN_THOUGHTS} thoughts (you have ${g.thoughts()}).` : 'Climb the lighthouse and speak with the Keeper.'},
};

const EGGS = {
  cogito:'A dog who thinks', name:'A meaningful name', lantern:'An honest person?', sign:'You are here', fountain:'Reflection',
  schrodinger:'The box', vat:'Brain in a jar', chalk:'The chalkboard', bell:'One hand clapping',
  duck:'Duck or rabbit?', owl:'The owl at dusk', zeno:'Zeno\'s path', shadows:'The cave wall',
  theseus:'The ship', books:'The strange books', stamp:'Categorically approved', boulder:'The boulder itself',
};

const MIN_THOUGHTS = 12;

/* Names with a reaction at the start. */
const NAME_EGGS = {
  socrates:'You know that you know nothing. A promising start.',
  plato:'The real you is probably in a better world somewhere.',
  aristotle:'Everything in moderation, including this game.',
  nietzsche:'You stare into the game. The game stares back.',
  descartes:'You think, therefore you play.',
  kant:'Play this game only as you would want everyone to play it.',
  camus:'One must imagine you happy.',
  sartre:'You are condemned to choose a different name. Just kidding. Free choice.',
  diogenes:'You\'d prefer a barrel, but fine.',
  sisyphus:'That name is taken. He\'s busy.',
  god:'Bold.',
  claude:'A thoughtful choice.',
};

/* ---------- Characters & objects ----------
   kind: 'human' (uses look), or a special sprite name.  x,y in tiles.
   secret: the worldview this character secretly represents (revealed at the end).
*/
const NPCS = {
  // ===== Village Square =====
  rex:{zone:'square', x:14, y:10, kind:'dog', name:'Rex', blip:520,
    talk:g => {
      if (g.has('croissant') && !g.flag('acornFound')) return [
        '* Rex stares at your croissant. Then at you. Then at the croissant, with an intensity usually reserved for proofs.',
        '* You give Rex the croissant. He eats it in 0.4 seconds.', {take:'croissant'},
        'Woof! I eat, therefore I am... full.',
        '* Rex trots behind the bench and returns with something in his mouth. He drops it at your feet. It\'s an acorn. A very special-looking acorn.',
        {give:'acorn'}, {set:'acornFound'},
        g2 => g2.quest('acorn') ? [] : ['* Someone is probably missing this.'],
      ];
      const lines = [
        ['Woof! I bark, therefore I am.', {egg:'cogito'}],
        ['I sniff, therefore I smell. That one is less famous.'],
        ['Is the ball real? Is the stick real? Doesn\'t matter. THROW IT.'],
        ['Good dog? Bad dog? I am beyond good dog and bad dog.'],
        ['Woof woof. (Translation: the unexamined bone is not worth chewing.)'],
        ['* Rex wags his tail with total metaphysical confidence.'],
      ];
      return lines[g.counter('rex') % lines.length];
    }},

  mira:{zone:'square', x:3, y:10, kind:'human', name:'Mira', title:'the gardener', secret:'stoicism', blip:300,
    look:{skin:'#e3b48f', hair:'#d6d3cc', style:'bun', top:'#5d8d4c', bottom:'#6b4f3a', extras:['hat:#d8b25a','apron:#c9b48a']},
    hello:['Oh, hello. Mind the marigolds; they\'re having a hard week.', 'I\'m Mira. I tend this garden. The rain tends it too, whether I like it or not.'],
    hi:['Back again? The marigolds remember you.', 'Hello, {name}. Sit if you like. The bench doesn\'t mind.'],
    topics:[
      {label:'What are you growing?', script:['Marigolds, tomatoes, and patience. Mostly patience.', 'The watering is up to me. The soil, the care. Whether it hails tomorrow is not.', 'Learning which is which took me about sixty years. Saves a great deal of shouting at clouds.']},
      {label:'How do you stay so calm?', script:['Practice. And a simple rule: worry only about what you can change.'], ask:'mira_storm'},
      {label:'What if someone is rude to you?', script:['Ah. People. The most unpredictable weather of all.'], ask:'mira_insult'},
      {label:'Who is the man in the barrel?', script:['Dio. He lives in that barrel by choice and tells everyone the truth by force.', 'We disagree about almost everything. We share tea on Sundays.']},
    ]},

  gus:{zone:'square', x:17, y:3, kind:'human', name:'Gus', title:'the mechanic', secret:'pragmatism', blip:200,
    look:{skin:'#c98e62', hair:'#4a3426', style:'short', top:'#3f63a8', bottom:'#3f63a8', extras:['cap:#e07b39','beard','belt:#2b2b2b']},
    hello:['Name\'s Gus. I fix things. Theories? Mostly no. Gates? Mostly yes.'],
    hi:['Gus here. Still fixing. Still not theorising.', 'Hey, {name}. Need something tightened? Bolts, arguments?'],
    topics:[
      {label:'What\'s wrong with the gate?', when:g => !g.flag('gateFixed') && !g.has('wrench'), fresh:g => g.thoughts() >= MIN_THOUGHTS, script:[
          'Rusted hinge. The path behind it goes up to the old lighthouse.',
          'They say the mirror up there shows you who you really are. Never needed it. I know who I am. I\'m Gus.',
          'I\'d fix the gate, but my good wrench walked off. Doc Quark borrowed it for an "experiment". The lab is the building with the door, top-left.',
          {quest:'gate'},
        ]},
      {label:'Here\'s your wrench!', when:g => !g.flag('gateFixed') && g.has('wrench'), script:[
          'Is that my wrench? Hand it over.', {take:'wrench'},
          '* Clank. Clonk. Skreeeeek.',
          'There. Does it open? Then it\'s fixed. That\'s all "fixed" ever means.',
          {set:'gateFixed'}, {done:'gate'},
          '* The lighthouse gate is open. A path winds up the hill.',
        ]},
      {label:'What is truth, Gus?', script:['Truth? If an idea works when you use it, I call it true. If it doesn\'t, it\'s decoration.'], ask:'gus_map'},
      {label:'Fixed anything weird lately?', script:['A philosopher\'s argument. Perfectly valid, went absolutely nowhere. Like a car on blocks.', 'Also a stopped clock. Right twice a day. Customer was thrilled. Who am I to argue?']},
      {label:'Do you believe in anything?', script:['Hinges. Grease. Lunch.', 'Here\'s one I chew on, though.'], ask:'gus_belief'},
    ]},

  dio:{zone:'square', x:20, y:10, kind:'barrel', name:'Dio', title:'the man in the barrel', secret:'cynicism', blip:160,
    look:{skin:'#d4a27a', hair:'#9c9690'},
    hello:['Stand a little out of my sunlight.', '* You step aside.', '...Thank you. I\'m Dio. I live in this barrel. Rent-free, honest view.'],
    hi:['You\'re in my sunlight again.', 'Back for more truth? It\'s free. That\'s why nobody wants it.'],
    topics:[
      {label:'Why a barrel?', script:['Why a house? Why a sofa? Why seventeen spoons?', 'That dog over there needs no spoons. He is the wisest creature in town, and he licks fountains.']},
      {label:'What\'s the lantern for?', script:['I\'m looking for an honest person. Been looking for years. Hold still.', '* Dio holds the lantern up to your face. He squints.', 'Hmm. Inconclusive.', {egg:'lantern'}]},
      {label:'Would you like a house?', script:['A house? Ha. Let me ask YOU.'], ask:'dio_house'},
      {label:'What do you think of rules?', script:['Most rules are fences around nothing.'], ask:'dio_rules'},
      {label:'Offer him the croissant', when:g => g.has('croissant') && !g.flag('dioAte'), script:['A croissant? Flaky. Buttery. Unnecessary.', '* He eats exactly half of it. Precisely half.', 'There. I needed half. Give the rest to someone who needs it more. The dog, probably.', {set:'dioAte'}]},
    ]},

  sign:{zone:'square', x:8, y:5, kind:'sign', name:'Signpost', solid:true,
    talk:['* YOU ARE HERE.', '* Underneath, someone has scratched: "but who are you?"', '* Arrows: TEMPLE (north) · MARKET (east) · FOREST (west) · CAFÉ & LIBRARY (south) · LIGHTHOUSE (north-east, gate)', {egg:'sign'}]},
  fountain:{zone:'square', x:11, y:7, kind:'none', name:'Fountain',
    talk:g => g.flag('finished')
      ? ['* You look into the water. The face looking back is clear now.', `* It looks like you. Mostly ${g.topWorldview()}, with a few surprises.`]
      : ['* You look into the water. A face looks back, but it\'s blurry, like it hasn\'t made up its mind.', '* Somebody has thrown in a coin and a note: "I wished to know myself. Still waiting."', {egg:'fountain'}]},
  gate:{zone:'square', x:18, y:1, kind:'none', name:'Gate',
    talk:g => g.flag('gateFixed') ? ['* The gate stands open.'] : ['* A rusty iron gate. Behind it, a path climbs toward a dark lighthouse.', '* The hinge is rusted solid. Maybe someone handy could fix it.']},

  // ===== Laboratory =====
  quark:{zone:'lab', x:15, y:5, kind:'human', name:'Dr. Ada Quark', title:'the scientist', secret:'naturalism', blip:440,
    look:{skin:'#f0c8a0', hair:'#3b2a20', style:'bun', top:'#5aa0c8', bottom:'#4b4b5a', extras:['coat:#f4f4f4','glasses']},
    hello:['Ah! A visitor! Don\'t touch anything labelled "probably fine".', 'Dr. Ada Quark. I study how everything works, from atoms upward.', 'So far: no magic, lots of physics. Still astonishing, though.'],
    hi:['Back for more science? Excellent. Goggles optional, curiosity mandatory.', 'Ah, {name}! I\'ve updated my hypothesis about you. It\'s still a hypothesis.'],
    topics:[
      {label:'What are you researching?', script:['Whether the universe needs anything outside itself to explain it.', 'Every time we thought something needed a miracle (lightning, disease, rainbows), it turned out to have a cause we could test.', 'That doesn\'t prove there\'s nothing more. It just means I bet on the boring explanation. It\'s usually right.']},
      {label:'Why does anything exist?', script:['The big one! Let me get my clipboard.'], ask:'quark_origin'},
      {label:'Can I borrow Gus\'s wrench?', when:g => g.quest('gate') && !g.has('wrench') && !g.flag('gateFixed'),
        script:['Gus\'s wrench? I was using it to... measure the wrench constant. It\'s not a real constant.', 'Fine. Help me with one experiment and it\'s yours.', {ask:'quark_coin'}, 'Here you go. Tell Gus it was used for SCIENCE.', {give:'wrench'}]},
      {label:'If we\'re just atoms, does anything matter?', script:['Ooh. Philosophy. My favourite thing to pretend I don\'t do.'], ask:'quark_love'},
    ]},
  catbox:{zone:'lab', x:20, y:5, kind:'box', name:'A box', solid:true,
    talk:g => g.counter('box') % 2 === 0
      ? ['* A sealed box. Something inside purrs. Or doesn\'t.', '* You decide not to collapse anything today.', {egg:'schrodinger'}]
      : ['* The box is silent now. Or purring. It is both, until you stop wondering.']},
  vat:{zone:'lab', x:19, y:3, kind:'jar', name:'Jar',
    talk:['* A brain floats in a jar, labelled "DO NOT TELL IT".', '* It seems to be dreaming about a little town with a fountain and a very confident dog.', '* ...You decide not to think about this too hard.', {egg:'vat'}]},
  chalk:{zone:'lab', x:3, y:1, kind:'none', name:'Chalkboard',
    talk:['* The chalkboard says: E = mc².', '* Underneath, in different handwriting: "ok but WHY".', '* Under that, in Dr. Quark\'s handwriting: "because."', {egg:'chalk'}]},

  // ===== Temple =====
  anselm:{zone:'temple', x:6, y:2, kind:'human', name:'Brother Anselm', title:'the monk', secret:'theism', blip:260,
    look:{skin:'#e7b48e', hair:'#7a5a3a', style:'tonsure', top:'#6e4b2e', bottom:'#6e4b2e', extras:['robe','belt:#d8c08a']},
    hello:['Peace be with you, traveller! I\'m Brother Anselm.', 'Mind the step. It\'s older than the town, and twice as grumpy.'],
    hi:['Welcome back, {name}. The candles are glad to see you. I am too.', 'Ah, {name}! Come in, come in.'],
    topics:[
      {label:'What is this place?', script:['A chapel. People come here to talk to God.', 'Some come to complain to God. He gets a lot of complaints. I think He prefers them to silence.']},
      {label:'What do you believe?', script:['That the world was made by Someone who loves it. Including the mosquitoes, somehow.'], ask:'anselm_stars'},
      {label:'Have you lost something?', when:g => !g.quest('book'), script:['How did you know? My prayer book! I think I left it at the library, south of the square.', 'Would you fetch it? I\'d go myself, but the librarian shushes me in a way that feels theological.', {quest:'book'}]},
      {label:'Return the prayer book', when:g => g.has('book'), script:['My book! My notes are all still in the margins. And the cat doodle! Thank you.', {take:'book'}, {done:'book'}, 'You have earned a hard question, friend. Hard questions are a kind of gift.', {ask:'anselm_evil'}]},
      {label:'Do you ever doubt?', script:['Every Tuesday. Doubt is just faith doing push-ups.', 'If I\'d never doubted, I\'d never really have chosen to believe.']},
    ]},
  kiri:{zone:'temple', x:17, y:8, kind:'human', name:'Kiri', title:'the meditator', secret:'buddhism', blip:340, sitting:true,
    look:{skin:'#c99a6e', hair:'#c99a6e', style:'bald', top:'#e39b2d', bottom:'#c9711b', extras:['robe']},
    hello:['...', '...Hello.', 'I am Kiri. I was sitting. Now I am sitting and talking. Soon, only sitting again.'],
    hi:['...Hello again, {name}.', 'The sand has been raked and unraked twice since you left. Welcome.'],
    topics:[
      {label:'What are you doing?', script:['Breathing in. Breathing out. Watching thoughts drift by like clouds. Not chasing them.', '* A thought about lunch drifts past. Kiri lets it go. The thought looks disappointed.']},
      {label:'Who am I?', script:['A good question. Let me give it back to you.'], ask:'kiri_self'},
      {label:'How do I find peace?', script:['Not by finding. More by... putting down.'], ask:'kiri_peace'},
      {label:'Why rake the sand?', script:['We rake it into patterns. The wind undoes them. We rake again.', 'Everything is like this. Mountains. Empires. You. This sentence.']},
    ]},
  bell:{zone:'temple', x:21, y:2, kind:'bell', name:'Bell', solid:true,
    talk:['* You ring the bell. BONNNNG.', '* Somewhere, someone reaches enlightenment. Or a pigeon falls off a roof. Hard to say which.', '* Either way, it was louder than one hand clapping.', {egg:'bell'}]},

  // ===== Forest =====
  sylva:{zone:'forest', x:14, y:11, kind:'spirit', name:'Sylva', title:'the forest spirit', secret:'pantheism', blip:620,
    hello:['Rustle, rustle! A walker!', 'I am Sylva. I am the forest. Also the moss. Also, a little bit, you.'],
    hi:['The trees whispered you were coming. They whisper everything. Terrible gossips.', 'Rustle! Welcome back, {name}.'],
    topics:[
      {label:'Are you a god?', script:['Not "a" god. If anything is divine, it isn\'t sitting outside the world, building it like a clock.', 'It IS the world. Bark, rain, beetles, stars, you.', 'There is no outside. That\'s the secret. Shh. The trees know.']},
      {label:'What is a forest for?', script:['Oh! Nobody ever asks me that. Let me ask you first.'], ask:'sylva_forest'},
      {label:'You seem sad.', when:g => !g.quest('acorn') && !g.flag('acornBack'), script:['My acorn is gone! My one, special acorn. Someday it will be the oldest tree in the world, if someone gives it back.', 'I told the detective in the café. He said he "doubts it exists". It EXISTS.', {quest:'acorn'}]},
      {label:'Give back the acorn', when:g => g.has('acorn'), script:['MY ACORN!!! It smells of... croissant? And dog.', {take:'acorn'}, {set:'acornBack'}, 'Thank you, thank you. Here, a leaf. It\'s not valuable. Nothing is valuable. Everything is precious. Those are different things.', {give:'leaf'}, {ask:'sylva_after'}]},
    ]},
  syd:{zone:'forest', x:18, y:4, kind:'human', name:'Syd', title:'the boulder guy', secret:'absurdism', blip:380,
    look:{skin:'#d79f72', hair:'#2c1d14', style:'short', top:'#e6e6e6', bottom:'#4a5b8c', extras:['headband:#d64545']},
    hello:['Hnnnngh! Oh, hi! Syd. I push this boulder up the hill. Then it rolls down. Then I push it up again.', 'Forever. Long story. I annoyed some gods.'],
    hi:['Hey {name}! I got it up three metres today! It rolled down four!', 'Back! Wanna watch? It\'s kind of my whole thing.'],
    topics:[
      {label:'Doesn\'t that drive you mad?', script:['It did. For the first thousand years.', 'Then I noticed: the hill doesn\'t care, the boulder doesn\'t care, the universe never answers. And yet here I am, pushing.', 'That\'s kind of hilarious, right? One must imagine me happy. I\'ve saved you the effort. I am.']},
      {label:'What\'s the point?', script:['Ohh, the big one.'], ask:'syd_meaning'},
      {label:'Want some help?', ask:'syd_help'},
      {label:'Any tips?', script:['Lift with your legs. Don\'t think about the top. The top is a scam.']},
    ]},
  boulder:{zone:'forest', x:18, y:3, kind:'boulder', name:'Boulder', solid:true,
    talk:['* A large, round, extremely patient boulder.', '* You push it. It does not move. You feel you understand Syd a little better.', {egg:'boulder'}]},
  raven:{zone:'forest', x:13, y:3, kind:'human', name:'Raven', title:'the goth kid', secret:'nihilism', blip:240,
    look:{skin:'#efd9d0', hair:'#6e3a98', style:'long', top:'#1e1b24', bottom:'#1e1b24', extras:['boots']},
    hello:['Ugh. A person. Hi, I guess.', 'I\'m Raven. I come to the forest because nothing matters, and the forest is where nothing matters the most quietly.'],
    hi:['Oh. It\'s you again. Cool. Whatever. (It\'s actually cool.)', 'Hey {name}. Still nothing matters. Just so you know.'],
    topics:[
      {label:'Does nothing really matter?', script:['Like, cosmically? No. In five billion years the sun eats the Earth. Your homework? Eaten. Your crush? Eaten.', '...Anyway, do you like my boots? They\'re new.', '...Not that it matters.']},
      {label:'So what\'s left?', ask:'raven_left'},
      {label:'What\'s in the cave?', when:g => !g.quest('cave'), script:['The cave up there, top-left? People say if you go in, you see "the truth".', 'Bet you won\'t go in. I didn\'t. Not because I\'m scared. Because truth is overrated.', {quest:'cave'}]},
      {label:'I went into the cave.', when:g => g.flag('caveSeen') && g.quest('cave') === 'active', script:['Wait. Seriously?', {ask:'raven_cave'}, {done:'cave'}]},
    ]},
  duck:{zone:'forest', x:9, y:11, kind:'duck', name:'Duck?',
    talk:['* Quack.', '* ...Or was that a rabbit? From this angle, definitely a rabbit. From that angle, definitely a duck.', '* The animal itself seems unbothered by the debate.', {egg:'duck'}]},
  owl:{zone:'forest', x:21, y:10, kind:'owl', name:'Owl',
    talk:['* Hoo.', '* Hoo?', '* The owl only flies at dusk. It seems to be waiting until you\'ve finished understanding everything.', {egg:'owl'}]},
  zeno:{zone:'forest', x:1, y:7, kind:'sign', name:'Sign', solid:true,
    talk:['* "To reach the edge of the forest, you must first walk half the way. Then half of what is left. Then half of that..."', '* You do the maths. You will never arrive.', '* You decide to stay put. It\'s faster.', {egg:'zeno'}]},

  // ===== Cave =====
  pell:{zone:'cave', x:11, y:3, kind:'human', name:'Pell', title:'the cave watcher', blip:280, sitting:true, facing:'up',
    look:{skin:'#d9b08c', hair:'#7b6a55', style:'long', top:'#8a7a63', bottom:'#6d604d', extras:['beard']},
    hello:['Shh! The show\'s on.', 'Look: a rabbit. A bird. A teapot. Isn\'t the world beautiful?', 'I\'m Pell. I\'ve watched this wall since I was little. Best show there is. Only show there is.'],
    hi:['Shh. The teapot is coming back.'],
    topics:[
      {label:'Those are just shadows.', script:['Just shadows? They\'re the most real things I\'ve ever seen. They\'re the ONLY things I\'ve ever seen.']},
      {label:'Tell him about the outside', ask:'pell_sun'},
    ]},
  shadows:{zone:'cave', x:7, y:1, kind:'none', name:'Wall',
    talk:g => ['* Shadows flicker on the wall: a rabbit, a bird, a teapot.', '* Behind you, the fire crackles. Behind the fire, light from outside.', '* You realise the shadows are made by the fire... and the fire is not the sun.', {egg:'shadows'}, {set:'caveSeen'}]},

  // ===== Market =====
  bella:{zone:'market', x:4, y:3, kind:'human', name:'Bella', title:'the baker', secret:'hedonism', blip:500,
    look:{skin:'#e9b08e', hair:'#b5562a', style:'short', top:'#e88aa0', bottom:'#6b4f6b', extras:['chef','apron:#fafafa']},
    hello:['Welcome, welcome! Smell that? That\'s the smell of being alive.', 'I\'m Bella. I bake. Bread, buns, little moments of happiness with jam inside.'],
    hi:['{name}! You\'re back! Come smell the cinnamon rolls. Smelling is free.', 'Hello, sweetie! Hungry? Everyone\'s a little hungry.'],
    topics:[
      {label:'What\'s the secret to a good life?', script:['Pleasure! But the clever kind.', 'Not ten cakes. One good cake, with friends, no worries, no debts. Simple pleasures and a quiet mind.', 'Ten cakes leads to a stomach-ache, regret, and a long talk with the dentist.']},
      {label:'A perfect afternoon?', ask:'bella_afternoon'},
      {label:'Something smells amazing...', when:g => !g.answered('bella_croissant'), ask:'bella_croissant', after:[{give:'croissant'}]},
      {label:'Another croissant?', when:g => g.answered('bella_croissant') && !g.has('croissant') && !g.flag('acornFound'), script:['Lost it already? Ha! Here, one more. Bakers never run out of second chances.', {give:'croissant'}]},
    ]},
  penny:{zone:'market', x:19, y:3, kind:'human', name:'Mr. Penny', title:'the merchant', secret:'libertarianism', blip:330,
    look:{skin:'#f2cfae', hair:'#2a2a2a', style:'short', top:'#6b3fa0', bottom:'#2a2a2a', extras:['tophat','mustache','monocle']},
    hello:['Greetings, customer! Mr. Penny, free trader.', 'Everything here is for sale except my opinions. Those are free, and worth every penny.'],
    hi:['Ah, my favourite customer! You\'re my only customer today, but still.', 'Welcome back, {name}! Freedom is in stock.'],
    topics:[
      {label:'What do you believe in?', script:['Freedom! Your life is yours, your work is yours, your choices are yours.', 'Nobody should take what\'s yours. Not a thief, not a king, not a committee with clipboards.', '* He glances at the union stall. ...Ahem.']},
      {label:'What about taxes?', ask:'penny_tax'},
      {label:'Would you sign Rosa\'s petition?', when:g => g.has('petition'), script:['* Mr. Penny reads the petition. His monocle drops out.', {ask:'penny_petition'}, '* He signs, in tiny, very reluctant cursive.', 'Freedom includes the freedom to be outvoted. Grudgingly.', {take:'petition'}, {give:'signed'}]},
    ]},
  rosa:{zone:'market', x:4, y:12, kind:'human', name:'Rosa', title:'the organiser', secret:'collectivism', blip:360,
    look:{skin:'#b57a52', hair:'#1d1410', style:'long', top:'#3d6fa3', bottom:'#3a3a3a', extras:['bandana:#c93a3a','clipboard']},
    hello:['Comrade! ...Sorry, habit. Hi! I\'m Rosa.', 'I organise the workers of this market. All four of us.'],
    hi:['{name}! Solidarity! ...Hi.', 'Back again! Want to join the union? We have biscuits.'],
    topics:[
      {label:'What are you fighting for?', script:['Fair pay. Shorter hours. Bread for everyone, not just for whoever owns the oven.', 'Alone, a worker is easy to ignore. Together we\'re a choir. A loud, slightly off-key choir.']},
      {label:'Group or individual?', ask:'rosa_group'},
      {label:'Can I help?', when:g => !g.quest('petition'), script:['Yes! Get Mr. Penny to sign my petition for a shorter working day.', 'If HE signs, everyone signs. He\'s our biggest... let\'s say "obstacle".', {give:'petition'}, {quest:'petition'}]},
      {label:'Hand over the signed petition', when:g => g.has('signed'), script:['He SIGNED?! In cursive?!', {take:'signed'}, {done:'petition'}, '* Rosa high-fives you so hard it echoes across the market.', 'You did it. That\'s what solidarity looks like. One stubborn person at a time.']},
    ]},
  tally:{zone:'market', x:14, y:4, kind:'human', name:'Mr. Tally', title:'the accountant', secret:'utilitarianism', blip:420,
    look:{skin:'#f0c49c', hair:'#8a8a8a', style:'short', top:'#7c8590', bottom:'#4f5560', extras:['visor:#4caf7a','glasses','calc']},
    hello:['Hello. Tally. I count things. Mostly happiness.', 'Current town total: 4,812 units. You just added three. Thank you.'],
    hi:['Ah, {name}. Your happiness score is up two units since last time. Well done.', 'Hello again. I\'m recounting everything. It\'s going well. It\'s going exactly as well as it is.'],
    topics:[
      {label:'You count happiness?', script:['Of course. Every action has consequences. Add up the joy, subtract the suffering. The bigger number wins.', 'The tricky part is the units. Is one hug worth two croissants? I\'m still working out the exchange rate.']},
      {label:'What\'s with the toy train?', script:['Ah, my model railway. It\'s for thought experiments. Very serious. Very small.'], ask:'trolley'},
      {label:'Is lying ever okay?', ask:'tally_lie'},
    ]},
  trolley:{zone:'market', x:11, y:4, kind:'trolley', name:'Toy railway',
    talk:['* A tiny model railway. Five little wooden people stand on one track. One stands on the other.', '* There is a lever. There is always a lever.', '* (Mr. Tally would love to discuss this.)']},
  ought:{zone:'market', x:19, y:12, kind:'human', name:'Clerk Ought', title:'the clerk', secret:'deontology', blip:300,
    look:{skin:'#e8c0a0', hair:'#4a4a4a', style:'bun', top:'#2b3a66', bottom:'#2b3a66', extras:['glasses','stamp']},
    hello:['Next! Name? ...{name}. Very well.', 'I am Clerk Ought, Registry of Duties. Please take a number.', '* You take a number. It says "ALWAYS".'],
    hi:['Next! Oh. It\'s you. Please take a number anyway. Rules are rules.', 'Good day, {name}. Your paperwork is in order. For now.'],
    topics:[
      {label:'What is your job?', script:['To see that duties are done. Not because I enjoy rules. Because a rule you\'d want EVERYONE to follow is the only fair kind.', 'If everyone cut the queue, there would be no queue. Therefore: no queue-cutting. Ever. Not even for croissants.']},
      {label:'About promises...', ask:'ought_promise'},
      {label:'About people...', ask:'ought_tool'},
      {label:'Could you stamp something?', script:['* Clerk Ought stamps the back of your hand.', '* It reads: APPROVED (CATEGORICALLY).', {egg:'stamp'}]},
    ]},

  // ===== Café & Library =====
  bo:{zone:'cafe', x:2, y:2, kind:'human', name:'Bo', title:'the barista', blip:450,
    look:{skin:'#8d5a3b', hair:'#2a1a10', style:'puff', top:'#f1f1f1', bottom:'#3b3b3b', extras:['apron:#2f7d5b']},
    talk:g => {
      if (g.quest('coffee') === 'active' && !g.has('coffee') && !g.flag('coffeeGiven')) return ['For Rémy? Fine. Tell him to stop staring at the sugar like it betrayed him.', {give:'coffee'}];
      const lines = [
        ['Welcome! Today we have: Coffee, Decaf, and Coffee That Does Not Exist. That last one\'s cheaper.'],
        ['The man in black orders a coffee and then looks at it for an hour. Says it "confronts him". It\'s a flat white.'],
        ['Tea? Sure. Tea is just coffee that has made peace with itself.'],
      ];
      return lines[g.counter('bo') % lines.length];
    }},
  remy:{zone:'cafe', x:3, y:3, kind:'human', name:'Rémy', title:'the café philosopher', secret:'existentialism', blip:230,
    look:{skin:'#ead2b8', hair:'#1a1a1a', style:'short', top:'#1d1d22', bottom:'#2b2b33', extras:['beret:#232323','cig']},
    hello:['*sigh* Another person, condemned to be free.', 'Rémy. I sit in this café and think about existence. And drink coffee. The coffee is the easy part.'],
    hi:['Ah. {name}. You exist again. Bravo.', '*sigh* Hello. I was just choosing to sit here. Again. Freely.'],
    topics:[
      {label:'"Condemned to be free"?', script:['You did not choose to exist. But now you are here, and every choice is yours. Even not choosing is a choice.', 'Terrifying, no? Delicious, no? Both.', '* He waves his cigarette. It\'s a chocolate cigarette. "I have freely chosen my dentist," he mutters.']},
      {label:'Is there a human nature?', ask:'remy_nature'},
      {label:'Can I get you anything?', when:g => !g.quest('coffee'), script:['A coffee. Black. Like the void.', 'The barista refuses to serve me. She says I "stare too much". I stare exactly the right amount.', {quest:'coffee'}]},
      {label:'Here\'s your coffee', when:g => g.has('coffee'), script:['* You hand Rémy the coffee. He stares into it. It stares back.', {take:'coffee'}, {set:'coffeeGiven'}, {done:'coffee'}, {ask:'remy_coffee'}]},
    ]},
  hume:{zone:'cafe', x:7, y:5, kind:'human', name:'Inspector Hume', title:'the detective', secret:'skepticism', blip:270,
    look:{skin:'#dba67e', hair:'#3b2a20', style:'short', top:'#c7c2b4', bottom:'#5e5340', extras:['coat:#b89a63','fedora:#6b4b2f','magnifier']},
    hello:['Inspector Hume. Private eye.', 'I don\'t trust anything I can\'t check. And I\'m suspicious of the things I can.'],
    hi:['{name}. You look the same as last time. Suspicious.', 'Still on the case. Every case, really. Reality is one long case.'],
    topics:[
      {label:'Working on any cases?', when:g => !g.flag('acornBack'), script:['The Case of the Missing Acorn. Reported by the forest spirit.', 'Clues: crumbs, and a muddy pawprint. A paw. Four legs. Possibly a table. I keep an open mind.', g => g.quest('acorn') ? [] : [{quest:'acorn'}]]},
      {label:'The acorn case is solved!', when:g => g.flag('acornBack') && g.quest('acorn') !== 'done', script:['Solved? Without me? I mean... with me. Spiritually.', {ask:'hume_sure'}, {done:'acorn'}]},
      {label:'Does God exist?', script:['* He lowers his voice.', 'Let\'s hear your verdict first. I\'ll tell you mine never.'], ask:'hume_god', again:['My verdict? I\'ve seen evidence pointing everywhere. The case stays open. It\'s been open for three thousand years.']},
      {label:'Can we know anything?', script:['I\'ve seen the sun rise every morning of my life. Does that prove it rises tomorrow? Nope. That\'s habit, not proof.', 'Still. I set an alarm.']},
    ]},
  page:{zone:'cafe', x:19, y:2, kind:'human', name:'Ms. Page', title:'the librarian', blip:400,
    look:{skin:'#f1c9a5', hair:'#a35d2e', style:'bun', top:'#9e4f5f', bottom:'#4a3a4a', extras:['glasses']},
    talk:g => {
      if (g.quest('book') === 'active' && !g.has('book') && !g.flag('bookFound')) return ['A prayer book? Hmm... in the returns cart.', 'Also returned: "The Meaning of Life". Overdue by forty years. Nobody\'s found it yet. The meaning, I mean.', {give:'book'}, {set:'bookFound'}];
      const lines = [['Shh.', '...That was me shushing the universe. It\'s very loud today.'], ['Everything here is fiction, except the non-fiction. And some of the non-fiction.'], ['Looking for a book on paradoxes? It\'s in the section you won\'t find it in.']];
      return lines[g.counter('page') % lines.length];
    }},
  ship:{zone:'cafe', x:17, y:9, kind:'ship', name:'Model ship',
    talk:['* A model ship. The label says: "THE SHIP OF THESEUS. Every plank has been replaced, one at a time."', '* Smaller print: "Is it still the same ship? Please discuss quietly."', '* Smaller still: "This label has also been replaced."', {egg:'theseus'}]},
  shelf:{zone:'cafe', x:16, y:4, kind:'none', name:'Bookshelf',
    talk:g => {
      const t = [
        '"Being and Nothingness". The second half is blank.',
        '"Thus Spoke Zarathustra". Someone has added a sticky note: "and spoke, and spoke".',
        '"The Complete Works of Socrates". All pages blank. He never wrote anything down.',
        '"Critique of Pure Reason". There is a sandwich pressed between pages 400 and 401.',
        '"How to Win Arguments". It contradicts itself on page 3.',
      ];
      return ['* You pull out a book: ' + t[g.counter('shelf') % t.length], {egg:'books'}];
    }},

  // ===== Lighthouse =====
  keeper:{zone:'lighthouse', x:8, y:4, kind:'human', name:'The Keeper', title:'the lighthouse keeper', blip:180,
    look:{skin:'#2a2a3a', hair:'#2d3b6b', style:'bald', top:'#2d3b6b', bottom:'#2d3b6b', extras:['hood','robe','lantern']},
    talk:g => {
      if (g.flag('ready')) return ['Go on. The mirror is waiting.'];
      if (g.thoughts() < MIN_THOUGHTS) return [
        g.flag('keeperMet') ? 'Back so soon?' : 'Ah. A visitor. I keep the light here. And the mirror.',
        {set:'keeperMet'},
        `The mirror is still foggy. It only shows people who have really talked with others. You carry ${g.thoughts()} thoughts. Come back with at least ${MIN_THOUGHTS}.`,
        'Ask people questions. Answer theirs. That is all philosophy ever was.',
      ];
      return [
        g.flag('keeperMet') ? 'You came back. And you carry so many conversations now.' : 'You came. And you talked with people. Most only talk AT them.',
        {set:'keeperMet'},
        'Before you look, three questions. Don\'t think too hard. The mirror can tell.',
        {ask:'keeper_good'}, {ask:'keeper_end'}, {ask:'keeper_world'},
        'Thank you. Now go. Look.', {set:'ready'},
      ];
    }},
  mirror:{zone:'lighthouse', x:11, y:2, kind:'none', name:'Mirror',
    talk:g => g.flag('ready') ? [{reveal:true}] : ['* A tall mirror, clouded with fog. You can\'t see yourself at all.', '* Maybe the keeper knows something.']},
};

/* ---------- Zones ----------
   24 x 15 tiles. Legend (see sprites.js for drawing):
   . floor/grass   , path   _ sand   f flowers   g tall grass   R rug   ^ slope
   # wall  T tree  ~ water  F fountain  B bookshelf  t table  c counter  b bench
   S stall awning  L lab bench  A altar  P pillar  C candles  r rock  x plant
   H hedge  G gate  D door  O dark exit  K chalkboard  W cave wall  E fire
   l log  w window  M mirror
*/
const ZONES = {
  square:{name:'Village Square', music:0, map:[
    'TTTTTTTTTTT,,TTTTT,,TTTT',
    'T######TTTf,,fTTTTGGTTTT',
    'T######...f,,f....,,...T',
    'T###D##....,,.....,,...T',
    'T...,,,,,,,,,,,,,,,,...T',
    'T.f.......,,,,......f..T',
    ',,,,,,....FFFF..,,,,,,,,',
    ',,,,,,,,,,FFFF,,,,,,,,,,',
    ',,,,,,....FFFF..,,,,,,,,',
    'T.f.......,,,,.........T',
    'T....b....,,,,....b....T',
    'Tx........,,,,........xT',
    'T..f......,,,,.....f...T',
    'TTTTTTTTTT,,,,TTTTTTTTTT',
    'TTTTTTTTTT,,,,TTTTTTTTTT',
  ], exits:[
    {x:11, y:0, w:2, h:1, to:'temple', at:[5,13]},
    {x:18, y:0, w:2, h:1, to:'lighthouse', at:[11,13]},
    {x:0, y:6, w:1, h:3, to:'forest', at:[22,7]},
    {x:23, y:6, w:1, h:3, to:'market', at:[1,7]},
    {x:10, y:14, w:4, h:1, to:'cafe', at:[11,1]},
    {x:4, y:3, w:1, h:1, to:'lab', at:[11,13]},
  ]},
  lab:{name:'Laboratory', indoor:true, map:[
    '########################',
    '##KKKK######KKK#########',
    '#......................#',
    '#.LLLL....LLLL....LLL..#',
    '#......................#',
    '#......................#',
    '#.LLLL....LLLL.........#',
    '#......................#',
    '#x.....................#',
    '#......................#',
    '#.LLL...........ttt....#',
    '#......................#',
    '#......................#',
    '#x.........,,.........x#',
    '###########DD###########',
  ], exits:[{x:11, y:14, w:2, h:1, to:'square', at:[4,4]}]},
  temple:{name:'Temple & Zen Garden', indoor:true, map:[
    '########################',
    '#C..AAAA..C#___________#',
    '#..........#__r_____r__#',
    '#.P.RRRR.P.#___________#',
    '#...RRRR...#____~~~____#',
    '#.P.RRRR.P..____~~~____#',
    '#...RRRR....___________#',
    '#.P.RRRR.P.#_r_______x_#',
    '#...RRRR...#___________#',
    '#bb.RRRR.bb#___________#',
    '#...RRRR...#__x____r___#',
    '#bb.RRRR.bb#___________#',
    '#...RRRR...#___________#',
    '#x..RRRR..x#x_________x#',
    '####RRRR################',
  ], exits:[{x:4, y:14, w:4, h:1, to:'square', at:[11,2]}]},
  forest:{name:'Whispering Forest', map:[
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TTOTTTTTTTTTTTTTr^^rTTTT',
    'TT,TTTT.gg....TTr^^rTTTT',
    'TT,TT......ll...T^^..TTT',
    'TT,..........g...^^...TT',
    'TT,...................TT',
    'T,,..g.........g......,,',
    'T,,,,,,,,,,,,,,,,,,,,,,,',
    'T,,.....g.........g...,,',
    'TT...........,.........T',
    'TT...~~~~...ffff.....TTT',
    'TT..~~~~~...ffff....TTTT',
    'TT...~~~....ffff...TTTTT',
    'TTT.......g.......TTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ], exits:[
    {x:23, y:6, w:1, h:3, to:'square', at:[1,7]},
    {x:2, y:1, w:1, h:1, to:'cave', at:[11,13]},
  ]},
  cave:{name:'The Cave', dark:true, indoor:true, map:[
    '########################',
    '####WWWWWWWWWWWWWWWW####',
    '###..................###',
    '##....................##',
    '##....................##',
    '##....................##',
    '##.........E..........##',
    '##....................##',
    '##.r................r.##',
    '###..................###',
    '####................####',
    '#####..............#####',
    '#######..........#######',
    '#########......#########',
    '##########OOOO##########',
  ], exits:[{x:10, y:14, w:4, h:1, to:'forest', at:[2,2]}]},
  market:{name:'Market (the Agora)', map:[
    'HHHHHHHHHHHHHHHHHHHHHHHH',
    'H..SSSS.....x.....SSSS.H',
    'H..cccc...........cccc.H',
    'H......................H',
    'H.........tttt.........H',
    'H......................H',
    ',,,,,,,,,,,,,,,,,,,,,,.H',
    ',,,,,,,,,,,,,,,,,,,,,,.H',
    ',,,,,,,,,,,,,,,,,,,,,,.H',
    'H......................H',
    'H..SSSS...........SSSS.H',
    'H..cccc...........cccc.H',
    'H......................H',
    'Hx....................xH',
    'HHHHHHHHHHHHHHHHHHHHHHHH',
  ], exits:[{x:0, y:6, w:1, h:3, to:'square', at:[22,7]}]},
  cafe:{name:'Café & Library', indoor:true, map:[
    '##########DDDD##########',
    '#cccc.....,,,,..BBBBBBB#',
    '#.........,,,,.........#',
    '#.t...t...,,,,..BB.BB..#',
    '#.........,,,,..BB.BB..#',
    '#.t...t...,,,,.........#',
    '#.........,,,,..BB.BB..#',
    '#x........,,,,..BB.BB.x#',
    '#.........,,,,.........#',
    '#..RRRR...,,,,...ttt...#',
    '#..RRRR...,,,,.........#',
    '#......................#',
    '#x....................x#',
    '#......................#',
    '########################',
  ], exits:[{x:10, y:0, w:4, h:1, to:'square', at:[11,13]}]},
  lighthouse:{name:'The Lighthouse', indoor:true, night:true, map:[
    '########################',
    '########wwwwwwww########',
    '######....MMMM....######',
    '#####..............#####',
    '####................####',
    '###..................###',
    '###......RRRRRR......###',
    '###......RRRRRR......###',
    '###......RRRRRR......###',
    '###..C...RRRRRR...C..###',
    '####.....RRRRRR.....####',
    '#####....RRRRRR....#####',
    '######...RRRRRR...######',
    '########.RRRRRR.########',
    '#########DDDDDD#########',
  ], exits:[{x:9, y:14, w:6, h:1, to:'square', at:[18,2]}]},
};

const INTRO = [
  '* ...',
  '* You open your eyes.',
  '* A small square. A fountain. A dog, staring at you with enormous certainty.',
  '* You don\'t remember your name.',
  {nameInput:true},
  '* You don\'t remember what you believe, either.',
  '* To the north-east, an old lighthouse stands dark. People say its mirror shows you who you really are...',
  '* ...but only to someone who has really talked with people.',
  '* (Arrows / WASD to walk. Z, E or Enter to talk. X or Esc to go back. Q for your journal, M for the map.)',
];

if (typeof module !== 'undefined') module.exports = {WORLDVIEWS, QUESTIONS, ITEMS, QUESTS, EGGS, NPCS, ZONES, INTRO, NAME_EGGS, MIN_THOUGHTS};
