---
format: 1080x1920
message: "一位大师的框架再强也有盲区——把十位大师组成智囊团，按问题匹配、互相补盲，才能看到全貌"
arc: concept-explainer with story
audience: 关注个人成长与职场决策的中文短视频观众，听说过"AI蒸馏人物"但没想过组团
mode: autonomous
music: thoughtful warm minimal, understated curiosity, low-key electronic-acoustic
---

## Video direction

- **palette system**（来自 frame.md，claude 预设）: canvas = cream（暖纸面，永不纯白）；主文字 = ink；珊瑚 coral 是稀缺"电压"——每帧最多一个强调词/一个强调元素；卡片 = tile / tile-strong；navy 深面仅用于 Frame 10 的"安装卡"（代码声部）；✱ 珊瑚花标是全片唯一装饰符号，小而克制。
- **type roles**: 大字/金句 = display（衬线，中文回退 Noto Serif CJK）；说明/正文 = body；kicker/标签/路径 = mono 大写小字距。中文竖版：字更大、每行更短，英雄元素锚定 y≈0.42×高度。
- **motion grammar + reveal model**: 一切入场用长尾平滑收尾（power3 级），禁止弹跳/overshoot。每帧按 VO 分句揭示——t=0 只出现正在说的内容，后续元素等到被念到才进场，揭示分布在后半段。落定后保持静止，最多 subtle jitter；不做懒呼吸、不做后半段慢推拉。
- **rhythm / held frames**: Frame 9（分歧）和 Frame 11（落点）是刻意的呼吸帧——单一克制动作后长读秒；Frame 8 是信息密度最高的高潮帧。
- **consistent stage**: Frame 4→5 共用"十张名牌卡"舞台（网格→收成环）；Frame 5→6 共用同一 cream 舞台，push-slide UP 作为机制段落的统一接缝。
- **negative list**: 不出现弹跳缓动、紫蓝"AI感"渐变与漂浮 bokeh、浏览器边框/导航条/真实截图、纯 #000/#fff；两种运动失败模式都禁止——幻灯片式（前 25% 全倒出然后冻结）与屏保式（所有元素各自漂浮）。

## Frame 1 — 钩子：眼镜不是大脑

- scene: 纯排版开场——"最强大脑"被划掉，原位换上"十副不同的眼镜"，词语替换即是动作
- voiceover: "你缺的不是一个最强大脑——是十副不同的眼镜。"
- duration: 6s
- transition_in: cut
- status: outline
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Counterintuitive claim（反直觉宣言）
- beat: surprise + intrigue
- blueprint: kinetic-type-beats (Reproduce)
- focal: 替换后的英雄词"十副不同的眼镜"
- roles: 两行大字 = foreground subject · 细线网格+双径向光晕 = background（dim ~40%）· 珊瑚✱花标 = supporting
- sfx: whoosh-soft, tick

Scene 1 (0.0–2.2s): cream 纸面 + 细线网格微光晕铺底；随 VO "你缺的不是"逐词进场（per-word staggered reveal → dynamic-content-sequencing），"最强大脑"以 display 大字落在 y≈0.42 居中，占幅约 50%，长尾收稳。
Scene 2 (2.2–4.2s): 破折号处一道墨色删除线横穿"最强大脑"（SVG self-draw → svg-path-draw），该词降到 40% 灰度并缩小让位；VO 念到"十副不同的眼镜"时原位硬切换词（hard-cut word-swap → discrete-text-sequence），新词更大一档，"眼镜"两字用 coral 强调，尺寸对比 3:1。
Scene 3 (4.2–6.0s): 版面锁定持读；仅英雄词上留 subtle jitter（sine-wave-loop 低幅档），✱ 花标在角落一次 keyword glow 后归于静止。

narrativeRole: 用一句反直觉宣言打开认知缺口：问题不在"更聪明"，在"更多视角"。全片都在兑现这句话。
keyMessage: 解决难题靠的不是单个更强的头脑，而是多个不同的视角。

