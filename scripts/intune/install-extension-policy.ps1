# Eva Assist Chrome Extension - Intune Deployment Script
#
# Deploys Chrome policy to auto-install the Eva Assist extension.
# Uses "normal_installed" mode: extension installs automatically
# but users can remove it if they choose.
#
# Deployment via Intune:
#   Devices > Scripts and remediations > Platform scripts
#   Run as: System (HKLM requires admin)
#   Assign to: Target device group
#
# Manual testing:
#   Run as Administrator in PowerShell
#   After running, restart Chrome and check chrome://policy

param(
    [string]$ExtensionId = "YOUR_EXTENSION_ID_HERE",
    [string]$UpdateUrl = "https://YOUR_APP_URL/api/updates/extension?file=updates.xml"
)

$ErrorActionPreference = "Stop"

# Build the ExtensionSettings JSON policy
# normal_installed = auto-install, user can remove
$extensionSettings = @{
    $ExtensionId = @{
        installation_mode = "normal_installed"
        update_url        = $UpdateUrl
        toolbar_pin       = "default_unpinned"
    }
} | ConvertTo-Json -Compress

# Write to Chrome policy registry
$regPath = "HKLM:\SOFTWARE\Policies\Google\Chrome"

if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

Set-ItemProperty -Path $regPath -Name "ExtensionSettings" -Value $extensionSettings -Type String

Write-Host "Chrome extension policy installed successfully."
Write-Host "Extension ID: $ExtensionId"
Write-Host "Update URL: $UpdateUrl"
Write-Host "Mode: normal_installed (auto-install, removable)"
Write-Host ""
Write-Host "Restart Chrome and verify at chrome://policy"
