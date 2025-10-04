import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { VisualizationSettings, PulseInstruction, getOptimalTimeScaleForInstructions } from '@/types/pulser/pulse';

interface SettingsPanelProps {
  settings: VisualizationSettings;
  onSettingsChange: (settings: VisualizationSettings) => void;
  instructions: PulseInstruction[];
}

export function SettingsPanel({ settings, onSettingsChange, instructions }: SettingsPanelProps) {
  // Use a generic type for value to avoid 'any'
  const updateSetting = <K extends keyof VisualizationSettings>(
    key: K,
    value: VisualizationSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleAutoScale = () => {
    const optimalScale = getOptimalTimeScaleForInstructions(instructions);
    updateSetting('timeScale', optimalScale);
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Visualization Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="timeScale">Time Scale</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAutoScale}
              className="h-7 px-2 text-xs"
            >
              Auto
            </Button>
          </div>
          <Select 
            value={settings.timeScale} 
            onValueChange={(value) => updateSetting('timeScale', value as VisualizationSettings['timeScale'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ns">Nanoseconds (ns)</SelectItem>
              <SelectItem value="μs">Microseconds (μs)</SelectItem>
              <SelectItem value="ms">Milliseconds (ms)</SelectItem>
              <SelectItem value="s">Seconds (s)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="flagCount">Flag Count: {settings.flagCount}</Label>
          <Slider
            value={[settings.flagCount]}
            onValueChange={([value]) => updateSetting('flagCount', value)}
            min={1}
            max={24}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="horizontalScale">Horizontal Scale: {settings.horizontalScale}px/unit</Label>
          <Slider
            value={[settings.horizontalScale]}
            onValueChange={([value]) => updateSetting('horizontalScale', value)}
            min={10}
            max={1000}
            step={10}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showTiming">Show Timing</Label>
          <Switch
            id="showTiming"
            checked={settings.showTiming}
            onCheckedChange={(checked) => updateSetting('showTiming', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showOpcode">Show Opcode</Label>
          <Switch
            id="showOpcode"
            checked={settings.showOpcode}
            onCheckedChange={(checked) => updateSetting('showOpcode', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}