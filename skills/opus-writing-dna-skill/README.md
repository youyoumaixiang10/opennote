# Opus 4.6 写作 DNA

> 从 Claude Opus 4.6 的写作决策机制中反向提炼的写作能力内核。
> 喂给任何 AI 模型，都能让它的写作质量明显提升。

## 这是什么

一份提示词文件（SKILL.md），包含 Opus 4.6 在写作时的五层决策机制：

1. **感知层** — 动笔前判断文字任务、读者状态、说话人设
2. **结构层** — 按读者认知路径排列信息，而非按信息类别
3. **语言层** — 具体替代抽象、节奏感、类比、反 AI 味词汇表
4. **元认知层** — 写完后的五项自检（删减/替换/出声/So what/AI味）
5. **规则打破层** — 什么时候可以违反以上所有规则

## 安装方法

### Claude（推荐）

1. 打开 [claude.ai](https://claude.ai)
2. 左侧栏点击「Projects」→ 新建一个项目
3. 在项目设置中，找到「Project Knowledge」
4. 上传 `SKILL.md` 文件
5. 在该项目内的对话中，Claude 会自动应用这份写作 DNA

### 扣子（Coze）

1. 打开 [coze.cn](https://www.coze.cn) 或 [coze.com](https://www.coze.com)
2. 创建或编辑一个 Bot
3. 在「人设与回复逻辑」中，把 SKILL.md 的全部内容粘贴进去
4. 或者在「知识库」中上传 SKILL.md 文件

### GPT（ChatGPT）

1. 打开 [chatgpt.com](https://chatgpt.com)
2. 点击右上角头像 →「Customize ChatGPT」
3. 在「How would you like ChatGPT to respond?」里粘贴 SKILL.md 内容
4. 或者创建一个 GPTs，在 Instructions 中粘贴

### 豆包 / Kimi / 其他

在对话框的「系统提示词」「自定义指令」或「人设」位置，粘贴 SKILL.md 的全部内容即可。

## 来源

由 Claude Opus 4.6 对自身写作决策过程进行逆向工程生成。
由「歪歪小姐的AI进化岛」整理发布。

## 协议

免费使用，欢迎分享。转载请注明来源。
