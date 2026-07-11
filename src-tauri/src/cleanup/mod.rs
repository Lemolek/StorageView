use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Safe,
    Moderate,
    High,
    Critical,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RiskAssessment {
    pub risk_level: RiskLevel,
    pub reason: String,
    pub protected: bool,
}

const PROTECTED_ROOT_SEGMENTS: &[&str] = &[
    "windows",
    "program files",
    "program files (x86)",
    "boot",
    "efi",
    "recovery",
    "system volume information",
    "$recycle.bin",
];

const UNIX_PROTECTED_ROOT_SEGMENTS: &[&str] = &[
    "usr",
    "etc",
    "bin",
    "sbin",
    "lib",
    "lib64",
    "boot",
    "proc",
    "sys",
    "dev",
    "opt",
    "system",
    "library",
    "applications",
    "private",
    "cores",
];

const USER_DOCUMENT_SEGMENTS: &[&str] = &[
    "\\documents",
    "\\desktop",
    "\\pictures",
    "\\videos",
    "\\music",
];

const SAFE_EXTENSIONS: &[&str] = &[".tmp", ".log", ".bak", ".old", ".dmp"];
const INSTALLER_EXTENSIONS: &[&str] = &[".exe", ".msi", ".iso"];

fn assessment(risk_level: RiskLevel, reason: &str) -> RiskAssessment {
    RiskAssessment {
        risk_level,
        reason: reason.to_string(),
        protected: risk_level == RiskLevel::Critical,
    }
}

pub fn assess_path(raw: &str) -> RiskAssessment {
    let normalized = raw.replace('/', "\\").to_lowercase();
    let trimmed = normalized.trim_end_matches('\\');

    if is_drive_root(trimmed) {
        return assessment(
            RiskLevel::Critical,
            "Drive roots cannot be added to the cleanup queue",
        );
    }
    if let Some(segment) = first_segment(trimmed) {
        if PROTECTED_ROOT_SEGMENTS.contains(&segment)
            || UNIX_PROTECTED_ROOT_SEGMENTS.contains(&segment)
        {
            return assessment(
                RiskLevel::Critical,
                "Operating system and application directories are protected",
            );
        }
    }
    if trimmed.contains("\\appdata\\local\\temp")
        || trimmed.contains("\\temp\\")
        || trimmed.ends_with("\\temp")
        || trimmed.contains("\\cache")
        || trimmed.contains("\\thumbnails")
    {
        return assessment(RiskLevel::Safe, "Temporary or cache location");
    }
    if first_segment(trimmed) == Some("tmp")
        || trimmed.contains("\\var\\tmp")
        || trimmed.contains("\\var\\cache")
        || trimmed.contains("\\var\\log")
        || trimmed.contains("\\.cache")
    {
        return assessment(RiskLevel::Safe, "Temporary or cache location");
    }
    if trimmed.contains("\\users\\") && trimmed.contains("\\library\\caches") {
        return assessment(RiskLevel::Safe, "Temporary or cache location");
    }
    if SAFE_EXTENSIONS
        .iter()
        .any(|extension| trimmed.ends_with(extension))
    {
        return assessment(RiskLevel::Safe, "Disposable file type");
    }
    if trimmed.contains("\\downloads\\")
        && INSTALLER_EXTENSIONS
            .iter()
            .any(|extension| trimmed.ends_with(extension))
    {
        return assessment(RiskLevel::Moderate, "Installer file in Downloads");
    }
    if trimmed.contains("\\appdata\\") {
        return assessment(
            RiskLevel::High,
            "Application data — removing it may break installed applications",
        );
    }
    if first_segment(trimmed) == Some("programdata") {
        return assessment(
            RiskLevel::High,
            "Shared application data — removing it may break installed applications",
        );
    }
    if trimmed.contains("\\.config") || trimmed.contains("\\.local") {
        return assessment(
            RiskLevel::High,
            "User configuration — removing it may break applications",
        );
    }
    if trimmed.contains("\\users\\") && trimmed.contains("\\library") {
        return assessment(
            RiskLevel::High,
            "User library data — removing it may break installed applications",
        );
    }
    if USER_DOCUMENT_SEGMENTS
        .iter()
        .any(|segment| trimmed.contains(segment))
    {
        return assessment(
            RiskLevel::High,
            "User documents location — verify the contents before cleanup",
        );
    }
    assessment(RiskLevel::Moderate, "Review this item before cleanup")
}

