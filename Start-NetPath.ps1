$ErrorActionPreference = 'Stop'
$netPathRoot = $PSScriptRoot
$netPathUrl = 'http://127.0.0.1:4173'
$netPathNode = (Get-Command node -ErrorAction Stop).Source
$netPathMajor = [int]((& $netPathNode --version).TrimStart('v').Split('.')[0])
if ($netPathMajor -lt 24) { throw 'NetPath requires Node.js 24 or newer. Install it, then reopen this launcher.' }
New-Item -ItemType Directory -Force -Path (Join-Path $netPathRoot 'data') | Out-Null
try {
    $netPathResponse = Invoke-RestMethod "$netPathUrl/api/state" -TimeoutSec 2
    if ($netPathResponse.state.version -eq 1) { Start-Process $netPathUrl; exit }
} catch { }
$netPathProcess = Start-Process -FilePath $netPathNode -ArgumentList ('"' + (Join-Path $netPathRoot 'server.mjs') + '"') -WorkingDirectory $netPathRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $netPathRoot 'data/server.log') -RedirectStandardError (Join-Path $netPathRoot 'data/server-error.log')
for ($netPathAttempt = 0; $netPathAttempt -lt 30; $netPathAttempt++) {
    Start-Sleep -Milliseconds 300
    try {
        $netPathResponse = Invoke-RestMethod "$netPathUrl/api/state" -TimeoutSec 1
        if ($netPathResponse.state.version -eq 1) { Start-Process $netPathUrl; exit }
    } catch { }
    if ($netPathProcess.HasExited) { break }
}
$netPathDetails = Get-Content (Join-Path $netPathRoot 'data/server-error.log') -Tail 15 -ErrorAction SilentlyContinue
throw ("NetPath did not start. Try Run NetPath (keep open).cmd to see the error directly.`n" + ($netPathDetails -join "`n"))
