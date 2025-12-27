# Windows 构建和打包脚本

param(
    [switch]$Clean,
    [switch]$NSIS,
    [switch]$Help
)

if ($Help) {
    Write-Host "Tomorin Player - Windows 构建脚本"
    Write-Host ""
    Write-Host "用法: .\build-windows.ps1 [-Clean] [-NSIS]"
    Write-Host ""
    Write-Host "参数:"
    Write-Host "  -Clean  清理构建目录"
    Write-Host "  -NSIS   创建 NSIS 安装程序"
    Write-Host "  -Help   显示此帮助"
    exit 0
}

Write-Host "==================================" -ForegroundColor Green
Write-Host "Tomorin Player - Windows 构建" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# 检查 Wails
Write-Host "[1/4] 检查 Wails..." -ForegroundColor Yellow
$wails = Get-Command wails -ErrorAction SilentlyContinue
if (-not $wails) {
    Write-Host "错误: 未找到 wails 命令" -ForegroundColor Red
    Write-Host "请访问: https://wails.io/docs/gettingstarted/installation"
    exit 1
}
Write-Host "Wails: $($wails.Source)" -ForegroundColor Green
Write-Host ""

# 检查 MinGW 工具链（编译 go-sqlite3 需要 CGO）
Write-Host "[2/4] 检查 MinGW-w64 交叉编译工具链..." -ForegroundColor Yellow
$mingw = Get-Command x86_64-w64-mingw32-gcc -ErrorAction SilentlyContinue
if (-not $mingw) {
    Write-Host "错误: 未找到 x86_64-w64-mingw32-gcc" -ForegroundColor Red
    Write-Host "请安装: sudo apt install gcc-mingw-w64-x86-64" -ForegroundColor Yellow
    exit 1
}
Write-Host "MinGW GCC: $($mingw.Source)" -ForegroundColor Green
Write-Host ""

# 配置 CGO 环境（必须启用，否则 go-sqlite3 会报 CGO_DISABLED=0 错误）
Write-Host "[3/4] 配置 CGO 环境变量..." -ForegroundColor Yellow
$env:CGO_ENABLED = "1"
$env:CC = "x86_64-w64-mingw32-gcc"
$env:CXX = "x86_64-w64-mingw32-g++"
Write-Host "CGO_ENABLED=$($env:CGO_ENABLED)" -ForegroundColor Green
Write-Host "CC=$($env:CC)" -ForegroundColor Green
Write-Host "CXX=$($env:CXX)" -ForegroundColor Green
Write-Host ""

# 版本注入：优先使用环境变量 APP_VERSION；否则从 frontend/package.json 读取
$version = $env:APP_VERSION
if (-not $version) {
    if (Test-Path -Path "frontend/package.json") {
        $pkg = Get-Content "frontend/package.json" -Raw | ConvertFrom-Json
        $version = $pkg.version
    }
}
if (-not $version) {
    Write-Host "错误: 未提供 APP_VERSION，且无法从 package.json 读取版本" -ForegroundColor Red
    exit 1
}

# 注入到前端（Vite 仅暴露 VITE_ 前缀的环境变量）
$env:VITE_APP_VERSION = $version

# 临时更新 wails.json 的 productVersion
$backup = "wails.json.bak"
Copy-Item -Path "wails.json" -Destination $backup -Force
$wails = Get-Content "wails.json" -Raw | ConvertFrom-Json
$wails.windows.info.productVersion = $version
$wails.info.productVersion = $version
$wails | ConvertTo-Json -Depth 10 | Set-Content "wails.json" -Encoding UTF8

try {
    # 构建参数
    $buildArgs = @("build", "-platform", "windows/amd64")
    if ($Clean) { $buildArgs += "-clean" }
    if ($NSIS) { $buildArgs += "-nsis" }

    # 构建应用
    Write-Host "[4/4] 构建应用... (版本 $version)" -ForegroundColor Yellow
    & wails @buildArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 构建失败" -ForegroundColor Red
        exit 1
    }
}
finally {
    # 恢复 wails.json
    if (Test-Path -Path $backup) {
        Move-Item -Path $backup -Destination "wails.json" -Force
    }
}

# 构建应用
Write-Host "[4/4] 构建应用..." -ForegroundColor Yellow
& wails @buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 显示结果
Write-Host "[3/3] 构建完成!" -ForegroundColor Green
Write-Host ""
Get-ChildItem -Path "build\bin\*.exe" | ForEach-Object {
    Write-Host "  $($_.Name) - $([math]::Round($_.Length/1MB, 2)) MB"
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "下一步:" -ForegroundColor Cyan
Write-Host "1. 将 build/bin/*.exe 复制到 Windows 系统"
Write-Host "2. 确保已安装 WebView2 运行时"
Write-Host "3. 使用 diagnose.bat 诊断启动问题"
Write-Host "==================================" -ForegroundColor Green
