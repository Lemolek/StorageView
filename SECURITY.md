# Security Policy

## Principles

DiskScope is designed around user safety:

- No file is deleted without explicit user confirmation.
- Moving files to the system trash is the preferred cleanup action.
- Permanent deletion is a separate option that requires stronger confirmation.
- A protected path list blocks cleanup of operating system and application directories.
- Permission errors are handled gracefully and never hidden.
- Failed cleanup operations are always reported to the user.
- Cleanup actions are logged locally.

## Privacy

- DiskScope works entirely locally. There is no cloud dependency.
- No telemetry or analytics are collected by default.
- File paths, filenames and scan results are never uploaded automatically.

## Reporting a Vulnerability

If you discover a security issue, contact the author, Lemolek, before public disclosure. Include a description of the issue, steps to reproduce and the affected version.
