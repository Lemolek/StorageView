# Changelog

## 0.7.0

Feature expansion release.

- Interactive treemap explorer with drill-down, breadcrumbs, back/forward navigation, rescan and per-row usage bars
- Storage hub with consolidated tabs: Treemap, Largest Files, Largest Folders, File Types, Duplicates, Insights
- Filesystem search with wildcard and regex modes, extension, size and date filters, hidden-file toggle, streaming results and cancellation
- Applications view: installed application inventory from the Windows registry, native uninstall and conservative leftover analysis with confidence levels
- Recycle Bin summary and guarded empty action on the Cleanup page
- Token-based theme engine: built-in Noir and Light themes, custom theme editor with live preview, contrast warnings and validated theme import/export
- Signed automatic updates: check, download, install and restart from Settings
- Overview navigation label replacing Dashboard

## 0.6.0

Rebrand release.

- Product renamed to StorageView
- New brand identity and icons
- Bundle identifier changed to `com.lemolek.storageview` with automatic settings migration
- Repository renamed to StorageView

## 0.5.0

Multi-platform release.

- macOS and Linux support: release builds for all three desktop platforms
- Protected path detection extended to Unix and macOS system directories
- CI verification matrix on Windows, macOS and Linux
- Release workflow builds NSIS/MSI (Windows), universal .dmg (macOS) and .deb/.rpm/.AppImage (Linux) from one version tag

## 0.4.0

Explorer and productivity release.

- Sorting on all Storage Explorer tables with clickable column headers
- Search by name and path in files, folders and file types tables
- Minimum size filter for the largest files table
- File type drilldown: list the largest files of any extension
- Scan-this-folder action on folder rows
- Recommended cleanup: automatic detection of temporary files, browser caches and package manager caches with one-click queueing
- Command menu (Ctrl+K) for navigation and quick actions
- Scan progress indicator in the sidebar
- Window size and position are remembered between sessions

## 0.3.0

Cleanup and analytics release.

- Cleanup Queue with risk levels, reasons and per-item removal
- Safe Cleanup: move to trash with confirmation dialog and cleanup summary
- Advanced Cleanup: unlock phrase, permanent deletion with typed confirmation
- Protected system paths blocked from all cleanup operations
- Local cleanup action log
- Duplicate analysis: size grouping plus BLAKE3 content hashing, with progress and cancellation
- Analytics charts: file type donut, largest files and folders bars, folder treemap, file age distribution
- Scan history with persisted summaries
- JSON and CSV report export
- Settings: ignored scan paths, default scan location, Advanced Cleanup lock

## 0.2.0

Storage analysis release.

- Drive list with capacity, used and free storage on the Storage page
- Dashboard storage overview with totals and usage bar
- Recursive folder and drive scanning in the Rust backend
- Live scan progress with current path, file count, size, speed and cancellation
- Scan results: largest files, largest folders and file type distribution in the Storage Explorer
- Open file location and copy path actions
- Folder picker for scanning any directory
- Graceful permission error handling with skipped location count

## 0.1.0

Foundation release.

- Tauri application with React, TypeScript, Vite and Tailwind CSS
- Application shell with sidebar navigation and routing
- Dark-first design tokens with light theme support
- Placeholder pages: Dashboard, Storage, Explorer, Analytics, Cleanup, Reports, Settings
- Rust backend module structure: commands, core, scanning, cleanup, duplicates, reports, system
- Application info command wired through typed API bindings
- Byte and date formatting utilities with tests
- Windows NSIS installer configuration with code signing support
- GitHub Actions workflows for CI and release builds
- Build and code signing documentation
- Repository documents: README, LICENSE, ROADMAP, SECURITY