## Frame 2 — 痛点：单个大师有盲区

- scene: 一束聚光灯照亮画面一角，光圈外的阴影里浮现"盲区"——射程与盲区同时可见
- voiceover: "今年很流行把一个人的思维蒸馏成AI，随时调用他的视角。但任何一个大师的框架——再强，也有他看不到的地方。"
- duration: 9s
- transition_in: crossfade
- status: outline
- src: compositions/frames/02-blindspot.html
- type: pain_point
- persuasion: Common-belief vs reality（共识与现实对照）
- beat: recognition + unease
- blueprint: kinetic-type-beats (Adapt)
- focal: 聚光灯圆形光域，以及光域外的"盲区"二字
- roles: 聚光圆 + 圈内关键词 = foreground subject · 圈外暗场 = background（dim ~65%）· 顶部"蒸馏"小图形 = supporting
- sfx: whoosh-soft

Adapt: 保留 kinetic-type-beats 的"短句各自落台"签名节拍，但把后半段的台面换成聚光灯图形隐喻——文字节拍不变，光圈成为第三拍的主角。
Scene 1 (0.0–3.2s): 上三分之一处，一个抽象头像轮廓 token 经 scale-swap 化成一页文档图标（SVG self-draw 勾边），旁注 mono kicker "蒸馏"；随 VO "随时调用他的视角"下方 body 短句逐词进场。上下堆叠（竖版 stacked band），3 层景深。
Scene 2 (3.2–6.4s): VO 到"但"——一个大墨色圆形光域（约占画面 55%，rule-of-thirds 偏上）crossfade 进场，圈内亮着"框架""判断""原则"几个词卡；圈外整体压暗 65%（depth-of-field-blur 弱档）。
Scene 3 (6.4–9.0s): VO "看不到的地方"——圈外阴影里"盲区"两字以 coral 亮起（keyword glow → asr-keyword-glow），一次辉光后全画面静止持读。

narrativeRole: 承认"蒸馏单人"有价值，再指出它的结构性缺陷：每种认知框架都有射程，也都有盲区。
keyMessage: 不是大师不够强，是任何单一框架都有照不到的地方。

## Frame 3 — 命名概念：组一个智囊团

- scene: 芒格"锤子与钉子"一闪而过，十个空席位围成一圈点亮，中央落下标题"大师智囊团"
- voiceover: "芒格说过：手里只有锤子，看什么都像钉子。所以——既然能蒸馏一个人，为什么不把十位大师，组成一个智囊团？"
- duration: 10s
- transition_in: crossfade
- status: outline
- src: compositions/frames/03-council.html
- type: product_intro
- persuasion: Citation + rhetorical question（引证+设问）
- beat: clarity + anticipation
- blueprint: constellation-hub (Reproduce)
- focal: 中央标题卡"大师智囊团"
- roles: 中央标题卡 = foreground subject · 十个席位节点环 = supporting · cream 纸面+细环导线 = background
- sfx: whoosh-soft, thock

Scene 1 (0.0–3.5s): 引言"手里只有锤子，看什么都像钉子。"在上三分之一逐词进场（per-word staggered reveal），下方 mono kicker "——查理·芒格"；余下画面留白蓄势。
Scene 2 (3.5–7.0s): VO "为什么不把十位大师"——引言经 scale-swap 缩小让位；十个空席位圆片（tile 色，细墨描边）绕椭圆环staggered 弹入并落位（orbit-3d-entry，入场后环缓转），环心留空。
Scene 3 (7.0–10.0s): VO "组成一个智囊团"——标题"大师智囊团"带 ✱ 花标 spring-pop 平滑落进环心（spring-pop-entrance，长尾收稳，无过冲），环停转归静；轻微整体 push-in 后完全静止（signature：ring assembles → camera resolves on the core）。

