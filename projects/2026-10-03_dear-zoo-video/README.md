# Dear Zoo — 2岁宝宝英语启蒙绘本视频

成片：`dear-zoo.mp4`（1920×1080，约 4 分 42 秒，带英文朗读、音效和轻柔背景音乐）

## 画面

- 小男孩、红色木箱（FROM THE ZOO）、大象、猴子直接取自参考图，原图抠出后重新排版成 16:9，文字已擦除后用动画重写
- 长颈鹿、狮子、骆驼、蛇、青蛙、小狗按参考图风格手绘（黑色描边 + 平涂 + 粉色腮红），都从同一个木箱里冒出来
- 故事文字用接近原书的衬线体，重点词标红

## 每只动物的学习环节（8 只动物都一样，形成可预期的节奏）

1. **猜一猜**：「Who's in the box?」箱子晃动 + 拟声词提示（Stomp! / Roar! / Hiss! / Ribbit! …）
2. **一起数**：「One, two, three!」三个彩色数字依次弹出 → 动物出场
3. **读原文**：「They sent me a giraffe.」动物名变红放大
4. **单词卡**：吊牌样式大字卡（首字母红色）→ 慢速读一遍 →「Can you say giraffe?」→ **Your turn! 停顿约 2.5 秒让宝宝跟读**（三个圆点依次变绿）→ 表扬
5. **形容词**：「He was too tall!」字体形状模仿词义（big 变大、tall 拉高、fierce 发抖、jumpy 跳动……）
6. **动作互动（TPR）**：让宝宝跟着做——张开双臂 / 踮脚伸高 / 学狮子吼 / 做生气脸 / 捂眼睛 / 跳一跳 / 抱一抱
7. **送回去**：「So I sent him back.」+「Bye-bye, giraffe!」挥手告别

结尾：8 只动物复习墙（每个停顿让宝宝说）→ 4 道二选一小游戏（Who was too big? …）→ The End。

## 重新生成

```bash
cd src
python3 prep.py && python3 prep2.py   # 从 reference.png 抠图（需要 pillow numpy）
python3 animals.py                    # 生成动物 SVG
python3 build.py                      # Kokoro TTS 生成朗读 + 合成音频 + 生成 index.html
npx hyperframes render -f 30 -o dear-zoo.mp4
```

注：故事原文来自 Rod Campbell 的绘本 *Dear Zoo*，此视频仅供家庭学习使用。
