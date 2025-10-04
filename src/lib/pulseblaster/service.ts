import { invoke } from '@tauri-apps/api/core';
import { PulseInstruction } from '@/types/pulser/pulse';

export interface PulseBlasterConfig {
  board_num: number;
  clock_freq_mhz: number;
}

export interface PulseBlasterStatus {
  status: number;
  is_running: boolean;
  is_stopped: boolean;
  is_reset: boolean;
  is_waiting: boolean;
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
        duration: inst.duration
      }));

      const result = await invoke<string>('program_pulse_sequence', { 
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
      const result = await invoke<string>('start_pulse_program');
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
      const result = await invoke<string>('stop_pulse_program');
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
  async getStatus(): Promise<PulseBlasterStatus> {
    if (!this.isInitialized) {
      throw new Error('PulseBlaster not initialized');
    }

    try {
      const status = await invoke<number>('get_pulseblaster_status');
      
      // Decode status bits (typical PulseBlaster status format)
      return {
        status,
        is_running: (status & 0x01) !== 0,
        is_stopped: (status & 0x02) !== 0,
        is_reset: (status & 0x04) !== 0,
        is_waiting: (status & 0x08) !== 0,
      };
    } catch (error) {
      throw new Error(`Failed to get PulseBlaster status: ${error}`);
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