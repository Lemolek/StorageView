# Code Signing

Signing the StorageView executable and installer prevents SmartScreen warnings and proves the binaries come from Lemolek. Signing is optional for local builds and automatic in the release workflow once secrets are configured.

## Certificate Options

- OV (Organization Validation) code signing certificate: standard choice, reputation builds over time.
- EV (Extended Validation) certificate: immediate SmartScreen reputation, requires a hardware token or a cloud signing service.
- Azure Trusted Signing or a similar service: certificate never leaves the provider, integrates through a custom sign command.

## Local Signing with a PFX Certificate

Import the certificate into the current user store:

```powershell
Import-PfxCertificate -FilePath storageview-signing.pfx -CertStoreLocation Cert:\CurrentUser\My -Password (Read-Host -AsSecureString)
```

Read the certificate thumbprint:

```powershell
Get-ChildItem Cert:\CurrentUser\My | Select-Object Subject, Thumbprint
```

Add the thumbprint to `src-tauri/tauri.conf.json`:

```json
"windows": {
  "certificateThumbprint": "<THUMBPRINT>",
  "digestAlgorithm": "sha256",
  "timestampUrl": "http://timestamp.digicert.com"
}
```

`npm run tauri build` then signs the executable and the NSIS installer. Do not commit the thumbprint of a private development certificate; prefer passing it through `--config` as the release workflow does.

## Signing in GitHub Actions

The release workflow signs automatically when these repository secrets exist:

- `WINDOWS_CERTIFICATE`: the PFX file encoded as Base64.
- `WINDOWS_CERTIFICATE_PASSWORD`: the PFX password.

Encode the certificate:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("storageview-signing.pfx")) | Set-Clipboard
```

The workflow imports the certificate into the runner's certificate store and passes the thumbprint to the Tauri bundler through a config overlay. Without the secrets, the workflow still produces an unsigned installer.

## Signing Services with a Custom Sign Command

For providers such as Azure Trusted Signing, replace the thumbprint with a sign command in `src-tauri/tauri.conf.json`:

```json
"windows": {
  "signCommand": "trusted-signing-cli -e <endpoint> -a <account> -c <profile> %1"
}
```

The bundler invokes the command for every binary, with `%1` replaced by the file path.

## Timestamping

Always keep `timestampUrl` configured. Timestamped signatures stay valid after the certificate expires.
