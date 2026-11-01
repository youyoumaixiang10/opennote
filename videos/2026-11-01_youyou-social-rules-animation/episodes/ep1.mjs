// 第1集《小手不推人》 — shot script. Ground line y=1500. Camera keys: [t, cx, cy, zoom].
const ZK = 1.5;  // global framing: characters big in the tall frame
const F = (t, cx, z, g = 1420) => { const Z = z * ZK, G = 960 + (g - 960) * 1.25; return [t, cx, 1500 - (G - 960) / Z, Z]; };
const M4 = ['不推人', '小手停', '挥挥手', '一起玩'];
const MP = ['cross', 'clasp', 'wave', 'open'];
const mantraLines = (who) => M4.map((text, i) => ({ who, text: text + (i === 3 ? '！' : '，'), at: i === 0 ? '+0.4' : '+0.3', gain: 0.9 }));
const mantraKeys = (base) => MP.map((pose, i) => [`L${base + i}-0.1`, { pose }]);

export default {
  id: 'ep1', title: ['第1集', '小手不推人'],
  set: { trees: [260, 2780], slide: 2420, sandpit: [1990, 1570], flowers: true },
  shots: [
    { // 0 wide: arriving
      title: { from: 0.3 }, music: 'theme', dur: 6.2,
      cam: [F(0, 560, 0.6, 1380), F(6.2, 700, 0.64, 1390)],
      actors: {
        mama: [[0, { x: 200, f: 1, pose: 'holdlow', expr: 'smile' }], [5.6, { x: 640 }]],
        doudou: [[0, { x: 330, f: 1, pose: 'holdup', expr: 'happy' }], [5.6, { x: 770 }]],
      },
      lines: [{ who: 'nar', text: '豆豆和妈妈，来公园玩啦。', at: 2.6 }],
    },
    { // 1 notices Mimi
      music: 'theme', dur: 4.8,
      cam: [F(0, 1140, 0.95), F(4.8, 1160, 1.0)],
      actors: {
        mama: [[0, { x: 800, f: 1, pose: 'stand', expr: 'smile' }]],
        doudou: [[0, { x: 935, f: 1, pose: 'stand', expr: 'neutral' }], [1.3, { expr: 'excited' }], ['L0-0.2', { pose: 'point' }]],
        mimi: [[0, { x: 1380, f: 1, pose: 'hold', expr: 'happy', wobble: 1 }], [4.2, { x: 1460 }]],
      },
      props: { pinwheel: [[0, { att: 'mimi.R' }]] },
      lines: [{ who: 'doudou', text: '小兔！', at: 2.0 }],
      sfx: [{ at: 0.4, s: 'whirr', g: 0.5 }],
    },
    { // 2 approaches, hands come up
      music: 'soft', dur: 3.6,
      cam: [F(0, 1280, 1.05), F(3.6, 1440, 1.22)],
      actors: {
        doudou: [[0, { x: 940, f: 1, pose: 'stand', expr: 'excited' }], [2.9, { x: 1390 }], [2.5, { pose: 'reach' }]],
        mimi: [[0, { x: 1530, f: 1, pose: 'hold', expr: 'happy' }]],
      },
      props: { pinwheel: [[0, { att: 'mimi.R' }]] },
    },
    { // 3 the push (once, short, no comic sound)
      music: 'off', dur: 3.0, caption: false,
      cam: [F(0, 1460, 1.25), F(3, 1480, 1.25)],
      actors: {
        doudou: [[0, { x: 1390, f: 1, pose: 'reach', expr: 'excited', lean: 0 }], [0.3, { lean: -6 }], [0.55, { lean: 9, x: 1420, pose: 'push' }], [1.1, { lean: 0, x: 1410, pose: 'stand', expr: 'surprise' }]],
        mimi: [[0, { x: 1530, f: 1, pose: 'hold', expr: 'happy' }], [0.55, { lean: 0 }], [0.75, { lean: 14, x: 1550, expr: 'surprise' }], [1.1, { sit: 1, lean: 0, x: 1575, pose: 'down' }], [1.5, { expr: 'sad' }]],
      },
      props: { pinwheel: [[0, { att: 'mimi.R' }], [0.75, { x: 1600, y: 1395, rot: 20 }], [1.15, { x: 1660, y: 1492, rot: 82 }]] },
      sfx: [{ at: 1.08, s: 'thud', g: 0.7 }],
    },
    { // 4a close: Mimi hurts
      music: 'off', dur: 2.6,
      cam: [F(0, 1580, 2.2, 1560), F(2.6, 1580, 2.3, 1570)],
      actors: { mimi: [[0, { x: 1575, f: -1, sit: 1, pose: 'rubknee', expr: 'cry' }]] },
      props: { pinwheel: [[0, { x: 1660, y: 1492, rot: 82 }]] },
      lines: [{ who: 'mimi', text: '呜……疼……', at: 0.3, gain: 0.75 }],
    },
    { // 4b close: Doudou looks at its own hands
      music: 'off', dur: 2.8,
      cam: [F(0, 1410, 2.1, 1560), F(2.8, 1410, 2.2, 1560)],
      actors: { doudou: [[0, { x: 1410, f: 1, pose: 'stand', expr: 'surprise' }], [0.7, { pose: 'lookhands', expr: 'worry' }]] },
    },
    { // 5 Mama arrives, crouches, holds the hands
      music: 'off',
      cam: [F(0, 1300, 1.3, 1450), F(1, 1320, 1.38, 1450)],
      actors: {
        mama: [[0, { x: 1010, f: 1, pose: 'stand', expr: 'firm' }], [1.3, { x: 1235 }], [1.8, { crouch: 1, pose: 'holdhands' }]],
        doudou: [[0, { x: 1410, f: -1, pose: 'lookhands', expr: 'worry' }], [1.5, { pose: 'handsout' }]],
      },
      lines: [{ who: 'mama', text: '停。', at: 2.3 }, { who: 'mama', text: '妈妈不让你推人。', at: '+0.6' }],
    },
    { // 6 Mama points to Mimi: the consequence
      music: 'off',
      cam: [F(0, 1330, 1.3, 1450), F('L0+0.5', 1330, 1.3, 1450), F('L1', 1470, 1.08, 1430)],
      actors: {
        mama: [[0, { x: 1235, f: 1, crouch: 1, pose: 'holdhands', expr: 'firm' }], ['L0+0.2', { pose: 'point', crouch: 0.7 }]],
        doudou: [[0, { x: 1410, f: -1, pose: 'handsout', expr: 'worry' }], ['L0+0.6', { f: 1, pose: 'stand' }]],
        mimi: [[0, { x: 1610, f: -1, sit: 1, pose: 'rubknee', expr: 'cry' }]],
        tumama: [[0, { x: 1950, f: -1, pose: 'stand', expr: 'worry' }], ['L0+1.4', { x: 1730 }], ['L0+1.8', { crouch: 1, pose: 'comfort' }]],
      },
      props: { pinwheel: [[0, { x: 1690, y: 1492, rot: 82 }]] },
      lines: [{ who: 'mama', text: '你推了米米，米米摔倒了。', at: 0.4 }, { who: 'mama', text: '它很疼，在哭。', at: '+0.4' }],
    },
    { // 7 go and care, give the pinwheel back
      music: 'soft', dur: 'L2e+3.4',
      cam: [F(0, 1480, 1.15, 1430), F('L2e', 1540, 1.22, 1440)],
      actors: {
        mama: [[0, { x: 1130, f: 1, pose: 'stand', expr: 'gentle' }], [1.6, { x: 1340 }], ['L1-0.2', { crouch: 0.8 }]],
        doudou: [[0, { x: 1260, f: 1, pose: 'stand', expr: 'worry' }], [1.6, { x: 1470 }], ['L2e+0.2', { crouch: 1, pose: 'pick' }], ['L2e+0.9', { crouch: 0, pose: 'give' }], ['L2e+2.0', { pose: 'stand', expr: 'smile' }]],
        mimi: [[0, { x: 1640, f: -1, pose: 'stand', expr: 'sad' }], ['L2e+1.6', { pose: 'hold' }], ['L2e+1.9', { expr: 'smile' }]],
        tumama: [[0, { x: 1790, f: -1, crouch: 1, pose: 'comfort', expr: 'worry' }], ['L2e+2', { expr: 'smile' }]],
      },
      props: { pinwheel: [[0, { x: 1545, y: 1492, rot: 82 }], ['L2e+0.6', { att: 'doudou.R' }], ['L2e+1.6', { att: 'mimi.R' }]] },
      lines: [
        { who: 'mama', text: '我们去看看米米。', at: 0.3 },
        { who: 'mama', text: '米米，你疼吗？', at: '+0.5' },
        { who: 'doudou', text: '米米……疼吗？', at: '+0.4' },
      ],
      sfx: [{ at: 'L2e+0.5', s: 'rustle', g: 0.6 }, { at: 'L2e+1.6', s: 'whirr', g: 0.4 }],
    },
    { // 8 Mama teaches the replacement: wave
      music: 'soft', dur: 'L2e+1.6',
      cam: [F(0, 1240, 1.55, 1480), F('L2e', 1250, 1.65, 1490)],
      actors: {
        mama: [[0, { x: 1140, f: 1, crouch: 1, pose: 'handsout', expr: 'gentle' }], ['L2-0.1', { pose: 'wave', expr: 'happy' }]],
        doudou: [[0, { x: 1310, f: -1, pose: 'handsout', expr: 'neutral' }], ['L2+0.5', { pose: 'wave', expr: 'happy' }]],
      },
      lines: [
        { who: 'mama', text: '大朋友、小朋友，都不推。', at: 0.4 },
        { who: 'mama', text: '豆豆的小手，可以——', at: '+0.5' },
        { who: 'mama', text: '挥挥手！', at: '+0.2' },
      ],
    },
    { // 9 the mantra, first time
      music: 'theme', caption: false, tail: 1.0,
      mantra: { text: M4, lines: [0, 1, 2, 3] },
      cam: [F(0, 1230, 1.22, 1230)],
      actors: {
        mama: [[0, { x: 1110, f: 1, look: 'cam', pose: 'stand', expr: 'happy' }], ...mantraKeys(0)],
        doudou: [[0, { x: 1350, f: -1, look: 'cam', pose: 'stand', expr: 'happy' }], ...mantraKeys(0)],
      },
      lines: mantraLines(['mama', 'doudou']),
    },
    { // 10 a little later: back to the sandpit
      music: 'soft', dur: 5.2, caption: false,
      cam: [F(0, 1350, 0.92, 1420), F(3.4, 1830, 1.05, 1420), F(5.2, 1840, 1.07, 1420)],
      over: '过了一会儿',
      actors: {
        mama: [[0, { x: 1150, f: 1, pose: 'stand', expr: 'smile' }], [3.2, { x: 1560 }]],
        doudou: [[0, { x: 1300, f: 1, pose: 'stand', expr: 'smile' }], [3.3, { x: 1810 }], [4.0, { pose: 'lookhands', expr: 'thinking' }]],
        mimi: [[0, { x: 2000, f: -1, crouch: 1, pose: 'dig', expr: 'smile' }]],
        tumama: [[0, { x: 2330, f: -1, pose: 'stand', expr: 'smile' }]],
      },
      props: { bucket: [[0, { x: 2085, y: 1505 }]], shovel: [[0, { att: 'mimi.R' }]] },
      sfx: [{ at: 0.6, s: 'sand', g: 0.5 }, { at: 1.6, s: 'sand', g: 0.5 }, { at: 2.6, s: 'sand', g: 0.5 }],
    },
    { // 11 INTERACTIVE: what do the little hands do?
      music: 'wait', dur: 'L0e+4.6', caption: true,
      star: ['L0e+0.1', 'L0e+4.4'],
      cam: [F(0, 1820, 2.25, 1560), F('L0e', 1820, 2.4, 1570)],
      actors: { doudou: [[0, { x: 1810, f: 1, pose: 'lookhands', expr: 'thinking' }], [1.1, { look: 'cam', pose: 'stand', expr: 'neutral' }], ['L0e+1.5', { expr: 'smile' }]] },
      lines: [{ who: 'nar', text: '豆豆的小手，要做什么呢？', at: 1.3 }],
    },
    { // 12 the right choice
      music: 'happy', dur: 'L1e+1.4',
      cam: [F(0, 1900, 1.22, 1440), F('L1e', 1905, 1.3, 1450)],
      actors: {
        doudou: [[0, { x: 1810, f: 1, pose: 'clasp', expr: 'smile' }], [0.7, { pose: 'wave', expr: 'happy' }], ['L0e+0.2', { pose: 'stand' }]],
        mimi: [[0, { x: 2000, f: -1, crouch: 1, pose: 'dig', expr: 'neutral' }], ['L0e-0.6', { crouch: 0, pose: 'stand', expr: 'happy' }], ['L1', { pose: 'wave', expr: 'joy' }]],
      },
      props: { bucket: [[0, { x: 2085, y: 1505 }]], shovel: [[0, { att: 'mimi.R' }], ['L0e-0.6', { x: 2045, y: 1500, rot: 70 }]] },
      lines: [{ who: 'doudou', text: '米米，你好！我们一起玩吧！', at: 0.9 }, { who: 'mimi', text: '好！', at: '+0.3' }],
    },
    { // 13 playing together
      music: 'happy', dur: 7, caption: false,
      cam: [F(0, 1950, 1.02, 1420), F(7, 1960, 1.14, 1430)],
      actors: {
        mama: [[0, { x: 1590, f: 1, pose: 'stand', expr: 'smile' }]],
        tumama: [[0, { x: 2330, f: -1, pose: 'stand', expr: 'smile' }]],
        doudou: [[0, { x: 1890, f: 1, crouch: 1, pose: 'dig', expr: 'joy' }], [3.0, { pose: 'give', expr: 'happy' }], [4.4, { pose: 'dig', expr: 'joy' }]],
        mimi: [[0, { x: 2030, f: -1, crouch: 1, pose: 'dig', expr: 'joy' }], [3.4, { pose: 'take', expr: 'happy' }], [4.6, { pose: 'dig', expr: 'joy' }]],
      },
      props: { bucket: [[0, { x: 1960, y: 1512 }]], shovel: [[0, { att: 'doudou.R' }], [3.7, { att: 'mimi.R' }]] },
      sfx: [{ at: 0.5, s: 'sand', g: 0.6 }, { at: 1.4, s: 'sand', g: 0.6 }, { at: 2.3, s: 'sand', g: 0.6 }, { at: 4.9, s: 'sand', g: 0.6 }, { at: 5.8, s: 'sand', g: 0.6 }],
    },
    { // 14 praise that names the effect on the other
      music: 'soft', dur: 'L2e+1.2',
      cam: [F(0, 1735, 1.65, 1500), F('L2e', 1740, 1.75, 1505)],
      order: ['mama', 'doudou'],
      actors: {
        mama: [[0, { x: 1660, f: 1, crouch: 1, pose: 'hug', expr: 'gentle', armsFront: 1 }], ['L1', { expr: 'happy' }]],
        doudou: [[0, { x: 1775, f: -1, pose: 'stand', expr: 'joy' }], ['L2', { pose: 'open', look: 'cam' }]],
      },
      lines: [
        { who: 'mama', text: '你挥挥手，米米就和你一起玩了。', at: 0.4 },
        { who: 'mama', text: '米米笑啦！', at: '+0.3' },
        { who: 'doudou', text: '我也开心！', at: '+0.3' },
      ],
    },
    { // 15 say it together
      music: 'theme', tail: 2.2, caption: true,
      mantra: { text: M4, lines: [1, 2, 3, 4] },
      cam: [F(0, 1790, 1.5, 1250), F('L0e', 1790, 1.42, 1240)],
      actors: { doudou: [[0, { x: 1790, f: 1, look: 'cam', pose: 'open', expr: 'happy' }], ...mantraKeys(1), ['L4e+0.5', { pose: 'wave' }]] },
      lines: [{ who: 'doudou', text: '和我一起说——', at: 0.3 }, ...mantraLines(['doudou', 'nar'])],
    },
  ],
};
