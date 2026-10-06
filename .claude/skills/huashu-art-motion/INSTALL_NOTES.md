# 本仓库的安装备注

- 来源：https://github.com/alchaincyf/huashu-art-motion @ 445c075（2026-10-06 安装）
- 为控制仓库体积，去掉了只在 README 首页展示、skill 文档和脚本都不引用的 6 个文件（约 16 MB）：
  `assets/showcase/`（hero.png 与 3 个 GIF）、`assets/全风格总览.jpg`、`assets/长卷穿越_总览.jpg`。
  所以 README 里这几张图会显示不出来，去 GitHub 原仓库看即可。其余文件（含语法总览图、字体、示范工程）原样保留。
- 云端环境渲染提示：系统自带 Chromium 是 chromium-1194（`/opt/pw-browsers`），对应 Playwright 1.56，
  命令里用 `uv run --with playwright==1.56.0 ...` 代替 `uv run --with playwright ...`，不要运行 `playwright install`。
- 授权：代码与文档 MIT；字体 OFL；笔顺数据 Arphic Public License；花叔卡通形象与角色帧仅限 skill 示范，不可用于自己的作品。
