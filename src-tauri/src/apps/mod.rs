use serde::Serialize;

use crate::core::error::AppError;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    pub id: String,
    pub name: String,
    pub publisher: Option<String>,
    pub version: Option<String>,
    pub install_location: Option<String>,
    pub estimated_size_bytes: Option<u64>,
    pub uninstall_command: Option<String>,
    pub quiet_uninstall_command: Option<String>,
    pub source: String,
    pub install_date_ms: Option<u64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum LeftoverConfidence {
    High,
    Medium,
    Low,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LeftoverCandidate {
    pub path: String,
    pub kind: String,
    pub size_bytes: u64,
    pub confidence: LeftoverConfidence,
    pub source: String,
}

#[cfg(any(target_os = "windows", test))]
const GENERIC_NAMES: &[&str] = &[
    "app",
    "data",
    "setup",
    "install",
    "cache",
    "temp",
    "common",
    "shared",
    "microsoft",
    "windows",
    "program",
    "programs",
];

#[cfg(any(target_os = "windows", test))]
fn estimated_size_kb_to_bytes(kilobytes: u32) -> u64 {
    u64::from(kilobytes) * 1024
}

#[cfg(any(target_os = "windows", test))]
fn parse_install_date(raw: &str) -> Option<u64> {
    let digits = raw.trim();
    if digits.len() != 8 || !digits.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    let year: i64 = digits[0..4].parse().ok()?;
    let month: i64 = digits[4..6].parse().ok()?;
    let day: i64 = digits[6..8].parse().ok()?;
    if !(1970..=2200).contains(&year)
        || !(1..=12).contains(&month)
        || day < 1
        || day > days_in_month(year, month)
    {
        return None;
    }
    let days = days_from_civil(year, month, day);
    u64::try_from(days).ok().map(|days| days * 86_400_000)
}

#[cfg(any(target_os = "windows", test))]
fn days_in_month(year: i64, month: i64) -> i64 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) {
                29
            } else {
                28
            }
        }
        _ => 0,
    }
}

#[cfg(any(target_os = "windows", test))]
fn days_from_civil(year: i64, month: i64, day: i64) -> i64 {
    let adjusted_year = if month <= 2 { year - 1 } else { year };
    let era = if adjusted_year >= 0 {
        adjusted_year
    } else {
        adjusted_year - 399
    } / 400;
    let year_of_era = adjusted_year - era * 400;
    let day_of_year = (153 * ((month + 9) % 12) + 2) / 5 + day - 1;
    let day_of_era = year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year;
    era * 146_097 + day_of_era - 719_468
}

#[cfg(any(target_os = "windows", test))]
fn is_usable_component(value: &str) -> bool {
    let trimmed = value.trim();
    trimmed.chars().count() >= 4 && !GENERIC_NAMES.contains(&trimmed.to_lowercase().as_str())
}

#[cfg(any(target_os = "windows", test))]
fn leftover_joins(name: &str, publisher: Option<&str>) -> Vec<(Vec<String>, LeftoverConfidence)> {
    let mut joins = Vec::new();
    let name_usable = is_usable_component(name);
    let publisher_usable = publisher.is_some_and(is_usable_component);
    if name_usable {
        joins.push((vec![name.trim().to_string()], LeftoverConfidence::Medium));
    }
    if let Some(publisher) = publisher {
        if publisher_usable && name_usable {
            joins.push((
                vec![publisher.trim().to_string(), name.trim().to_string()],
                LeftoverConfidence::Medium,
            ));
        }
        if publisher_usable {
            joins.push((vec![publisher.trim().to_string()], LeftoverConfidence::Low));
        }
    }
    joins
}

#[cfg(any(target_os = "windows", test))]
fn is_acceptable_candidate(path: &str) -> bool {
    !crate::cleanup::is_protected(path)
}

#[cfg(any(target_os = "windows", test))]
fn confidence_rank(confidence: LeftoverConfidence) -> u8 {
    match confidence {
        LeftoverConfidence::High => 0,
        LeftoverConfidence::Medium => 1,
        LeftoverConfidence::Low => 2,
    }
}

#[cfg(target_os = "windows")]
mod windows_impl {
    use std::collections::HashSet;
    use std::fs;
    use std::path::{Path, PathBuf};

    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    use winreg::{RegKey, HKEY};

    use super::{
        confidence_rank, estimated_size_kb_to_bytes, is_acceptable_candidate, leftover_joins,
        parse_install_date, InstalledApp, LeftoverCandidate, LeftoverConfidence,
    };
    use crate::core::error::AppError;

