import { invoke } from '@tauri-apps/api/core';
import { PulseInstruction } from '@/types/pulser/pulse';

export interface PulseBlasterConfig {
  board: number;
  core_clock_MHz?: number;
  debug: boolean;
}

export class PulseBlasterService {
  private isInitialized = false;

  /**
   * Initialize the PulseBlaster hardware
   */
  async initialize(config: PulseBlasterConfig): Promise<void> {
    try {
      const result = await invoke<string>('initialize_pulseblaster', { config });
      this.isInitialized = true;
      console.log('PulseBlaster initialized:', result);
    } catch (error) {
      this.isInitialized = false;
      throw new Error(`Failed to initialize PulseBlaster: ${error}`);
    }
  }

  /**
   * Program a pulse sequence to the hardware
   */
  async programSequence(instructions: PulseInstruction[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('PulseBlaster not initialized');
    }

    try {
      // Convert frontend instruction format to backend format
      const backendInstructions = instructions.map(inst => ({
        flags: inst.flags,
        opcode: inst.opcode,
        data: inst.data,
        duration: inst.duration,
        units: inst.displayTimeScale || 'ns', // Use displayTimeScale or default to 'ns'
        // Optional DDS fields
        freq0: null,
        phase0: null,
        amp0: null,
        dds_en0: null,
        phase_reset0: null,
        freq1: null,
        phase1: null,
        amp1: null,
        dds_en1: null,
        phase_reset1: null
      }));

      const result = await invoke<string>('program_instructions', { 
        instructions: backendInstructions 
      });
      console.log('Pulse sequence programmed:', result);
    } catch (error) {
      throw new Error(`Failed to program pulse sequence: ${error}`);
    }
  }

  /**
   * Start the programmed pulse sequence
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('start_pulseblaster');
      console.log('Pulse program started:', result);
    } catch (error) {
      throw new Error(`Failed to start pulse program: ${error}`);
    }
  }

  /**
   * Stop the running pulse sequence
   */
  async stop(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('stop_pulseblaster');
      console.log('Pulse program stopped:', result);
    } catch (error) {
      throw new Error(`Failed to stop pulse program: ${error}`);
    }
  }

  /**
   * Reset the PulseBlaster hardware
   */
  async reset(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('reset_pulseblaster');
      console.log('PulseBlaster reset:', result);
    } catch (error) {
      throw new Error(`Failed to reset PulseBlaster: ${error}`);
    }
  }

  /**
   * Get the current status of the PulseBlaster
   */
  async getStatus(): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('PulseBlaster not initialized');
    }

    try {
      const status = await invoke<string>('get_pulseblaster_status');
      return status;
    } catch (error) {
      throw new Error(`Failed to get PulseBlaster status: ${error}`);
    }
  }

  /**
   * Wait until the pulse program stops
   */
  async waitUntilStopped(timeoutS: number): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('PulseBlaster not initialized');
    }

    try {
      const result = await invoke<string>('wait_until_stopped', { timeout_s: timeoutS });
      return result;
    } catch (error) {
      throw new Error(`Failed to wait until stopped: ${error}`);
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
}

// Export singleton instance
// export const pulseBlasterService = new PulseBlasterService();