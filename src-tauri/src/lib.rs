mod python_bridge;

use python_bridge::{PBInstruction, PulseBlaster, PulseBlasterConfig};
use std::sync::Mutex;
use tauri::State;

// Global state to hold Python PulseBlaster instance
struct PulseBlasterState(Mutex<Option<PulseBlaster>>);

#[tauri::command]
fn initialize_pulseblaster(
    config: PulseBlasterConfig,
    state: State<PulseBlasterState>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let pb = PulseBlaster::new(config, app);
    let result = pb.initialize()?;

    let mut pb_state = state.0.lock().unwrap();
    *pb_state = Some(pb);

    Ok(result)
}

#[tauri::command]
fn program_instructions(
    instructions: Vec<PBInstruction>,
    state: State<PulseBlasterState>,
) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.program_instructions(instructions)
    } else {
        Err("PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn start_pulseblaster(state: State<PulseBlasterState>) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.start()
    } else {
        Err("PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn stop_pulseblaster(state: State<PulseBlasterState>) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.stop()
    } else {
        Err("PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn reset_pulseblaster(state: State<PulseBlasterState>) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.reset()
    } else {
        Err("PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn get_pulseblaster_status(state: State<PulseBlasterState>) -> Result<String, String> {
    let pb_state = state.0.lock().unwrap();
    if let Some(ref pb) = *pb_state {
        pb.get_status()
    } else {
        Err("PulseBlaster not initialized".to_string())
    }
}

#[tauri::command]
fn wait_until_stopped(timeout_s: f64, state: State<PulseBlasterState>) -> Result<String, String> {
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
        .plugin(tauri_plugin_shell::init())
        .manage(PulseBlasterState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            initialize_pulseblaster,
            start_pulseblaster,
            stop_pulseblaster,
            reset_pulseblaster,
            get_pulseblaster_status,
            wait_until_stopped,
            program_instructions
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
