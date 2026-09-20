//! File read/write tools.

use crate::traits::BaseTool;
use openjarvis_core::{OpenJarvisError, ToolResult, ToolSpec};
use openjarvis_security::file_policy::is_sensitive_file;
use once_cell::sync::Lazy;
use serde_json::Value;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

fn checked_path(path: &Path) -> Result<PathBuf, String> {
    if is_sensitive_file(path) {
        return Err("sensitive file".into());
    }
    let resolved = if path.exists() || path.is_symlink() {
        std::fs::canonicalize(path).map_err(|e| e.to_string())?
    } else {
        let mut parent = path.parent().unwrap_or_else(|| Path::new("."));
        let mut missing = Vec::new();
        while !parent.exists() {
            if let Some(name) = parent.file_name() { missing.push(name.to_os_string()); }
            parent = parent.parent().unwrap_or_else(|| Path::new("."));
        }
        let mut resolved = std::fs::canonicalize(parent).map_err(|e| e.to_string())?;
        for part in missing.iter().rev() { resolved.push(part); }
        if let Some(name) = path.file_name() { resolved.push(name); }
        resolved
    };
    if is_sensitive_file(&resolved) { return Err("resolved target is a sensitive file".into()); }
    Ok(resolved)
}

static READ_SPEC: Lazy<ToolSpec> = Lazy::new(|| ToolSpec {
    name: "file_read".into(), description: "Read the contents of a file".into(),
    parameters: serde_json::json!({"type":"object","properties":{"path":{"type":"string","description":"File path to read"}},"required":["path"]}),
    category: "filesystem".into(), cost_estimate: 0.0, latency_estimate: 0.0, requires_confirmation: false,
    timeout_seconds: 10.0, required_capabilities: vec!["file:read".into()], metadata: HashMap::new(),
});
static WRITE_SPEC: Lazy<ToolSpec> = Lazy::new(|| ToolSpec {
    name: "file_write".into(), description: "Write content to a file".into(),
    parameters: serde_json::json!({"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}),
    category: "filesystem".into(), cost_estimate: 0.0, latency_estimate: 0.0, requires_confirmation: true,
    timeout_seconds: 10.0, required_capabilities: vec!["file:write".into()], metadata: HashMap::new(),
});

pub struct FileReadTool;
impl BaseTool for FileReadTool {
    fn tool_id(&self)->&str{"file_read"} fn spec(&self)->&ToolSpec{&READ_SPEC}
    fn execute(&self, params:&Value)->Result<ToolResult,OpenJarvisError>{
        let raw=params["path"].as_str().unwrap_or(""); let supplied=Path::new(raw);
        let path=match checked_path(supplied){Ok(p)=>p,Err(e)=>return Ok(ToolResult::failure("file_read",format!("Access denied: '{raw}' ({e})")))};
        match std::fs::read_to_string(&path){Ok(c)=>Ok(ToolResult::success("file_read",c)),Err(e)=>Ok(ToolResult::failure("file_read",format!("Error reading '{raw}': {e}")))}
    }
}
pub struct FileWriteTool;
impl BaseTool for FileWriteTool {
    fn tool_id(&self)->&str{"file_write"} fn spec(&self)->&ToolSpec{&WRITE_SPEC}
    fn execute(&self,params:&Value)->Result<ToolResult,OpenJarvisError>{
        let raw=params["path"].as_str().unwrap_or(""); let content=params["content"].as_str().unwrap_or(""); let supplied=Path::new(raw);
        let path=match checked_path(supplied){Ok(p)=>p,Err(e)=>return Ok(ToolResult::failure("file_write",format!("Access denied: '{raw}' ({e})")))};
        if let Some(parent)=path.parent(){if !parent.exists(){if let Err(e)=std::fs::create_dir_all(parent){return Ok(ToolResult::failure("file_write",format!("Error creating directory: {e}")))}}}
        match std::fs::write(&path,content){Ok(())=>Ok(ToolResult::success("file_write",format!("Written {} bytes to {}",content.len(),raw))),Err(e)=>Ok(ToolResult::failure("file_write",format!("Error writing '{raw}': {e}")))}
    }
}
#[cfg(test)]
mod tests {
 use super::*; use std::fs;
 #[test] fn test_file_read_sensitive_blocked(){let r=FileReadTool.execute(&serde_json::json!({"path":".env"})).unwrap();assert!(!r.success);}
 #[test] fn test_file_write_sensitive_blocked(){let r=FileWriteTool.execute(&serde_json::json!({"path":"id_rsa","content":"secret"})).unwrap();assert!(!r.success);}
 #[cfg(unix)] #[test] fn test_symlink_to_sensitive_target_blocked(){
   use std::os::unix::fs::symlink; let root=std::env::temp_dir().join(format!("oj-sec-{}",std::process::id())); let _=fs::remove_dir_all(&root); fs::create_dir_all(&root).unwrap();
   let secret=root.join(".env"); let alias=root.join("notes.txt"); fs::write(&secret,"secret").unwrap(); symlink(&secret,&alias).unwrap();
   let r=FileReadTool.execute(&serde_json::json!({"path":alias.to_string_lossy()})).unwrap(); assert!(!r.success); let _=fs::remove_dir_all(root);
 }
}
