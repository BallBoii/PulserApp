use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
use std::io::Write;
use tempfile::NamedTempFile;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PythonPulseBlasterConfig {
    pub board: i32,
    #[serde(rename = "core_clock_MHz")]
    pub core_clock_mhz: Option<f64>,
    pub debug: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PythonPBInstruction {
    pub flags: PythonFlags,
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
pub enum PythonFlags {
    Integer(u32),
    String(String),
    Array(Vec<u32>),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PulseSequencePattern {
    pub flags: PythonFlags,
    pub duration: f64,
    pub units: String,
}

pub struct PythonPulseBlaster {
    config: PythonPulseBlasterConfig,
    python_script_path: String,
}

impl PythonPulseBlaster {
    pub fn new(config: PythonPulseBlasterConfig, script_path: String) -> Self {
        // The script_path should already be resolved by the caller
        // but we'll keep some fallback logic for safety
        let resolved_path = if std::path::Path::new(&script_path).is_absolute() {
            script_path
        } else {
            // For relative paths during development, resolve from src-tauri directory
            let current_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            let src_tauri_dir = if current_dir.ends_with("src-tauri") {
                current_dir
            } else {
                current_dir.join("src-tauri")
            };
            let dev_path = src_tauri_dir.join(&script_path);
            
            // Check if the development path exists
            if dev_path.exists() {
                dev_path.to_string_lossy().to_string()
            } else {
                // Fallback to the original path for bundled resources
                script_path
            }
        };
        
        Self {
            config,
            python_script_path: resolved_path,
        }
    }

    pub fn execute_python_command(&self, command: &str) -> Result<String, String> {
        let script_path = std::path::Path::new(&self.python_script_path);
        let script_dir = script_path.parent().ok_or("Invalid script path")?;
        let script_dir_str = script_dir.to_string_lossy();
        
        let script = format!(
            r#"
import sys
import os

# Add the script directory to Python path
script_dir = r"{}"
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

# Debug: Print Python path and check if module exists
print(f"Python path: {{sys.path}}", file=sys.stderr)
print(f"Script directory: {{script_dir}}", file=sys.stderr)
print(f"pulserblaster.py exists: {{os.path.exists(os.path.join(script_dir, 'pulserblaster.py'))}}", file=sys.stderr)

try:
    from pulserblaster import PulseBlaster
    import json

    # Configuration - parse JSON properly
    import json
    config_str = '{}'
    config = json.loads(config_str)
    
    pb = PulseBlaster(
        board=config['board'],
        core_clock_MHz=config.get('core_clock_MHz'),
        debug=config['debug']
    )

    try:
        with pb:
{}
            result = {{"status": "success", "message": "Command executed successfully"}}
        print(json.dumps(result))
    except Exception as e:
        error = {{"status": "error", "message": str(e)}}
        print(json.dumps(error))
        
except ImportError as e:
    error = {{"status": "error", "message": f"Failed to import pulserblaster module: {{str(e)}}. Script directory: {{script_dir}}"}}
    print(json.dumps(error))
except Exception as e:
    error = {{"status": "error", "message": f"Unexpected error: {{str(e)}}"}}
    print(json.dumps(error))
"#,
            script_dir_str,
            serde_json::to_string(&self.config).map_err(|e| e.to_string())?,
            command
        );

        self.run_python_script(&script)
    }

    pub fn initialize(&self) -> Result<String, String> {
        // First, test if we can import the module without initializing hardware
        let test_script = format!(
            r#"
import sys
import os
import json

# Add the script directory to Python path
script_dir = r"{}"
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

try:
    from pulserblaster import PulseBlaster
    result = {{"status": "success", "message": "Module imported successfully"}}
    print(json.dumps(result))
except ImportError as e:
    error = {{"status": "error", "message": f"Failed to import pulserblaster module: {{str(e)}}. Script directory: {{script_dir}}, Files in dir: {{os.listdir(script_dir) if os.path.exists(script_dir) else 'Directory not found'}}"}}
    print(json.dumps(error))
"#,
            std::path::Path::new(&self.python_script_path).parent().unwrap().to_string_lossy()
        );
        
        // Test the import first
        let import_result = self.run_python_script(&test_script)?;
        let import_response: serde_json::Value = serde_json::from_str(&import_result)
            .map_err(|e| format!("Failed to parse import test response: {}", e))?;
            
        if import_response["status"] == "error" {
            return Err(import_response["message"].as_str().unwrap_or("Unknown import error").to_string());
        }

        // If import succeeded, proceed with hardware initialization
        let command = r#"            # PulseBlaster is automatically opened in context manager
            status = pb.status_bits()
            result = {"status": "success", "message": "PulseBlaster initialized", "hardware_status": status}"#;
        
        self.execute_python_command(command)
    }

    pub fn program_instructions(&self, instructions: Vec<PythonPBInstruction>) -> Result<String, String> {
        let instructions_json = serde_json::to_string(&instructions)
            .map_err(|e| format!("Failed to serialize instructions: {}", e))?;

        let command = format!(
            r#"
import json
from pulserblaster import PBInstruction

# Parse instructions from JSON
instructions_data = json.loads('{}')
instructions = []

for inst_data in instructions_data:
    inst = PBInstruction(
        flags=inst_data['flags'],
        opcode=inst_data['opcode'],
        data=inst_data['data'],
        duration=inst_data['duration'],
        units=inst_data['units']
    )
    
    # Add DDS fields if present
    if inst_data.get('freq0') is not None:
        inst.freq0 = inst_data['freq0']
    if inst_data.get('phase0') is not None:
        inst.phase0 = inst_data['phase0']
    if inst_data.get('amp0') is not None:
        inst.amp0 = inst_data['amp0']
    if inst_data.get('dds_en0') is not None:
        inst.dds_en0 = inst_data['dds_en0']
    if inst_data.get('phase_reset0') is not None:
        inst.phase_reset0 = inst_data['phase_reset0']
        
    if inst_data.get('freq1') is not None:
        inst.freq1 = inst_data['freq1']
    if inst_data.get('phase1') is not None:
        inst.phase1 = inst_data['phase1']
    if inst_data.get('amp1') is not None:
        inst.amp1 = inst_data['amp1']
    if inst_data.get('dds_en1') is not None:
        inst.dds_en1 = inst_data['dds_en1']
    if inst_data.get('phase_reset1') is not None:
        inst.phase_reset1 = inst_data['phase_reset1']
    
    instructions.append(inst)

# Validate and program the sequence
warnings = pb.validate_program(instructions)
pb.program_pulse_program(instructions)
if warnings:
    result = {{"status": "warning", "message": "Instructions programmed with warnings", "warnings": warnings}}
else:
    result = {{"status": "success", "message": "Instructions programmed successfully"}}
"#,
            instructions_json.replace('\\', "\\\\").replace('"', "\\\"")
        );

        self.execute_python_command(&command)
    }

    pub fn program_simple_pulse_sequence(&self, patterns: Vec<PulseSequencePattern>, repeat_count: u32) -> Result<String, String> {
        let patterns_json = serde_json::to_string(&patterns)
            .map_err(|e| format!("Failed to serialize patterns: {}", e))?;

        let command = format!(
            r#"
import json

# Parse pulse patterns
patterns_data = json.loads('{}')
patterns = [(p['flags'], p['duration'], p['units']) for p in patterns_data]

# Program the sequence
pb.program_pulse_sequence(patterns, repeat_count={})
result = {{"status": "success", "message": "Pulse sequence programmed successfully"}}
"#,
            patterns_json.replace('\\', "\\\\").replace('"', "\\\""),
            repeat_count
        );

        self.execute_python_command(&command)
    }

    pub fn start(&self) -> Result<String, String> {
        self.execute_python_command("pb.start()")
    }

    pub fn stop(&self) -> Result<String, String> {
        self.execute_python_command("pb.stop()")
    }

    pub fn reset(&self) -> Result<String, String> {
        self.execute_python_command("pb.reset()")
    }

    pub fn get_status(&self) -> Result<String, String> {
        let command = r#"
status_bits = pb.status_bits()
status_text = pb.status_text()
result = {
    "status": "success", 
    "hardware_status": status_bits,
    "status_message": status_text
}
"#;
        self.execute_python_command(command)
    }

    pub fn program_freq_registers(&self, frequencies: Vec<f64>) -> Result<String, String> {
        let freqs_str = frequencies.iter()
            .map(|f| format!("{}*sp.MHz", f))
            .collect::<Vec<_>>()
            .join(", ");

        let command = format!(
            r#"
import spinapi as sp
reg_ids = pb.program_freq_regs({})
result = {{"status": "success", "message": "Frequency registers programmed", "register_ids": reg_ids}}
"#,
            freqs_str
        );

        self.execute_python_command(&command)
    }

    pub fn program_phase_registers(&self, phases: Vec<f64>) -> Result<String, String> {
        let phases_str = phases.iter()
            .map(|p| p.to_string())
            .collect::<Vec<_>>()
            .join(", ");

        let command = format!(
            r#"
reg_ids = pb.program_phase_regs({})
result = {{"status": "success", "message": "Phase registers programmed", "register_ids": reg_ids}}
"#,
            phases_str
        );

        self.execute_python_command(&command)
    }

    pub fn program_amplitude_registers(&self, amplitudes: Vec<f64>) -> Result<String, String> {
        let amps_str = amplitudes.iter()
            .map(|a| a.to_string())
            .collect::<Vec<_>>()
            .join(", ");

        let command = format!(
            r#"
reg_ids = pb.program_amp_regs({})
result = {{"status": "success", "message": "Amplitude registers programmed", "register_ids": reg_ids}}
"#,
            amps_str
        );

        self.execute_python_command(&command)
    }

    pub fn wait_until_stopped(&self, timeout_s: f64) -> Result<String, String> {
        let command = format!(
            r#"
success = pb.wait_until_stopped(timeout_s={})
result = {{"status": "success", "stopped": success, "message": "Wait completed"}}
"#,
            timeout_s
        );

        self.execute_python_command(&command)
    }

    fn run_python_script(&self, script: &str) -> Result<String, String> {
        // Create a temporary file for the script
        let mut temp_file = NamedTempFile::new()
            .map_err(|e| format!("Failed to create temp file: {}", e))?;

        temp_file.write_all(script.as_bytes())
            .map_err(|e| format!("Failed to write script: {}", e))?;

        // Get Python executable path
        let python_exe = self.find_python_executable()?;
        
        let output = Command::new(&python_exe)
            .arg(temp_file.path())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to execute Python at '{}': {}", python_exe, e))?;
            
        if output.status.success() {
            String::from_utf8(output.stdout)
                .map_err(|e| format!("Invalid UTF-8 output: {}", e))
        } else {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            
            // Include both stdout and stderr for better debugging
            let error_message = if !stdout.is_empty() {
                format!("Python execution failed:\nStdout: {}\nStderr: {}", stdout, stderr)
            } else {
                format!("Python execution failed: {}", stderr)
            };
            
            Err(error_message)
        }
    }

    fn find_python_executable(&self) -> Result<String, String> {
        let script_dir = std::path::Path::new(&self.python_script_path).parent()
            .ok_or("Invalid script path")?;
        
        // Priority order for finding Python executable:
        // 1. Virtual environment in the same directory as the script
        // 2. Bundled Python (for production builds)
        // 3. System Python (fallback)
        
        let mut python_candidates = vec![];
        let mut tried_paths = vec![];
        
        // 1. Virtual environment Python in script directory
        let venv_locations = [
            script_dir.join(".venv").join("Scripts").join("python.exe"),  // Windows
            script_dir.join(".venv").join("bin").join("python"),          // Unix
        ];
        
        for location in &venv_locations {
            tried_paths.push(location.to_string_lossy().to_string());
            if location.exists() {
                python_candidates.push(location.to_string_lossy().to_string());
            }
        }
        
        // 2. Try to find bundled Python for production builds
        if let Ok(current_exe) = std::env::current_exe() {
            if let Some(app_dir) = current_exe.parent() {
                // Common bundled locations in different Tauri configurations
                let bundled_locations = [
                    // Direct in app directory
                    app_dir.join("python").join(".venv").join("Scripts").join("python.exe"),
                    app_dir.join("python").join(".venv").join("bin").join("python"),
                    // In resources subdirectory (common for some bundlers)
                    app_dir.join("resources").join("python").join(".venv").join("Scripts").join("python.exe"),
                    app_dir.join("resources").join("python").join(".venv").join("bin").join("python"),
                    // macOS app bundle structure
                    app_dir.join("..").join("Resources").join("python").join(".venv").join("bin").join("python"),
                    // Windows installer structure
                    app_dir.join("..").join("python").join(".venv").join("Scripts").join("python.exe"),
                ];
                
                for location in &bundled_locations {
                    tried_paths.push(location.to_string_lossy().to_string());
                    if location.exists() {
                        python_candidates.push(location.to_string_lossy().to_string());
                    }
                }
            }
        }
        
        // 3. System Python as fallback
        let system_pythons = ["python", "python3", "py"];
        for py_cmd in &system_pythons {
            python_candidates.push(py_cmd.to_string());
            tried_paths.push(py_cmd.to_string());
        }
        
        // Test each candidate
        for py_cmd in &python_candidates {
            if self.test_python_executable(py_cmd) {
                println!("Found working Python executable: {}", py_cmd);
                return Ok(py_cmd.clone());
            }
        }
        
        // Enhanced error message with debugging info
        let debug_info = format!(
            "Script path: {}\nScript directory: {}\nCurrent exe: {:?}\nTried paths: {}",
            self.python_script_path,
            script_dir.display(),
            std::env::current_exe(),
            tried_paths.join("\n  ")
        );
        
        Err(format!(
            "No working Python interpreter found.\n\nDebug information:\n{}\n\nPlease ensure:\n1. Python virtual environment exists at script location\n2. Python is installed system-wide\n3. Required Python packages are installed",
            debug_info
        ))
    }

    fn test_python_executable(&self, python_path: &str) -> bool {
        Command::new(python_path)
            .arg("-c")
            .arg("print('test')")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|status| status.success())
            .unwrap_or(false)
    }
}