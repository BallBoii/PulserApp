'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Zap, 
  ZapOff, 
  Settings, 
  AlertCircle,
  CheckCircle2,
  Code2,
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { pythonPulseBlasterService, PythonPulseBlasterConfig, PythonPulseBlasterStatus } from '@/lib/pulseblaster/python-service';
import { PulseInstruction } from '@/types/pulser/pulse';

interface PythonHardwareControlProps {
  instructions: PulseInstruction[];
  onStatusChange?: (connected: boolean) => void;
}

export function PythonHardwareControl({ instructions, onStatusChange }: PythonHardwareControlProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProgramming, setIsProgramming] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<PythonPulseBlasterStatus | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [config, setConfig] = useState<PythonPulseBlasterConfig>({
    board: 0,
    core_clock_mhz: 500.0,
    debug: false
  });
  const [error, setError] = useState<string | null>(null);

  // Advanced settings
  const [ddsFrequencies, setDdsFrequencies] = useState<number[]>([10, 20, 50]); // MHz
  const [ddsPhases, setDdsPhases] = useState<number[]>([0, 90, 180]); // degrees
  const [ddsAmplitudes, setDdsAmplitudes] = useState<number[]>([1.0, 0.8, 0.5]); // 0-1
  const [blinkSettings, setBlinkSettings] = useState({
    flags: [0],
    onTime: 500,
    offTime: 500
  });

  // Poll status when connected
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isConnected) {
      intervalId = setInterval(async () => {
        try {
          const currentStatus = await pythonPulseBlasterService.getStatus();
          setStatus(currentStatus);
          setIsRunning(currentStatus.hardware_status?.running || false);
        } catch (err) {
          console.warn('Failed to get status:', err);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected]);

  // Notify parent of connection status changes
  useEffect(() => {
    onStatusChange?.(isConnected);
  }, [isConnected, onStatusChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await pythonPulseBlasterService.initialize(config);
      setIsConnected(true);
      toast.success('Connected to PulseBlaster via Python wrapper');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to connect: ${errorMsg}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await pythonPulseBlasterService.disconnect();
      setIsConnected(false);
      setStatus(null);
      setIsRunning(false);
      setWarnings([]);
      toast.success('Disconnected from PulseBlaster');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Error during disconnect: ${errorMsg}`);
    }
  };

  const handleProgramSequence = async () => {
    if (!isConnected || instructions.length === 0) return;
    
    setIsProgramming(true);
    setError(null);
    setWarnings([]);
    
    try {
      const programWarnings = await pythonPulseBlasterService.programInstructions(instructions);
      setWarnings(programWarnings);
      
      if (programWarnings.length > 0) {
        toast.warning(`Sequence programmed with ${programWarnings.length} warnings`);
      } else {
        toast.success('Pulse sequence programmed successfully');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to program sequence: ${errorMsg}`);
    } finally {
      setIsProgramming(false);
    }
  };

  const handleStart = async () => {
    if (!isConnected) return;
    
    try {
      await pythonPulseBlasterService.start();
      setIsRunning(true);
      toast.success('Pulse program started');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to start: ${errorMsg}`);
    }
  };

  const handleStop = async () => {
    if (!isConnected) return;
    
    try {
      await pythonPulseBlasterService.stop();
      setIsRunning(false);
      toast.success('Pulse program stopped');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to stop: ${errorMsg}`);
    }
  };

  const handleReset = async () => {
    if (!isConnected) return;
    
    try {
      await pythonPulseBlasterService.reset();
      setIsRunning(false);
      toast.success('PulseBlaster reset');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to reset: ${errorMsg}`);
    }
  };

  const handleProgramDDSRegisters = async () => {
    if (!isConnected) return;

    try {
      const freqIds = await pythonPulseBlasterService.programFrequencyRegisters(ddsFrequencies);
      const phaseIds = await pythonPulseBlasterService.programPhaseRegisters(ddsPhases);
      const ampIds = await pythonPulseBlasterService.programAmplitudeRegisters(ddsAmplitudes);
      
      toast.success(`DDS registers programmed (Freq: ${freqIds}, Phase: ${phaseIds}, Amp: ${ampIds})`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to program DDS registers: ${errorMsg}`);
    }
  };

  const handleProgramBlink = async () => {
    if (!isConnected) return;

    try {
      await pythonPulseBlasterService.programSimpleBlink(
        blinkSettings.flags,
        blinkSettings.onTime,
        blinkSettings.offTime
      );
      toast.success('Simple blink pattern programmed');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to program blink: ${errorMsg}`);
    }
  };

  const handleWaitUntilStopped = async () => {
    if (!isConnected || !isRunning) return;

    try {
      const stopped = await pythonPulseBlasterService.waitUntilStopped(10.0);
      if (stopped) {
        toast.success('Pulse program completed');
        setIsRunning(false);
      } else {
        toast.warning('Timeout waiting for program to stop');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Wait failed: ${errorMsg}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="w-5 h-5" />
          Python Hardware Control
          {isConnected ? (
            <Badge variant="default" className="ml-auto">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-auto">
              <ZapOff className="w-3 h-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Control</TabsTrigger>
            <TabsTrigger value="dds">DDS Control</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            {/* Connection Configuration */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="py-board-num">Board Number</Label>
                  <Input
                    id="py-board-num"
                    type="number"
                    value={config.board}
                    onChange={(e) => setConfig({ ...config, board: parseInt(e.target.value) || 0 })}
                    disabled={isConnected}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="py-clock-freq">Clock Frequency (MHz)</Label>
                  <Input
                    id="py-clock-freq"
                    type="number"
                    value={config.core_clock_mhz || 500}
                    onChange={(e) => setConfig({ ...config, core_clock_mhz: parseFloat(e.target.value) || 500.0 })}
                    disabled={isConnected}
                    min="1"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="debug-mode"
                  checked={config.debug}
                  onCheckedChange={(checked) => setConfig({ ...config, debug: checked })}
                  disabled={isConnected}
                />
                <Label htmlFor="debug-mode">Debug Mode</Label>
              </div>

              <div className="flex gap-2">
                {!isConnected ? (
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleDisconnect}
                    variant="outline"
                    className="flex-1"
                  >
                    <ZapOff className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Program Warnings:</div>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Control Panel */}
            <div className="space-y-3">
              <Button
                onClick={handleProgramSequence}
                disabled={!isConnected || isProgramming || instructions.length === 0}
                className="w-full"
                variant="outline"
              >
                <Settings className="w-4 h-4 mr-2" />
                {isProgramming ? 'Programming...' : 'Program Sequence'}
                <Badge variant="secondary" className="ml-2">
                  {instructions.length} instructions
                </Badge>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleStart}
                  disabled={!isConnected || isRunning}
                  variant="default"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
                
                <Button
                  onClick={handleStop}
                  disabled={!isConnected || !isRunning}
                  variant="secondary"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleReset}
                  disabled={!isConnected}
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>

                <Button
                  onClick={handleWaitUntilStopped}
                  disabled={!isConnected || !isRunning}
                  variant="outline"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Wait Stop
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dds" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Frequency Registers (MHz)</Label>
                <Input
                  value={ddsFrequencies.join(', ')}
                  onChange={(e) => setDdsFrequencies(
                    e.target.value.split(',').map(f => parseFloat(f.trim()) || 0)
                  )}
                  placeholder="10, 20, 50"
                />
              </div>

              <div>
                <Label>Phase Registers (degrees)</Label>
                <Input
                  value={ddsPhases.join(', ')}
                  onChange={(e) => setDdsPhases(
                    e.target.value.split(',').map(p => parseFloat(p.trim()) || 0)
                  )}
                  placeholder="0, 90, 180"
                />
              </div>

              <div>
                <Label>Amplitude Registers (0-1)</Label>
                <Input
                  value={ddsAmplitudes.join(', ')}
                  onChange={(e) => setDdsAmplitudes(
                    e.target.value.split(',').map(a => parseFloat(a.trim()) || 0)
                  )}
                  placeholder="1.0, 0.8, 0.5"
                />
              </div>

              <Button
                onClick={handleProgramDDSRegisters}
                disabled={!isConnected}
                className="w-full"
              >
                <Activity className="w-4 h-4 mr-2" />
                Program DDS Registers
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Simple Blink Pattern</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Flags</Label>
                    <Input
                      value={blinkSettings.flags.join(',')}
                      onChange={(e) => setBlinkSettings({
                        ...blinkSettings,
                        flags: e.target.value.split(',').map(f => parseInt(f.trim()) || 0)
                      })}
                      placeholder="0,1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ON Time (μs)</Label>
                    <Input
                      type="number"
                      value={blinkSettings.onTime}
                      onChange={(e) => setBlinkSettings({
                        ...blinkSettings,
                        onTime: parseInt(e.target.value) || 500
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">OFF Time (μs)</Label>
                    <Input
                      type="number"
                      value={blinkSettings.offTime}
                      onChange={(e) => setBlinkSettings({
                        ...blinkSettings,
                        offTime: parseInt(e.target.value) || 500
                      })}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleProgramBlink}
                  disabled={!isConnected}
                  className="w-full mt-2"
                  variant="outline"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Program Blink
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Display */}
        {isConnected && status && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hardware Status</Label>
              {status.hardware_status && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Running:</span>
                    <Badge variant={status.hardware_status.running ? "default" : "secondary"} className="text-xs">
                      {status.hardware_status.running ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Stopped:</span>
                    <Badge variant={status.hardware_status.stopped ? "default" : "secondary"} className="text-xs">
                      {status.hardware_status.stopped ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset:</span>
                    <Badge variant={status.hardware_status.reset ? "default" : "secondary"} className="text-xs">
                      {status.hardware_status.reset ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Waiting:</span>
                    <Badge variant={status.hardware_status.waiting ? "default" : "secondary"} className="text-xs">
                      {status.hardware_status.waiting ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              )}
              {status.status_message && (
                <div className="text-xs text-muted-foreground">
                  Message: {status.status_message}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}