param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$netPathRoot = $PSScriptRoot
$netPathNode = (Get-Command node -ErrorAction Stop).Source
if ([int]((& $netPathNode --version).TrimStart('v').Split('.')[0]) -lt 24) { throw 'NetPath requires Node.js 24 or newer.' }
$netPathHash = [System.Security.Cryptography.SHA256]::Create()
try { $netPathId = [BitConverter]::ToString($netPathHash.ComputeHash([Text.Encoding]::UTF8.GetBytes($netPathRoot.Replace('\','/').ToLowerInvariant()))).Replace('-','').ToLowerInvariant() } finally { $netPathHash.Dispose() }
$netPathPort = $null
foreach ($candidatePort in 4180..4189) {
    $candidateUrl = "http://127.0.0.1:$candidatePort"
    try {
        $identity = Invoke-RestMethod "$candidateUrl/api/installation" -TimeoutSec 1
        if ($identity.installationId -eq $netPathId -and $identity.version -eq '1.8.0') {
            if (-not $NoBrowser) { Start-Process "$candidateUrl/#sandbox" }
            Write-Output "$candidateUrl/#sandbox"
            exit
        }
    } catch { }
    $probe = [Net.Sockets.TcpClient]::new()
    try { $probe.Connect('127.0.0.1',$candidatePort); $occupied = $true } catch { $occupied = $false } finally { $probe.Dispose() }
    if (-not $occupied -and $null -eq $netPathPort) { $netPathPort = $candidatePort }
}
if ($null -eq $netPathPort) { throw 'Ports 4180–4189 are occupied. Close an unused NetPath instance and try again.' }
$netPathUrl = "http://127.0.0.1:$netPathPort"
New-Item -ItemType Directory -Force -Path (Join-Path $netPathRoot 'data') | Out-Null
$previousPort = $env:PORT
$previousData = $env:NETPATH_DATA
try {
    $env:PORT = [string]$netPathPort
    $env:NETPATH_DATA = Join-Path $netPathRoot 'data'
    $netPathProcess = Start-Process -FilePath $netPathNode -ArgumentList ('"' + (Join-Path $netPathRoot 'server.mjs') + '"') -WorkingDirectory $netPathRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $netPathRoot 'data/sandbox-server.log') -RedirectStandardError (Join-Path $netPathRoot 'data/sandbox-server-error.log')
} finally { $env:PORT = $previousPort; $env:NETPATH_DATA = $previousData }
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 300
    try {
        $identity = Invoke-RestMethod "$netPathUrl/api/installation" -TimeoutSec 1
        if ($identity.installationId -eq $netPathId -and $identity.version -eq '1.8.0') {
            if (-not $NoBrowser) { Start-Process "$netPathUrl/#sandbox" }
            Write-Output "$netPathUrl/#sandbox"
            exit
        }
    } catch { }
    if ($netPathProcess.HasExited) { break }
}
throw 'NetPath could not start. See data/sandbox-server-error.log in this folder.'
