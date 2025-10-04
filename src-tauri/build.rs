fn main() {
  // // Link SpinAPI library
  // // You'll need to set the SPINAPI_LIB_DIR environment variable 
  // // to point to your SpinAPI installation directory
  // if let Ok(lib_dir) = std::env::var("SPINAPI_LIB_DIR") {
  //   println!("cargo:rustc-link-search=native={}", lib_dir);
  //   println!("cargo:rustc-link-lib=dylib=spinapi64"); // or spinapi32 for 32-bit
  // } else {
  //   // Fallback: try common installation paths
  //   #[cfg(windows)]
  //   {
  //     // Common SpinCore installation paths on Windows
  //     let common_paths = [
  //       "C:\\SpinCore\\SpinAPI\\lib",
  //       "C:\\Program Files\\SpinCore\\SpinAPI\\lib",
  //       "C:\\Program Files (x86)\\SpinCore\\SpinAPI\\lib",
  //     ];
      
  //     for path in &common_paths {
  //       if std::path::Path::new(path).exists() {
  //         println!("cargo:rustc-link-search=native={}", path);
  //         println!("cargo:rustc-link-lib=dylib=spinapi64");
  //         break;
  //       }
  //     }
  //   }
    
  //   #[cfg(unix)]
  //   {
  //     // Common installation paths on Linux/macOS
  //     let common_paths = [
  //       "/usr/local/lib",
  //       "/opt/spincore/lib",
  //       "/usr/lib",
  //     ];
      
  //     for path in &common_paths {
  //       if std::path::Path::new(path).exists() {
  //         println!("cargo:rustc-link-search=native={}", path);
  //         println!("cargo:rustc-link-lib=dylib=spinapi");
  //         break;
  //       }
  //     }
  //   }
  // }
  
  tauri_build::build()
}
