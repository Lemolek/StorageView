# StorageView Roadmap

## Phase 1 — Foundation (complete)

- Tauri application with React, TypeScript, Vite and Tailwind CSS
- Application shell with sidebar navigation and routing
- Design tokens with dark and light themes
- Placeholder pages: Dashboard, Storage, Explorer, Analytics, Cleanup, Reports, Settings
- Rust backend module structure
- Repository documents

## Phase 2 — System Information (complete)

- Disk list with capacity, used and free storage
- Platform-safe system commands
- Dashboard storage cards

## Phase 3 — Folder Scanning (complete)

- Folder selection and recursive scanning
- Progress events with current path, file count and bytes scanned
- Scan cancellation
- Permission error handling
- Scan summary

## Phase 4 — Storage Explorer (complete)

- Largest files, largest folders and file types tables
- Open file location, open folder, copy path
- Sorting, filtering and search
- File type drilldown

## Phase 5 — Visualizations (complete)

- Donut chart for file types
- Bar charts for largest files and folders
- Treemap for folder sizes
- File age distribution

## Phase 6 — Cleanup Queue (complete)

- Add files and folders to the queue
- Queue review with risk levels
- Estimated recovered space

## Phase 7 — Safe Cleanup (complete)

- Move to trash
- Confirmation dialog and cleanup summary
- Local cleanup action log

## Phase 8 — Advanced Cleanup (complete)

- Advanced Cleanup unlock phrase
- Permanent deletion with strong confirmation
- Protected path handling

## Phase 9 — Duplicate Analysis (complete)

- Group by size, hash candidates with BLAKE3
- Duplicate group display and selection

## Phase 10 — Reports and Polish (mostly complete)

- JSON and CSV export (done)
- Scan history (done)
- Screenshots and release polish (planned)
