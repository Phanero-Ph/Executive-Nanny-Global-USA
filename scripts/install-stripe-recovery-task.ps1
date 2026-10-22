$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$wscriptPath = (Get-Command wscript.exe -ErrorAction Stop).Source
$tsxPath = Join-Path $projectDirectory 'node_modules/tsx/dist/cli.mjs'
$runner = Join-Path $PSScriptRoot 'recover-stripe.ts'
$hiddenRunner = Join-Path $PSScriptRoot 'run-stripe-recovery-hidden.vbs'
$arguments = "//B //NoLogo `"$hiddenRunner`" `"$nodePath`" `"$tsxPath`" `"$runner`""
$action = New-ScheduledTaskAction -Execute $wscriptPath -Argument $arguments -WorkingDirectory $projectDirectory
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 4) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -Hidden
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName 'ExecutiveNanny-StripeRecovery' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Recover missed Stripe billing events every five minutes while signed in.' -Force | Out-Null
Write-Output 'Stripe recovery scheduled every five minutes and configured to run without opening a console window.'
