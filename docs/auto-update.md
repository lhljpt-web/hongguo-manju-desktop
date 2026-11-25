# 应用内更新

Windows 正式安装版会在启动约 2 秒后自动检查更新，运行期间每 4 小时再次检查。更新来源固定为本仓库 `lhljpt-web/hongguo-manju-desktop` 的公开 GitHub Releases，只接收正式版，不连接参考项目或红果官方的更新渠道。

发现更高版本后，程序弹出居中的「发现新版本」提示，显示当前和新版版本号；同一版本在本次运行中只自动提醒一次，重开软件会再次检查并提醒。弹窗支持关闭、Esc 和键盘操作，全屏播放时也可见。程序仅提示新版，点击「立即更新」才下载安装包。选择「暂不更新」会收起提示，保留顶部「有新版本」入口，不会下载。重开应用仍需再次点击，才开始下载。顶部「更新」显示下载百分比，展开后可查看大小与进度；可以收起面板继续观看。下载完成并通过 SHA-512 校验后，点击「重启安装」：应用先保存观看记录、关闭媒体，再运行安装程序并重新打开。普通退出不安装，不会在观看时自动重启。

更新会保留原安装路径与 `%APPDATA%/红果漫剧桌面版/` 数据，包括收藏、观看进度和 `player-profile.json` 播放标识。不要先卸载或删除数据目录。正式版从 0.1.0 重新编号；旧测试版版本数字较高，需要手动覆盖安装一次，之后按正式版本号递增更新。

更新失败时，在面板点「重试更新」。检查依赖 GitHub，连接失败、磁盘空间不足或文件校验不通过会明确提示；已完整缓存并校验的安装包可在后续检查时复用。退出后未完成的下载会在再次检查时重试，不能保证断点续传。也可从 [发布页面](https://github.com/lhljpt-web/hongguo-manju-desktop/releases) 下载 `.exe` 手动覆盖安装。

当前安装包没有 Windows 发布者代码签名。HTTPS 与 SHA-512 用于传输和文件一致性校验，不等同于发布者身份认证。开发模式不执行升级。

## 维护者发布要求

1. 修改 `package.json` 与锁文件中的版本号，完成测试、类型检查和构建。
2. 在具备完整 `runtime-bundle` 的 Windows 机器上执行 `npm run package:win -- --publish never`（或构建后执行 `npx electron-builder --win --x64 --publish never`）。
3. 执行 `npm run release:verify`，核对 `latest.yml` 版本、安装文件名、SHA-512 和安装包内的 GitHub provider。不要手工复制旧版元数据。
4. 将同批 `.exe` 和 `latest.yml` 上传到同一个版本 Release；同时提供本项目源码归档、`*-sdk-sources.zip` 对应源码及涵盖全部附件的 SHA256SUMS。先建草稿并上传完整附件，再公开发布，避免客户端发现缺少元数据的新版本。
5. 保持递增的 `vX.Y.Z` 标签；当前客户端关闭 `allowPrerelease`，只接收正式发行版。不上传 token、开发配置或本地测试更新源。

当前使用完整 NSIS 安装包，未启用差分更新。`latest.yml` 是自动更新必需文件；仅上传 exe 会导致旧客户端检查失败。程序使用 electron-updater 的版本比较、GitHub provider、SHA-512 校验和 NSIS 升级实现，见 [官方更新文档](https://www.electron.build/features/auto-update)。
