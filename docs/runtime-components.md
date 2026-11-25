# 本机 Windows 运行组件

以下记录以最初的本机个人构建为基础。签名 SDK 二进制的许可与再分发权尚未核实，不以本项目 GPL 对其重新授权，也不将本机成功构建视为已取得公共发布许可。其他第三方组件分别保留原许可证。

发布状态更新（2026-10-16）：0.2.1 作为 Windows x64 测试版提供安装附件。以下内容保留构建来源与许可核验记录；发布行为不表示 SDK 再分发许可或全部开源组件的对应源码交付事项已完成确认。

## 独立桥接程序

`runtime/SignerBridge.java` 是本项目独立编写的标准输入输出程序。研究记录仅用于核对 Android JNI 的类名、操作号、必要返回值、签名函数偏移和头部编码等技术事实；没有复制、重命名上游 Java 实现，也没有包含研究 HTTP 服务或跟踪命令。参考事实来自本地已运行的 `research/sign-test/unidbg-sign/FqTrace.java`，不是已获得该上游源码复用许可的声明。

程序入口为 `app.hongguo.runtime.SignerBridge`，唯一参数为 SDK 目录绝对路径。工作线程依次读取 UTF-8 JSON 行 `{seq,url,headers}`，每行返回 `{seq,headers}`；失败返回 `{seq,error:"SIGN_FAILED"}`，无法解析请求时 `seq:null`。`seq` 支持数字或字符串，headers 是字符串字典。URL 只接受 HTTPS。输出签名只经标准输出交还主进程；标准错误、第三方 Java 日志及异常正文不对外输出。原生崩溃仍可能直接终止进程，调用方需超时、清理和重启。收到 EOF 后关闭模拟器退出。

模拟器使用 64 位 Android、API 23 解析器和 **默认 UnicornBackend**；没有启用在本机曾崩溃的 Unicorn2。签名偏移为 `0x168c80`，仅对应当前固定 SDK；替换 SDK 后不能假定偏移或 JNI 契约仍然成立。

主进程使用 `runtime-bundle/java/bin/java.exe -cp "runtime-bundle/classes;runtime-bundle/dependencies.jar" app.hongguo.runtime.SignerBridge <sdk绝对路径>`。打包时应将路径转换为应用资源目录绝对路径，并将进程工作目录和临时目录设置在可写的用户应用数据目录。不能把签名头、请求 URL 或密钥发送给渲染进程或写入开发日志。

## 来源与许可