    const UNINSTALL_PATH: &str = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
    const UNINSTALL_PATH_32: &str =
        "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall";

    const SOURCE_MACHINE: &str = "machine";
    const SOURCE_MACHINE_32: &str = "machine32";
    const SOURCE_USER: &str = "user";

    fn registry_location(source: &str) -> Option<(HKEY, &'static str)> {
        match source {
            SOURCE_MACHINE => Some((HKEY_LOCAL_MACHINE, UNINSTALL_PATH)),
            SOURCE_MACHINE_32 => Some((HKEY_LOCAL_MACHINE, UNINSTALL_PATH_32)),
            SOURCE_USER => Some((HKEY_CURRENT_USER, UNINSTALL_PATH)),
            _ => None,
        }
    }

    fn read_string(key: &RegKey, value_name: &str) -> Option<String> {
        key.get_value::<String, _>(value_name)
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
    }

    fn is_patch_release(release_type: &str) -> bool {
        let lowered = release_type.to_lowercase();
        lowered.contains("update")
            || lowered.contains("hotfix")
            || lowered.contains("patch")
            || lowered.contains("service pack")
    }

    fn read_app_entry(key: &RegKey, source: &str, key_name: &str) -> Option<InstalledApp> {
        let name = read_string(key, "DisplayName")?;
        if key.get_value::<u32, _>("SystemComponent").unwrap_or(0) == 1 {
            return None;
        }
        if read_string(key, "ParentKeyName").is_some() {
            return None;
        }
        if let Some(release_type) = read_string(key, "ReleaseType") {
            if is_patch_release(&release_type) {
                return None;
            }
        }
        let estimated_size_bytes = key
            .get_value::<u32, _>("EstimatedSize")
            .ok()
            .map(estimated_size_kb_to_bytes);
        let install_date_ms = read_string(key, "InstallDate")
            .as_deref()
            .and_then(parse_install_date);
        Some(InstalledApp {
            id: format!("{source}\\{key_name}"),
            name,
            publisher: read_string(key, "Publisher"),
            version: read_string(key, "DisplayVersion"),
            install_location: read_string(key, "InstallLocation"),
            estimated_size_bytes,
            uninstall_command: read_string(key, "UninstallString"),
            quiet_uninstall_command: read_string(key, "QuietUninstallString"),
            source: source.to_string(),
            install_date_ms,
        })
    }

    fn collect_source(source: &str) -> Vec<InstalledApp> {
        let Some((hive, path)) = registry_location(source) else {
            return Vec::new();
        };
        let Ok(root) = RegKey::predef(hive).open_subkey(path) else {
            return Vec::new();
        };
        let mut apps = Vec::new();
        for key_name in root.enum_keys().flatten() {
            let Ok(entry) = root.open_subkey(&key_name) else {
                continue;
            };
            if let Some(app) = read_app_entry(&entry, source, &key_name) {
                apps.push(app);
            }
        }
        apps
    }

    fn dedupe_key(app: &InstalledApp) -> (String, String) {
        (
            app.name.to_lowercase(),
            app.version.as_deref().unwrap_or_default().to_lowercase(),
        )
    }

    pub fn list_installed_apps() -> Result<Vec<InstalledApp>, AppError> {
        let mut apps = collect_source(SOURCE_MACHINE);
        let machine_keys: HashSet<(String, String)> = apps.iter().map(dedupe_key).collect();
        apps.extend(
            collect_source(SOURCE_MACHINE_32)
                .into_iter()
                .filter(|app| !machine_keys.contains(&dedupe_key(app))),
        );
        apps.extend(collect_source(SOURCE_USER));
        apps.sort_by_key(|app| app.name.to_lowercase());
        Ok(apps)
    }

    pub fn launch_uninstall(app_id: &str) -> Result<(), AppError> {
        let (source, key_name) = app_id
            .split_once('\\')
            .ok_or_else(|| AppError::Internal(format!("invalid application id: {app_id}")))?;
        let (hive, path) = registry_location(source)
            .ok_or_else(|| AppError::Internal(format!("invalid application id: {app_id}")))?;
        let root = RegKey::predef(hive).open_subkey(path).map_err(|_| {
            AppError::PathNotFound(format!("uninstall registry is unavailable for {app_id}"))
        })?;
        let entry = root.open_subkey(key_name).map_err(|_| {
            AppError::PathNotFound(format!(
                "the application entry no longer exists in the registry: {app_id}"
            ))
        })?;
        let command = read_string(&entry, "UninstallString")
            .or_else(|| read_string(&entry, "QuietUninstallString"))
            .ok_or_else(|| {
                AppError::Internal(format!(
                    "no uninstall command is registered for this application: {app_id}"
                ))
            })?;
        std::process::Command::new("cmd")
            .args(["/C", &command])
            .spawn()
            .map_err(|error| {
                AppError::Internal(format!("failed to launch the uninstaller: {error}"))
            })?;
        Ok(())
    }

