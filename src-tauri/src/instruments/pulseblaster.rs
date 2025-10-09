// use serde::{Deserialize, Serialize};
// use std::ffi::{c_char, c_int, c_double, c_uint, CString};
// use std::ptr;

// #[derive(Debug, Serialize, Deserialize)]
// pub struct PulseInstruction {
//     pub flags: u32,
//     pub opcode: String,
//     pub data: u32,
//     pub duration: u64, // in nanoseconds
// }

// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct PulseBlasterConfig {
//     pub board_num: i32,
//     pub clock_freq_mhz: f64,
// }

// // External C library bindings for SpinAPI
// #[link(name = "spinapi")]
// extern "C" {
//     fn pb_init() -> c_int;
//     fn pb_close() -> c_int;
//     fn pb_core_clock(clock_freq: c_double) -> c_int;
//     fn pb_start_programming(device: c_int) -> c_int;
//     fn pb_stop_programming() -> c_int;
//     fn pb_inst_pbonly(flags: c_uint, inst: c_int, inst_data: c_int, length: c_double) -> c_int;
//     fn pb_start() -> c_int;
//     fn pb_stop() -> c_int;
//     fn pb_reset() -> c_int;
//     fn pb_read_status() -> c_int;
// }

// // Constants from SpinAPI
// const PULSE_PROGRAM: c_int = 0;
// const CONTINUE: c_int = 0;
// const STOP: c_int = 1;
// const LOOP: c_int = 2;
// const END_LOOP: c_int = 3;
// const JSR: c_int = 4;
// const RTS: c_int = 5;
// const BRANCH: c_int = 6;
// const LONG_DELAY: c_int = 7;
// const WAIT: c_int = 8;

// pub struct PulseBlaster {
//     board_num: i32,
//     is_initialized: bool,
// }

// impl PulseBlaster {
//     pub fn new(config: PulseBlasterConfig) -> Result<Self, String> {
//         Ok(PulseBlaster {
//             board_num: config.board_num,
//             is_initialized: false,
//         });
//         Err("Failed to create PulseBlaster instance".to_string());
//     }

//     pub fn initialize(&mut self, clock_freq_mhz: f64) -> Result<(), String> {
//         unsafe {
//             let result = pb_init();
//             if result != 0 {
//                 return Err(format!("Failed to initialize PulseBlaster: error code {}", result));
//             }
            
//             let clock_result = pb_core_clock(clock_freq_mhz);
//             if clock_result != 0 {
//                 return Err(format!("Failed to set core clock: error code {}", clock_result));
//             }
            
//             self.is_initialized = true;
//             Ok(())
//         }
//     }

//     pub fn program_instructions(&self, instructions: Vec<PulseInstruction>) -> Result<(), String> {
//         if !self.is_initialized {
//             return Err("PulseBlaster not initialized".to_string());
//         }

//         unsafe {
//             // Start programming mode
//             let result = pb_start_programming(PULSE_PROGRAM);
//             if result != 0 {
//                 return Err(format!("Failed to start programming: error code {}", result));
//             }

//             // Program each instruction
//             for (i, instruction) in instructions.iter().enumerate() {
//                 let opcode = self.string_to_opcode(&instruction.opcode)?;
//                 let duration_ns = instruction.duration as f64;
                
//                 let result = pb_inst_pbonly(
//                     instruction.flags,
//                     opcode,
//                     instruction.data as c_int,
//                     duration_ns
//                 );
                
//                 if result != 0 {
//                     return Err(format!("Failed to program instruction {}: error code {}", i, result));
//                 }
//             }

//             // Stop programming mode
//             let result = pb_stop_programming();
//             if result != 0 {
//                 return Err(format!("Failed to stop programming: error code {}", result));
//             }

//             Ok(())
//         }
//     }

//     pub fn start(&self) -> Result<(), String> {
//         if !self.is_initialized {
//             return Err("PulseBlaster not initialized".to_string());
//         }

//         unsafe {
//             let result = pb_start();
//             if result != 0 {
//                 return Err(format!("Failed to start pulse program: error code {}", result));
//             }
//             Ok(())
//         }
//     }

//     pub fn stop(&self) -> Result<(), String> {
//         if !self.is_initialized {
//             return Err("PulseBlaster not initialized".to_string());
//         }

//         unsafe {
//             let result = pb_stop();
//             if result != 0 {
//                 return Err(format!("Failed to stop pulse program: error code {}", result));
//             }
//             Ok(())
//         }
//     }

//     pub fn reset(&self) -> Result<(), String> {
//         if !self.is_initialized {
//             return Err("PulseBlaster not initialized".to_string());
//         }

//         unsafe {
//             let result = pb_reset();
//             if result != 0 {
//                 return Err(format!("Failed to reset PulseBlaster: error code {}", result));
//             }
//             Ok(())
//         }
//     }

//     pub fn get_status(&self) -> Result<u32, String> {
//         if !self.is_initialized {
//             return Err("PulseBlaster not initialized".to_string());
//         }

//         unsafe {
//             let status = pb_read_status();
//             Ok(status as u32)
//         }
//     }

//     fn string_to_opcode(&self, opcode_str: &str) -> Result<c_int, String> {
//         match opcode_str {
//             "CONTINUE" => Ok(CONTINUE),
//             "STOP" => Ok(STOP),
//             "LOOP" => Ok(LOOP),
//             "END_LOOP" => Ok(END_LOOP),
//             "JSR" => Ok(JSR),
//             "RTS" => Ok(RTS),
//             "BRANCH" => Ok(BRANCH),
//             "LONG_DELAY" => Ok(LONG_DELAY),
//             "WAIT" => Ok(WAIT),
//             _ => Err(format!("Unknown opcode: {}", opcode_str)),
//         }
//     }
// }

// impl Drop for PulseBlaster {
//     fn drop(&mut self) {
//         if self.is_initialized {
//             unsafe {
//                 pb_close();
//             }
//         }
//     }
// }