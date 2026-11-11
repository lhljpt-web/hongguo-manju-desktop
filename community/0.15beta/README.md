# 社区发行版 0.15beta（非官方补丁包）

基于上游 **0.1.4** 运行时文件的社区补丁包，只替换 `resources/app/dist` 下的前端/主进程文件，不改动安装器与运行时组件。适用于 Windows x64 已安装 0.1.4 的用户。

> 本项目与红果官方无隶属关系；补丁仅用于个人学习与兼容性研究，请支持正版。

## 包含改动

### 播放
- 播放签名升级：Argus/Ladon **551** + 客户端 **7.4.3.32** 协议，gzip 正文参与签名，修复中间集/末集空响应。
- `device_level=1`：让服务端下发 HEVC（bytevc1）而不是 VVC（bytevc2）。
- VVC 分集快速失败，不再先下载再报错；有 HEVC 轨道时优先选择 HEVC。
- 无 `encrypt_info` 的分集按未加密处理，兼容接口变化。
- 播放报错 30 秒自动下一集（普通播放器与刷剧模式共用「连续播放」开关）。

### 缓存与下载
- 单文件多线程分段下载（IDM 风格）：1–128 线程可调，按段断点续传。
- 并行准备上限 128，两季任务按公平份额分配，总数不超过所选并行数。
- 缓存检查点写入限流 + EPERM/EBUSY 退避重试，显著降低「无法读写视频缓存」失败率。
- 转码超时按时长动态计算（片长 × 6 + 60 秒），失败自动以 ultrafast 单线程重试一次。
- 设置项：并行准备、单文件线程、CPU 解码档位（低/中/高）、解码方式（自动直通硬解 / 强制 GPU / 纯软件 / 仅直通硬解）、网络状态。

### 硬件加速
- 启动自动探测 NVENC → QSV → AMF，优先 GPU 硬编，失败回退 libx264。
- 自动模式：Chromium 支持 HEVC 硬解时走「只解密 + 重封装」，播放交给系统硬解，不再长时间转码。

### 刷剧模式（Demo）
- 独立窗口：竖向滑动切集、自动连播、收藏/缓存/下一集。
- 分类筛选：推荐 / 言情 / 古装 / 甜宠 / 悬疑 / 逆袭 / 全部。
- 个性化推荐：按观看记录与收藏题材加权；可在刷剧设置或缓存页底部关闭/管理。

## 安装

1. 已安装 0.1.4 桌面版（默认路径 `%LOCALAPPDATA%\Programs\hongguo-manju-desktop` 或自定义目录）。
2. 关闭应用。
3. 右键 `apply.ps1` → 使用 PowerShell 运行，按提示输入安装目录（含 `红果漫剧桌面版.exe` 的目录）。
4. 脚本会备份原文件为 `*.bak-0.15beta`，然后覆盖以下文件：
   - `resources/app/dist/main/main.cjs`
   - `resources/app/dist/main/preload.cjs`
   - `resources/app/dist/renderer/assets/index-Bd3dQB5J.js`
   - `resources/app/dist/renderer/swipe.html`、`swipe-app.js`、`watchdog.js`

> 本补丁针对解包目录 `resources/app`。若安装包仍使用 `resources/app.asar`，请先自行解包并让 Electron 加载目录（参考上游构建说明），或使用本仓库 Release 中的完整替换包。

## 回滚

关闭应用后删除 `*.bak-0.15beta` 后缀，或把备份文件改回原名即可。

## 已知限制

- VVC（bytevc2）仅在服务端强制下发时出现；已通过 `device_level=1` 规避，若后续接口再变仍可能复现。
- 硬件编码画质与兼容性取决于驱动；遇到花屏/黑屏可在设置里切换到「纯软件」。
- 刷剧模式为 Demo，未接入账号登录与付费内容。

## 校验

Release 附件包含 `SHA256SUMS.txt`，可用 `Get-FileHash` 校验。
