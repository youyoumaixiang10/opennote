// Original lyrics (story of the traditional counting rhyme, retold in our own words)
export const NUM = ["Zero", "One", "Two", "Three", "Four", "Five"];
export const NUM_ZH = ["零", "一", "二", "三", "四", "五"];
export const WORDS = {
  5: { en: "monkey", zh: "猴子" },
  4: { en: "bed", zh: "床" },
  3: { en: "jump", zh: "跳" },
  2: { en: "head", zh: "头" },
  1: { en: "doctor", zh: "医生" },
};

export function buildLines() {
  const L = [];
  L.push({ id: "intro1", part: "intro", en: "Hello, friends! Let's sing, count, and learn with five little monkeys!", zh: "小朋友们好！一起和五只小猴子唱歌、数数、学英语吧！", gap: 0.8 });
  for (let n = 5; n >= 1; n--) {
    const m = n - 1;
    const N = NUM[n];
    const w = WORDS[n];
    const v = `v${n}`;
    L.push({ id: `${v}a`, part: v, kind: "jump", n,
      en: n > 1 ? `${N} little monkeys jump, jump, jump on the bed!` : `One little monkey jumps, jumps, jumps on the bed!`,
      zh: `${NUM_ZH[n]}只小猴子，在床上跳呀跳呀跳！`, gap: 0.5 });
    L.push({ id: `${v}b`, part: v, kind: "fall", n,
      en: n > 1 ? "One slipped off... bonk! And bumped a head." : "Oh no, it slipped off... bonk! And bumped a head.",
      zh: n > 1 ? "一只滑下来……咚！撞到了头。" : "哎呀，它也滑下来……咚！撞到了头。", gap: 0.5 });
    L.push({ id: `${v}c`, part: v, kind: "call", n,
      en: "Mama monkey called the doctor. Ring, ring!",
      zh: "猴妈妈给医生打电话。叮铃铃！", gap: 0.4 });
    L.push({ id: `${v}d`, part: v, kind: "doctor", n,
      en: "The doctor said: Beds are for sleeping, not for jumping!",
      zh: "医生说：床是用来睡觉的，不是用来跳的！", gap: 0.8 });
    L.push({ id: `${v}e`, part: v, kind: "math", n,
      en: m > 0 ? `${N} take away one makes ${NUM[m].toLowerCase()}. ${n} minus 1 equals ${m}!` : `One take away one makes zero. No monkeys on the bed!`,
      zh: m > 0 ? `${n} 减 1 等于 ${m}！还剩${NUM_ZH[m]}只小猴子。` : `1 减 1 等于 0！床上没有小猴子啦。`, gap: 0.6 });
    L.push({ id: `${v}f`, part: v, kind: "word", n,
      en: `Word time! ${w.en}. Say it with me: ${w.en}!`,
      zh: `学单词：${w.en}，${w.zh}！跟我一起说：${w.en}！`, gap: 1.0 });
  }
  L.push({ id: "out1", part: "outro", kind: "sleep", en: "Now every little monkey is tucked in bed. Shh... good night!", zh: "现在所有的小猴子都乖乖躺在床上啦。嘘……晚安！", gap: 0.6 });
  L.push({ id: "out2", part: "outro", kind: "count", en: "Let's count down together: five, four, three, two, one, zero!", zh: "我们一起倒数：五、四、三、二、一、零！", gap: 0.6 });
  L.push({ id: "out3", part: "outro", kind: "review", en: "Monkey, bed, jump, head, doctor. You did it! Great job!", zh: "猴子、床、跳、头、医生。你真棒！", gap: 1.5 });
  return L;
}
