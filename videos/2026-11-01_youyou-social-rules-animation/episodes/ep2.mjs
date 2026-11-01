// 第2集《别人的玩具先问问》 — with Baba. Bench seat at y≈1392, ground y=1500.
const ZK = 1.5;
const F = (t, cx, z, g = 1420) => { const Z = z * ZK, G = 960 + (g - 960) * 1.25; return [t, cx, 1500 - (G - 960) / Z, Z]; };
const M4 = ['别人的', '背背手', '先问问', '可以吗'];
const MP = ['point', 'behind', 'tapmouth', 'shrug'];
const mantraLines = (who) => M4.map((text, i) => ({ who, text: text + (i === 3 ? '？' : '，'), at: i === 0 ? '+0.4' : '+0.3', gain: 0.9 }));
const mantraKeys = (base) => MP.map((pose, i) => [`L${base + i}-0.1`, { pose, tilt: i === 3 ? 10 : 0 }]);
const SEAT = 1366;

export default {
  id: 'ep2', title: ['第2集', '别人的玩具先问问'],
  set: { trees: [250, 2800], benches: [[1400, 1470]], basket: [1960, 1490], flowers: true, clouds: [[800, -600, 1], [1800, -250, 1.1], [2700, -650, 0.9], [300, 250, 0.8]] },
  shots: [
    { // 0 wide: Baba and Doudou with the red ball
      title: { from: 0.3 }, music: 'theme', dur: 6.0,
      cam: [F(0, 2200, 0.6, 1380), F(6, 2060, 0.64, 1390)],
      actors: {
        baba: [[0, { x: 2600, f: -1, pose: 'stand', expr: 'smile' }], [5.4, { x: 2160 }]],
        doudou: [[0, { x: 2460, f: -1, pose: 'hugbox', expr: 'happy' }], [5.4, { x: 2020 }]],
      },
      props: { ball: [[0, { att: 'doudou.R' }]] },
      lines: [{ who: 'nar', text: '今天，爸爸带豆豆来公园。', at: 2.6 }],
    },
    { // 1 Gaga on the bench, putting leaves in a bucket; Doudou comes to look
      music: 'theme', dur: 5.0,
      cam: [F(0, 1520, 1.0), F(5, 1480, 1.08)],
      actors: {
        baba: [[0, { x: 1950, f: -1, pose: 'hugbox', expr: 'smile' }]],
        gaga: [[0, { x: 1290, y: SEAT, f: 1, sit: 1, pose: 'dig', expr: 'smile' }]],
        doudou: [[0, { x: 1820, f: -1, pose: 'stand', expr: 'neutral' }], [3.0, { x: 1590 }], [3.2, { expr: 'excited' }]],
      },
      props: { ball: [[0, { att: 'baba.R' }]], bucket: [[0, { x: 1440, y: SEAT, leaves: 1 }]] },
      sfx: [{ at: 0.8, s: 'rustle', g: 0.4 }, { at: 2.2, s: 'rustle', g: 0.4 }],
    },
    { // 2 the slap (once, short)
      music: 'off', dur: 3.0, caption: false,
      cam: [F(0, 1470, 1.3, 1450), F(3, 1480, 1.3, 1450)],
      actors: {
        gaga: [[0, { x: 1290, y: SEAT, f: 1, sit: 1, pose: 'stand', expr: 'smile' }], [1.2, { expr: 'surprise' }]],
        doudou: [[0, { x: 1590, f: -1, pose: 'stand', expr: 'excited' }], [0.4, { pose: 'slap' }], [0.75, { pose: 'stand', expr: 'surprise' }]],
      },
      props: { bucket: [[0, { x: 1440, y: SEAT, leaves: 1 }], [0.6, { x: 1440, y: SEAT, leaves: 1 }], [1.0, { x: 1480, y: 1505 }]], leaves: [[0, { hide: 1 }], [1.0, { x: 1470, y: 1520 }]] },
      sfx: [{ at: 0.6, s: 'tap', g: 0.6 }, { at: 1.0, s: 'thud', g: 0.35 }, { at: 1.0, s: 'rustle', g: 0.6 }],
    },
    { // 3a close: Gaga is sad
      music: 'off', dur: 2.8,
      cam: [F(0, 1330, 2.2, 1500), F(2.8, 1330, 2.3, 1505)],
      actors: { gaga: [[0, { x: 1290, y: SEAT, f: 1, sit: 1, pose: 'rubknee', expr: 'sad', tilt: 6 }]] },
      lines: [{ who: 'gaga', text: '我的树叶……', at: 0.4, gain: 0.85 }],
    },
    { // 3b close: Doudou
      music: 'off', dur: 2.4,
      cam: [F(0, 1590, 2.1, 1560), F(2.4, 1590, 2.2, 1560)],
      actors: { doudou: [[0, { x: 1590, f: -1, pose: 'stand', expr: 'surprise' }], [0.8, { pose: 'lookhands', expr: 'worry' }]] },
    },
    { // 4 Baba: stop, whose it is, what happened
      music: 'off',
      cam: [F(0, 1680, 1.3, 1450), F('L1', 1600, 1.15, 1440)],
      actors: {
        baba: [[0, { x: 1980, f: -1, pose: 'stand', expr: 'firm' }], [1.2, { x: 1770 }], [1.6, { crouch: 1, pose: 'holdhands' }], ['L1+0.3', { pose: 'point', crouch: 0.7 }]],
        doudou: [[0, { x: 1600, f: 1, pose: 'lookhands', expr: 'worry' }], [1.4, { pose: 'handsout' }], ['L1+0.6', { f: -1, pose: 'stand' }]],
        gaga: [[0, { x: 1290, y: SEAT, f: 1, sit: 1, pose: 'stand', expr: 'sad' }]],
      },
      props: { bucket: [[0, { x: 1480, y: 1505 }]], leaves: [[0, { x: 1470, y: 1520 }]] },
      lines: [
        { who: 'baba', text: '停。这是嘎嘎的小桶。', at: 2.0 },
        { who: 'baba', text: '你拍掉了，树叶都撒了，嘎嘎很难过。', at: '+0.5' },
      ],
    },
    { // 5 pick it up together, give it back
      music: 'soft', dur: 'L1e+1.6',
      cam: [F(0, 1520, 1.2, 1450), F('L1e', 1500, 1.25, 1450)],
      actors: {
        baba: [[0, { x: 1720, f: -1, crouch: 0.7, pose: 'stand', expr: 'gentle' }], [0.8, { crouch: 1, pose: 'pick' }], [2.6, { crouch: 0.6, pose: 'stand' }]],
        doudou: [[0, { x: 1590, f: -1, pose: 'stand', expr: 'worry' }], [0.9, { crouch: 1, pose: 'pick' }], [2.2, { crouch: 1, pose: 'pick' }], [2.8, { crouch: 0, pose: 'give', x: 1540 }], ['L1-0.1', { pose: 'give' }], ['L1e+0.4', { pose: 'stand', expr: 'smile' }]],
        gaga: [[0, { x: 1290, y: SEAT, f: 1, sit: 1, pose: 'stand', expr: 'sad' }], ['L1', { pose: 'take' }], ['L1e', { pose: 'hugbox', expr: 'smile' }]],
      },
      props: {
        leaves: [[0, { x: 1470, y: 1520 }], [2.4, { hide: 1 }]],
        bucket: [[0, { x: 1480, y: 1505 }], [2.6, { att: 'doudou.R', leaves: 1 }], ['L1+0.3', { att: 'gaga.R', leaves: 1 }]],
      },
      lines: [
        { who: 'baba', text: '掉了，我们捡起来。', at: 0.3 },
        { who: 'doudou', text: '给你。', at: 3.3 },
      ],
      sfx: [{ at: 1.2, s: 'rustle', g: 0.5 }, { at: 1.9, s: 'rustle', g: 0.5 }],
    },
    { // 6 Baba teaches: hands behind, ask first
      music: 'soft', dur: 'L1e+1.2',
      cam: [F(0, 1640, 1.55, 1480), F('L1e', 1640, 1.65, 1490)],
      actors: {
        baba: [[0, { x: 1750, f: -1, crouch: 1, pose: 'stand', expr: 'gentle' }], ['L0+0.6', { pose: 'behind' }], ['L1+0.4', { pose: 'tapmouth', expr: 'happy' }]],
        doudou: [[0, { x: 1580, f: 1, pose: 'stand', expr: 'neutral' }], ['L0+1.1', { pose: 'behind', expr: 'smile' }], ['L1+0.9', { pose: 'tapmouth', expr: 'happy' }]],
      },
      lines: [
        { who: 'baba', text: '别人的东西，小手背一背。', at: 0.4 },
        { who: 'baba', text: '想玩，先问问：“我可以玩吗？”', at: '+0.5' },
      ],
    },
    { // 7 the mantra, first time
      music: 'theme', caption: false, tail: 1.0,
      mantra: { text: M4, lines: [0, 1, 2, 3] },
      cam: [F(0, 1660, 1.22, 1230)],
      actors: {
        baba: [[0, { x: 1780, f: -1, look: 'cam', pose: 'stand', expr: 'happy' }], ...mantraKeys(0)],
        doudou: [[0, { x: 1540, f: 1, look: 'cam', pose: 'stand', expr: 'happy' }], ...mantraKeys(0)],
      },
      lines: mantraLines(['baba', 'doudou']),
    },
    { // 8 later: Gaga's little yellow car
      music: 'soft', dur: 5.0, caption: false, over: '过了一会儿',
      cam: [F(0, 1700, 0.95, 1420), F(5, 1430, 1.05, 1420)],
      actors: {
        gaga: [[0, { x: 1180, f: 1, crouch: 0.6, pose: 'drive', expr: 'joy' }], [1.6, { x: 1260 }], [3.2, { x: 1180 }], [5, { x: 1240 }]],
        doudou: [[0, { x: 1900, f: -1, pose: 'stand', expr: 'smile' }], [3.6, { x: 1480 }], [4.2, { expr: 'excited' }]],
        baba: [[0, { x: 2100, f: -1, pose: 'hugbox', expr: 'smile' }], [3.4, { x: 1800 }]],
      },
      props: { ball: [[0, { att: 'baba.R' }]], car: [[0, { att: 'gaga.R' }]] },
      sfx: [{ at: 0.4, s: 'roll', g: 0.5 }, { at: 2.0, s: 'roll', g: 0.5 }, { at: 3.6, s: 'roll', g: 0.5 }],
    },
    { // 9 INTERACTIVE: how do you ask?
      music: 'wait', dur: 'L0e+4.6',
      star: ['L0e+0.1', 'L0e+4.4'],
      cam: [F(0, 1480, 2.25, 1560), F('L0e', 1480, 2.4, 1570)],
      actors: { doudou: [[0, { x: 1480, f: -1, pose: 'stand', expr: 'excited' }], [0.7, { pose: 'behind', expr: 'neutral' }], [1.2, { look: 'cam' }], ['L0e+1.5', { expr: 'smile' }]] },
      lines: [{ who: 'nar', text: '豆豆想玩小车，要怎么说呢？', at: 1.3 }],
    },
    { // 10 asking — and hearing "wait"
      music: 'soft', dur: 'L1e+1.0',
      cam: [F(0, 1340, 1.35, 1450), F('L1e', 1340, 1.42, 1455)],
      actors: {
        doudou: [[0, { x: 1480, f: -1, pose: 'behind', expr: 'smile' }]],
        gaga: [[0, { x: 1210, f: 1, crouch: 0.6, pose: 'drive', expr: 'joy' }], ['L0e', { crouch: 0, pose: 'hugbox', expr: 'neutral' }]],
      },
      props: { car: [[0, { att: 'gaga.R' }]] },
      lines: [
        { who: 'doudou', text: '嘎嘎，我可以玩吗？', at: 0.5 },
        { who: 'gaga', text: '等一下，我还在玩。', at: '+0.4' },
      ],
    },
    { // 11 a little disappointed; Baba names the feeling, gives an outlet
      music: 'soft', dur: 'L2e+1.0',
      cam: [F(0, 1560, 1.6, 1490), F('L2e', 1560, 1.7, 1495)],
      actors: {
        doudou: [[0, { x: 1480, f: -1, pose: 'stand', expr: 'shy' }], ['L0+0.6', { f: 1 }], ['L1e', { expr: 'neutral' }], ['L2+0.8', { pose: 'hugbox', expr: 'smile' }]],
        baba: [[0, { x: 1660, f: -1, crouch: 1, pose: 'comfort', expr: 'gentle' }], ['L2', { pose: 'give' }]],
      },
      props: { ball: [[0, { att: 'baba.R' }], ['L2+0.8', { att: 'doudou.R' }]] },
      lines: [
        { who: 'baba', text: '你很想玩，有点着急，对吗？', at: 0.6 },
        { who: 'baba', text: '嘎嘎说等一下，我们就等一等。', at: '+0.4' },
        { who: 'baba', text: '先玩我们自己的球。', at: '+0.4' },
      ],
    },
    { // 12 throw your own ball into the basket
      music: 'happy', dur: 'L1e+0.8',
      cam: [F(0, 1830, 1.1, 1440), F('L1e', 1840, 1.15, 1445)],
      actors: {
        doudou: [[0, { x: 1700, f: 1, pose: 'hugbox', expr: 'excited' }], [0.6, { pose: 'throw' }], [1.2, { pose: 'open', expr: 'joy' }]],
        baba: [[0, { x: 1560, f: 1, pose: 'stand', expr: 'smile' }], [1.5, { pose: 'open', expr: 'happy' }]],
      },
      props: { ball: [[0, { att: 'doudou.R' }], [0.75, { x: 1760, y: 1300 }], [1.05, { x: 1880, y: 1250 }], [1.35, { x: 1960, y: 1440 }], [1.6, { hide: 1 }]] },
      lines: [
        { who: 'doudou', text: '进啦！', at: 1.5 },
        { who: 'baba', text: '扔自己的球，扔进筐里！', at: '+0.3' },
      ],
      sfx: [{ at: 0.7, s: 'pop', g: 0.4 }, { at: 1.4, s: 'ball', g: 0.7 }],
    },
    { // 13 Gaga brings the car: taking turns
      music: 'happy', dur: 'L1e+4.2',
      cam: [F(0, 1560, 1.15, 1440), F('L1e+4', 1560, 1.22, 1445)],
      actors: {
        gaga: [[0, { x: 1200, f: 1, pose: 'hugbox', expr: 'smile' }], [1.4, { x: 1430 }], ['L0', { pose: 'give', expr: 'happy' }], ['L1e', { crouch: 0.6, pose: 'drive', expr: 'joy' }]],
        doudou: [[0, { x: 1690, f: -1, pose: 'stand', expr: 'neutral' }], ['L0+0.6', { pose: 'take', expr: 'excited' }], ['L1e', { crouch: 0.6, pose: 'drive', expr: 'joy' }]],
      },
      props: {
        car: [[0, { att: 'gaga.R' }], ['L0+0.8', { att: 'doudou.R' }], ['L1e+0.2', { x: 1610, y: 1505, f: -1 }], ['L1e+1.2', { x: 1500, y: 1505, f: -1 }], ['L1e+2.2', { x: 1610, y: 1505, f: 1 }], ['L1e+3.2', { x: 1500, y: 1505, f: -1 }]],
      },
      lines: [
        { who: 'gaga', text: '豆豆，现在给你玩！', at: 1.6 },
        { who: 'doudou', text: '谢谢嘎嘎！', at: '+0.3' },
      ],
      sfx: [{ at: 'L1e+0.3', s: 'roll', g: 0.5 }, { at: 'L1e+1.3', s: 'roll', g: 0.5 }, { at: 'L1e+2.3', s: 'roll', g: 0.5 }],
    },
    { // 14 praise names what happened for the other one
      music: 'soft', dur: 'L0e+1.2',
      cam: [F(0, 1600, 1.5, 1480), F('L0e', 1600, 1.6, 1485)],
      actors: {
        baba: [[0, { x: 1760, f: -1, crouch: 1, pose: 'stand', expr: 'happy' }], [0.6, { pose: 'open' }], [1.2, { pose: 'stand' }]],
        doudou: [[0, { x: 1600, f: 1, pose: 'stand', expr: 'joy' }]],
        gaga: [[0, { x: 1430, f: 1, crouch: 0.6, pose: 'drive', expr: 'joy' }]],
      },
      props: { car: [[0, { x: 1500, y: 1505, f: 1 }]] },
      lines: [{ who: 'baba', text: '你先问了，还等了一等，嘎嘎就愿意和你一起玩了。', at: 0.5 }],
    },
    { // 15 say it together
      music: 'theme', tail: 2.2,
      mantra: { text: M4, lines: [1, 2, 3, 4] },
      cam: [F(0, 1600, 1.5, 1250), F('L0e', 1600, 1.42, 1240)],
      actors: { doudou: [[0, { x: 1600, f: 1, look: 'cam', pose: 'open', expr: 'happy' }], ...mantraKeys(1), ['L4e+0.5', { pose: 'wave', tilt: 0 }]] },
      lines: [{ who: 'doudou', text: '和我一起说——', at: 0.3 }, ...mantraLines(['doudou', 'nar'])],
    },
  ],
};
