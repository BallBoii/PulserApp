# PulseBlaster Hardware Integration Guide

This guide explains how to connect and use SpinCore PulseBlaster hardware with your Next.js + Tauri application.

## Overview

Your application integrates PulseBlaster hardware through:
1. **Rust Backend**: Direct SpinAPI library bindings in Tauri
2. **TypeScript Service**: Frontend abstraction layer for hardware communication
3. **React Components**: User interface for hardware control

## Prerequisites

### 1. SpinCore Software Installation

Download and install the SpinCore SDK from [SpinCore's website](https://www.spincore.com/):

**Windows:**
- Download SpinAPI SDK for Windows
- Install to default location (typically `C:\SpinCore\SpinAPI\`)
- Add the library path to your system PATH or set `SPINAPI_LIB_DIR` environment variable

**Linux/macOS:**
- Download and compile SpinAPI SDK
- Install libraries to `/usr/local/lib` or `/opt/spincore/lib`
- Set `LD_LIBRARY_PATH` (Linux) or `DYLD_LIBRARY_PATH` (macOS)

### 2. Hardware Setup

1. **Connect PulseBlaster**: Connect your PulseBlaster device via USB or PCIe
2. **Install Drivers**: Install the appropriate device drivers
3. **Test Connection**: Verify the device is recognized by running SpinCore's test utilities

### 3. Environment Configuration

Set the SpinAPI library path (if not in standard locations):

**Windows:**
```cmd
set SPINAPI_LIB_DIR=C:\SpinCore\SpinAPI\lib
```

**Linux/macOS:**
```bash
export SPINAPI_LIB_DIR=/usr/local/lib
```

## Building the Application

### Development Mode

```bash
# Install dependencies
pnpm install

# Start development server (frontend + backend)
pnpm tauri dev
```

### Production Build

```bash
# Build for production
pnpm tauri build
```

## Hardware Control Features

### 1. Connection Management

The `HardwareControl` component provides:
- **Board Selection**: Choose which PulseBlaster board to use (default: 0)
- **Clock Configuration**: Set the core clock frequency (default: 500 MHz)
- **Connection Status**: Real-time connection status monitoring

### 2. Pulse Programming

- **Sequence Upload**: Program your designed pulse sequence to hardware
- **Instruction Validation**: Automatic validation of instruction parameters
- **Error Handling**: Comprehensive error reporting for programming issues

### 3. Execution Control

- **Start/Stop**: Control pulse sequence execution
- **Reset**: Hardware reset functionality
- **Status Monitoring**: Real-time hardware status display

## Usage Instructions

### Basic Workflow

1. **Design Sequence**: Use the visual editor to create your pulse sequence
2. **Configure Hardware**: Set board number and clock frequency
3. **Connect**: Click "Connect" to initialize the PulseBlaster
4. **Program**: Click "Program Sequence" to upload your design
5. **Execute**: Use Start/Stop buttons to control execution
6. **Monitor**: Watch real-time status updates

### Hardware Status Indicators

The status panel shows:
- **Running**: Pulse program is actively executing
- **Stopped**: Hardware is stopped/idle
- **Reset**: Hardware is in reset state  
- **Waiting**: Hardware is waiting for trigger/condition

### Error Handling

Common errors and solutions:

**"Failed to initialize PulseBlaster"**
- Check hardware connection
- Verify drivers are installed
- Ensure no other software is using the device

**"Failed to program sequence"**
- Check instruction parameters
- Verify sequence has valid STOP instruction
- Ensure timing constraints are met

**"Library not found"**
- Set `SPINAPI_LIB_DIR` environment variable
- Install SpinCore SDK
- Check library path in build configuration

## Advanced Configuration

### Custom Library Paths

Modify `src-tauri/build.rs` to add custom SpinAPI library paths:

```rust
let custom_paths = [
    "/your/custom/path/lib",
    // Add more paths as needed
];
```

### Hardware-Specific Settings

Different PulseBlaster models may require specific configurations:

```typescript
// For PulseBlasterESR-PRO
const config = {
  board_num: 0,
  clock_freq_mhz: 400.0  // Lower frequency for ESR-PRO
};

// For PulseBlaster24
const config = {
  board_num: 0,
  clock_freq_mhz: 100.0  // Much lower for PB24
};
```

### Multiple Devices

To use multiple PulseBlaster devices:

```typescript
// Connect to first device
await pulseBlasterService.initialize({ board_num: 0, clock_freq_mhz: 500.0 });

// For second device, you'll need a separate service instance
const secondDevice = new PulseBlasterService();
await secondDevice.initialize({ board_num: 1, clock_freq_mhz: 500.0 });
```

## API Reference

### PulseBlasterService Methods

```typescript
// Initialize hardware
await pulseBlasterService.initialize(config);

// Program sequence
await pulseBlasterService.programSequence(instructions);

// Control execution
await pulseBlasterService.start();
await pulseBlasterService.stop();
await pulseBlasterService.reset();

// Get status
const status = await pulseBlasterService.getStatus();

// Cleanup
await pulseBlasterService.disconnect();
```

### Configuration Types

```typescript
interface PulseBlasterConfig {
  board_num: number;      // Board index (0-based)
  clock_freq_mhz: number; // Core clock frequency in MHz
}

interface PulseBlasterStatus {
  status: number;         // Raw status register
  is_running: boolean;    // Execution status
  is_stopped: boolean;    // Stop status
  is_reset: boolean;      // Reset status
  is_waiting: boolean;    // Wait status
}
```

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure Rust toolchain is installed
   - Verify SpinAPI SDK installation
   - Check environment variables

2. **Runtime Errors**
   - Check device permissions
   - Verify hardware connection
   - Test with SpinCore utilities first

3. **Performance Issues**
   - Adjust status polling frequency
   - Optimize instruction sequences
   - Check system resources

### Debug Mode

Enable debug logging by setting environment variable:
```bash
RUST_LOG=debug pnpm tauri dev
```

### Testing Without Hardware

For development without physical hardware, you can:
1. Mock the SpinAPI calls in `pulseblaster.rs`
2. Use the simulation mode in your frontend
3. Test with Python library export functionality

## Support

For additional help:
1. Check SpinCore documentation and examples
2. Review Tauri documentation for Rust/JS integration
3. Examine the generated Python code for reference implementations
4. Test individual components in isolation