pub fn is_protected(raw: &str) -> bool {
    assess_path(raw).protected
}

fn is_drive_root(path: &str) -> bool {
    let bytes = path.as_bytes();
    bytes.len() == 2 && bytes[1] == b':' || path.is_empty()
}

fn first_segment(path: &str) -> Option<&str> {
    let without_drive = path.split_once(":\\").map_or(path, |(_, rest)| rest);
    without_drive
        .trim_start_matches('\\')
        .split('\\')
        .next()
        .filter(|s| !s.is_empty())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupRequestItem {
    pub path: String,
    pub size_bytes: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupItemOutcome {
    pub path: String,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupReport {
    pub requested: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub bytes_recovered: u64,
    pub permanent: bool,
    pub outcomes: Vec<CleanupItemOutcome>,
}

pub fn execute(app: &AppHandle, items: Vec<CleanupRequestItem>, permanent: bool) -> CleanupReport {
    let mut outcomes = Vec::with_capacity(items.len());
    let mut bytes_recovered = 0u64;
    for item in &items {
        let outcome = remove_item(&item.path, permanent);
        if outcome.success {
            bytes_recovered += item.size_bytes;
        }
        outcomes.push(outcome);
    }
    let report = CleanupReport {
        requested: items.len(),
        succeeded: outcomes.iter().filter(|outcome| outcome.success).count(),
        failed: outcomes.iter().filter(|outcome| !outcome.success).count(),
        bytes_recovered,
        permanent,
        outcomes,
    };
    log_report(app, &report);
    report
}

fn remove_item(path: &str, permanent: bool) -> CleanupItemOutcome {
    if is_protected(path) {
        return CleanupItemOutcome {
            path: path.to_string(),
            success: false,
            error: Some("Path is protected and cannot be removed".to_string()),
        };
    }
    let target = Path::new(path);
    if !target.exists() {
        return CleanupItemOutcome {
            path: path.to_string(),
            success: false,
            error: Some("Path no longer exists".to_string()),
        };
    }
    let result = if permanent {
        if target.is_dir() {
            fs::remove_dir_all(target).map_err(|error| error.to_string())
        } else {
            fs::remove_file(target).map_err(|error| error.to_string())
        }
    } else {
        trash::delete(target).map_err(|error| error.to_string())
    };
    match result {
        Ok(()) => CleanupItemOutcome {
            path: path.to_string(),
            success: true,
            error: None,
        },
        Err(error) => CleanupItemOutcome {
            path: path.to_string(),
            success: false,
            error: Some(error),
        },
    }
}

fn log_report(app: &AppHandle, report: &CleanupReport) {
    let Ok(directory) = app.path().app_data_dir() else {
        return;
    };
    if fs::create_dir_all(&directory).is_err() {
        return;
    }
    let timestamp_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or_default();
    let Ok(mut file) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(directory.join("cleanup-log.jsonl"))
    else {
        return;
    };
    for outcome in &report.outcomes {
        let line = serde_json::json!({
            "timestampMs": timestamp_ms,
            "path": outcome.path,
            "permanent": report.permanent,
            "success": outcome.success,
            "error": outcome.error,
        });
        let _ = writeln!(file, "{line}");
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupSuggestion {
    pub label: String,
    pub path: String,
    pub category: String,
    pub size_bytes: u64,
    pub risk_level: RiskLevel,
    pub reason: String,
}

struct CandidateLocation {
    label: &'static str,
    category: &'static str,
    risk_level: RiskLevel,
    reason: &'static str,
    path: Option<std::path::PathBuf>,
}

pub fn suggest_cleanup() -> Vec<CleanupSuggestion> {
    let mut suggestions: Vec<CleanupSuggestion> = candidate_locations()
        .into_iter()
        .filter_map(|candidate| {
            let path = candidate.path?;
            if !path.is_dir() {
                return None;
            }
            let size_bytes = directory_size(&path);
            if size_bytes == 0 {
                return None;
            }
            Some(CleanupSuggestion {
                label: candidate.label.to_string(),
                path: path.display().to_string(),
                category: candidate.category.to_string(),
                size_bytes,
                risk_level: candidate.risk_level,
                reason: candidate.reason.to_string(),
            })
        })
        .collect();
    suggestions.sort_unstable_by_key(|suggestion| std::cmp::Reverse(suggestion.size_bytes));
    suggestions
}

fn env_path(variable: &str) -> Option<std::path::PathBuf> {
    std::env::var_os(variable).map(std::path::PathBuf::from)
}

fn joined(base: &Option<std::path::PathBuf>, relative: &str) -> Option<std::path::PathBuf> {
    base.as_ref().map(|path| path.join(relative))
}

#[cfg(target_os = "windows")]
fn candidate_locations() -> Vec<CandidateLocation> {
    let local = env_path("LOCALAPPDATA");
    let windir = env_path("WINDIR");
    let profile = env_path("USERPROFILE");
    let mut candidates = vec![
        CandidateLocation {
            label: "User temporary files",
            category: "System temp",
            risk_level: RiskLevel::Safe,
            reason: "Temporary files created by applications",
            path: env_path("TEMP"),
        },
        CandidateLocation {
            label: "Windows temporary files",
            category: "System temp",
            risk_level: RiskLevel::Safe,
            reason: "Temporary files created by Windows",
            path: joined(&windir, "Temp"),
        },
        CandidateLocation {
            label: "Chrome cache",
            category: "Browser cache",
            risk_level: RiskLevel::Safe,
            reason: "Close Chrome before cleaning",
            path: joined(&local, "Google\\Chrome\\User Data\\Default\\Cache"),
        },
        CandidateLocation {
            label: "Edge cache",
            category: "Browser cache",
            risk_level: RiskLevel::Safe,
            reason: "Close Edge before cleaning",
            path: joined(&local, "Microsoft\\Edge\\User Data\\Default\\Cache"),
        },
        CandidateLocation {
            label: "npm cache",
            category: "Package manager cache",
            risk_level: RiskLevel::Safe,
            reason: "Packages are downloaded again when needed",
            path: joined(&local, "npm-cache"),
        },
        CandidateLocation {
            label: "pnpm store",
            category: "Package manager cache",
            risk_level: RiskLevel::Moderate,
            reason: "Existing projects re-download packages on next install",
            path: joined(&local, "pnpm\\store"),
        },
        CandidateLocation {
            label: "Yarn cache",
            category: "Package manager cache",
            risk_level: RiskLevel::Safe,
            reason: "Packages are downloaded again when needed",
            path: joined(&local, "Yarn\\Cache"),
        },
        CandidateLocation {
            label: "Cargo registry cache",
            category: "Developer cache",
            risk_level: RiskLevel::Moderate,
            reason: "Crates are downloaded again on the next build",
            path: joined(&profile, ".cargo\\registry\\cache"),
        },
        CandidateLocation {
            label: "NuGet package cache",
            category: "Developer cache",
            risk_level: RiskLevel::Moderate,
            reason: "Packages are restored again on the next build",
            path: joined(&profile, ".nuget\\packages"),
        },
    ];
    if let Some(profiles) = joined(&local, "Mozilla\\Firefox\\Profiles") {
        if let Ok(entries) = fs::read_dir(profiles) {
            for entry in entries.flatten() {
                let cache = entry.path().join("cache2");
                candidates.push(CandidateLocation {
                    label: "Firefox cache",
                    category: "Browser cache",
                    risk_level: RiskLevel::Safe,
                    reason: "Close Firefox before cleaning",
                    path: Some(cache),
                });
            }
        }
    }
    candidates
}

#[cfg(not(target_os = "windows"))]
fn candidate_locations() -> Vec<CandidateLocation> {
    let home = env_path("HOME");
    vec![
        CandidateLocation {
            label: "User temporary files",
            category: "System temp",
            risk_level: RiskLevel::Safe,
            reason: "Temporary files created by applications",
            path: env_path("TMPDIR").or_else(|| Some(std::path::PathBuf::from("/tmp"))),
        },
        CandidateLocation {
            label: "User cache directory",
            category: "Application cache",
            risk_level: RiskLevel::Moderate,
            reason: "Applications rebuild caches when needed",
            path: joined(&home, ".cache"),
        },
    ]
}

fn directory_size(path: &Path) -> u64 {
    let Ok(entries) = fs::read_dir(path) else {
        return 0;
    };
    let mut total = 0u64;
    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if file_type.is_symlink() {
            continue;
        }
        if file_type.is_dir() {
            total += directory_size(&entry.path());
        } else if file_type.is_file() {
            total += entry.metadata().map(|metadata| metadata.len()).unwrap_or(0);
        }
    }
    total
}

#[cfg(test)]
mod tests {
    use super::{assess_path, directory_size, is_protected, RiskLevel};
    use std::fs;

    #[test]
    fn directory_size_sums_nested_files() {
        let root = std::env::temp_dir().join("diskscope-test-dir-size");
        let nested = root.join("nested");
        fs::create_dir_all(&nested).unwrap();
        fs::write(root.join("a.bin"), vec![0u8; 100]).unwrap();
        fs::write(nested.join("b.bin"), vec![0u8; 250]).unwrap();

        assert_eq!(directory_size(&root), 350);

        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn drive_roots_are_protected() {
        assert!(is_protected("C:\\"));
        assert!(is_protected("D:"));
    }

    #[test]
    fn system_directories_are_protected() {
        assert!(is_protected("C:\\Windows\\System32"));
        assert!(is_protected("C:\\Program Files\\App"));
        assert!(is_protected("C:\\Program Files (x86)\\App"));
        assert!(is_protected("D:\\$Recycle.Bin\\S-1-5"));
        assert!(is_protected("C:\\System Volume Information"));
    }

    #[test]
    fn temp_and_cache_locations_are_safe() {
        assert_eq!(
            assess_path("C:\\Users\\Karol\\AppData\\Local\\Temp\\setup.tmp").risk_level,
            RiskLevel::Safe
        );
        assert_eq!(
            assess_path("C:\\Users\\Karol\\AppData\\Local\\SomeApp\\Cache\\entry").risk_level,
            RiskLevel::Safe
        );
        assert_eq!(
            assess_path("C:\\Projects\\build\\output.log").risk_level,
            RiskLevel::Safe
        );
    }

    #[test]
    fn appdata_outside_cache_is_high_risk() {
        let assessment = assess_path("C:\\Users\\Karol\\AppData\\Roaming\\App\\config");
        assert_eq!(assessment.risk_level, RiskLevel::High);
        assert!(!assessment.protected);
    }

    #[test]
    fn user_documents_are_high_risk() {
        assert_eq!(
            assess_path("C:\\Users\\Karol\\Documents\\notes").risk_level,
            RiskLevel::High
        );
    }

    #[test]
    fn installers_in_downloads_are_moderate() {
        assert_eq!(
            assess_path("C:\\Users\\Karol\\Downloads\\setup.exe").risk_level,
            RiskLevel::Moderate
        );
        assert_eq!(
            assess_path("C:\\Users\\Karol\\Downloads\\image.iso").risk_level,
            RiskLevel::Moderate
        );
    }

    #[test]
    fn ordinary_paths_default_to_moderate() {
        let assessment = assess_path("D:\\Media\\movie.mkv");
        assert_eq!(assessment.risk_level, RiskLevel::Moderate);
        assert!(!assessment.protected);
    }

    #[test]
    fn filesystem_root_is_protected() {
        assert!(is_protected("/"));
    }

    #[test]
    fn unix_system_directories_are_protected() {
        assert!(is_protected("/usr/bin"));
        assert!(is_protected("/etc/hosts"));
        assert!(is_protected("/System/Library/x"));
        assert!(is_protected("/Applications/App.app"));
    }

    #[test]
    fn unix_temp_and_cache_locations_are_safe() {
        assert_eq!(assess_path("/tmp/build").risk_level, RiskLevel::Safe);
        assert_eq!(
            assess_path("/home/user/.cache/app").risk_level,
            RiskLevel::Safe
        );
        assert_eq!(assess_path("/var/log/syslog").risk_level, RiskLevel::Safe);
    }

    #[test]
    fn unix_user_configuration_is_high_risk() {
        assert_eq!(
            assess_path("/home/user/.config/app").risk_level,
            RiskLevel::High
        );
    }

    #[test]
    fn macos_user_library_caches_are_safe() {
        assert_eq!(
            assess_path("/Users/karol/Library/Caches/app").risk_level,
            RiskLevel::Safe
        );
    }

    #[test]
    fn macos_user_library_is_high_risk() {
        let assessment = assess_path("/Users/karol/Library/Preferences/app");
        assert_eq!(assessment.risk_level, RiskLevel::High);
        assert!(!assessment.protected);
    }

    #[test]
    fn unix_user_documents_are_high_risk() {
        assert_eq!(
            assess_path("/home/user/documents/notes").risk_level,
            RiskLevel::High
        );
    }

    #[test]
    fn unix_ordinary_paths_default_to_moderate() {
        let assessment = assess_path("/srv/data/file.bin");
        assert_eq!(assessment.risk_level, RiskLevel::Moderate);
        assert!(!assessment.protected);
    }
}
