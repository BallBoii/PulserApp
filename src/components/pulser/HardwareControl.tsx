'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Zap, 
  ZapOff, 
  Settings, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { pulseBlasterService, PulseBlasterConfig, PulseBlasterStatus } from '@/lib/pulseblaster/service';
import { PulseInstruction } from '@/types/pulser/pulse';

interface HardwareControlProps {
  instructions: PulseInstruction[];
  onStatusChange?: (connected: boolean) => void;
}

export function HardwareControl({ instructions, onStatusChange }: HardwareControlProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProgramming, setIsProgramming] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<PulseBlasterStatus | null>(null);
  const [config, setConfig] = useState<PulseBlasterConfig>({
    board_num: 0,
    clock_freq_mhz: 500.0
  });
  const [error, setError] = useState<string | null>(null);

  // Poll status when connected
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isConnected) {
      intervalId = setInterval(async () => {
        try {
          const currentStatus = await pulseBlasterService.getStatus();
          setStatus(currentStatus);
          setIsRunning(currentStatus.is_running);
        } catch (err) {
          console.warn('Failed to get status:', err);
        }
      }, 1000); // Poll every second
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
      await pulseBlasterService.initialize(config);
      setIsConnected(true);
      toast.success('Connected to PulseBlaster successfully');
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
      await pulseBlasterService.disconnect();
      setIsConnected(false);
      setStatus(null);
      setIsRunning(false);
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
    
    try {
      await pulseBlasterService.programSequence(instructions);
      toast.success('Pulse sequence programmed successfully');
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
      await pulseBlasterService.start();
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
      await pulseBlasterService.stop();
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
      await pulseBlasterService.reset();
      setIsRunning(false);
      toast.success('PulseBlaster reset');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to reset: ${errorMsg}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Hardware Control
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
      
      <CardContent className="space-y-4">
        {/* Connection Configuration */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="board-num">Board Number</Label>
              <Input
                id="board-num"
                type="number"
                value={config.board_num}
                onChange={(e) => setConfig({ ...config, board_num: parseInt(e.target.value) || 0 })}
                disabled={isConnected}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="clock-freq">Clock Frequency (MHz)</Label>
              <Input
                id="clock-freq"
                type="number"
                value={config.clock_freq_mhz}
                onChange={(e) => setConfig({ ...config, clock_freq_mhz: parseFloat(e.target.value) || 500.0 })}
                disabled={isConnected}
                min="1"
                step="0.1"
              />
            </div>
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

          <div className="grid grid-cols-3 gap-2">
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
            
            <Button
              onClick={handleReset}
              disabled={!isConnected}
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Status Display */}
        {isConnected && status && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hardware Status</Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Running:</span>
                  <Badge variant={status.is_running ? "default" : "secondary"} className="text-xs">
                    {status.is_running ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Stopped:</span>
                  <Badge variant={status.is_stopped ? "default" : "secondary"} className="text-xs">
                    {status.is_stopped ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Reset:</span>
                  <Badge variant={status.is_reset ? "default" : "secondary"} className="text-xs">
                    {status.is_reset ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Waiting:</span>
                  <Badge variant={status.is_waiting ? "default" : "secondary"} className="text-xs">
                    {status.is_waiting ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Raw Status: 0x{status.status.toString(16).toUpperCase().padStart(8, '0')}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}