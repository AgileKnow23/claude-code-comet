# Launch Comet with Remote Debugging enabled
# This allows Claude Code to connect to your browser with your existing sessions

$cometPath = "$env:LOCALAPPDATA\Perplexity\Comet\Application\comet.exe"
$debugPort = 9222

# Check if Comet is already running with debug port
$existingDebug = Get-NetTCPConnection -LocalPort $debugPort -ErrorAction SilentlyContinue

if ($existingDebug) {
    Write-Host "Comet is already running with debugging on port $debugPort" -ForegroundColor Green
    exit 0
}

# Check if regular Comet is running
$cometProcess = Get-Process -Name "comet" -ErrorAction SilentlyContinue

if ($cometProcess) {
    Write-Host "Comet is running but without debugging enabled." -ForegroundColor Yellow
    $response = Read-Host "Close existing Comet and relaunch with debugging? (y/n)"
    if ($response -eq 'y') {
        Stop-Process -Name "comet" -Force
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Aborted. Close Comet manually and run this script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Launching Comet with remote debugging on port $debugPort..." -ForegroundColor Cyan
Start-Process -FilePath $cometPath -ArgumentList "--remote-debugging-port=$debugPort"
Write-Host "Done! Claude Code can now connect to your browser." -ForegroundColor Green
