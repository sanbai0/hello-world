# 一次性 GitHub Git 授权；仅在本机隐藏输入，令牌不写入源码或日志。
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$blogRemote = (& git remote get-url origin).Trim()
if ($blogRemote -ne 'https://github.com/sanbai0/hello-world.git') { throw '当前仓库目标不匹配，已停止。' }
Write-Host '请粘贴仅授权 sanbai0/hello-world 的 fine-grained token；输入不会显示。'
$blogSecureToken = Read-Host 'GitHub token' -AsSecureString
$blogPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($blogSecureToken)
$blogPlainToken = $null
try {
  $blogPlainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($blogPointer)
  if (-not $blogPlainToken.StartsWith('github_pat_')) { throw '请使用 fine-grained token，账号密码不适用于此处。' }
  $blogHeaders = @{ Authorization = ('Bearer ' + $blogPlainToken); Accept = 'application/vnd.github+json'; 'User-Agent' = 'hello-world-blog-setup' }
  try {
    $blogIdentity = Invoke-RestMethod 'https://api.github.com/user' -Headers $blogHeaders
    $blogRepository = Invoke-RestMethod 'https://api.github.com/repos/sanbai0/hello-world' -Headers $blogHeaders
  } catch { throw 'GitHub 授权验证失败，请检查令牌是否有效及目标仓库范围。令牌没有写入文件。' }
  if ($blogIdentity.login -ne 'sanbai0' -or -not $blogRepository.permissions.push) { throw 'GitHub 用户或仓库写入权限不匹配。' }
  & git config --local credential.useHttpPath true
  & git config --local credential.https://github.com.username sanbai0
  $blogGitProcess = New-Object System.Diagnostics.ProcessStartInfo
  $blogGitProcess.FileName = (Get-Command git.exe).Source
  $blogGitProcess.Arguments = 'credential approve'
  $blogGitProcess.RedirectStandardInput = $true
  $blogGitProcess.RedirectStandardOutput = $true
  $blogGitProcess.RedirectStandardError = $true
  $blogGitProcess.UseShellExecute = $false
  $blogChild = [System.Diagnostics.Process]::Start($blogGitProcess)
  $blogChild.StandardInput.Write("protocol=https`nhost=github.com`npath=sanbai0/hello-world.git`nusername=sanbai0`npassword=" + $blogPlainToken + "`n`n")
  $blogChild.StandardInput.Close()
  $blogChild.WaitForExit()
  if ($blogChild.ExitCode -ne 0) { throw '系统凭据保存失败。未输出令牌。' }
  Write-Host '授权完成：sanbai0/hello-world。凭据已交由系统 Git Credential Manager 保存。'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($blogPointer)
  $blogPlainToken = $null
  $blogHeaders = $null
  if ($blogSecureToken) { $blogSecureToken.Dispose() }
}