narrativeRole: 给解法命名——"大师智囊团"正式登场，成为全片的主角概念。
keyMessage: 解法是把多位大师组成一个团，用不同框架同时看同一件事。

## Frame 4 — 十位大师名单

- scene: 十张名牌卡按梯次浮现成 2×5 网格，每张＝人名＋管辖域一词
- voiceover: "从古希腊、先秦，到当代硅谷——十种互不重叠的认知框架：有人管决策，有人破约束，有人算杠杆，有人解内耗。"
- duration: 10s
- transition_in: push-slide UP
- status: outline
- src: compositions/frames/04-roster.html
- type: feature_showcase
- persuasion: Numbered enumeration（清单列举）
- beat: fascination
- blueprint: grid-card-assemble (Reproduce)
- focal: 十张名牌卡组成的 2×5 网格
- roles: 名牌卡网格 = foreground subject（占幅 ~60%）· 顶部年代细带 = supporting · cream 纸面 = background
- sfx: tick, whoosh-soft

卡片文案（人名 display + 管辖域 mono kicker）：芒格·决策｜马斯克·破界｜纳瓦尔·杠杆｜达里奥·复盘｜孙子·竞争｜曾国藩·执行｜稻盛和夫·初心｜荣格·内耗｜苏格拉底·追问｜老子·反转。
Scene 1 (0.0–2.5s): VO "从古希腊、先秦，到当代硅谷"——顶部一条 full-width 年代细带自左向右 SVG 自绘展开（svg-path-draw）：古希腊 · 先秦 · 晚清 · 当代，mono 小字依次点亮。
Scene 2 (2.5–8.0s): 十张名牌卡分四波梯次瀑布进场（staggered cascade → grid-card-assemble signature），四波分别踩在"管决策/破约束/算杠杆/解内耗"四个 VO 分句上；2 列 × 5 行竖排网格，锚定画面中带，卡片一律长尾收稳。
Scene 3 (8.0–10.0s): 网格锁定；苏格拉底、老子两张卡右上角翻出 coral 小标签"方法"（card corner flip），随后全网格静止持读。

narrativeRole: 展示阵容的广度与互补性：跨文化、跨时代，管辖域互不重叠。
keyMessage: 十位大师不是拼名气，是拼认知覆盖度——各管一类难题。

## Frame 5 — 机制一：按问题匹配

- scene: 问题气泡落在中央，十张卡只有三张点亮聚拢，其余暗下去
- voiceover: "不是十个人一起上。抛出你的难题，系统自动匹配最相关的三四位——而且每位大师都标注了，什么问题别来找我。"
- duration: 9s
- transition_in: push-slide UP
- status: outline
- src: compositions/frames/05-routing.html
- type: feature_showcase
- persuasion: Demonstration（机制演示）
- beat: comprehension
- blueprint: constellation-hub (Adapt)
- focal: 中央问题气泡"我的难题"
- roles: 问题气泡 = foreground subject · 十个迷你名牌节点环 = supporting · 未命中节点压暗层 = background dim
- sfx: tick, whoosh-soft

Adapt: 保留 constellation-hub 的"节点环+向核心汇聚"签名，但 hub 从品牌标改为问题气泡；延续 Frame 4 的名牌舞台（同一批卡缩小成环，consistent stage）。
Scene 1 (0.0–2.5s): VO "不是十个人一起上"——上一帧的十张名牌缩小为十个迷你节点，收拢成一个椭圆环（cluster→outward 的逆向收拢 → center-outward-expansion 反向使用），全部亮着。
Scene 2 (2.5–6.0s): VO "抛出你的难题"——tile 色问题气泡（"我的难题"）平滑落入环心（spring-pop-entrance 平滑档）；三个节点亮起 coral 并各自向气泡自绘一条细连线（avatar-cloud-network 的连线签名），其余七个降到 30% 亮度并轻微失焦（depth-of-field-blur）。
Scene 3 (6.0–9.0s): VO "什么问题别来找我"——一个暗节点翻面，露出 mono 小牌"失效区 ✗"（card corner flip）；全画面静止持读，气泡上仅留 subtle jitter。