    fn env_dir(variable: &str) -> Option<PathBuf> {
        std::env::var_os(variable)
            .map(PathBuf::from)
            .filter(|path| path.is_dir())
    }

    fn candidate_bases() -> Vec<(PathBuf, &'static str)> {
        let mut bases = Vec::new();
        if let Some(local) = env_dir("LOCALAPPDATA") {
            bases.push((local.clone(), "LocalAppData"));
            let programs = local.join("Programs");
            if programs.is_dir() {
                bases.push((programs, "LocalAppData\\Programs"));
            }
        }
        if let Some(roaming) = env_dir("APPDATA") {
            bases.push((roaming, "AppData\\Roaming"));
        }
        if let Some(program_data) = env_dir("PROGRAMDATA") {
            bases.push((program_data, "ProgramData"));
        }
        bases
    }

    fn push_candidate(
        candidates: &mut Vec<LeftoverCandidate>,
        seen: &mut HashSet<String>,
        path: &Path,
        confidence: LeftoverConfidence,
        source: &str,
    ) {
        let display = path.display().to_string();
        if !path.is_dir() || !is_acceptable_candidate(&display) {
            return;
        }
        if !seen.insert(display.to_lowercase()) {
            return;
        }
        candidates.push(LeftoverCandidate {
            size_bytes: directory_size(path),
            path: display,
            kind: "folder".to_string(),
            confidence,
            source: source.to_string(),
        });
    }

    pub fn find_leftovers(
        name: &str,
        publisher: Option<&str>,
        install_location: Option<&str>,
    ) -> Result<Vec<LeftoverCandidate>, AppError> {
        let mut candidates = Vec::new();
        let mut seen = HashSet::new();
        if let Some(location) = install_location {
            let trimmed = location.trim().trim_end_matches('\\');
            if !trimmed.is_empty() {
                push_candidate(
                    &mut candidates,
                    &mut seen,
                    Path::new(trimmed),
                    LeftoverConfidence::High,
                    "InstallLocation",
                );
            }
        }
        let joins = leftover_joins(name, publisher);
        for (base, label) in candidate_bases() {
            for (segments, confidence) in &joins {
                let mut path = base.clone();
                for segment in segments {
                    path.push(segment);
                }
                push_candidate(&mut candidates, &mut seen, &path, *confidence, label);
            }
        }
        candidates.sort_by(|a, b| {
            confidence_rank(a.confidence)
                .cmp(&confidence_rank(b.confidence))
                .then(b.size_bytes.cmp(&a.size_bytes))
        });
        Ok(candidates)
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
}

#[cfg(target_os = "windows")]
pub fn list_installed_apps() -> Result<Vec<InstalledApp>, AppError> {
    windows_impl::list_installed_apps()
}

#[cfg(not(target_os = "windows"))]
pub fn list_installed_apps() -> Result<Vec<InstalledApp>, AppError> {
    Ok(Vec::new())
}

#[cfg(target_os = "windows")]
pub fn launch_uninstall(app_id: &str) -> Result<(), AppError> {
    windows_impl::launch_uninstall(app_id)
}

#[cfg(not(target_os = "windows"))]
pub fn launch_uninstall(app_id: &str) -> Result<(), AppError> {
    let _ = app_id;
    Err(AppError::Internal(
        "application uninstall is not supported on this platform".to_string(),
    ))
}

#[cfg(target_os = "windows")]
pub fn find_leftovers(
    name: &str,
    publisher: Option<&str>,
    install_location: Option<&str>,
) -> Result<Vec<LeftoverCandidate>, AppError> {
    windows_impl::find_leftovers(name, publisher, install_location)
}

#[cfg(not(target_os = "windows"))]
pub fn find_leftovers(
    name: &str,
    publisher: Option<&str>,
    install_location: Option<&str>,
) -> Result<Vec<LeftoverCandidate>, AppError> {
    let _ = (name, publisher, install_location);
    Err(AppError::Internal(
        "leftover analysis is not supported on this platform".to_string(),
    ))
}

#[cfg(test)]
mod tests {
    use super::{
        confidence_rank, estimated_size_kb_to_bytes, is_acceptable_candidate, is_usable_component,
        leftover_joins, parse_install_date, LeftoverConfidence,
    };

