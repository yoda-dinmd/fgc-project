/* Pixel art, drawn in code. One logical pixel = 1 canvas pixel; tiles are 16x16. */
const TILE = 16;

const PALETTES = {
  square:    {ground:'#8cc46a', ground2:'#79b35a', path:'#dcc38e', path2:'#c9ad78', tree:'#3f8a4a', tree2:'#2e6b39', treeHi:'#5aa860', trunk:'#6b4a2e', wall:'#d9a37a', wall2:'#b9825c', roof:'#a84a3a', roof2:'#7e3329', water:'#5ab3d6', water2:'#8fd3ec', stone:'#c4bdb1', stone2:'#9d958a'},
  forest:    {ground:'#5f9e4f', ground2:'#4f8a42', path:'#b99a68', path2:'#9e8155', tree:'#2f6e3b', tree2:'#1f4f2a', treeHi:'#45904f', trunk:'#5a3c24', water:'#3e8fb5', water2:'#79c3e0', stone:'#8f8a82', stone2:'#6b665f', slope:'#9c8a6a', slope2:'#7f6f52'},
  market:    {ground:'#ecd6a4', ground2:'#dfc690', path:'#d2b17a', path2:'#bf9c66', hedge:'#4f8f45', hedge2:'#3b7334', stone:'#c4bdb1', stone2:'#9d958a', wood:'#9a6a3e', wood2:'#7a5030'},
  lab:       {ground:'#e4ecee', ground2:'#d2dde0', path:'#b8c7cc', path2:'#a6b6bb', wall:'#6f8796', wall2:'#566b78', top:'#36434c', stone:'#c4bdb1', stone2:'#9d958a', wood:'#8a6a4e', wood2:'#6b503a'},
  temple:    {ground:'#aea7ad', ground2:'#9b949b', path:'#aea7ad', path2:'#9b949b', wall:'#6b6070', wall2:'#554b5a', top:'#2f2833', rug:'#8b2f3a', rug2:'#c9a24a', sand:'#ebdfbd', sand2:'#d8c89f', water:'#4f9fb8', water2:'#8fd0e2', stone:'#8a8580', stone2:'#6a6560', wood:'#7a5233', wood2:'#5c3d25'},
  cafe:      {ground:'#a8774d', ground2:'#93653f', path:'#6c4232', path2:'#5a3628', wall:'#5e3d2c', wall2:'#4a2f22', top:'#2a1a12', rug:'#3f7070', rug2:'#d9b26a', wood:'#6e4a2c', wood2:'#53371f', stone:'#b9b2a6', stone2:'#8d877c'},
  cave:      {ground:'#3d3532', ground2:'#332c29', path:'#3d3532', path2:'#332c29', wall:'#2a2321', wall2:'#1d1816', top:'#120e0d', stone:'#4f4642', stone2:'#3a3330', lit:'#7a5a42', lit2:'#68503b'},
  lighthouse:{ground:'#33405f', ground2:'#2b3651', path:'#33405f', path2:'#2b3651', wall:'#232b45', wall2:'#1b2136', top:'#0f1322', rug:'#7d6430', rug2:'#c9a24a', stone:'#8a8fa3', stone2:'#5e6378', wood:'#5a4a3a', wood2:'#3f3428'},
};

const SOLID = new Set('#T~FBtcbSLAPCrxHGKWElwM'.split(''));
const ANIMATED = new Set('~ECwMF'.split(''));

function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

