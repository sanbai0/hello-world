param([ValidateSet('install','build','preview','audit')][string]$Task = 'preview')
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$blogNode = Join-Path (Get-Location) '.local-tools/node/node.exe'
if (-not (Test-Path -LiteralPath $blogNode)) {
  $blogNode = (Get-Command node -ErrorAction Stop).Source
}
$major = [int]((& $blogNode --version).TrimStart('v').Split('.')[0])
if ($major -lt 22) { throw '需要 Node.js 22+，推荐 Node.js 24 LTS。请安装后重开终端，或按使用指南准备项目内 Node。' }
$env:PATH = (Split-Path $blogNode -Parent) + ';' + $env:PATH
if ($Task -eq 'install') {
  $npmCli = Join-Path (Get-Location) '.local-tools/node/node_modules/npm/bin/npm-cli.js'
  if (Test-Path -LiteralPath $npmCli) { & $blogNode $npmCli ci --no-audit --no-fund }
  else { & npm.cmd ci --no-audit --no-fund }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & $blogNode quartz/bootstrap-cli.mjs plugin install
} elseif ($Task -eq 'audit') {
  & $blogNode scripts/check-public-content.mjs
} else {
  if ($Task -eq 'preview') { & $blogNode quartz/bootstrap-cli.mjs build --serve }
  if ($Task -eq 'build') { & $blogNode quartz/bootstrap-cli.mjs build }
}
exit $LASTEXITCODE
