# PulseBlaster Tauri Sidecar Setup - Complete Guide

## Overview

Your PulseBlaster Tauri application now uses a **sidecar approach** for Python integration. This means:

1. **Tauri App (Frontend)** - React/TypeScript UI
2. **Rust Backend** - Tauri commands and sidecar management
3. **Python Sidecar** - Standalone executable that controls PulseBlaster hardware
4. **PulseBlaster Hardware** - Controlled via SpinAPI

## What Was Set Up

### 1. Sidecar Configuration

**File: `src-tauri/tauri.conf.json`**
- Added `resources: ["python/**/*"]` to bundle Python files
- Configured `externalBin: ["bin/pulser.exe"]` for the sidecar executable

**File: `src-tauri/capabilities/default.json`**  
- Added shell permissions to execute the `pulser` sidecar with arguments
- Configured `sidecar: true` for proper security

### 2. Python Sidecar Implementation

**File: `src-tauri/python/sidecar.py`**
- Complete CLI implementation with all PulseBlaster commands
- JSON input/output for communication with Tauri
- Proper error handling and status reporting
- Support for: initialize, program, start, stop, reset, status, wait, cleanup

**File: `src-tauri/python/pulser.spec`**
- PyInstaller specification for building standalone executable
- Includes all dependencies and instruments packages
- Creates single-file executable with embedded Python runtime

### 3. Build System

**File: `src-tauri/python/build.bat`**
- Builds the sidecar using PyInstaller
- Tests the executable
- Copies to Tauri bin directory (`../bin/pulser.exe`)

**File: `src-tauri/python/setup.bat`**
- Complete automated setup script
- Creates Python virtual environment
- Installs dependencies
- Builds the sidecar executable

### 4. Rust Backend

**File: `src-tauri/src/python_bridge.rs`**
- New sidecar-based implementation using Tauri's shell plugin
- Async command execution
- JSON payload handling
- Proper error management

**File: `src-tauri/src/lib.rs`**
- Updated Tauri commands for Python sidecar integration
- New command names with `python_` prefix
- Async command handlers

### 5. Dependencies

**File: `src-tauri/python/requirements.txt`**
- Minimal dependencies: spinapi, click, PyInstaller
- Optional development tools

**File: `src-tauri/Cargo.toml`**
- Added tokio for async support
- Updated tauri features for shell integration

## How to Use

### Initial Setup

1. **Run the setup script:**
   ```cmd
   cd src-tauri\python
   setup.bat
   ```

2. **Verify the setup:**
   ```cmd
   test-sidecar.bat
   ```

### Building Your App

1. **Development:**
   ```cmd
   pnpm tauri dev
   ```

2. **Production Build:**
   ```cmd
   pnpm tauri build
   ```

### TypeScript Integration

Your existing `PythonPulseBlasterService` in `src/lib/pulseblaster/python-service.ts` will work with the new sidecar backend. The Tauri commands have been updated but the TypeScript interface remains the same.

**New Tauri Commands:**
- `initialize_python_pulseblaster`
- `program_python_instructions`
- `program_python_pulse_sequence`
- `start_python_pulseblaster`
- `stop_python_pulseblaster`
- `reset_python_pulseblaster`
- `get_python_pulseblaster_status`
- `wait_python_until_stopped`

## Architecture Benefits

### Security
- Sidecar runs with limited permissions
- No direct Python interpreter access
- Sandboxed execution environment

### Reliability  
- Standalone executable with embedded dependencies
- No Python installation required on target machines
- Consistent behavior across environments

### Performance
- No Python startup overhead per command
- Single process for hardware control
- Efficient JSON communication

### Distribution
- Single executable bundle
- No external dependencies
- Easy deployment

## File Structure

```
src-tauri/
├── python/
│   ├── sidecar.py          # Main sidecar implementation
│   ├── pulser.spec         # PyInstaller specification  
│   ├── build.bat           # Build script
│   ├── setup.bat           # Complete setup script
│   ├── test-sidecar.bat    # Development testing
│   ├── requirements.txt    # Python dependencies
│   ├── README.md           # Python setup documentation
│   ├── .venv/              # Python virtual environment (created by setup)
│   ├── dist/               # Built executable (created by build)
│   └── instruments/        # Your existing PulseBlaster modules
├── bin/
│   └── pulser.exe          # Sidecar executable (copied by build)
├── capabilities/
│   └── default.json        # Updated sidecar permissions
├── src/
│   ├── lib.rs              # Updated Tauri commands
│   └── python_bridge.rs    # New sidecar implementation
├── tauri.conf.json         # Updated configuration
└── Cargo.toml              # Updated dependencies
```

## Next Steps

1. **Test the setup:**
   ```cmd
   cd src-tauri\python
   setup.bat
   test-sidecar.bat
   ```

2. **Build your application:**
   ```cmd
   pnpm tauri build
   ```

3. **Test with hardware:**
   - Connect PulseBlaster device
   - Run your Tauri app
   - Use the existing UI to test PulseBlaster control

## Troubleshooting

### Common Issues

1. **"Sidecar not found" error:**
   - Run `setup.bat` to build the sidecar
   - Check that `bin/pulser.exe` exists

2. **SpinAPI import errors:**
   - Install SpinCore drivers
   - Ensure SpinAPI DLLs are in PATH

3. **Permission errors:**
   - Check `capabilities/default.json` permissions
   - Verify sidecar name matches configuration

4. **Build errors:**
   - Ensure Python 3.8+ is installed
   - Run `pip install -r requirements.txt`

### Development Tips

- Use `test-sidecar.bat` to test sidecar independently
- Check sidecar output with `pulser.exe help`
- Monitor Tauri console for sidecar communication
- Use `debug: true` in PulseBlaster config for verbose logging

## Migration from Previous Setup

Your existing TypeScript code should work without changes. The main differences:

1. **Commands are now async** (handled automatically by Tauri)
2. **Better error handling** with detailed JSON responses  
3. **Improved security** through sidecar sandboxing
4. **Easier distribution** with standalone executable

The sidecar approach provides a more robust, secure, and distributable solution for your PulseBlaster control application.