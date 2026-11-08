# 红果漫剧桌面版

Windows 上的第三方漫剧客户端。找剧、播放、缓存，接着上次的进度继续看。

**[下载 0.1.4 正式版 · Windows x64](https://github.com/lhljpt-web/hongguo-manju-desktop/releases/download/v0.1.4/Hongguo-Manju-0.1.4-Windows-x64.exe)** · [发布说明与校验](https://github.com/lhljpt-web/hongguo-manju-desktop/releases/tag/v0.1.4) · [安装指南](docs/installation.md) · [反馈问题](https://github.com/lhljpt-web/hongguo-manju-desktop/issues)

支持 Windows 10 / 11 x64。安装包自带运行组件，无需手机、模拟器或额外配置开发环境。

0.1.4 修复匿名播放身份复用失效导致的中间集、末集取流失败，采用按请求登记的签名 POST 恢复路径。[本轮验证记录](docs/playback-fix-2026-11-08.md)

> 本项目独立维护，与红果官方及其运营方无隶属或合作关系。作品、品牌和媒体资源归相应权利方所有。

## 主要功能

- **找剧与收藏**：推荐、热播、新剧榜单，剧名搜索，分享链接导入，本机收藏与观看记录。
- **播放与续播**：来源提供的高清档位、倍速、音量、全屏、画中画，保存进度并在重开后继续观看。
- **进度拖动**：向前、向后定位；目标尚未缓冲时保留选择，准备好后自动跳转，无需再次拖动。
- **自动连播**：集间续播，确认唯一后续季时跨季衔接；没有后续季时展示相似题材。
- **本地缓存**：当前集优先，后台多作品缓存，暂停、重试、断点续传、目录迁移、容量与速度设置。
- **四套外观**：宣纸书卷、午夜影院、流光、像素放映厅，切换后立即生效。
- **按需更新**：发现正式新版时提示，确认后下载，保存进度后重启安装。

画质以实际资源为准，不会将低清资源标为高清，也不会用首集预览替代后续分集。内容服务和网络可能变化，无法保证所有作品始终可播。

## 界面预览

首页浏览、继续观看与剧名搜索：

![正式版首页](docs/screenshots/stable-home.webp)

选集、播放进度与播放器控制：

![正式版播放器](docs/screenshots/stable-player.webp)

## 三步开始

1. 从 [最新正式版](https://github.com/lhljpt-web/hongguo-manju-desktop/releases/latest) 下载 Windows-x64.exe 安装包。
2. 双击安装，从桌面或开始菜单打开「红果漫剧桌面版」。
3. 通过榜单、搜索或「导入链接」打开作品；收藏、观看进度和缓存保存在当前电脑。

**从旧测试版迁移**：正式版从 0.1.0 重新编号。旧测试版的版本号高于 0.1.0，需退出托盘中的软件，再手动覆盖安装一次；保留原安装路径及应用数据，无需先卸载。此后按正式版本号递增更新。

关闭主窗口后软件会留在托盘继续缓存。需要完全退出时，在托盘菜单选择「退出软件」。详细操作见 [安装与使用指南](docs/installation.md)。

## 常见问题

**下载哪个文件？** 普通用户下载 .exe。源码 ZIP 用于开发，latest.yml 用于软件更新，校验文件用于核对完整性。

**拖到未缓存位置需要等待吗？** 需要等待目标媒体可用。软件会记住最新选择并自动定位，期间可以改选其他位置；网络中断时仍可能失败。

**某一集无法播放？** 先重试当前集；初次设备登记失败时，退出软件后重开再试。仍失败可导出诊断，在本仓库提交作品、集数和复现步骤，请勿附账号、媒体地址或个人资料。

**可以同步手机收藏吗？** 目前收藏、历史及缓存仅保存在本机，不接入手机账号或跨设备同步。

## 开发

需要 Windows x64、Node.js 22+。源码不附完整运行组件；播放与打包前需按 [运行组件说明](docs/runtime-components.md) 准备 runtime-bundle。

~~~powershell
npm ci
npm test
npm run typecheck
npm run build
~~~

准备好运行组件后可执行 npm start 或 npm run package:win。自动更新与发布校验见 [维护说明](docs/auto-update.md)。历史故障调查与验证记录保存在 docs 目录，不代表当前版本的全部可用范围。

## 参考与致谢

- [woshishiq1/drpys](https://github.com/woshishiq1/drpys)：0.1.3 播放签名算法块的上游来源（GPL-3.0），经 hongguoTV 的公开副本适配；[改动与许可记录](src/main/vendor/NOTICE.md)。
- [tsukiyo-zero/hongguoTV](https://github.com/tsukiyo-zero/hongguoTV)：0.1.2 的 `video_tab` 接口迁移线索，以及 0.1.3 播放签名和匿名登记字段的适配依据。

- [渠道有数 · hongguo-desktop](https://github.com/waligoraamodio288-rgb/hongguo-desktop-releases)：桌面功能组织与 TV 版请求结构的研究参考；这是公开发行仓库，本项目不是其源码分支。
- [hongguo-monorepo](https://github.com/wofanqiang/hongguo-monorepo)：多端架构和内容接入流程参考。
- [hongguo-downloader](https://github.com/zhenyong97/hongguo-downloader)：搜索、详情和原生接口研究参考。

感谢上述项目提供的参考。本项目独立维护，问题和更新请以本仓库为准。[来源记录](research/sources.json) 保留研究来源与许可核验状态。

## 许可

自有源码采用 [GPL-3.0-only](LICENSE)。第三方运行组件保留各自许可，相关来源与许可状态见 [运行组件说明](docs/runtime-components.md)。仓库不存储或分发剧集媒体，播放缓存仅保存在本机。