narrativeRole: 讲第一层机制：自动路由＋诚实边界，防止AI无所不知地胡说。
keyMessage: 系统按问题匹配大师，问题落在失效区时大师会明说"这不是我擅长的"。

## Frame 6 — 机制二：三个席位

- scene: 三个席位依次亮牌：方向位→机制位→反方位；反方位牌下一道裂纹划过前两者的共同底座
- voiceover: "出场也有分工：方向位定往哪走，机制位给出具体动作——反方位，专门攻击他们的共同前提。如果所有人都同意，说明还有什么，你们都没看到。"
- duration: 11s
- transition_in: push-slide UP
- status: outline
- src: compositions/frames/06-seats.html
- type: feature_showcase
- persuasion: Rule of three + frame-then-fill（三分结构）
- beat: aha
- blueprint: grid-card-assemble (Adapt)
- focal: 第三张"反方位"席位卡
- roles: 三张席位卡竖排 = foreground subject · 底座横条+裂纹线 = supporting · cream 舞台 = background
- sfx: thock, tick

Adapt: 保留 grid-card-assemble 的梯次自组装签名，但改为竖版三段堆叠（stacked band），并追加一道 SVG 裂纹作为反方位的语义动作。
Scene 1 (0.0–3.0s): VO "方向位定往哪走"——席位卡一（"方向位 · 定往哪走"）push-slide UP 滑入上段位，底部一条 tile 底座横条同时展开。
Scene 2 (3.0–5.5s): VO "机制位给出具体动作"——席位卡二滑入中段位，同样收稳；三段布局（竖向 triptych）此时留着空的下段位制造期待。
Scene 3 (5.5–8.0s): VO "反方位，专门攻击他们的共同前提"——席位卡三带 coral 描边落入下段位（kinetic beat-slam 的单拍重落，平滑收尾）；一道裂纹自它脚下沿底座向上两卡方向 SVG 自绘划过（svg-path-draw）。
Scene 4 (8.0–11.0s): VO "你们都没看到"——"反方位"三字一次 keyword glow；全部静止持读。

narrativeRole: 讲第二层机制：席位角色让多位大师真正回应同一问题的不同面，反方专职补盲区。
keyMessage: 反方不是抬杠，是制度化地寻找所有人共同的盲区。

## Frame 7 — 实测：35岁之问

- scene: 干净的提问卡压场："35岁还没升到管理层，怎么办？"下方三个名牌滑入
- voiceover: "实测一个扎心问题：35岁还没升到管理层，怎么办？系统派出纳瓦尔、稻盛和夫——和唱反调的荣格。"
- duration: 9s
- transition_in: cut
- status: outline
- src: compositions/frames/07-case.html
- type: social_proof
- persuasion: Worked example（真实案例）
- beat: tension + recognition
- blueprint: kinetic-type-beats (Reproduce)
- focal: 提问卡"35岁还没升到管理层，怎么办？"
- roles: 提问大字卡 = foreground subject（占幅 ~55%）· 三个出场名牌 = supporting · cream 纸面+细网格 = background
- sfx: thock, tick

Scene 1 (0.0–3.5s): mono kicker "实测 CASE 01" 打字机点出（type-on with caret → discrete-text-sequence）；随 VO 提问句以 display 大字整卡上滑进场（单拍 beat-slam，平滑收稳），"35岁"用 coral 强调，卡片锚定 y≈0.42。
Scene 2 (3.5–7.0s): 三个名牌按 VO 报名依次滑入提问卡下方一行（per-cue 进场）：纳瓦尔·方向位｜稻盛和夫·机制位｜荣格·反方位——荣格牌 coral 描边以预示反调。
Scene 3 (7.0–9.0s): 版面静止持读。

narrativeRole: 把抽象机制放进一个人人有感的真实难题，开启内嵌故事线。
keyMessage: 这套系统怎么运转，用一个高频职场难题现场验证。

