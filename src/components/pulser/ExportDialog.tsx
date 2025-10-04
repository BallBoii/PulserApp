import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download } from 'lucide-react';
import { PulseProgram } from '@/types/pulser/pulse';
import { toast } from 'sonner';

interface ExportDialogProps {
  program: PulseProgram;
  children: React.ReactNode;
}

export function ExportDialog({ program, children }: ExportDialogProps) {
  const [open, setOpen] = useState(false);

  const generateJSON = () => {
    return JSON.stringify(program, null, 2);
  };

  const generatePython = () => {
    const instructionsCode = program.instructions.map(inst => {
      // Convert bitmask flags back to array of flag indices
      let flagsOutput;
      if (typeof inst.flags === 'number') {
        if (inst.flags === 0) {
          flagsOutput = '[]';
        } else {
          const flagIndices: number[] = [];
          for (let i = 0; i < 24; i++) {
            if ((inst.flags >> i) & 1) {
              flagIndices.push(i);
            }
          }
          flagsOutput = `[${flagIndices.join(', ')}]`;
        }
      } else {
        flagsOutput = `"${inst.flags}"`;
      }

      // Determine appropriate duration and units
      let duration: number;
      let units: string;
      
      if (inst.duration >= 1000000) {
        duration = Math.round(inst.duration / 1000000);
        units = "ms";
      } else if (inst.duration >= 1000) {
        duration = Math.round(inst.duration / 1000);
        units = "us";
      } else {
        duration = inst.duration;
        units = "ns";
      }

      return `    PBInstruction(flags=${flagsOutput}, opcode="${inst.opcode}", data=${inst.data}, duration=${duration}, units="${units}")`;
    }).join(',\n');

    return `# Generated pulse program
from pulser import PulseBlaster, PBInstruction

# Program instructions
instructions = [
${instructionsCode}
]

# Run the program
with PulseBlaster(board=0, core_clock_MHz=500.0) as pb:
    pb.program_pulse_program(instructions)
    pb.start()
    input("Press Enter to stop the program...")
    # Add your timing logic here
    pb.stop()
`;
  };

  const generateSpinAPI = () => {
    // Convert duration to nanoseconds for SpinAPI (which expects nanoseconds)
    const instructionsCode = program.instructions.map(inst => {
      // Convert flags to hexadecimal format for SpinAPI
      const flagsHex = `0x${inst.flags.toString(16).toUpperCase().padStart(6, '0')}`;
      
      // SpinAPI expects duration in nanoseconds
      const durationNs = inst.duration;
      
      // Map opcodes to SpinAPI constants
      const opcodeMapping: { [key: string]: string } = {
        'CONTINUE': 'pb.CONTINUE',
        'STOP': 'pb.STOP',
        'LOOP': 'pb.LOOP',
        'END_LOOP': 'pb.END_LOOP',
        'JSR': 'pb.JSR',
        'RTS': 'pb.RTS',
        'BRANCH': 'pb.BRANCH',
        'LONG_DELAY': 'pb.LONG_DELAY',
        'WAIT': 'pb.WAIT'
      };
      
      const spinApiOpcode = opcodeMapping[inst.opcode] || 'pb.CONTINUE';
      
      return `    pb.pb_inst_pbonly(${flagsHex}, ${spinApiOpcode}, ${inst.data}, ${durationNs} * pb.ns)`;
    }).join('\n');

    return `# Generated SpinAPI Python program
# Program: ${program.name || 'Untitled'}
# Generated on: ${new Date().toISOString()}
# Total Instructions: ${program.instructions.length}

import spinapi as pb
import time

# Initialize PulseBlaster
board_num = 0  # Board number (usually 0)
clock_freq = 500.0  # Clock frequency in MHz

try:
    # Initialize the board
    if pb.pb_init() != 0:
        raise Exception("Failed to initialize PulseBlaster board")
    
    # Set clock frequency
    pb.pb_core_clock(clock_freq)
    
    # Program the pulse sequence
    pb.pb_start_programming(pb.PULSE_PROGRAM)
    
    # Add instructions
${instructionsCode}
    
    # Stop programming
    pb.pb_stop_programming()
    
    # Start the pulse program
    pb.pb_start()
    
    print("Pulse program started successfully")
    print("Press Ctrl+C to stop the program...")
    
    # Wait for user interrupt or run for specific time
    try:
        while True:
            time.sleep(1)
            status = pb.pb_read_status()
            print(status)
    except KeyboardInterrupt:
        print("\\nStopping pulse program...")
        pb.pb_stop()
        
except Exception as e:
    print(f"Error: {e}")
    
finally:
    # Clean up
    pb.pb_close()
    print("PulseBlaster closed")
`;
  };

  const generatePulseBlasterInterpreter = () => {
    // First pass: identify which instructions need labels (branch/JSR targets)
    const needsLabel = new Set<number>();
    program.instructions.forEach(inst => {
      if ((inst.opcode === 'BRANCH' || inst.opcode === 'JSR') && inst.data > 0 && inst.data < program.instructions.length) {
        needsLabel.add(inst.data);
      }
    });

    const instructionsCode = program.instructions.map((inst, index) => {
      // Convert flags to binary format
      const flagsBinary = `0b${inst.flags.toString(2).padStart(24, '0')}`;
      
      // Format duration with appropriate time units
      let duration: string;
      if (inst.duration >= 1000000) {
        duration = `${Math.round(inst.duration / 1000000)}ms`;
      } else if (inst.duration >= 1000) {
        duration = `${Math.round(inst.duration / 1000)}us`;
      } else {
        duration = `${inst.duration}ns`;
      }
      
      // Generate instruction line
      let line = '';
      
      // Add label if this instruction needs one
      if (index === 0) {
        line += 'start: ';
      } else if (needsLabel.has(index)) {
        line += `line${index}: `;
      } else {
        line += '       ';
      }
      
      // Add flags and duration
      line += `${flagsBinary}, ${duration}`;
      
      // Add opcode-specific suffixes
      switch (inst.opcode) {
        case 'BRANCH':
          if (inst.data === 0 || inst.data >= program.instructions.length) {
            line += ', branch, start'; // Branch back to start if invalid target
          } else {
            line += `, branch, line${inst.data}`;
          }
          break;
        case 'JSR':
          if (inst.data === 0 || inst.data >= program.instructions.length) {
            line += ', jsr, start'; // JSR to start if invalid target
          } else {
            line += `, jsr, line${inst.data}`;
          }
          break;
        case 'RTS':
          line += ', rts';
          break;
        case 'LOOP':
          line += `, loop, ${inst.data}`;
          break;
        case 'END_LOOP':
          line += ', end_loop';
          break;
        case 'LONG_DELAY':
          line += `, long_delay, ${inst.data}`;
          break;
        case 'WAIT':
          line += ', wait';
          break;
        case 'STOP':
          line += ', stop';
          break;
        case 'CONTINUE':
        default:
          // For CONTINUE, no additional suffix needed
          break;
      }
      
      return line;
    }).join('\n');

    return `// Generated PulseBlaster Interpreter program
// Program: ${program.name || 'Untitled'}
// Generated on: ${new Date().toISOString()}
// Total Instructions: ${program.instructions.length}
// 
// Format: [label:] 0b111111111111111111111111, duration[, opcode[, data]]
// Flags: Binary format (24-bit)
// Duration: Time with units (ns, us, ms)
// Opcodes: continue, stop, branch, jsr, rts, loop, end_loop, etc.
//
// ================================================================

${instructionsCode}`;
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${format} code copied to clipboard`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`File ${filename} downloaded`);
  };

  const jsonContent = generateJSON();
  const pythonContent = generatePython();
  const spinApiContent = generateSpinAPI();
  const interpreterContent = generatePulseBlasterInterpreter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Export Pulse Program</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="json" className="w-full overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="json">JSON Format</TabsTrigger>
            <TabsTrigger value="python">Python Script</TabsTrigger>
            <TabsTrigger value="spinapi">SpinAPI Python</TabsTrigger>
            <TabsTrigger value="interpreter">PB Interpreter</TabsTrigger>
          </TabsList>
          
          <TabsContent value="json" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Export as JSON for storage and configuration management
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(jsonContent, 'JSON')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(jsonContent, `${program.name || 'pulse_program'}.json`)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <Textarea
              value={jsonContent}
              readOnly
              className="font-mono text-sm h-96 resize-none overflow-auto whitespace-nowrap"
              style={{ wordBreak: 'keep-all' }}
            />
          </TabsContent>
          
          <TabsContent value="python" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Export as Python script for direct execution with SpinAPI
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(pythonContent, 'Python')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(pythonContent, `${program.name || 'pulse_program'}.py`)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <Textarea
              value={pythonContent}
              readOnly
              className="font-mono text-sm h-96 resize-none overflow-auto whitespace-nowrap"
              style={{ wordBreak: 'keep-all' }}
            />
          </TabsContent>
          
          <TabsContent value="spinapi" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Export as SpinAPI Python script for SpinCore PulseBlaster hardware
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(spinApiContent, 'SpinAPI Python')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(spinApiContent, `${program.name || 'pulse_program'}_spinapi.py`)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <Textarea
              value={spinApiContent}
              readOnly
              className="font-mono text-sm h-96 resize-none overflow-auto whitespace-nowrap"
              style={{ wordBreak: 'keep-all' }}
            />
          </TabsContent>
          
          <TabsContent value="interpreter" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Export as PulseBlaster Interpreter assembly format
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(interpreterContent, 'PulseBlaster Interpreter')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(interpreterContent, `${program.name || 'pulse_program'}.pb`)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <Textarea
              value={interpreterContent}
              readOnly
              className="font-mono text-sm h-96 resize-none overflow-auto whitespace-nowrap"
              style={{ wordBreak: 'keep-all' }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}