function makeArt(ctx) {
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  function ground(x, y, P, tx, ty, zone) {
    if (zone === 'lab') { R(x, y, 16, 16, (tx + ty) % 2 ? P.ground : P.ground2); return; }
    if (zone === 'temple' || zone === 'cave') { R(x, y, 16, 16, P.ground); R(x, y + 15, 16, 1, P.ground2); R(x + 15, y, 1, 16, P.ground2); if (hash(tx, ty) > .7) R(x + 4, y + 6, 2, 1, P.ground2); return; }
    if (zone === 'cafe' || zone === 'lighthouse') { R(x, y, 16, 16, P.ground); for (let i = 3; i < 16; i += 4) R(x, y + i, 16, 1, P.ground2); R(x + (ty % 2 ? 5 : 11), y, 1, 16, P.ground2); return; }
    R(x, y, 16, 16, P.ground);
    const h = hash(tx, ty);
    if (h > .5) { R(x + Math.floor(h * 12), y + Math.floor(h * 97) % 13, 1, 2, P.ground2); R(x + Math.floor(h * 51) % 13, y + Math.floor(h * 31) % 12 + 2, 2, 1, P.ground2); }
  }

  function tile(ch, x, y, P, tx, ty, zone, map, t, flags) {
    const at = (dx, dy) => (map[ty + dy] || '')[tx + dx] || '#';
    switch (ch) {
      case '.': ground(x, y, P, tx, ty, zone); break;
      case ',': {
        if (zone === 'cafe') { R(x, y, 16, 16, P.path); R(x, y, 1, 16, P.rug2); R(x + 15, y, 1, 16, P.rug2); break; }
        if (zone === 'lab' || zone === 'temple') { ground(x, y, P, tx, ty, zone); break; }
        R(x, y, 16, 16, P.path); const h = hash(tx, ty);
        R(x + Math.floor(h * 13), y + Math.floor(h * 71) % 13, 2, 1, P.path2); R(x + Math.floor(h * 37) % 14, y + Math.floor(h * 19) % 14, 1, 1, P.path2); break;
      }
      case '_': R(x, y, 16, 16, P.sand); for (let i = 2; i < 16; i += 4) for (let j = 0; j < 16; j += 2) R(x + j, y + i + ((j + tx * 16) % 8 < 4 ? 0 : 1), 2, 1, P.sand2); break;
      case 'f': ground(x, y, P, tx, ty, zone); { const cs = ['#f2d14b', '#e86a8a', '#f4f4f4', '#b77ce0']; for (let i = 0; i < 3; i++) { const h = hash(tx * 3 + i, ty); const fx = x + 2 + Math.floor(h * 11), fy = y + 2 + Math.floor(h * 77) % 11; R(fx, fy + 2, 1, 2, '#3c7a3a'); R(fx - 1, fy, 3, 1, cs[(tx + i) % 4]); R(fx, fy - 1, 1, 3, cs[(tx + i) % 4]); R(fx, fy, 1, 1, '#fff3b0'); } } break;
      case 'g': ground(x, y, P, tx, ty, zone); for (let i = 0; i < 5; i++) { const gx = x + 1 + i * 3; R(gx, y + 7, 1, 7, P.tree || '#3f8a4a'); R(gx + 1, y + 9, 1, 5, P.ground2); } break;
      case 'R': R(x, y, 16, 16, P.rug); { const L = at(-1, 0) !== 'R', Rr = at(1, 0) !== 'R'; if (L) R(x + 1, y, 2, 16, P.rug2); if (Rr) R(x + 13, y, 2, 16, P.rug2); if ((tx + ty) % 2 === 0) R(x + 7, y + 7, 2, 2, P.rug2); } break;
      case '^': R(x, y, 16, 16, P.slope); R(x, y + 5, 16, 1, P.slope2); R(x + 3, y + 11, 13, 1, P.slope2); if (hash(tx, ty) > .5) R(x + 9, y + 2, 2, 2, P.stone2); break;
      case '#': case 'K': case 'W': {
        const below = at(0, 1);
        const face = !'#KW'.includes(below) && below !== 'D' || (zone === 'square' && !'#KWD'.includes(below));
        if (zone === 'square') {
          if (!'#D'.includes(below)) { R(x, y, 16, 16, P.wall); for (let i = 3; i < 16; i += 5) R(x, y + i, 16, 1, P.wall2); R(x + ((ty * 7 + tx * 5) % 2 ? 4 : 10), y, 1, 16, P.wall2); if (tx % 3 === 1) { R(x + 4, y + 3, 8, 7, '#38505e'); R(x + 5, y + 4, 3, 2, '#8fc6dc'); R(x + 4, y + 10, 8, 1, P.wall2); } }
          else { R(x, y, 16, 16, P.roof); for (let i = 0; i < 16; i += 4) R(x, y + i + 3, 16, 1, P.roof2); for (let i = 0; i < 16; i += 4) R(x + i + (ty % 2) * 2, y + i % 8, 1, 3, P.roof2); }
          break;
        }
        if (ch === 'W') { R(x, y, 16, 16, P.lit); R(x, y + 12, 16, 4, P.lit2); if (hash(tx, ty) > .5) R(x + 5, y + 4, 3, 1, P.lit2); break; }
        if (face) {
          R(x, y, 16, 16, P.wall); R(x, y, 16, 3, P.top); R(x, y + 14, 16, 2, P.wall2);
          if (zone === 'cave') { if (hash(tx, ty) > .4) R(x + 4, y + 7, 4, 2, P.wall2); }
          else for (let i = 7; i < 14; i += 6) R(x, y + i, 16, 1, P.wall2);
          if (ch === 'K') { R(x + 1, y + 3, 14, 10, '#4b3a2a'); R(x + 2, y + 4, 12, 8, '#2f5a45'); R(x + 3, y + 6, 4 + (tx % 3), 1, '#dfe8df'); R(x + 4, y + 9, 6 - (tx % 2) * 2, 1, '#dfe8df'); }
        } else R(x, y, 16, 16, P.top);
        break;
      }
      case 'T': {
        ground(x, y, P, tx, ty, zone);
        const up = at(0, -1) === 'T', down = at(0, 1) === 'T';
        R(x - 1, y + (up ? -2 : 1), 18, down ? 18 : 12, P.tree);
        R(x + 1, y + (up ? 0 : 0), 14, down ? 16 : 11, P.tree);
        R(x + 3, y + (up ? 1 : 2), 5, 3, P.treeHi); R(x + 10, y + 6, 3, 2, P.treeHi);
        R(x + 2, y + (down ? 13 : 10), 12, 2, P.tree2);
        if (!down) { R(x + 6, y + 12, 4, 4, P.trunk); R(x + 6, y + 12, 1, 4, '#4a3220'); }
        break;
      }
      case '~': {
        if (zone === 'square') { R(x, y, 16, 16, P.water); break; }
        R(x, y, 16, 16, P.water); const o = Math.floor(t / 300 + tx) % 4;
        R(x + o * 3, y + 4, 4, 1, P.water2); R(x + 12 - o * 2, y + 10, 3, 1, P.water2);
        if (at(0, -1) !== '~') R(x, y, 16, 2, P.ground2 || P.sand2);
        break;
      }
      case 'F': {
        const L = at(-1, 0) !== 'F', Rr = at(1, 0) !== 'F', U = at(0, -1) !== 'F', D = at(0, 1) !== 'F';
        R(x, y, 16, 16, P.water); const o = Math.floor(t / 250 + tx + ty) % 4; R(x + o * 3, y + 6, 4, 1, P.water2); R(x + 10 - o * 2, y + 11, 3, 1, P.water2);
        if (L) R(x, y, 3, 16, P.stone); if (Rr) R(x + 13, y, 3, 16, P.stone); if (U) R(x, y, 16, 3, P.stone); if (D) { R(x, y + 13, 16, 3, P.stone); R(x, y + 15, 16, 1, P.stone2); }
        if (!U && !D && !L && Rr) { R(x + 10, y + 2, 6, 10, P.stone); R(x + 12, y - 4, 3, 7, P.stone2); }
        if (!U && !D && L && !Rr) { R(x, y + 2, 6, 10, P.stone); R(x + 1, y - 4, 3, 7, P.stone2); }
        if (!U && !D && !L && !Rr) { const s = Math.floor(t / 120) % 3; R(x + 6, y - 8 + s, 4, 10, P.water2); R(x + 4, y - 6 + s, 1, 2, P.water2); }
        if (!U && !D) { R(x + 2, y - 6 - (Math.floor(t / 200) % 3), 1, 1, '#d8f3ff'); }
        break;
      }
      case 'B': { R(x, y, 16, 16, P.wood2); R(x + 1, y + 1, 14, 14, P.wood); const cs = ['#b04a3a', '#3f6e9a', '#d9b26a', '#4f8a4a', '#7a4f8a', '#e0e0d0']; for (let s = 0; s < 2; s++) { R(x + 1, y + 7 + s * 7, 14, 1, P.wood2); for (let i = 0; i < 6; i++) { const h = hash(tx * 7 + i, ty * 3 + s); R(x + 2 + i * 2, y + 2 + s * 7 + Math.floor(h * 2), 2, 5 - Math.floor(h * 2), cs[Math.floor(h * 6)]); } } break; }
      case 't': ground(x, y, P, tx, ty, zone); R(x, y + 2, 16, 9, P.wood || '#9a6a3e'); R(x, y + 2, 16, 2, '#00000022'); R(x, y + 11, 16, 2, P.wood2 || '#7a5030'); if (at(-1, 0) !== 't') R(x + 1, y + 13, 2, 3, P.wood2 || '#7a5030'); if (at(1, 0) !== 't') R(x + 13, y + 13, 2, 3, P.wood2 || '#7a5030'); break;
      case 'c': ground(x, y, P, tx, ty, zone); R(x, y + 1, 16, 13, P.wood2 || '#7a5030'); R(x, y + 1, 16, 4, P.wood || '#9a6a3e'); R(x, y + 14, 16, 2, '#00000040'); if (zone === 'cafe' && tx === 2) { R(x + 4, y - 3, 7, 6, '#c9c9c9'); R(x + 5, y - 2, 5, 2, '#5a5a5a'); } if (zone === 'market' && tx % 2) { R(x + 3, y, 4, 3, '#d99a4a'); R(x + 9, y + 1, 4, 2, '#f2d38a'); } break;
      case 'b': ground(x, y, P, tx, ty, zone); R(x, y + 5, 16, 3, '#9a6a3e'); R(x, y + 9, 16, 2, '#9a6a3e'); R(x + 2, y + 11, 2, 4, '#6b4a2e'); R(x + 12, y + 11, 2, 4, '#6b4a2e'); break;
      case 'S': { ground(x, y, P, tx, ty, zone); const c1 = tx < 12 ? (ty < 5 ? '#e8a0b0' : '#c93a3a') : (ty < 5 ? '#7a4fb0' : '#2b3a66'); R(x, y + 2, 16, 10, c1); for (let i = 0; i < 16; i += 4) R(x + i, y + 2, 2, 10, '#f6f0e0'); R(x, y + 12, 16, 2, '#00000030'); for (let i = 0; i < 16; i += 4) R(x + i, y + 12, 3, 2, c1); if (at(-1, 0) !== 'S' || at(1, 0) !== 'S') R(x + (at(-1, 0) !== 'S' ? 1 : 13), y + 12, 2, 4, '#6b4a2e'); break; }
      case 'L': R(x, y, 16, 16, P.ground); R(x, y + 2, 16, 11, '#8a979e'); R(x, y + 2, 16, 3, '#b5c1c6'); R(x, y + 13, 16, 3, '#566168'); { const h = hash(tx, ty); if (h > .3) { R(x + 3, y - 2, 3, 6, '#cfe9f2'); R(x + 3, y + 1, 3, 3, h > .6 ? '#6ad38a' : '#e86ab0'); } if (h > .55) { R(x + 9, y - 1, 4, 5, '#cfe9f2'); R(x + 9, y + 2, 4, 2, '#f2c84b'); } } break;
      case 'A': ground(x, y, P, tx, ty, zone); R(x, y + 3, 16, 11, '#efe8d8'); R(x, y + 3, 16, 2, '#c9a24a'); R(x, y + 12, 16, 2, '#c9a24a'); if (at(-1, 0) === 'A' && at(1, 0) === 'A' && at(2, 0) === 'A') { R(x + 14, y - 6, 3, 12, '#d9b24a'); R(x + 11, y - 3, 9, 3, '#d9b24a'); } break;
      case 'P': ground(x, y, P, tx, ty, zone); R(x + 3, y - 6, 10, 20, P.stone); R(x + 3, y - 6, 2, 20, '#ffffff22'); R(x + 10, y - 6, 3, 20, P.stone2); R(x + 2, y - 7, 12, 2, P.stone2); R(x + 2, y + 13, 12, 3, P.stone2); break;
      case 'C': { ground(x, y, P, tx, ty, zone); R(x + 7, y + 3, 2, 12, '#c9a24a'); R(x + 3, y + 3, 10, 2, '#c9a24a'); R(x + 5, y + 14, 6, 2, '#c9a24a'); for (const cx of [3, 7, 11]) { R(x + cx, y - 1, 2, 4, '#f4f0e4'); const f = Math.floor(t / 150 + cx) % 2; R(x + cx, y - 4 + f, 2, 3, '#f7b23b'); R(x + cx, y - 3 + f, 1, 1, '#fff3b0'); } break; }
      case 'r': ground(x, y, P, tx, ty, zone); R(x + 2, y + 5, 12, 10, P.stone2); R(x + 3, y + 4, 10, 9, P.stone); R(x + 5, y + 5, 3, 2, '#ffffff40'); break;
      case 'x': ground(x, y, P, tx, ty, zone); R(x + 4, y + 9, 8, 6, '#b5603a'); R(x + 4, y + 9, 8, 2, '#8a4428'); R(x + 3, y + 1, 10, 9, '#4f9a4a'); R(x + 5, y - 1, 6, 4, '#4f9a4a'); R(x + 5, y + 2, 3, 2, '#7cc06a'); break;
      case 'H': R(x, y, 16, 16, P.hedge); for (let i = 0; i < 4; i++) { const h = hash(tx * 4 + i, ty); R(x + Math.floor(h * 13), y + Math.floor(h * 53) % 13, 3, 2, P.hedge2); } R(x, y + 14, 16, 2, P.hedge2); break;
      case 'G': {
        R(x, y, 16, 16, P.path);
        if (flags.gateFixed) { R(x + (tx % 2 ? 13 : 0), y - 2, 3, 18, '#4a4a52'); }
        else { R(x, y + 1, 16, 2, '#4a4a52'); R(x, y + 12, 16, 2, '#4a4a52'); for (let i = 1; i < 16; i += 4) R(x + i, y - 2, 2, 18, '#5b5b66'); R(x + (tx % 2 ? 0 : 13), y + 5, 3, 4, '#a0522d'); }
        break;
      }
      case 'D':
        if (zone === 'square') { R(x, y, 16, 16, P.wall); R(x + 2, y + 1, 12, 15, '#6b4a2e'); R(x + 3, y + 2, 10, 14, '#8a6038'); R(x + 10, y + 8, 2, 2, '#f2d14b'); }
        else { R(x, y, 16, 16, zone === 'cafe' ? P.path : P.ground2); R(x, y, 16, 2, '#00000040'); }
        break;
      case 'O':
        if (zone === 'cave') { const g = ctx.createLinearGradient(0, y, 0, y + 16); g.addColorStop(0, P.ground); g.addColorStop(1, '#f4e6b0'); ctx.fillStyle = g; ctx.fillRect(x, y, 16, 16); }
        else { R(x, y, 16, 16, P.stone2); R(x + 2, y + 3, 12, 13, '#15110f'); R(x + 4, y + 1, 8, 3, '#15110f'); R(x, y, 3, 16, P.stone); R(x + 13, y, 3, 16, P.stone); }
        break;
      case 'E': { R(x, y, 16, 16, P.ground); R(x + 2, y + 11, 12, 4, '#4a3020'); R(x + 1, y + 12, 3, 2, '#6b4a2e'); R(x + 12, y + 12, 3, 2, '#6b4a2e'); const f = Math.floor(t / 110) % 3; R(x + 4, y + 4 + f, 8, 8 - f, '#e8641e'); R(x + 5, y + 1 + f, 6, 6, '#f7a13b'); R(x + 6, y + 5, 4, 5, '#fff0a0'); R(x + 7 + (f - 1), y - 2 + f, 2, 3, '#f7a13b'); break; }
      case 'l': ground(x, y, P, tx, ty, zone); R(x, y + 6, 16, 8, '#7a5233'); R(x, y + 6, 16, 2, '#9a6a3e'); if (at(-1, 0) !== 'l') { R(x, y + 6, 3, 8, '#c49a6c'); R(x + 1, y + 8, 1, 3, '#7a5233'); } break;
      case 'w': { R(x, y, 16, 16, P.wall); R(x + 1, y + 2, 14, 12, '#0b1030'); for (let i = 0; i < 3; i++) { const h = hash(tx * 9 + i, 3); const tw = Math.floor(t / 400 + h * 10) % 3 ? '#f4f0c8' : '#8a8fb0'; R(x + 2 + Math.floor(h * 12), y + 3 + Math.floor(h * 77) % 9, 1, 1, tw); } R(x, y + 14, 16, 2, P.wall2); R(x + 7, y + 2, 1, 12, P.wall); break; }
      case 'M': {
        R(x, y, 16, 16, P.ground);
        const first = at(-1, 0) !== 'M', last = at(1, 0) !== 'M';
        R(x, y - 12, 16, 26, '#b8bfd0'); R(x, y - 10, 16, 22, flags.ready ? '#9fc4e8' : '#7a8399');
        const sh = Math.floor(t / 90) % 40; R(x + ((sh + tx * 8) % 16), y - 10, 2, 22, flags.ready ? '#dff0ff' : '#99a2b8');
        if (first) R(x, y - 12, 2, 26, '#d9b24a'); if (last) R(x + 14, y - 12, 2, 26, '#d9b24a');
        R(x, y - 13, 16, 2, '#d9b24a'); R(x, y + 12, 16, 2, '#d9b24a');
        break;
      }
      default: ground(x, y, P, tx, ty, zone);
    }
  }

  /* ---------- Characters ---------- */
  function human(cx, fy, look, opts = {}) {
    const {frame = 0, dir = 'down', sitting = false} = opts;
    const ex = look.extras || [];
    const has = n => ex.find(e => e === n || e.startsWith(n + ':'));
    const col = n => (has(n) || '').split(':')[1];
    const x0 = cx - 6, y0 = fy - (sitting ? 14 : 17);
    const P = (x, y, w, h, c) => R(x0 + x, y0 + y, w, h, c);
    const robe = has('robe'), hood = has('hood');
    const skin = look.skin, hair = look.hair, top = look.top, bot = look.bottom;
    // shadow
    ctx.fillStyle = '#00000033'; ctx.fillRect(cx - 5, fy - 1, 10, 2);
    // legs
    if (sitting) {
      P(1, 12, 10, 2, bot); P(0, 13, 12, 1, bot);
    } else if (robe) {
      P(2, 12, 8, 4, top); P(3, 16, 2, 1, '#2a2a2a'); P(7, 16, 2, 1, '#2a2a2a');
    } else {
      const a = frame === 1 ? 1 : 0, b = frame === 2 ? 1 : 0;
      P(3, 12, 2, 4 - a, bot); P(7, 12, 2, 4 - b, bot);
      const shoe = has('boots') ? '#121212' : '#3a2a20';
      P(3, 16 - a, 2, 1, shoe); P(7, 16 - b, 2, 1, shoe);
      if (has('boots')) { P(3, 14 - a, 2, 2, shoe); P(7, 14 - b, 2, 2, shoe); }
    }
    // body
    P(2, 7, 8, 6, top);
    if (has('coat')) { const c = col('coat'); P(2, 7, 3, 7, c); P(7, 7, 3, 7, c); P(5, 7, 2, 1, c); if (!sitting) { P(2, 13, 3, 2, c); P(7, 13, 3, 2, c); } }
    if (has('apron')) P(3, 9, 6, 5, col('apron'));
    if (has('belt')) P(2, 11, 8, 1, col('belt'));
    // arms
    const armC = has('coat') ? col('coat') : top;
    P(1, 8, 1, 4, armC); P(10, 8, 1, 4, armC); P(1, 12, 1, 1, skin); P(10, 12, 1, 1, skin);
    // hand items
    if (has('calc')) { P(10, 10, 3, 4, '#3a3a3a'); P(11, 11, 1, 1, '#8fe08a'); }
    if (has('magnifier')) { P(11, 7, 3, 3, '#c9a24a'); P(12, 8, 1, 1, '#cfe9f2'); P(11, 10, 1, 3, '#6b4a2e'); }
    if (has('clipboard')) { P(-1, 8, 3, 5, '#a87a4a'); P(-1, 9, 3, 3, '#f4f4f4'); }
    if (has('stamp')) { P(10, 10, 2, 3, '#6b4a2e'); P(10, 13, 3, 1, '#c93a3a'); }
    if (has('lantern')) { const f = Math.floor(performance.now() / 200) % 2; ctx.fillStyle = '#f7d36b33'; ctx.fillRect(x0 + 6, y0 + 4, 12, 12); P(10, 10, 4, 5, '#3a3a3a'); P(11, 11, 2, 3, f ? '#ffe08a' : '#f7b23b'); }
    // head
    if (hood) {
      P(2, 0, 8, 8, top); P(3, 2, 6, 5, '#11131f'); const blink = Math.floor(performance.now() / 2600) % 8 === 0;
      if (!blink) { P(4, 4, 1, 1, '#9fd3ff'); P(7, 4, 1, 1, '#9fd3ff'); }
      return;
    }
    P(3, 1, 6, 6, skin);
    if (dir !== 'up') {
      if (dir === 'down') { P(4, 4, 1, 1, '#241c1c'); P(7, 4, 1, 1, '#241c1c'); }
      if (dir === 'left') P(4, 4, 1, 1, '#241c1c');
      if (dir === 'right') P(7, 4, 1, 1, '#241c1c');
    }
    // hair
    const st = look.style;
    if (st === 'short' || st === 'bun' || st === 'long' || st === 'puff') { P(3, 0, 6, 2, hair); P(3, 2, 1, 2, hair); P(8, 2, 1, 2, hair); if (dir === 'up') P(3, 0, 6, 6, hair); }
    if (st === 'long') { P(2, 1, 1, 8, hair); P(9, 1, 1, 8, hair); if (dir !== 'down') P(3, 2, 6, 1, hair); }
    if (st === 'bun') { P(5, -2, 3, 2, hair); }
    if (st === 'puff') { P(2, -2, 8, 4, hair); P(1, -1, 10, 3, hair); }
    if (st === 'tonsure') { P(3, 2, 1, 3, hair); P(8, 2, 1, 3, hair); P(3, 1, 6, 1, hair); P(5, 1, 2, 1, skin); }
    if (dir === 'down') {
      if (has('glasses')) { P(3, 4, 6, 1, '#2a2a2a'); P(4, 4, 1, 1, '#bfe6ff'); P(7, 4, 1, 1, '#bfe6ff'); }
      if (has('monocle')) { P(7, 3, 2, 2, '#e8c45a'); P(7, 4, 1, 1, '#241c1c'); }
      if (has('beard')) { P(3, 5, 6, 2, hair); P(4, 7, 4, 1, hair); }
      if (has('mustache')) P(4, 5, 4, 1, hair);
      if (has('cig')) { P(8, 5, 3, 1, '#7a4a2a'); P(11, 5, 1, 1, '#d9c9b0'); }
    }
    // headwear
    if (has('hat')) { const c = col('hat'); P(1, 1, 10, 1, c); P(3, -1, 6, 2, c); P(3, 0, 6, 1, '#8a6a3a'); }
    if (has('tophat')) { P(2, 0, 8, 1, '#151515'); P(4, -5, 4, 5, '#151515'); P(4, -2, 4, 1, '#6b3fa0'); }
    if (has('cap')) { const c = col('cap'); P(3, -1, 6, 2, c); P(dir === 'left' ? 1 : 7, 1, 4, 1, c); }
    if (has('chef')) { P(3, -4, 6, 5, '#fafafa'); P(2, -5, 8, 3, '#fafafa'); P(3, 0, 6, 1, '#dcdcdc'); }
    if (has('beret')) { const c = col('beret'); P(2, -1, 7, 2, c); P(5, -2, 1, 1, c); }
    if (has('fedora')) { const c = col('fedora'); P(1, 1, 10, 1, c); P(3, -2, 6, 3, c); P(3, 0, 6, 1, '#2a2a2a'); }
    if (has('bandana')) { const c = col('bandana'); P(3, 0, 6, 2, c); P(9, 1, 2, 1, c); }
    if (has('headband')) P(3, 2, 6, 1, col('headband'));
    if (has('visor')) { P(3, 2, 6, 1, col('visor')); P(dir === 'left' ? 1 : 6, 3, 5, 1, col('visor') + 'aa'); }
  }

  function special(kind, cx, fy, t, ent = {}) {
    const P = (x, y, w, h, c) => R(cx + x, fy + y, w, h, c);
    ctx.fillStyle = '#00000033';
    switch (kind) {
      case 'dog': {
        ctx.fillRect(cx - 7, fy - 1, 14, 2);
        const wag = Math.floor(t / 120) % 2;
        P(-6, -9, 10, 5, '#b07a45'); P(-5, -4, 2, 4, '#b07a45'); P(1, -4, 2, 4, '#b07a45'); // body + legs
        P(2, -13, 6, 6, '#c08a55'); P(2, -13, 2, 4, '#7a4f2a'); P(7, -10, 2, 2, '#2a1a10'); P(5, -11, 1, 1, '#120c08'); // head, ear, nose, eye
        P(-3, -8, 4, 2, '#d9a46a');
        if (wag) { P(-9, -12, 2, 1, '#b07a45'); P(-8, -11, 2, 2, '#b07a45'); } else { P(-10, -9, 3, 1, '#b07a45'); P(-8, -8, 2, 1, '#b07a45'); }
        P(3, -7, 4, 1, '#c93a3a');
        break;
      }
      case 'barrel': {
        ctx.fillRect(cx - 8, fy - 1, 16, 2);
        const L = ent.look || {};
        P(-5, -19, 10, 7, L.skin); P(-5, -21, 10, 3, L.hair); P(-6, -18, 1, 4, L.hair); P(5, -18, 1, 4, L.hair);
        P(-3, -16, 1, 1, '#241c1c'); P(2, -16, 1, 1, '#241c1c'); P(-4, -14, 8, 3, L.hair);
        P(-8, -12, 16, 12, '#8a5a32'); P(-8, -12, 16, 2, '#6b4426'); P(-8, -7, 16, 1, '#4a4a4a'); P(-8, -3, 16, 1, '#4a4a4a'); P(-4, -12, 1, 12, '#6b4426'); P(3, -12, 1, 12, '#6b4426');
        const f = Math.floor(t / 300) % 2; P(8, -14, 4, 5, '#3a3a3a'); P(9, -13, 2, 3, f ? '#ffe08a' : '#f7b23b'); P(9, -16, 2, 2, '#3a3a3a');
        break;
      }
      case 'spirit': {
        const b = Math.round(Math.sin(t / 400) * 2);
        ctx.fillStyle = '#9ff0b033'; ctx.beginPath(); ctx.arc(cx, fy - 10 + b, 12, 0, 7); ctx.fill();
        P(-5, -16 + b, 10, 12, '#8de0a0'); P(-4, -4 + b, 8, 2, '#8de0a0'); P(-2, -2 + b, 4, 1, '#8de0a0aa');
        P(-6, -18 + b, 3, 3, '#4f9a4a'); P(-1, -20 + b, 3, 3, '#5fb85a'); P(4, -18 + b, 3, 3, '#4f9a4a'); P(2, -21 + b, 2, 2, '#e86a8a');
        P(-3, -12 + b, 1, 2, '#1f4f2a'); P(2, -12 + b, 1, 2, '#1f4f2a'); P(-1, -8 + b, 2, 1, '#1f4f2a');
        for (let i = 0; i < 3; i++) { const a = t / 600 + i * 2.1; P(Math.round(Math.cos(a) * 11), Math.round(-10 + Math.sin(a) * 8) + b, 1, 1, '#f4ffd0'); }
        break;
      }
      case 'boulder': ctx.fillRect(cx - 8, fy - 1, 16, 2); P(-8, -15, 16, 14, '#7f7a72'); P(-7, -16, 14, 16, '#8f8a82'); P(-5, -14, 4, 3, '#aaa59d'); P(2, -6, 5, 4, '#6b665f'); break;
      case 'duck': {
        ctx.fillRect(cx - 5, fy - 1, 10, 2);
        const rabbit = Math.floor(t / 2500) % 2;
        P(-4, -7, 8, 6, '#f4f4f4'); P(-2, -11, 5, 5, '#f4f4f4'); P(1, -9, 1, 1, '#241c1c');
        if (rabbit) { P(-1, -16, 2, 6, '#f4f4f4'); P(1, -15, 2, 5, '#e8e8e8'); P(3, -8, 1, 1, '#e88aa0'); }
        else { P(3, -9, 3, 2, '#f2a33b'); P(-6, -6, 2, 2, '#f4f4f4'); }
        break;
      }
      case 'owl': { const blink = Math.floor(t / 3000) % 6 === 0; P(-4, -26, 9, 10, '#7a5a3a'); P(-3, -25, 7, 4, '#a07a52'); P(-3, -24, 2, 2, blink ? '#7a5a3a' : '#f2d14b'); P(2, -24, 2, 2, blink ? '#7a5a3a' : '#f2d14b'); P(0, -22, 1, 1, '#d9a04a'); P(-4, -27, 1, 2, '#7a5a3a'); P(4, -27, 1, 2, '#7a5a3a'); break; }
      case 'sign': ctx.fillRect(cx - 4, fy - 1, 8, 2); P(-1, -10, 2, 10, '#6b4a2e'); P(-7, -15, 14, 7, '#a87a4a'); P(-7, -15, 14, 1, '#c49a6c'); P(-5, -13, 8, 1, '#5a3a20'); P(-5, -11, 10, 1, '#5a3a20'); break;
      case 'box': { ctx.fillRect(cx - 6, fy - 1, 12, 2); P(-6, -10, 12, 10, '#c49a6c'); P(-6, -10, 12, 2, '#a87a4a'); P(-1, -10, 2, 10, '#d9c49a'); if (Math.floor(t / 1700) % 5 === 0) { P(3, -12, 2, 2, '#4a4a4a'); P(5, -12, 1, 2, '#4a4a4a'); } break; }
      case 'jar': { const b = Math.floor(t / 300) % 6; P(-4, -14, 8, 2, '#8a979e'); P(-4, -12, 8, 9, '#bfe6efaa'); P(-3, -10, 6, 5, '#e8a0b0'); P(-2, -9, 1, 1, '#c97088'); P(1, -8, 1, 1, '#c97088'); P(2, -11 + -b % 3, 1, 1, '#ffffff'); break; }
      case 'bell': ctx.fillRect(cx - 7, fy - 1, 14, 2); P(-7, -22, 2, 22, '#6b4a2e'); P(5, -22, 2, 22, '#6b4a2e'); P(-7, -23, 14, 2, '#6b4a2e'); P(-4, -20, 8, 9, '#c9902a'); P(-5, -13, 10, 3, '#c9902a'); P(-3, -19, 2, 5, '#e8c45a'); P(-1, -10, 2, 2, '#8a5a1a'); break;
      case 'trolley': { const o = Math.floor(t / 400) % 3; P(-7, -4, 14, 1, '#4a4a4a'); P(-7, -1, 14, 1, '#4a4a4a'); P(-5 + o, -7, 5, 4, '#d64545'); P(-4 + o, -6, 3, 1, '#cfe9f2'); P(3, -8, 1, 3, '#e8c45a'); P(5, -8, 1, 3, '#e8c45a'); P(6, -8, 1, 3, '#e8c45a'); break; }
      case 'ship': { const b = Math.floor(t / 500) % 2; P(-6, -6 + b, 12, 3, '#7a4f2a'); P(-5, -3 + b, 10, 1, '#5a3a20'); P(0, -16 + b, 1, 10, '#5a3a20'); P(1, -15 + b, 5, 7, '#f4f0e0'); P(-4, -14 + b, 4, 5, '#e8e0d0'); break; }
    }
  }

  return {tile, human, special, R};
}

if (typeof module !== 'undefined') module.exports = {TILE, PALETTES, SOLID, ANIMATED, hash};
