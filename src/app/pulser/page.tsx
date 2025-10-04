'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Play, Save, FolderOpen, Code2 } from 'lucide-react';
import { InstructionTable } from '@/components/pulser/InstructionTable';
import { TimelineView } from '@/components/pulser/TimelineView';
import { SettingsPanel } from '@/components/pulser/SettingsPanel';
import { ExportDialog } from '@/components/pulser/ExportDialog';
import { ExamplePrograms } from '@/components/pulser/ExamplePrograms';
import { PythonHardwareControl } from '@/components/pulser/PythonHardwareControl';
import { PulseInstruction, VisualizationSettings, PulseProgram, TIME_SCALE_MULTIPLIERS } from '@/types/pulser/pulse';
import { Toaster } from '@/components/ui/sonner';
import { downloadPythonLibrary } from '@/lib/utils/pythonLibraryGenerator';

export default function App() {
  const [programName, setProgramName] = useState('Untitled Program');
  const [instructions, setInstructions] = useState<PulseInstruction[]>([
    {
      id: 'inst_1',
      flags: 0x000001,
      opcode: 'CONTINUE',
      data: 0,
      duration: 1000000,
      length: 1000000,
      displayTimeScale: 'μs'
    },
    {
      id: 'inst_2',
      flags: 0x000000,
      opcode: 'STOP',
      data: 0,
      duration: 5000000,
      length: 5000000,
      displayTimeScale: 'ms'
    }
  ]);

  const [settings, setSettings] = useState<VisualizationSettings>({
    timeScale: 'μs',
    flagCount: 8,
    showTiming: true,
    showOpcode: true,
    horizontalScale: 200 // pixels per time unit
  });

  const [selectedInstructionId, setSelectedInstructionId] = useState<string>();

  const currentProgram: PulseProgram = useMemo(() => {
    const totalLength = instructions.reduce((sum, inst) => sum + (inst.length || inst.duration), 0);
    return {
      name: programName,
      instructions,
      totalLength
    };
  }, [programName, instructions]);

  const formatTotalTime = () => {
    const multiplier = TIME_SCALE_MULTIPLIERS[settings.timeScale];
    const scaledTime = currentProgram.totalLength / multiplier;
    if (scaledTime < 1) return `${scaledTime.toFixed(3)} ${settings.timeScale}`;
    if (scaledTime < 1000) return `${scaledTime.toFixed(1)} ${settings.timeScale}`;
    return `${scaledTime.toFixed(0)} ${settings.timeScale}`;
  };

  const handleLoadExample = (program: PulseProgram) => {
    setProgramName(program.name);
    setInstructions(program.instructions);
    setSelectedInstructionId(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold">PulseBlaster Visual Editor</h1>
              </div>
              <Badge variant="secondary">SpinCore PulseBlaster</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <ExportDialog program={currentProgram}>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </ExportDialog>
              
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                Load
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadPythonLibrary(currentProgram)}
              >
                <Code2 className="w-4 h-4 mr-2" />
                Library
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Program Name:</label>
              <Input
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-64"
                placeholder="Enter program name"
              />
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{instructions.length} instructions</span>
              <span>Total: {formatTotalTime()}</span>
              <span>Flags: {settings.flagCount}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar - Settings */}
          <div className="xl:col-span-1 space-y-6">
            <PythonHardwareControl instructions={instructions} />
            <SettingsPanel 
              settings={settings} 
              onSettingsChange={setSettings}
              instructions={instructions}
            />
            <ExamplePrograms onLoadExample={handleLoadExample} />
          </div>

          {/* Main Editor Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Timeline View */}
            <TimelineView
              instructions={instructions}
              settings={settings}
              selectedInstructionId={selectedInstructionId}
              onSelectInstruction={setSelectedInstructionId}
            />

            {/* Instruction Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Instruction Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InstructionTable
                  instructions={instructions}
                  settings={settings}
                  onInstructionsChange={setInstructions}
                  selectedInstructionId={selectedInstructionId}
                  onSelectInstruction={setSelectedInstructionId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              PulseBlaster Visual Editor - Design and export pulse sequences for SpinCore devices
            </div>
            <div className="flex items-center gap-4">
              <span>Inspired by Aceternary UI</span>
              <span>•</span>
              <span>Built with React & Tailwind</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}