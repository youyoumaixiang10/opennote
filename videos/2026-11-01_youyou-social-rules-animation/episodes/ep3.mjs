// 第3集《好奇的小眼睛》 — with Nainai. Benches: Nainai's at x 700, Guoguo's at x 1700. Seat y≈1392.
const ZK = 1.5;
const F = (t, cx, z, g = 1420) => { const Z = z * ZK, G = 960 + (g - 960) * 1.25; return [t, cx, 1500 - (G - 960) / Z, Z]; };
const M4 = ['好吃的', '看一眼', '想吃了', '回来说'];
const MP = ['belly', 'binoc', 'tapmouth', 'patchest'];
const mantraLines = (who) => M4.map((text, i) => ({ who, text: text + (i === 3 ? '！' : '，'), at: i === 0 ? '+0.4' : '+0.3', gain: 0.9 }));
const mantraKeys = (base) => MP.map((pose, i) => [`L${base + i}-0.1`, { pose }]);
const SEAT = 1366;

export default {
  id: 'ep3', title: ['第3集', '好奇的小眼睛'],
  set: { bigtree: 260, benches: [[700, 1470], [1700, 1470]], mat: [2560, 1560], flowers: true, sun: [2700, -380], clouds: [[600, -650, 1], [1500, -300, 1.1], [2300, -760, 0.9], [3000, 300, 0.8]] },
  shots: [
    { // 0 wide: an afternoon walk
      title: { from: 0.3 }, music: 'theme', dur: 6.0,
      cam: [F(0, 900, 0.6, 1380), F(6, 1040, 0.64, 1390)],
      actors: {
        nainai: [[0, { x: 560, f: 1, pose: 'holdlow', expr: 'smile' }], [5.6, { x: 960 }]],
        doudou: [[0, { x: 690, f: 1, pose: 'holdup', expr: 'happy' }], [5.6, { x: 1090 }]],
      },
      lines: [{ who: 'nar', text: '豆豆和奶奶，在公园散步。', at: 2.6 }],
    },
    { // 1 Guoguo opens a box of biscuits; Doudou smells them
      music: 'theme', dur: 5.0,
      cam: [F(0, 1480, 1.0), F(5, 1520, 1.06)],
      actors: {
        nainai: [[0, { x: 1080, f: 1, pose: 'stand', expr: 'smile' }]],
        doudou: [[0, { x: 1220, f: 1, pose: 'stand', expr: 'neutral' }], [2.2, { tilt: -8, expr: 'excited' }], [3.5, { tilt: 0 }]],
        guoguo: [[0, { x: 1690, y: SEAT, f: -1, sit: 1, pose: 'stand', expr: 'smile' }], [1.0, { pose: 'eat', expr: 'joy' }]],
      },
      props: { cookiebox: [[0, { x: 1800, y: SEAT }]], cookie: [[0, { hide: 1 }], [1.0, { att: 'guoguo.R' }]], smell: [[0, { hide: 1 }], [1.6, { x: 1600, y: 1270 }]] },
      sfx: [{ at: 1.5, s: 'crunch', g: 0.6 }, { at: 3.0, s: 'crunch', g: 0.6 }],
    },
    { // 2 standing right in front, staring
      music: 'off', dur: 4.6, caption: false,
      cam: [F(0, 1450, 1.15, 1440), F(4.6, 1580, 1.4, 1460)],
      actors: {
        doudou: [[0, { x: 1220, f: 1, pose: 'stand', expr: 'excited' }], [2.4, { x: 1540 }], [2.6, { expr: 'surprise' }]],
        guoguo: [[0, { x: 1690, y: SEAT, f: -1, sit: 1, pose: 'eat', expr: 'joy' }], [2.8, { expr: 'neutral' }]],
      },
      props: { cookiebox: [[0, { x: 1800, y: SEAT }]], cookie: [[0, { att: 'guoguo.R' }]] },
    },
    { // 3 close: Guoguo feels uncomfortable
      music: 'off', dur: 'L0e+1.4',
      cam: [F(0, 1660, 2.0, 1500), F('L0e', 1670, 2.1, 1505)],
      actors: {
        guoguo: [[0, { x: 1690, y: SEAT, f: -1, sit: 1, pose: 'eat', expr: 'neutral' }], [0.6, { lean: -8, pose: 'hugbox', expr: 'worry' }], [1.6, { tilt: 8 }]],
        doudou: [[0, { x: 1540, f: 1, pose: 'stand', expr: 'surprise' }]],
      },
      props: { cookiebox: [[0, { x: 1800, y: SEAT }], [0.6, { att: 'guoguo.R' }]], cookie: [[0, { att: 'guoguo.R' }], [0.6, { hide: 1 }]] },
      lines: [{ who: 'guoguo', text: '嗯……', at: 1.3, gain: 0.8 }],
    },
    { // 4 Nainai takes Doudou back a few steps
      music: 'off', dur: 'L0e+2.6',
      cam: [F(0, 1400, 1.1, 1440), F('L0e+2.6', 1180, 1.15, 1440)],
      actors: {
        nainai: [[0, { x: 1080, f: 1, pose: 'stand', expr: 'gentle' }], [1.4, { x: 1400 }], ['L0e', { x: 1400, f: -1, pose: 'holdlow' }], ['L0e+2.4', { x: 1050 }]],
        doudou: [[0, { x: 1540, f: 1, pose: 'stand', expr: 'surprise' }], ['L0e', { x: 1530, f: -1, pose: 'holdup', expr: 'neutral' }], ['L0e+2.4', { x: 1180 }]],
        guoguo: [[0, { x: 1690, y: SEAT, f: -1, sit: 1, pose: 'hugbox', expr: 'worry' }]],
      },
      props: { cookiebox: [[0, { att: 'guoguo.R' }]] },
      lines: [{ who: 'nainai', text: '豆豆，跟奶奶过来。', at: 1.6 }],
    },
    { // 5 Nainai explains with what can be seen
      music: 'off',
      cam: [F(0, 1130, 1.5, 1480), F('L1e', 1130, 1.5, 1480), F('L2+0.2', 1550, 1.15, 1440)],
      actors: {
        nainai: [[0, { x: 1040, f: 1, crouch: 1, pose: 'handsout', expr: 'gentle' }], ['L0', { pose: 'point' }], ['L1+0.4', { pose: 'handsout' }]],
        doudou: [[0, { x: 1180, f: -1, pose: 'stand', expr: 'neutral' }], ['L0+0.5', { f: 1 }], ['L2+0.6', { expr: 'worry' }]],
        guoguo: [[0, { x: 1690, y: SEAT, f: -1, sit: 1, pose: 'hugbox', expr: 'worry' }], ['L2+1.6', { lean: 0, pose: 'eat', expr: 'smile' }]],
      },
      props: { cookiebox: [[0, { att: 'guoguo.R' }], ['L2+1.6', { x: 1800, y: SEAT }]], cookie: [[0, { hide: 1 }], ['L2+1.6', { att: 'guoguo.R' }]] },
      lines: [
        { who: 'nainai', text: '那是果果的饼干。', at: 0.4 },
        { who: 'nainai', text: '你站得太近，一直看，', at: '+0.4' },
        { who: 'nainai', text: '果果不舒服，都吃不下了。', at: '+0.3' },
      ],
    },
    { // 6 name the wish; tell what to do with it
      music: 'soft', dur: 'L2e+1.0',
      cam: [F(0, 1110, 1.6, 1490), F('L2e', 1110, 1.7, 1495)],
      actors: {
        nainai: [[0, { x: 1030, f: 1, crouch: 1, pose: 'handsout', expr: 'gentle' }], ['L0', { pose: 'belly' }], ['L2', { pose: 'patchest', expr: 'happy' }]],
        doudou: [[0, { x: 1180, f: -1, pose: 'stand', expr: 'worry' }], ['L1-0.2', { pose: 'belly', expr: 'happy' }], ['L2+0.4', { pose: 'stand', expr: 'smile' }]],
      },
      lines: [
        { who: 'nainai', text: '饼干看起来很香，豆豆也想吃，对吗？', at: 0.4 },
        { who: 'doudou', text: '嗯！我想吃。', at: '+0.3' },
        { who: 'nainai', text: '想吃了，就回来告诉奶奶。', at: '+0.3' },
      ],
    },
    { // 7 Doudou's own apple slices
      music: 'soft', dur: 'L0e+3.2',
      cam: [F(0, 1110, 1.5, 1480), F('L0e+3', 1115, 1.58, 1485)],
      actors: {
        nainai: [[0, { x: 1030, f: 1, crouch: 1, pose: 'give', expr: 'happy' }], ['L0e+0.6', { pose: 'stand' }]],
        doudou: [[0, { x: 1180, f: -1, pose: 'stand', expr: 'excited' }], ['L0e', { pose: 'take' }], ['L0e+0.8', { pose: 'eat', expr: 'joy' }]],
      },
      props: { applebox: [[0, { att: 'nainai.R' }], ['L0e+0.2', { att: 'doudou.L' }]], apple: [[0, { hide: 1 }], ['L0e+0.8', { att: 'doudou.R' }]] },
      lines: [{ who: 'nainai', text: '这是豆豆的苹果。', at: 0.5 }],
      sfx: [{ at: 'L0e+1.4', s: 'crunch', g: 0.6 }, { at: 'L0e+2.4', s: 'crunch', g: 0.6 }],
    },
    { // 8 the mantra, first time
      music: 'theme', caption: false, tail: 1.0,
      mantra: { text: M4, lines: [0, 1, 2, 3] },
      cam: [F(0, 1110, 1.22, 1230)],
      actors: {
        nainai: [[0, { x: 990, f: 1, look: 'cam', pose: 'stand', expr: 'happy' }], ...mantraKeys(0)],
        doudou: [[0, { x: 1230, f: -1, look: 'cam', pose: 'stand', expr: 'happy' }], ...mantraKeys(0)],
      },
      lines: mantraLines(['nainai', 'doudou']),
    },
    { // 9 later: Lulu eats corn on a picnic mat; Doudou looks once
      music: 'soft', dur: 5.4, caption: false, over: '过了一会儿',
      cam: [F(0, 2250, 0.9, 1420), F(5.4, 2420, 1.05, 1430)],
      actors: {
        nainai: [[0, { x: 1800, f: 1, pose: 'stand', expr: 'smile' }], [3.6, { x: 1960 }]],
        doudou: [[0, { x: 1930, f: 1, pose: 'stand', expr: 'smile' }], [3.6, { x: 2250 }], [3.9, { expr: 'excited' }]],
        lulu: [[0, { x: 2600, y: 1545, f: -1, sit: 1, pose: 'eat', expr: 'joy' }]],
      },
      props: { corn: [[0, { att: 'lulu.R' }]] },
      sfx: [{ at: 1.2, s: 'crunch', g: 0.4 }, { at: 3.4, s: 'crunch', g: 0.4 }],
    },
    { // 10 INTERACTIVE: one look — then where?
      music: 'wait', dur: 'L0e+4.6',
      star: ['L0e+0.1', 'L0e+4.4'],
      cam: [F(0, 2410, 1.35, 1480), F('L0e', 2400, 1.42, 1485)],
      actors: {
        doudou: [[0, { x: 2250, f: 1, pose: 'stand', expr: 'excited' }], [1.0, { look: 'cam', expr: 'neutral' }], ['L0e+1.5', { expr: 'smile' }]],
        lulu: [[0, { x: 2600, y: 1545, f: -1, sit: 1, pose: 'eat', expr: 'joy' }]],
      },
      props: { corn: [[0, { att: 'lulu.R' }]] },
      lines: [{ who: 'nar', text: '豆豆看了一眼。然后，要去哪里呢？', at: 1.2 }],
    },
    { // 11 runs back and says it
      music: 'happy', dur: 'L0e+0.8',
      cam: [F(0, 2200, 1.05, 1430), F(2.0, 2040, 1.2, 1440)],
      actors: {
        doudou: [[0, { x: 2250, f: -1, pose: 'stand', expr: 'happy' }], [1.9, { x: 2080 }], [2.0, { pose: 'open' }], ['L0', { pose: 'stand' }]],
        nainai: [[0, { x: 1960, f: 1, pose: 'stand', expr: 'smile' }], [1.8, { crouch: 1, pose: 'open' }]],
      },
      lines: [{ who: 'doudou', text: '奶奶，我也想吃玉米！', at: 2.2 }],
    },
    { // 12 Nainai answers truthfully
      music: 'soft', dur: 'L2e+1.0',
      cam: [F(0, 2010, 1.6, 1490), F('L2e', 2010, 1.7, 1495)],
      order: ['nainai', 'doudou'],
      actors: {
        nainai: [[0, { x: 1960, f: 1, crouch: 1, pose: 'hug', expr: 'happy', armsFront: 1 }]],
        doudou: [[0, { x: 2075, f: -1, pose: 'stand', expr: 'joy' }], ['L2', { look: 'cam', pose: 'open' }]],
      },
      lines: [
        { who: 'nainai', text: '你看了一眼，就回来告诉奶奶了。', at: 0.4 },
        { who: 'nainai', text: '今天没带玉米，我们回家煮玉米吃。', at: '+0.4' },
        { who: 'doudou', text: '好！', at: '+0.3' },
      ],
    },
    { // 13 sunset wash: sharing their own apples, waving
      music: 'theme', dur: 7.0, caption: false,
      wash: { from: 0.2, dur: 3.5 },
      cam: [F(0, 1170, 0.5, 1380), F(7, 1150, 0.53, 1390)],
      actors: {
        nainai: [[0, { x: 640, y: SEAT, f: 1, sit: 1, pose: 'eat', expr: 'joy' }], [3.6, { pose: 'wave', expr: 'happy' }]],
        doudou: [[0, { x: 790, y: SEAT, f: 1, sit: 1, pose: 'eat', expr: 'joy' }], [3.4, { pose: 'wave', expr: 'happy' }]],
        guoguo: [[0, { x: 1690, y: SEAT, f: -1, sit: 1, pose: 'eat', expr: 'joy' }], [4.0, { pose: 'wave' }]],
        lulu: [[0, { x: 1480, f: -1, pose: 'stand', expr: 'joy' }], [4.2, { pose: 'wave' }]],
      },
      props: { apple: [[0, { att: 'doudou.R' }], [3.4, { hide: 1 }]], applebox: [[0, { x: 715, y: SEAT }]], cookiebox: [[0, { x: 1800, y: SEAT }]] },
      sfx: [{ at: 1.0, s: 'crunch', g: 0.4 }],
    },
    { // 14 say it together
      music: 'theme', tail: 2.2,
      mantra: { text: M4, lines: [1, 2, 3, 4] },
      wash: { from: -10, dur: 0.1 },
      cam: [F(0, 1300, 1.5, 1250), F('L0e', 1300, 1.42, 1240)],
      actors: { doudou: [[0, { x: 1300, f: 1, look: 'cam', pose: 'open', expr: 'happy' }], ...mantraKeys(1), ['L4e+0.5', { pose: 'wave' }]] },
      lines: [{ who: 'doudou', text: '和我一起说——', at: 0.3 }, ...mantraLines(['doudou', 'nar'])],
    },
  ],
};
