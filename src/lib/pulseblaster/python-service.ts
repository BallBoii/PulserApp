import { invoke } from '@tauri-apps/api/core';
import { PulseInstruction } from '@/types/pulser/pulse';

export interface PythonPulseBlasterConfig {
  board: number;
  core_clock_MHz?: number;
  debug: boolean;
}

export interface PythonPBInstruction {
  flags: number | string | number[];
  opcode: string;
  data: number;
  duration: number;
  units: string;
  // DDS fields (optional)
  freq0?: number;
  phase0?: number;
  amp0?: number;
  dds_en0?: number;
  phase_reset0?: number;
  freq1?: number;
  phase1?: number;
  amp1?: number;
  dds_en1?: number;
  phase_reset1?: number;
}

export interface PulseSequencePattern {
  flags: number | string | number[];
  duration: number;
  units: string;
}

export interface PythonPulseBlasterStatus {
  status: string;
  hardware_status?: {
    stopped: boolean;
    reset: boolean;
    running: boolean;
    waiting: boolean;
  };
  status_message?: string;
  warnings?: string[];
}

export class PythonPulseBlasterService {
  private isInitialized = false;
  private scriptPath: string;

  constructor(scriptPath?: string) {
    // Default to the included Python script
    // The Rust bridge will handle path resolution from the src-tauri directory
    const defaultPath = 'python/pulserblaster.py';
    this.scriptPath = scriptPath || defaultPath;
  }

  /**
   * Initialize the Python PulseBlaster wrapper
   */
  async initialize(config: PythonPulseBlasterConfig): Promise<void> {
    try {
      const result = await invoke<string>('initialize_python_pulseblaster', { 
        config,
        scriptPath: this.scriptPath
      });
      
      const response = JSON.parse(result);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      this.isInitialized = true;
      console.log('Python PulseBlaster initialized:', response.message);
      
      // Log hardware status if available
      if (response.hardware_status) {
        console.log('Hardware status:', response.hardware_status);
      }
    } catch (error) {
      this.isInitialized = false;
      
      // Provide more specific error messages
      let errorMessage = `Failed to initialize Python PulseBlaster: ${error}`;
      
      if (typeof error === 'string' && error.includes('No working Python interpreter found')) {
        errorMessage = `Python interpreter not found. Please ensure:\n\n` +
          `1. The Python virtual environment exists in the bundled resources\n` +
          `2. Python is installed system-wide as a fallback\n` +
          `3. Required Python packages (spinapi, etc.) are installed\n\n` +
          `Script path: ${this.scriptPath}\n\n` +
          `Original error: ${error}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Program instructions using your Python wrapper
   */
  async programInstructions(instructions: PulseInstruction[]): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      // Convert frontend instructions to Python format
      const pythonInstructions: PythonPBInstruction[] = instructions.map(inst => ({
        flags: inst.flags,
        opcode: inst.opcode,
        data: inst.data,
        duration: inst.duration / 1000000000, // Convert ns to seconds for Python
        units: 's'
      }));

      const result = await invoke<string>('program_python_instructions', { 
        instructions: pythonInstructions 
      });
      
      const response = JSON.parse(result);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      console.log('Instructions programmed:', response.message);
      return response.warnings || [];
    } catch (error) {
      throw new Error(`Failed to program instructions: ${error}`);
    }
  }

  /**
   * Program a simple pulse sequence with repetition
   */
  async programPulseSequence(
    patterns: Array<{
      flags: number | string | number[];
      duration: number;
      units: string;
    }>,
    repeatCount: number = 1
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('program_python_pulse_sequence', { 
        patterns,
        repeatCount
      });
      
      const response = JSON.parse(result);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      console.log('Pulse sequence programmed:', response.message);
    } catch (error) {
      throw new Error(`Failed to program pulse sequence: ${error}`);
    }
  }

  /**
   * Start the programmed pulse sequence
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('start_python_pulseblaster');
      const response = JSON.parse(result);
      
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      console.log('Pulse program started:', response.message);
    } catch (error) {
      throw new Error(`Failed to start pulse program: ${error}`);
    }
  }

  /**
   * Stop the running pulse sequence
   */
  async stop(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('stop_python_pulseblaster');
      const response = JSON.parse(result);
      
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      console.log('Pulse program stopped:', response.message);
    } catch (error) {
      throw new Error(`Failed to stop pulse program: ${error}`);
    }
  }

  /**
   * Reset the PulseBlaster hardware
   */
  async reset(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('reset_python_pulseblaster');
      const response = JSON.parse(result);
      
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      console.log('PulseBlaster reset:', response.message);
    } catch (error) {
      throw new Error(`Failed to reset PulseBlaster: ${error}`);
    }
  }

  /**
   * Get comprehensive hardware status
   */
  async getStatus(): Promise<PythonPulseBlasterStatus> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('get_python_pulseblaster_status');
      const response = JSON.parse(result);
      
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to get PulseBlaster status: ${error}`);
    }
  }

  /**
   * Program frequency registers for DDS
   */
  async programFrequencyRegisters(frequencies: number[]): Promise<number[]> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('program_python_freq_registers', { frequencies });
      const response = JSON.parse(result);
      
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      console.log('Frequency registers programmed:', response.message);
      return response.register_ids;
    } catch (error) {
      throw new Error(`Failed to program frequency registers: ${error}`);
    }
  }

  /**
   * Program phase registers for DDS
   */
  async programPhaseRegisters(phases: number[]): Promise<number[]> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('program_python_phase_registers', { phases });
      const response = JSON.parse(result);
      
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      console.log('Phase registers programmed:', response.message);
      return response.register_ids;
    } catch (error) {
      throw new Error(`Failed to program phase registers: ${error}`);
    }
  }

  /**
   * Program amplitude registers for DDS
   */
  async programAmplitudeRegisters(amplitudes: number[]): Promise<number[]> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('program_python_amp_registers', { amplitudes });
      const response = JSON.parse(result);
      
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      console.log('Amplitude registers programmed:', response.message);
      return response.register_ids;
    } catch (error) {
      throw new Error(`Failed to program amplitude registers: ${error}`);
    }
  }

  /**
   * Wait until the pulse program stops
   */
  async waitUntilStopped(timeoutSeconds: number = 5.0): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Python PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('wait_python_until_stopped', { 
        timeoutS: timeoutSeconds 
      });
      const response = JSON.parse(result);
      
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      
      return response.stopped;
    } catch (error) {
      throw new Error(`Failed to wait for stop: ${error}`);
    }
  }

  /**
   * Check if PulseBlaster is initialized
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      try {
        await this.stop();
        await this.reset();
        this.isInitialized = false;
      } catch (error) {
        console.warn('Error during disconnect:', error);
        this.isInitialized = false;
      }
    }
  }

  /**
   * Set the Python script path
   */
  setScriptPath(path: string): void {
    this.scriptPath = path;
  }

  /**
   * Get diagnostic information about the Python environment
   */
  async getDiagnostics(): Promise<{
    scriptPath: string;
    isInitialized: boolean;
    pythonInfo?: PythonPulseBlasterStatus;
  }> {
    const diagnostics = {
      scriptPath: this.scriptPath,
      isInitialized: this.isInitialized,
    };

    if (this.isInitialized) {
      try {
        const status = await this.getStatus();
        return {
          ...diagnostics,
          pythonInfo: status
        };
      } catch (error) {
        console.warn('Could not get Python status for diagnostics:', error);
      }
    }

    return diagnostics;
  }
}

// Export singleton instance
export const pythonPulseBlasterService = new PythonPulseBlasterService();