| 组件 | 本机来源及核验 | 许可与限制 |
|---|---|---|
| Eclipse Temurin / OpenJDK | `research/runtime/jdk-17.0.20.1+1`；release 标识 Eclipse Adoptium 17.0.20.1+1、Windows x64；原压缩包 SHA256 为 `e53a79c3c3d86865bd7e787903884331068e71321714ffd44f145785affc7cb0` | 原 NOTICE 声明 GPL v2 with Classpath Exception；jlink 保留被选模块的 legal 文件，另保留原 NOTICE/release。项目来源：[Adoptium](https://adoptium.net/)、[jdk17u](https://github.com/adoptium/jdk17u)。 |
| unidbg 及 Java/native 依赖 | `research/sign-test/unidbg-sign/dependencies.jar`；输入 SHA256 必须等于 `03b6984d56682fbde0d941ca3ae7177260189a3c9da4a18732d1bae064bb1ecd`。本地来源核验记录 `research/sign-runtime-sources.json`。 | [unidbg](https://github.com/zhkl0228/unidbg) 为 Apache-2.0；组合 JAR 内的 JNA、Unicorn、Capstone、Keystone、Fastjson、SLF4J、Apache Commons 等保留各自许可，不能用 unidbg 或本项目许可概括整包。脚本复制包内 LICENSE/NOTICE 和 Maven 版本信息；这不等于已完成全部传递依赖的公共再分发审计。 |
| 组合 JAR 中研究业务类 | 输入 JAR 含 `com/hongguo/sign/` 下 FqTrace、MetasecSign、EncryptRun 等业务类 | `zhangbaio/hongguo` / `zero199901/fqnovel-unidbg` 的现有核验没有找到明确许可。构建脚本在编译前剔除 `com/hongguo/**`、相应 Maven 元数据及原入口清单，重建 JAR，并检查没有残留业务 class。原始 JAR 仅留研究目录。 |
| Android 签名 SDK | `research/sign-test/capture/fq_oversea/{libmetasec_ml.so,libc++_shared.so,ms_16777218.bin}`；研究对象包名 `com.dragon.read.oversea.gp`、版本 6.8.1.32 | SDK 及证书数据的再分发许可**未核实**。libc++ 是独立第三方运行库，但此特定二进制的对应源码/许可证随包情况未核实。每次准备记录这三个文件的 SHA256，仅纳入当前本机私人运行组件，不能按本项目 GPL 重新授权。 |
| FFmpeg 7.1 | 已安装 imageio-ffmpeg 的 `ffmpeg-win-x86_64-v7.1.exe`，自报 `7.1-essentials_build-www.gyan.dev`；[FFmpeg](https://ffmpeg.org/)、[Gyan builds](https://www.gyan.dev/ffmpeg/builds/)、[imageio-ffmpeg](https://github.com/imageio/imageio-ffmpeg) | 本机二进制 `-L` 明确报告 GPL v3 or later，配置含 `--enable-gpl --enable-version3`。不能把 imageio-ffmpeg Python 包自身的许可证误当二进制许可证。脚本保存完整 `-L` 输出及 SHA256；公开再分发前仍须履行对应源码等义务。 |

## 准备与验证

运行 `node scripts/prepare-runtime.mjs`。脚本使用现有本地 JDK 编译自行实现的 bridge，再以 jlink 生成精简运行时；不下载、安装或启动第三方安装包。可用 `HONGGUO_FFMPEG_SOURCE` 指向已有、可信的 FFmpeg 二进制。

生成结构为 `runtime-bundle/{java,classes,dependencies.jar,sdk,ffmpeg.exe,notices}`。`notices/build-manifest.json` 记录构建输入摘要、过滤后的 JAR 摘要、剔除清单以及验证信息。仅在编译、jlink、进程验证全部通过后替换旧 bundle。

验证在同一个签名进程中连续发送两个实际签名请求，中间插入一条无效 JSON；检查两次均返回 X-Argus/X-Gorgon 等非空字段、错误请求得到固定错误码、每行只有 JSON、stderr 为空、EOF 正常退出。测试仅输出字段名和长度，绝不记录签名值。这证明当前本机桥接可连续工作，不证明远程接口、未来 SDK 版本或全新 Windows 电脑必然可用。


## 0.1.9 Windows 完整分集取源组件

`npm run runtime:sdk` 使用既有 Node.js 与 electron-builder 的 7-Zip，下载并校验固定的 `jackotom/hongguo-drama v8.2` Windows 附件，只提取 `hongguo-sdk-playback.exe`。不会运行或安装参考项目的客户端。所有下载与可执行文件摘要固定于 `scripts/sdk-playback-assets.json`；打包钩子再次核对 helper 摘要。输出目录 `sdk-playback/` 不进入 Git。

主进程以 `--videos <目标分集编号> --cache <本机数据目录/sdk-playback>` 调用组件，只接受以该编号为键的模型，并交给既有画质、加密格式、完整时长与解码校验。输出和错误正文不进入日志。首次使用由 helper 从官方应用获取并校验所需输入；本机匿名设备及 SDK 状态仅写入此独立目录，不复制或替换旧播放标识，也不接入手机账号。退出和安装更新前停止本应用拥有的 helper 进程树。

脚本同时准备固定的上游 Windows 对应源码及 Unicorn、PyInstaller、Requests、PyCryptodome 和传递依赖的准确源码分发包，位于 `work/sdk-playback/v8.2/sources`。每次正式发行须将该目录归档为 `Hongguo-Manju-<版本>-sdk-sources.zip`，与安装包一同上传并纳入 SHA256SUMS。原始许可从这些源码包提取至发行组件的 notices；重建入口及来源见 `build/sdk-playback/README.txt`。这些源码不含官方 SDK 运行材料、设备状态、签名或剧集媒体。
