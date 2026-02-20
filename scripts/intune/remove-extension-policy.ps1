# Eva Assist Chrome Extension - Policy Removal Script
#
# Removes the Chrome extension policy. Run this if you need to
# stop auto-installing the extension on managed devices.

$ErrorActionPreference = "Stop"

$regPath = "HKLM:\SOFTWARE\Policies\Google\Chrome"

if (Test-Path $regPath) {
    $current = Get-ItemProperty -Path $regPath -Name "ExtensionSettings" -ErrorAction SilentlyContinue

    if ($current) {
        Remove-ItemProperty -Path $regPath -Name "ExtensionSettings"
        Write-Host "Chrome extension policy removed."
        Write-Host "Restart Chrome for changes to take effect."
    } else {
        Write-Host "No ExtensionSettings policy found."
    }
} else {
    Write-Host "No Chrome policy registry key found."
}
