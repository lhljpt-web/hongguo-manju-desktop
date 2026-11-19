# 社区发行版 0.2.8s（非官方补丁包）

基于上游 **0.1.4** 运行时文件的社区补丁包，只替换 `resources/app/dist` 下的前端/主进程文件，不改动安装器与运行时组件。适用于 Windows x64 已安装 0.1.4 的用户。

> 本项目与红果官方无隶属关系；补丁仅用于个人学习与兼容性研究，请支持正版。

## 包含改动

### 播放
- 播放签名 V5（`novel/player/multi_video_model/player/v1`，SM3 挑战签名 + gzip 正文），旧 551 通道兜底，修复取流空响应。
- 播放签名升级：Argus/Ladon **551** + 客户端 **7.4.3.32** 协议，gzip 正文参与签名，修复中间集/末集空响应。
- `device_level=1`：让服务端下发 HEVC（bytevc1）而不是 VVC（bytevc2）。
- VVC 分集快速失败，不再先下载再报错；有 HEVC 轨道时优先选择 HEVC。
- 无 `encrypt_info` 的分集按未加密处理，兼容接口变化。
- 播放报错 30 秒自动下一集（普通播放器与刷剧模式共用「连续播放」开关）。

### 缓存与下载
- 缓存按剧集分文件夹，文件按真实集数命名：`<缓存目录>/<剧集ID>/ep001.mp4`；启动后自动把旧的随机文件名改名迁移。
- 单文件多线程分段下载（IDM 风格）：1–128 线程可调，按段断点续传。
- 并行准备上限 128，两季任务按公平份额分配，总数不超过所选并行数。
- 缓存检查点写入限流 + EPERM/EBUSY 退避重试，显著降低「无法读写视频缓存」失败率。
- 转码超时按时长动态计算（片长 × 6 + 60 秒），失败自动以 ultrafast 单线程重试一次。
- 设置项：并行准备、单文件线程、CPU 解码档位（低/中/高）、解码方式（自动直通硬解 / 强制 GPU / 纯软件 / 仅直通硬解）、网络状态。

### 硬件加速
- 启动自动探测 NVENC → QSV → AMF，优先 GPU 硬编，失败回退 libx264。
- 自动模式：Chromium 支持 HEVC 硬解时走「只解密 + 重封装」，播放交给系统硬解，不再长时间转码。

### 界面
- 卡片角标显示「看到第 X 集」（按剧集 ID + 总集数校验，未看过的剧不显示）。
- 收藏页拖动排序：在「我的收藏」里按住卡片拖动即可调整顺序，仅对收藏生效。
- 页面全屏按钮 / F11；全屏播放竖屏视频等比完整显示。
- 刷剧模式（Demo）：独立窗口、竖向滑动、分类筛选（含言情）、个性化推荐。
- 刷剧预取：推荐前 3 部各预取 3 集到隐藏目录 `<缓存目录>/shuaju/`，不进缓存列表；「看全集」可跳回主窗口作品页并关闭刷剧窗口。

### 更新通道
- 菜单「文件 → 更新通道」或托盘右键菜单可在「官方版 / 社区版」之间切换，选择持久化到 `userData/update-channel.json`。
- 官方版：原 electron-updater 流程，检查 `lhljpt-web/hongguo-manju-desktop` 的 latest release。
- 社区版：检查 `zhonglike/hongguo-manju-desktop` 最新 release，下载补丁 zip 后先比对同一 Release 的 `SHA256SUMS.txt`（不一致直接判失败、删除半包），点「重启安装」后由 PowerShell 解压覆盖 `dist` 文件并重启（占用自动重试，无写权限自动 UAC 提权）。
- 版本抽屉：更新面板「社区版本」按钮可展开最近 30 个社区 Release，任选一版安装；当前版本标记为「当前」。
- 社区版保活：社区版切到官方通道更新时，退出前会拉起后台守护脚本，等官方更新**真正装完**（检测 `package.json` 版本变化）后自动把社区补丁覆盖回来，然后自行退出；正常关闭不会触发。日志见 `userData/updates/community-guard.log`。
- 版本约定：以后每个社区发行版都带 `s` 后缀（如 `0.2.5s`），官方版不带，方便一眼区分；`package.json` 内仍为合法 semver。
- 注意：官方更新会先把社区补丁整个覆盖，再由守护脚本补回；若官方大改前端接口，补丁可能不完全兼容。

## 安装

1. 已安装 0.1.4 桌面版（默认路径 `%LOCALAPPDATA%\Programs\hongguo-manju-desktop` 或自定义目录）。
2. 关闭应用。
3. 右键 `apply.ps1` → 使用 PowerShell 运行，按提示输入安装目录（含 `红果漫剧桌面版.exe` 的目录）。
4. 脚本会备份原文件为 `*.bak-0.15beta`，然后覆盖以下文件：
   - `resources/app/dist/main/main.cjs`
   - `resources/app/dist/main/preload.cjs`
   - `resources/app/dist/renderer/assets/index-Bd3dQB5J.js`
   - `resources/app/dist/renderer/swipe.html`、`swipe-app.js`、`watchdog.js`、`progress-badge.js`、`page-fullscreen.js`、`open-series.js`、`favorites-sort.js`

> 本补丁针对解包目录 `resources/app`。若安装包仍使用 `resources/app.asar`，请先自行解包并让 Electron 加载目录（参考上游构建说明），或使用本仓库 Release 中的完整替换包。

## 回滚

关闭应用后删除 `*.bak-0.15beta` 后缀，或把备份文件改回原名即可。

## 已知限制

- VVC（bytevc2）仅在服务端强制下发时出现；已通过 `device_level=1` 规避，若后续接口再变仍可能复现。
- 硬件编码画质与兼容性取决于驱动；遇到花屏/黑屏可在设置里切换到「纯软件」。
- 刷剧模式为 Demo，未接入账号登录与付费内容。

## 校验

Release 附件包含 `SHA256SUMS.txt`，可用 `Get-FileHash` 校验。
