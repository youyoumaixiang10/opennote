# 《最后一班船》 The Last Ship

一个可以直接在手机浏览器里玩通的 3D 叙事探索小游戏。竖屏、全程单指轻点，约 5–8 分钟。

> 傍晚，你被渡轮放在一座起雾的小岛上。灯塔是黑的，码头的木桩上别着一张纸条：
> 「今晚还有一班船。天黑以前，请把灯点起来。」

## 直接玩

**在线预览**：见交付说明里的 Artifact 链接（单文件，无需安装）。

**本地打开**：双击 `dist/last-ship.html` 即可。它是一个自包含的单文件页面，
three.js 已内联，不联网也能完整游玩（只有中文字体会退回系统字体）。

**手机上玩**：把 `dist/last-ship.html` 传到手机（网盘 / AirDrop / 自建静态服务），用浏览器打开。
或在电脑上起一个静态服务，手机连同一个 Wi-Fi 访问：

```bash
cd games/last-ship
python3 -m http.server 8000     # 然后手机访问 http://<电脑内网IP>:8000/dist/last-ship.html
```

## 开发

```
games/last-ship/
├── index.html                  # 源码：页面 + 全部游戏逻辑（唯一需要改的文件）
├── vendor/three.min.js         # three.js r150.1（MIT，见 three-LICENSE.txt）
├── build.mjs                   # 打包脚本
└── dist/
    ├── last-ship.html          # 单文件版（three 内联），直接打开就能玩
    └── last-ship.artifact.html # 同一页面，去掉 <html>/<head>/<body> 外壳，
                                #   给自带文档骨架的托管环境用
```

改完 `index.html` 后重新打包：

```bash
node build.mjs
```

本地调试（`index.html` 通过相对路径引用 `vendor/three.min.js`，需要走 http，不能用 `file://`）：

```bash
cd games/last-ship && python3 -m http.server 8000   # 打开 http://localhost:8000/index.html
```

游戏在 `window.__lastship` 上暴露了一个只读调试句柄（状态、交互点、坐标），方便在真机上排查。

## 怎么玩

| 操作 | 做什么 |
| --- | --- |
| 点地面 | 人物自动寻路走过去，会绕开房子、石头和塔身 |
| 点物件 | 先走近再查看；可交互物件上方有轻微浮动的光点 |
| ☰ | 线索手帐：读过的纸条、日志、信、海图都自动收录，随时重看 |
| ? | 渐进提示：第一次给方向，第二次在目标上方打一个箭头 |
| ♪ | 静音开关（音效全部由 WebAudio 合成，没有外部音频文件） |
| ⋯ | 暂停 / 画质切换 / 玩法说明 / 从头再来 |

没有倒计时，选错航道不会失败也不会锁死进度，可以一直改。

## 实现要点

- **three.js r150.1**，低多边形 + flat shading，全程不开阴影贴图（用圆形贴地阴影代替），
  草丛与树用 `InstancedMesh` + 顶点着色器摆动，海面是一个带三层正弦波的自定义 shader。
- **寻路**：每个场景一张走行格（岛上 0.7 m/格，室内 0.32 m/格），生成后做一次腐蚀保证离墙距离，
  A\* + 视线拉直（string pulling）。点地面时会吸附到最近的可走格。
- **相机**：固定朝向（屏幕上方永远是正北），室外跟随人物，室内改成拉远的固定机位，
  保证 7 m 见方的屋子在竖屏窄横向视野里能整间入画。海图上方也是正北，与场景一致。
- **交互判定**：屏幕空间距离 48 px 内取最近的可交互物，不依赖精确点中模型。
- **画质**：高 / 省电两档（像素比、海面网格密度、草量、雾气层）；连续 6 秒低于 24 fps 会自动降一档。

## 素材与许可

- three.js r150.1 — MIT，随仓库附 `vendor/three-LICENSE.txt`。
- 字体走 Google Fonts（Noto Serif SC / Noto Sans SC），取不到时退回系统中文字体，不影响游玩。
- 其余几何体、贴图（只有几张运行时生成的 canvas）、音效、文本全部是这个项目自己生成的。