    #[test]
    fn install_date_epoch_start_is_zero() {
        assert_eq!(parse_install_date("19700101"), Some(0));
    }

    #[test]
    fn install_date_counts_whole_days() {
        assert_eq!(parse_install_date("19700102"), Some(86_400_000));
        assert_eq!(parse_install_date("20240115"), Some(19_737 * 86_400_000));
    }

    #[test]
    fn install_date_accepts_leap_day() {
        assert_eq!(parse_install_date("20240229"), Some(19_782 * 86_400_000));
    }

    #[test]
    fn install_date_rejects_garbage() {
        assert_eq!(parse_install_date(""), None);
        assert_eq!(parse_install_date("garbage!"), None);
        assert_eq!(parse_install_date("2024"), None);
        assert_eq!(parse_install_date("202401150"), None);
        assert_eq!(parse_install_date("20241315"), None);
        assert_eq!(parse_install_date("20240230"), None);
        assert_eq!(parse_install_date("20230229"), None);
        assert_eq!(parse_install_date("19000101"), None);
    }

    #[test]
    fn estimated_size_converts_kilobytes_to_bytes() {
        assert_eq!(estimated_size_kb_to_bytes(0), 0);
        assert_eq!(estimated_size_kb_to_bytes(1), 1024);
        assert_eq!(estimated_size_kb_to_bytes(204_800), 209_715_200);
        assert_eq!(
            estimated_size_kb_to_bytes(u32::MAX),
            u64::from(u32::MAX) * 1024
        );
    }

    #[test]
    fn short_and_generic_names_are_rejected() {
        assert!(!is_usable_component("Git"));
        assert!(!is_usable_component("  ab  "));
        assert!(!is_usable_component("Cache"));
        assert!(!is_usable_component("MICROSOFT"));
        assert!(!is_usable_component("temp"));
        assert!(is_usable_component("Blender"));
        assert!(is_usable_component("Mozilla Firefox"));
    }

    #[test]
    fn joins_include_name_and_publisher_with_confidence() {
        let joins = leftover_joins("Blender", Some("Blender Foundation"));
        assert_eq!(joins.len(), 3);
        assert_eq!(joins[0].0, vec!["Blender".to_string()]);
        assert_eq!(joins[0].1, LeftoverConfidence::Medium);
        assert_eq!(
            joins[1].0,
            vec!["Blender Foundation".to_string(), "Blender".to_string()]
        );
        assert_eq!(joins[1].1, LeftoverConfidence::Medium);
        assert_eq!(joins[2].0, vec!["Blender Foundation".to_string()]);
        assert_eq!(joins[2].1, LeftoverConfidence::Low);
    }

    #[test]
    fn joins_skip_generic_or_short_components() {
        assert!(leftover_joins("App", Some("Microsoft")).is_empty());
        let joins = leftover_joins("Setup", Some("Contoso Ltd"));
        assert_eq!(joins.len(), 1);
        assert_eq!(joins[0].0, vec!["Contoso Ltd".to_string()]);
        assert_eq!(joins[0].1, LeftoverConfidence::Low);
        let joins = leftover_joins("Blender", None);
        assert_eq!(joins.len(), 1);
        assert_eq!(joins[0].1, LeftoverConfidence::Medium);
    }

    #[test]
    fn protected_paths_are_not_acceptable_candidates() {
        assert!(!is_acceptable_candidate("C:\\"));
        assert!(!is_acceptable_candidate("C:\\Program Files\\Blender"));
        assert!(!is_acceptable_candidate("C:\\Windows\\Blender"));
        assert!(is_acceptable_candidate(
            "C:\\Users\\Karol\\AppData\\Local\\Blender"
        ));
        assert!(is_acceptable_candidate("C:\\ProgramData\\Blender"));
    }

    #[test]
    fn confidence_ordering_ranks_high_first() {
        assert!(
            confidence_rank(LeftoverConfidence::High) < confidence_rank(LeftoverConfidence::Medium)
        );
        assert!(
            confidence_rank(LeftoverConfidence::Medium) < confidence_rank(LeftoverConfidence::Low)
        );
    }
}
