import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PulseProgram } from '@/types/pulser/pulse';

interface ExampleProgramsProps {
  onLoadExample: (program: PulseProgram) => void;
}

const EXAMPLE_PROGRAMS: PulseProgram[] = [
  {
    name: "CW Green Laser",
    totalLength: 4000000,
    instructions: [
      {
        id: "cw_1",
        flags: 0x000001, // green laser bit 0
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "cw_2",
        flags: 0x000001, // green laser continuous
        opcode: "BRANCH",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "ESR Readout Sequence",
    totalLength: 8000000,
    instructions: [
      {
        id: "esr_1",
        flags: 0x000001, // green laser
        opcode: "CONTINUE",
        data: 0,
        duration: 3000000,
        length: 3000000,
        displayTimeScale: "ms"
      },
      {
        id: "esr_2",
        flags: 0x000010, // mw1 (bit 4)
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "esr_3",
        flags: 0x000005, // green + ctr0 (bits 0,2)
        opcode: "CONTINUE",
        data: 0,
        duration: 300000,
        length: 300000,
        displayTimeScale: "μs"
      },
      {
        id: "esr_4",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 3700000,
        length: 3700000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "Rabi Oscillation",
    totalLength: 15000000,
    instructions: [
      {
        id: "rabi_1",
        flags: 0x000001, // green initialization
        opcode: "CONTINUE",
        data: 0,
        duration: 3000000,
        length: 3000000,
        displayTimeScale: "ms"
      },
      {
        id: "rabi_2",
        flags: 0x000050, // mw1 + awg1 (bits 4,6)
        opcode: "CONTINUE",
        data: 0,
        duration: 50000,
        length: 50000,
        displayTimeScale: "μs"
      },
      {
        id: "rabi_3",
        flags: 0x000005, // green + ctr0 readout
        opcode: "CONTINUE",
        data: 0,
        duration: 300000,
        length: 300000,
        displayTimeScale: "μs"
      },
      {
        id: "rabi_4",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 11650000,
        length: 11650000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "Simple Pulse Train",
    totalLength: 10000000,
    instructions: [
      {
        id: "ex1_1",
        flags: 0x000001,
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex1_2", 
        flags: 0x000000,
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex1_3",
        flags: 0x000001,
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex1_4",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 7000000,
        length: 7000000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "Multi-Channel Sequence",
    totalLength: 20000000,
    instructions: [
      {
        id: "ex2_1",
        flags: 0x000003,
        opcode: "CONTINUE",
        data: 0,
        duration: 2000000,
        length: 2000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex2_2",
        flags: 0x00000C,
        opcode: "CONTINUE", 
        data: 0,
        duration: 3000000,
        length: 3000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex2_3",
        flags: 0x000030,
        opcode: "CONTINUE",
        data: 0,
        duration: 5000000,
        length: 5000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex2_4",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 10000000,
        length: 10000000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "Loop Example",
    totalLength: 50000000,
    instructions: [
      {
        id: "ex3_1",
        flags: 0x000001,
        opcode: "LOOP",
        data: 10,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex3_2",
        flags: 0x000002,
        opcode: "CONTINUE",
        data: 0,
        duration: 500000,
        length: 500000,
        displayTimeScale: "μs"
      },
      {
        id: "ex3_3",
        flags: 0x000000,
        opcode: "END_LOOP",
        data: 0,
        duration: 500000,
        length: 500000,
        displayTimeScale: "μs"
      },
      {
        id: "ex3_4",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 30000000,
        length: 30000000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "Complex Timing",
    totalLength: 15000000,
    instructions: [
      {
        id: "ex4_1",
        flags: 0x00000F,
        opcode: "CONTINUE",
        data: 0,
        duration: 100000,
        length: 100000,
        displayTimeScale: "μs"
      },
      {
        id: "ex4_2",
        flags: 0x0000F0,
        opcode: "CONTINUE",
        data: 0,
        duration: 250000,
        length: 250000,
        displayTimeScale: "μs"
      },
      {
        id: "ex4_3",
        flags: 0x000F00,
        opcode: "CONTINUE",
        data: 0,
        duration: 500000,
        length: 500000,
        displayTimeScale: "μs"
      },
      {
        id: "ex4_4",
        flags: 0x00F000,
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex4_5",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 13150000,
        length: 13150000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "Spin Echo Sequence",
    totalLength: 20000000,
    instructions: [
      {
        id: "echo_1",
        flags: 0x000001, // green initialization
        opcode: "CONTINUE",
        data: 0,
        duration: 3000000,
        length: 3000000,
        displayTimeScale: "ms"
      },
      {
        id: "echo_2",
        flags: 0x000050, // π/2 pulse (mw1 + awg1)
        opcode: "CONTINUE",
        data: 0,
        duration: 25000,
        length: 25000,
        displayTimeScale: "μs"
      },
      {
        id: "echo_3",
        flags: 0x000000, // tau delay
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "echo_4",
        flags: 0x000050, // π pulse
        opcode: "CONTINUE",
        data: 0,
        duration: 50000,
        length: 50000,
        displayTimeScale: "μs"
      },
      {
        id: "echo_5",
        flags: 0x000000, // tau delay
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "echo_6",
        flags: 0x000050, // π/2 pulse
        opcode: "CONTINUE",
        data: 0,
        duration: 25000,
        length: 25000,
        displayTimeScale: "μs"
      },
      {
        id: "echo_7",
        flags: 0x000005, // readout (green + ctr0)
        opcode: "CONTINUE",
        data: 0,
        duration: 300000,
        length: 300000,
        displayTimeScale: "μs"
      },
      {
        id: "echo_8",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 14600000,
        length: 14600000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "PLE Measurement",
    totalLength: 12000000,
    instructions: [
      {
        id: "ple_1",
        flags: 0x000002, // scope trigger
        opcode: "CONTINUE",
        data: 0,
        duration: 20000,
        length: 20000,
        displayTimeScale: "μs"
      },
      {
        id: "ple_2",
        flags: 0x000001, // green excitation
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ple_3",
        flags: 0x000005, // green + ctr0 detection
        opcode: "CONTINUE",
        data: 0,
        duration: 500000,
        length: 500000,
        displayTimeScale: "μs"
      },
      {
        id: "ple_4",
        flags: 0x000000, // dark time
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ple_5",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 9480000,
        length: 9480000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "Multi-Counter Test",
    totalLength: 8000000,
    instructions: [
      {
        id: "ctr_1",
        flags: 0x000005, // green + ctr0
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ctr_2",
        flags: 0x000009, // green + ctr1
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ctr_3",
        flags: 0x000401, // green + ctr2 (bit 10)
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ctr_4",
        flags: 0x000801, // green + ctr3 (bit 11)
        opcode: "CONTINUE",
        data: 0,
        duration: 1000000,
        length: 1000000,
        displayTimeScale: "ms"
      },
      {
        id: "ctr_5",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 4000000,
        length: 4000000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "AWG Quantum Gates",
    totalLength: 6000000,
    instructions: [
      {
        id: "gate_1",
        flags: 0x000001, // initialization
        opcode: "CONTINUE",
        data: 0,
        duration: 3000000,
        length: 3000000,
        displayTimeScale: "ms"
      },
      {
        id: "gate_2",
        flags: 0x000050, // X90 gate (mw1 + awg1)
        opcode: "CONTINUE",
        data: 0,
        duration: 25000,
        length: 25000,
        displayTimeScale: "μs"
      },
      {
        id: "gate_3",
        flags: 0x0000A0, // Y90 gate (mw2 + awg2)
        opcode: "CONTINUE",
        data: 0,
        duration: 25000,
        length: 25000,
        displayTimeScale: "μs"
      },
      {
        id: "gate_4",
        flags: 0x000050, // X180 gate
        opcode: "CONTINUE",
        data: 0,
        duration: 50000,
        length: 50000,
        displayTimeScale: "μs"
      },
      {
        id: "gate_5",
        flags: 0x000005, // readout
        opcode: "CONTINUE",
        data: 0,
        duration: 300000,
        length: 300000,
        displayTimeScale: "μs"
      },
      {
        id: "gate_6",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 2600000,
        length: 2600000,
        displayTimeScale: "ms"
      }
    ]
  },
  {
    name: "Quantum Gate Sequence",
    totalLength: 25000000,
    instructions: [
      {
        id: "ex5_1",
        flags: 0x000007,
        opcode: "CONTINUE",
        data: 0,
        duration: 1500000,
        length: 1500000,
        displayTimeScale: "ms"
      },
      {
        id: "ex5_2",
        flags: 0x000018,
        opcode: "LOOP",
        data: 5,
        duration: 200000,
        length: 200000,
        displayTimeScale: "μs"
      },
      {
        id: "ex5_3",
        flags: 0x000060,
        opcode: "CONTINUE",
        data: 0,
        duration: 800000,
        length: 800000,
        displayTimeScale: "μs"
      },
      {
        id: "ex5_4",
        flags: 0x000000,
        opcode: "END_LOOP",
        data: 0,
        duration: 100000,
        length: 100000,
        displayTimeScale: "μs"
      },
      {
        id: "ex5_5",
        flags: 0x000180,
        opcode: "CONTINUE",
        data: 0,
        duration: 2000000,
        length: 2000000,
        displayTimeScale: "ms"
      },
      {
        id: "ex5_6",
        flags: 0x000000,
        opcode: "STOP",
        data: 0,
        duration: 16500000,
        length: 16500000,
        displayTimeScale: "ms"
      }
    ]
  }
];

export function ExamplePrograms({ onLoadExample }: ExampleProgramsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Programs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLE_PROGRAMS.map((program, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-3 flex flex-col items-start"
              onClick={() => onLoadExample(program)}
            >
              <div className="font-medium">{program.name}</div>
              <div className="text-xs text-muted-foreground">
                {program.instructions.length} instructions • {(program.totalLength / 1000000).toFixed(1)} ms
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}