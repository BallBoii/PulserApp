mod python_bridge;

use python_bridge::{
    PythonPulseBlaster, 
    PythonPulseBlasterConfig, 
    PythonPBInstruction, 
    PulseSequencePattern
};
use std::sync::Mutex;
use tauri::{State, Manager};

// Global state to hold Python PulseBlaster instance
struct PythonPulseBlasterState(Mutex<Option<PythonPulseBlaster>>);

#[tauri::command]
fn initialize_python_pulseblaster(
    config: PythonPulseBlasterConfig, 
    script_path: String,
    state: State<PythonPulseBlasterState>,
    app: tauri::AppHandle
) -> Result<String, String> {
    // Resolve the script path using Tauri's resource resolver
    let resolved_script_path = if script_path.starts_with("python/") {
        // Try to resolve as a resource first
        match app.path().resource_dir() {
            Ok(resource_dir) => {
                let resource_path = resource_dir.join(&script_path);
                if resource_path.exists() {
                    resource_path.to_string_lossy().to_string()
                } else {
                    // Fallback to relative path from current executable
                    match std::env::current_exe() {
                        Ok(exe_path) => {
                            if let Some(exe_dir) = exe_path.parent() {
                                exe_dir.join(&script_path).to_string_lossy().to_string()
                            } else {
                                script_path
                            }
                        }
                        Err(_) => script_path
                    }
                }
            }
            Err(_) => {
                // Fallback to relative path from current executable
                match std::env::current_exe() {
                    Ok(exe_path) => {
                        if let Some(exe_dir) = exe_path.parent() {
                            exe_dir.join(&script_path).to_string_lossy().to_string()
                        } else {
                            script_path
                        }
                    }
                    Err(_) => script_path
                }
            }
        }
    } else {
        script_path
    };

    let pb = PythonPulseBlaster::new(config, resolved_script_path);
    let result = pb.initialize()?;
    
    let mut pb_state = state.0.lock().unwrap();
    *pb_state = Some(pb);
    
    Ok(result)
}

#[tauri::command]
fn program_python_instructions(
    instructions: Vec<PythonPBInstruction>, 
    state: State<PythonPulseBlasterState>
) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.program_instructions(instructions)
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn program_python_pulse_sequence(
    patterns: Vec<PulseSequencePattern>,
    repeat_count: u32,
    state: State<PythonPulseBlasterState>
) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.program_simple_pulse_sequence(patterns, repeat_count)
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn start_python_pulseblaster(state: State<PythonPulseBlasterState>) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.start()
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn stop_python_pulseblaster(state: State<PythonPulseBlasterState>) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.stop()
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn reset_python_pulseblaster(state: State<PythonPulseBlasterState>) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.reset()
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn get_python_pulseblaster_status(state: State<PythonPulseBlasterState>) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.get_status()
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn program_python_freq_registers(
    frequencies: Vec<f64>, 
    state: State<PythonPulseBlasterState>
) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.program_freq_registers(frequencies)
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn program_python_phase_registers(
    phases: Vec<f64>, 
    state: State<PythonPulseBlasterState>
) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.program_phase_registers(phases)
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn program_python_amp_registers(
    amplitudes: Vec<f64>, 
    state: State<PythonPulseBlasterState>
) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.program_amplitude_registers(amplitudes)
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn wait_python_until_stopped(
    timeout_s: f64, 
    state: State<PythonPulseBlasterState>
) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.wait_until_stopped(timeout_s)
    } else {
        Err("Python PulseBlaster not initialized".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(PythonPulseBlasterState(Mutex::new(None)))
    .invoke_handler(tauri::generate_handler![
        initialize_python_pulseblaster,
        program_python_instructions,
        program_python_pulse_sequence,
        start_python_pulseblaster,
        stop_python_pulseblaster,
        reset_python_pulseblaster,
        get_python_pulseblaster_status,
        program_python_freq_registers,
        program_python_phase_registers,
        program_python_amp_registers,
        wait_python_until_stopped
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
