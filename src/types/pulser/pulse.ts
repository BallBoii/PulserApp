export interface PulseInstruction {
  id: string;
  flags: number;
  opcode: 'CONTINUE' | 'STOP' | 'LOOP' | 'END_LOOP' | 'JSR' | 'RTS' | 'BRANCH' | 'LONG_DELAY' | 'WAIT';
  data: number;
  duration: number;
  length?: number; // in nanoseconds
  displayTimeScale?: 'ns' | 'μs' | 'ms' | 's'; // individual time scale for editing
}

export interface VisualizationSettings {
  timeScale: 'ns' | 'μs' | 'ms' | 's';
  flagCount: number;
  showTiming: boolean;
  showOpcode: boolean;
  horizontalScale: number; // pixels per time unit for horizontal scaling
}

export interface PulseProgram {
  instructions: PulseInstruction[];
  totalLength: number;
  name: string;
}

export const OPCODE_OPTIONS = [
  'CONTINUE',
  'STOP', 
  'LOOP',
  'END_LOOP',
  'JSR',
  'RTS',
  'BRANCH',
  'LONG_DELAY',
  'WAIT'
] as const;

export const TIME_SCALE_MULTIPLIERS = {
  'ns': 1,
  'μs': 1000,
  'ms': 1000000,
  's': 1000000000
};

export function getOptimalTimeScale(durationNs: number): 'ns' | 'μs' | 'ms' | 's' {
  if (durationNs >= 1000000000) return 's';   // >= 1 second
  if (durationNs >= 1000000) return 'ms';     // >= 1 millisecond  
  if (durationNs >= 1000) return 'μs';        // >= 1 microsecond
  return 'ns';                                // < 1 microsecond
}

export function getOptimalTimeScaleForInstructions(instructions: PulseInstruction[]): 'ns' | 'μs' | 'ms' | 's' {
  if (instructions.length === 0) return 'μs';
  
  // Get total duration and average duration
  const totalDuration = instructions.reduce((sum, inst) => sum + (inst.length || inst.duration), 0);
  const avgDuration = totalDuration / instructions.length;
  const maxDuration = Math.max(...instructions.map(inst => inst.length || inst.duration));
  
  // Use the scale that works best for the average duration, but consider max
  const avgScale = getOptimalTimeScale(avgDuration);
  const maxScale = getOptimalTimeScale(maxDuration);
  
  // If max is much larger than average, use a scale between them
  const scales: Array<'ns' | 'μs' | 'ms' | 's'> = ['ns', 'μs', 'ms', 's'];
  const avgIndex = scales.indexOf(avgScale);
  const maxIndex = scales.indexOf(maxScale);
  
  // Use a scale that's closer to average but can still show max reasonably
  return scales[Math.min(maxIndex, avgIndex + 1)];
}

export function formatDurationInScale(durationNs: number, timeScale: 'ns' | 'μs' | 'ms' | 's'): string {
  const multiplier = TIME_SCALE_MULTIPLIERS[timeScale];
  const scaledDuration = durationNs / multiplier;
  
  if (scaledDuration < 1) return scaledDuration.toFixed(3);
  if (scaledDuration < 1000) return scaledDuration.toFixed(1);
  return scaledDuration.toFixed(0);
}

export function parseDurationFromScale(value: string, timeScale: 'ns' | 'μs' | 'ms' | 's'): number {
  const parsed = parseFloat(value) || 0;
  const multiplier = TIME_SCALE_MULTIPLIERS[timeScale];
  return parsed * multiplier;
}