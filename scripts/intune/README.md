# Chrome Extension Distribution via Intune

## Prerequisites

1. Extension is published via `pnpm ext:release` (uploads CRX to Convex storage)
2. You have the 32-character Chrome extension ID (derived from the public key in manifest.json)
3. Your web app is deployed (serves the update XML at `/api/updates/extension?file=updates.xml`)

## Option 1: Intune Settings Catalog (Recommended)

1. Go to **Intune** > **Devices** > **Configuration** > **Create** > **New Policy**
2. Platform: **Windows 10 and later**
3. Profile type: **Settings Catalog**
4. Click **Add settings**, search for **Google Chrome** > **Extensions**
5. Select **"Extension management settings"** (ExtensionSettings)
6. Set the value to:

```json
{
  "YOUR_EXTENSION_ID": {
    "installation_mode": "normal_installed",
    "update_url": "https://YOUR_APP_URL/api/updates/extension?file=updates.xml"
  }
}
```

7. Assign to your target device group
8. Users get the extension on next Chrome restart + policy sync

## Option 2: Intune Custom OMA-URI

1. Go to **Intune** > **Devices** > **Configuration** > **Create** > **New Policy**
2. Platform: **Windows 10 and later**
3. Profile type: **Templates** > **Custom**
4. Add an OMA-URI setting:
   - **Name:** Chrome Extension Policy
   - **OMA-URI:** `./Device/Vendor/MSFT/Policy/Config/Chrome~Policy~googlechrome~Extensions/ExtensionSettings`
   - **Data type:** String
   - **Value:** `{"YOUR_EXTENSION_ID":{"installation_mode":"normal_installed","update_url":"https://YOUR_APP_URL/api/updates/extension?file=updates.xml"}}`
5. Assign to your target device group

## Option 3: Intune PowerShell Script

1. Go to **Intune** > **Devices** > **Scripts and remediations** > **Platform scripts**
2. Upload `install-extension-policy.ps1`
3. Settings:
   - **Run this script using the logged on credentials:** No
   - **Run script in 64-bit PowerShell:** Yes
4. Assign to your target device group

## Option 4: Manual Registry (Testing)

Run `install-extension-policy.ps1` as Administrator on a test machine, then restart Chrome.

## Verification

After policy deployment:

1. Open Chrome
2. Go to `chrome://policy` > Click **"Reload policies"**
3. Look for `ExtensionSettings` in the policy list
4. Go to `chrome://extensions` — Eva Assist should appear
5. The extension shows as auto-installed (user can remove since we use `normal_installed`)

## Removing the Policy

Use `remove-extension-policy.ps1` or delete the `ExtensionSettings` value from Intune.

## Notes

- Chrome checks for extension updates every ~5 hours
- Force immediate update: `chrome://extensions` > Enable Developer Mode > Click "Update"
- `normal_installed` lets users uninstall; use `force_installed` if you want to prevent that
- Chrome shows "Managed by your organization" when any policy is active — this is cosmetic
- The download endpoint is intentionally public (Chrome's updater can't authenticate). Security is enforced by Clerk auth inside the extension.
