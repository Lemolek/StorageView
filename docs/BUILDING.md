# Building and Releasing StorageView

StorageView is a single desktop application. The React UI is embedded in the Tauri WebView and all filesystem operations run in the Rust backend through Tauri commands. There is no separate backend server and no HTTP API.

## Prerequisites

Common to all platforms:

- Node.js 20 or later
- Rust stable toolchain

Windows:

- Microsoft Visual Studio C++ Build Tools (MSVC)
- WebView2 Runtime (preinstalled on Windows 10/11)

macOS:

- Xcode Command Line Tools (`xcode-select --install`)

Linux (Debian/Ubuntu):

```sh
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## Development

```sh
npm install
npm run tauri dev
```

This single command builds the Rust backend, starts the embedded UI with hot reload and opens the desktop window.

## Tests and Checks

```sh
npm test
npm run build
cargo fmt --all --check
cargo clippy --all-targets -- -D warnings
```

Run the cargo commands inside `src-tauri`.

## Building the Installers

```sh
npm run tauri build
```

Bundles are written under `src-tauri/target/release/bundle/`, depending on the platform the build runs on:

- Windows: NSIS installer (`nsis/StorageView_<version>_x64-setup.exe`) and MSI package (`msi/`)
- macOS: application bundle (`macos/StorageView.app`) and disk image (`dmg/`), built as a universal binary for Apple Silicon and Intel
- Linux: `deb/`, `rpm/` and `appimage/` packages

On Windows the installer is produced by the NSIS bundler configured in `src-tauri/tauri.conf.json`. It installs per user, uses the StorageView icon and shows the license during installation. If a signing certificate is configured, the executable and the installer are signed automatically. See [CODE_SIGNING.md](CODE_SIGNING.md).

## Versioning

Before a release, set the same version in:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

Record the changes in `CHANGELOG.md`.

## Releasing with GitHub Actions

Two workflows live in `.github/workflows/`:

- `ci.yml` runs tests, the frontend build, `cargo fmt` and `cargo clippy` on Windows, macOS and Linux on every push and pull request.
- `release.yml` builds the installers for all three platforms and creates a draft GitHub release when a version tag is pushed.

To publish a release:

```sh
git tag v0.1.0
git push origin v0.1.0
```

From a single `v*` tag the release workflow builds in parallel on Windows, macOS and Linux: the Windows NSIS installer and MSI (signed when signing secrets are configured), the macOS universal `.dmg` and the Linux `.deb`, `.rpm` and `.AppImage` packages. All artifacts are uploaded to a single draft release, which is left for manual review before publishing.

## Release Checklist

1. Update versions and `CHANGELOG.md`.
2. Verify `npm test`, `npm run build` and `cargo clippy` pass.
3. Build the installer locally and smoke-test it.
4. Push the version tag.
5. Review and publish the draft GitHub release.
