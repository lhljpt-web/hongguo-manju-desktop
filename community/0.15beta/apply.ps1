param(
  [string]$AppDir = ""
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = Join-Path $here "files"

if (-not $AppDir) {
  Write-Host "请输入红果漫剧安装目录（包含 红果漫剧桌面版.exe 的文件夹）："
  $AppDir = Read-Host
}

if (-not (Test-Path (Join-Path $AppDir "resources"))) {
  throw "目录无效：$AppDir 下没有 resources 文件夹"
}

# 确认进程已退出
$running = Get-Process | Where-Object { $_.Path -like (Join-Path $AppDir "*") }
if ($running) {
  throw "请先关闭红果漫剧再运行本脚本"
}

$targets = @(
  "dist\main\main.cjs",
  "dist\main\preload.cjs",
  "dist\renderer\assets\index-Bd3dQB5J.js",
  "dist\renderer\swipe.html",
  "dist\renderer\swipe-app.js",
  "dist\renderer\watchdog.js",
  "dist\renderer\progress-badge.js",
  "dist\renderer\page-fullscreen.js"
)

$appRoot = Join-Path $AppDir "resources\app"
$unpacked = Test-Path (Join-Path $appRoot "dist\main\main.cjs")
if (-not $unpacked) {
  $asar = Join-Path $AppDir "resources\app.asar"
  if (Test-Path $asar) {
    throw "检测到 app.asar，请先按 README 说明解包并让应用加载 resources\app 目录"
  }
  throw "未找到 resources\app\dist，安装目录可能不是 0.1.4 桌面版"
}

foreach ($rel in $targets) {
  $src = Join-Path $files $rel
  $dst = Join-Path $appRoot $rel
  if (-not (Test-Path $src)) { throw "补丁文件缺失：$src" }
  $dir = Split-Path -Parent $dst
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  if (Test-Path $dst) {
    Copy-Item $dst "$dst.bak-0.15beta" -Force
  }
  Copy-Item $src $dst -Force
  Write-Host "已更新：$rel"
}

Write-Host ""
Write-Host "完成。启动应用即可。回滚：把 *.bak-0.15beta 恢复为原文件名。"