## Frame 8 — 三个视角

- scene: 同一舞台，三段引言卡随旁白依次替换：纳瓦尔（清单）→稻盛和夫（动机）→荣格（标准是谁定的）
- voiceover: "纳瓦尔说：先列清单——不靠经理头衔也能被市场付费的能力，你有几项？稻盛和夫问：你是真想带团队，还是只觉得到年龄该有头衔了？荣格只反问一句：35岁该到哪，这个标准——到底是你自己的，还是别人替你定的？"
- duration: 17s
- transition_in: push-slide UP
- status: outline
- src: compositions/frames/08-perspectives.html
- type: social_proof
- persuasion: Progressive disclosure + comparison（逐层揭示三种视角）
- beat: comprehension + aha
- blueprint: grid-card-assemble (Adapt)
- focal: 当前发言者的引言卡（每个时段一张）
- roles: 引言卡 = foreground subject（占幅 ~55%，居中）· 顶部三人小名牌导航轨 = supporting · cream 舞台 = background
- sfx: tick, whoosh-soft

Adapt: 保留梯次组装签名用于卡内元素（清单项/选项），卡与卡之间用 scale-swap 同心交接（scale-swap-transition），三张卡共用同一舞台不换景。
Scene 1 (0.0–5.5s): 顶部三人小名牌轨进场，纳瓦尔牌点亮；引言卡一居中：“不靠头衔也能被市场付费的能力，你有几项？”关键短语逐词进场；卡内三个空白勾选框随 VO "先列清单"梯次浮现（微型 grid-card-assemble）。
Scene 2 (5.5–11.0s): scale-swap 交接到稻盛和夫卡（顶轨焦点随之移动）：两行选项上下堆叠——“真想带团队” / “到年龄该有头衔了”，第二行随 VO 质询降灰 40%，第一行留正色。
Scene 3 (11.0–17.0s): scale-swap 交接到荣格卡，节奏放慢：“这个标准——是你自己的，还是别人替你定的？”，"标准"二字画一枚手绘圈强调（css-marker-patterns 的 circle 档）；卡落定后完全静止长读。

narrativeRole: 案例的核心：三种框架对同一问题给出真正不同层面的回应，兑现"多副眼镜"的承诺。
keyMessage: 同一个问题，杠杆、动机、投射三个层面各有一套看法，且互相不可替代。

## Frame 9 — 分歧即价值

- scene: 两张卡与一张卡在一道分界线两侧对峙，上方浮出"分歧本身，就是答案的一部分"
- voiceover: "注意——他们没有和稀泥。策略能解决现实问题，解决不了内耗。这个分歧本身，就是答案的一部分。"
- duration: 10s
- transition_in: crossfade
- status: outline
- src: compositions/frames/09-divergence.html
- type: benefit_highlight
- persuasion: Distillation + counterexample（分歧点提炼）
- beat: conviction
- blueprint: titlecard-reveal (Reproduce)
- focal: 金句题卡"分歧本身，就是答案的一部分"
- roles: 金句题卡 = foreground subject · 分界细线+两侧阵营小牌 = supporting · cream 纸面 = background
- sfx: tick

呼吸帧：单一克制动作 + 长持读（signature：one restrained move, then a still hold）。
Scene 1 (0.0–4.0s): VO "他们没有和稀泥"——一条竖向 hairline 分界线自上而下自绘（svg-path-draw）；左侧滑入并排两枚小牌（纳瓦尔 / 稻盛和夫，注"想得通"），右侧一枚（荣格，注"想不通——先看情绪"），左右各 40% 幅面，竖版上下留足呼吸。
Scene 2 (4.0–7.0s): VO "解决不了内耗"落点后——金句题卡以 slide-up crossfade 单动作浮现于分界线上方（titlecard-reveal signature），display 衬线，"分歧"二字 coral。
Scene 3 (7.0–10.0s): 完全静止长读，无任何附加运动。

