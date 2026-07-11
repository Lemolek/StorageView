<p align="center">
  <img src="assets/brand/storageview-wordmark-dark-1400x360.png" alt="StorageView" width="560" />
</p>

# StorageView

Analyze. Visualize. Optimize.

StorageView is a professional desktop application for storage analysis, visualization and safe cleanup.

Created by Lemolek.

## Features

- Disk usage dashboard
- Recursive folder scanning with live progress and cancellation
- Largest files and folders ranking with sorting, search and filters
- File type distribution with drilldown
- Interactive charts: donut, bars, treemap, file age
- Storage Explorer
- Cleanup Queue with risk levels
- Safe Cleanup (move to trash) and Advanced Cleanup (permanent delete)
- Recommended cleanup for temporary files and caches
- Protected system paths
- Duplicate analysis with content hashing
- Scan history
- JSON and CSV reports
- Command menu (Ctrl+K)

## Tech Stack

- Tauri
- Rust
- React
- TypeScript
- Tailwind CSS

## Architecture

StorageView is a single desktop application distributed as a Windows installer:

- The React UI is embedded in the Tauri WebView and ships inside the executable.
- All filesystem operations — scanning, cleanup, disk information, opening paths — run in the Rust backend.
- The UI communicates with Rust exclusively through typed Tauri commands and events.
- There is no separate backend server and no HTTP API.
- The application works fully offline with no cloud dependency.

## Project Status

Phase 1 (Foundation) is complete: application shell, routing, design tokens, placeholder pages and backend module structure. See [ROADMAP.md](ROADMAP.md) for the full implementation plan.

## Development

Prerequisites:

- Node.js 20 or later
- Rust stable toolchain
- Platform prerequisites for Tauri (see the Tauri documentation)

Install dependencies:

```sh
npm install
```

Run the desktop application in development mode:

```sh
npm run tauri dev
```

Run tests:

```sh
npm test
```

## Distribution

Platforms: Windows is the primary platform; macOS and Linux builds are produced by CI.

Build the installers for the current platform:

```sh
npm run tauri build
```

On Windows the NSIS installer is written to `src-tauri/target/release/bundle/nsis/StorageView_<version>_x64-setup.exe`.

Releases are automated with GitHub Actions: pushing a `v*` tag builds Windows (NSIS installer), macOS (universal `.dmg`) and Linux (`.deb`/`.rpm`/`.AppImage`) artifacts, signs the Windows installer when signing secrets are configured and uploads everything to a single draft GitHub release. See [docs/BUILDING.md](docs/BUILDING.md) and [docs/CODE_SIGNING.md](docs/CODE_SIGNING.md).

Repository: [github.com/Lemolek/StorageView](https://github.com/Lemolek/StorageView)

## Repository Structure

```text
StorageView/
├── src/                 React frontend
│   ├── app/             App shell, routing, providers
│   ├── components/      Reusable UI components
│   ├── features/        Feature modules
│   ├── hooks/           Shared hooks
│   ├── lib/             API wrappers and utilities
│   ├── pages/           Route pages
│   ├── styles/          Design tokens and global styles
│   └── types/           Shared TypeScript models
├── src-tauri/           Rust backend
│   └── src/
│       ├── commands/    Tauri command entry points
│       ├── core/        Shared domain models and errors
│       ├── scanning/    Recursive scanning, progress, cancellation
│       ├── cleanup/     Safe and advanced cleanup
│       ├── duplicates/  Duplicate detection
│       ├── reports/     JSON and CSV export
│       └── system/      Disk information and OS integration
├── assets/brand/        Brand assets
├── docs/                Documentation
└── .github/workflows/   CI and release pipelines
```

## Copyright

Copyright © 2026 Lemolek. All rights reserved.

This project is proprietary unless stated otherwise in the license file. See [LICENSE](LICENSE).
