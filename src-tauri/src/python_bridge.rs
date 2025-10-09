use serde::{Deserialize, Serialize};
use std::io::Write;
use std::process::{Command, Stdio};
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PulseBlasterConfig {
    pub board: i32,
    #[serde(rename = "core_clock_MHz")]
    pub core_clock_mhz: Option<f64>,
    pub debug: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PBInstruction {
    pub flags: Flags,
    pub opcode: String,
    pub data: i32,
    pub duration: f64,
    pub units: String,
    // DDS fields (optional)
    pub freq0: Option<i32>,
    pub phase0: Option<i32>,
    pub amp0: Option<i32>,
    pub dds_en0: Option<i32>,
    pub phase_reset0: Option<i32>,
    pub freq1: Option<i32>,
    pub phase1: Option<i32>,
    pub amp1: Option<i32>,
    pub dds_en1: Option<i32>,
    pub phase_reset1: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Flags {
    Integer(u32),
    String(String),
    Array(Vec<u32>),
}

pub struct PulseBlaster {
    config: PulseBlasterConfig,
    app_handle: tauri::AppHandle,
}

impl PulseBlaster {
    pub fn new(config: PulseBlasterConfig, app_handle: tauri::AppHandle) -> Self {
        Self {
            config,
            app_handle,
        }
    }

    pub fn execute_cli_command(
        &self,
        command: &str,
        payload: Option<serde_json::Value>,
    ) -> Result<String, String> {
        // Use direct execution for now since sidecar API is async and requires more setup
        self.try_direct_execution(command, payload)
    }

    fn try_direct_execution(
        &self,
        command: &str,
        payload: Option<serde_json::Value>,
    ) -> Result<String, String> {
        // Try to resolve the executable path directly
        let exe_path = self.resolve_executable_path()?;

        let mut cmd = Command::new(exe_path)
            .arg(command)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn process: {}", e))?;

        // Send payload as JSON to stdin if provided
        if let Some(payload) = payload {
            if let Some(stdin) = cmd.stdin.as_mut() {
                let payload_str = serde_json::to_string(&payload)
                    .map_err(|e| format!("Failed to serialize payload: {}", e))?;
                stdin
                    .write_all(payload_str.as_bytes())
                    .map_err(|e| format!("Failed to write to stdin: {}", e))?;
            }
        }

        let output = cmd
            .wait_with_output()
            .map_err(|e| format!("Failed to wait for command output: {}", e))?;

        if output.status.success() {
            String::from_utf8(output.stdout).map_err(|e| format!("Invalid UTF-8 output: {}", e))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Command failed: {}", stderr))
        }
    }

    fn resolve_executable_path(&self) -> Result<std::path::PathBuf, String> {
        let exe_name = "pulseblaster.exe";
        
        // 1. Try Tauri resource resolution
        if let Ok(resource_path) = self.app_handle
            .path()
            .resolve(&format!("bin/{}", exe_name), tauri::path::BaseDirectory::Resource) 
        {
            if resource_path.exists() {
                return Ok(resource_path);
            }
        }

        // 2. Try relative to current executable (for bundled applications)
        if let Ok(current_exe) = std::env::current_exe() {
            if let Some(exe_dir) = current_exe.parent() {
                let relative_path = exe_dir.join("bin").join(exe_name);
                if relative_path.exists() {
                    return Ok(relative_path);
                }
                
                // Also try in the same directory as the main executable
                let same_dir_path = exe_dir.join(exe_name);
                if same_dir_path.exists() {
                    return Ok(same_dir_path);
                }
            }
        }

        // 3. Try from src-tauri directory (development)
        let src_tauri_path = std::path::Path::new("src-tauri")
            .join("bin")
            .join(exe_name);
        if src_tauri_path.exists() {
            return Ok(src_tauri_path);
        }

        // 4. Try from current working directory + src-tauri (for when running from project root)
        if let Ok(current_dir) = std::env::current_dir() {
            let cwd_path = current_dir.join("src-tauri").join("bin").join(exe_name);
            if cwd_path.exists() {
                return Ok(cwd_path);
            }
        }

        Err("Could not locate pulseblaster.exe executable".to_string())
    }

    pub fn initialize(&self) -> Result<String, String> {
        // Use the CLI status command to initialize and check hardware
        self.execute_cli_command("status", None)
    }

    pub fn program_instructions(&self, instructions: Vec<PBInstruction>) -> Result<String, String> {
        let payload = serde_json::json!({
            "board": self.config.board,
            "coreClockMHz": self.config.core_clock_mhz,
            "debug": self.config.debug,
            "program": instructions
        });

        self.execute_cli_command("run", Some(payload))
    }

    pub fn start(&self) -> Result<String, String> {
        self.execute_cli_command("start", None)
    }

    pub fn stop(&self) -> Result<String, String> {
        self.execute_cli_command("stop", None)
    }

    pub fn reset(&self) -> Result<String, String> {
        self.execute_cli_command("reset", None)
    }

    pub fn get_status(&self) -> Result<String, String> {
        self.execute_cli_command("status", None)
    }

    pub fn wait_until_stopped(&self, timeout_s: f64) -> Result<String, String> {
        let payload = serde_json::json!({
            "timeout_s": timeout_s
        });
        self.execute_cli_command("wait", Some(payload))
    }


}