narrativeRole: 把案例升华为系统的核心价值：真正的视角差异被保留，而不是被平均掉。
keyMessage: 智囊团的价值不在共识，在被明确标出的分歧——它告诉你先解决哪类问题。

## Frame 10 — 开源与召集

- scene: 一张"安装卡"利落落下：GitHub 路径＋三行结构，下方一行"蒸馏你自己的大师，装进去"
- voiceover: "整个skill已经开源，装好后正常提问就会自动触发。你还可以蒸馏自己想要的大师，加进你的智囊团。"
- duration: 10s
- transition_in: push-slide UP
- status: outline
- src: compositions/frames/10-cta.html
- type: cta
- persuasion: Signposting（行动指引）
- beat: momentum + inspiration
- blueprint: titlecard-reveal (Adapt)
- focal: navy 安装卡（代码声部）
- roles: navy 安装卡 = foreground subject（占幅 ~55%）· 对话气泡 token 与 coral 召集行 = supporting · cream 纸面 = background
- sfx: whoosh-soft, tick

Adapt: 保留"单一克制动作展示一张卡"的签名，但卡为 navy 代码面（frame.md 的 code voice），卡内行随 VO 分句打字点亮，而非一次性铺满。
Scene 1 (0.0–4.0s): VO "整个skill已经开源"——navy 安装卡 slide-up crossfade 进场，卡头 mono 路径 `github.com/youyoumaixiang10/opennote` 打字机点出（type-on with caret）；随后三行结构逐行点亮：`SKILL.md — 路由器`、`roster.md — 名单速查`、`references/ — 十份大师档案`。
Scene 2 (4.0–7.5s): VO "正常提问就会自动触发"——卡上方浮出一个小对话气泡 token（tile 色，内有"提问…"），旁边 ✱ 花标一次 glow。
Scene 3 (7.5–10.0s): VO "蒸馏自己想要的大师"——卡下缘 coral 一行召集语进场："＋ 把你的大师，装进你的智囊团"；随后静止持读。

narrativeRole: 给出获取方式和可扩展性，把观众从理解推向行动。
keyMessage: 开源可装、提问即触发，而且智囊团可以按你的需要自定义。

## Frame 11 — 落点：全貌

- scene: 十个光点各自照亮画面一角，最后同时亮起拼成完整圆，压一行"一个人看到切面，一群人看到全貌"
- voiceover: "一个人看到的，是切面。一群人看到的——才是全貌。"
- duration: 8s
- transition_in: crossfade
- status: outline
- src: compositions/frames/11-outro.html
- type: branding
- persuasion: Callback + distillation（回扣钩子）
- beat: satisfaction + resolve
- blueprint: kinetic-type-beats (Adapt)
- focal: 两行收束金句
- roles: 金句两行 = foreground subject · 圆环与十个光点图形 = supporting（呼应 Frame 3 的席位环）· cream 纸面 = background
- sfx: tick, whoosh-soft

Adapt: 保留 beat-slam 的"分句各踩一拍"签名；图形层用"扇形→整圆"完成语义收束，呼应 Frame 3 的环。
Scene 1 (0.0–3.0s): VO "一个人看到的，是切面"——画面中上部一个大圆的细线轮廓上，仅一个光点亮起，从它出发 SVG 自绘出一个扇形切片（svg-path-draw）；第一行金句逐词进场。
Scene 2 (3.0–6.0s): VO "一群人看到的——才是全貌"——其余九个光点快速梯次点亮（staggered），扇形逐段补完成整圆；第二行金句进场，"全貌"coral 强调，字号高一档。
Scene 3 (6.0–8.0s): 整圆+两行金句完全静止长读；仅 ✱ 花标一次微光后归静。

narrativeRole: 回扣开场的"眼镜"隐喻，把全片压缩成一句可带走的话。
keyMessage: 多视角不是锦上添花，是看清全貌的唯一方式。
