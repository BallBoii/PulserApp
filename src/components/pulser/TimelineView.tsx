import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PulseInstruction, VisualizationSettings, TIME_SCALE_MULTIPLIERS } from '@/types/pulser/pulse';

interface TimelineViewProps {
  instructions: PulseInstruction[];
  settings: VisualizationSettings;
  selectedInstructionId?: string;
  onSelectInstruction: (id: string) => void;
}

export function TimelineView({ instructions, settings, selectedInstructionId, onSelectInstruction }: TimelineViewProps) {
  const timelineData = useMemo(() => {
    let currentTime = 0;
    const multiplier = TIME_SCALE_MULTIPLIERS[settings.timeScale];
    
    return instructions.map((instruction, index) => {
      const startTime = currentTime;
      const duration = instruction.length || instruction.duration;
      const endTime = currentTime + duration;
      currentTime = endTime;
      
      return {
        ...instruction,
        startTime,
        endTime,
        duration,
        scaledStartTime: startTime / multiplier,
        scaledEndTime: endTime / multiplier,
        scaledDuration: duration / multiplier,
        index
      };
    });
  }, [instructions, settings.timeScale]);

  const totalDuration = timelineData.length > 0 ? 
    timelineData[timelineData.length - 1].scaledEndTime : 0;

  // Calculate timeline width based on horizontal scale
  const timelineWidth = Math.max(800, totalDuration * settings.horizontalScale);
  
  // Calculate dynamic height based on flag count
  const flagRowHeight = 32;
  const rulerHeight = 40;
  const timelineHeight = rulerHeight + (settings.flagCount * flagRowHeight);

  const formatTime = (time: number) => {
    if (time < 1) return time.toFixed(3);
    if (time < 1000) return time.toFixed(1);
    return time.toFixed(0);
  };

  const getFlagColor = (flagIndex: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500',
      'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-sky-500',
      'bg-fuchsia-500', 'bg-slate-500', 'bg-gray-500', 'bg-neutral-500',
      'bg-stone-500', 'bg-zinc-500', 'bg-red-600', 'bg-blue-600'
    ];
    return colors[flagIndex % colors.length];
  };

  // Generate time markers
  const generateTimeMarkers = () => {
    if (totalDuration === 0) return [];
    
    const markers = [];
    const optimalMarkerCount = Math.min(20, Math.max(5, Math.floor(timelineWidth / 80)));
    const markerInterval = totalDuration / optimalMarkerCount;
    
    for (let i = 0; i <= optimalMarkerCount; i++) {
      const time = i * markerInterval;
      markers.push({
        time,
        position: time * settings.horizontalScale
      });
    }
    
    return markers;
  };

  const timeMarkers = generateTimeMarkers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Timeline View</span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: {formatTime(totalDuration)} {settings.timeScale}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full border rounded-lg max-h-screen">
          <div 
            className="relative bg-background"
            style={{ 
              width: timelineWidth,
              height: timelineHeight,
              minWidth: timelineWidth
            }}
          >
            {/* Time ruler */}
            <div 
              className="absolute top-0 left-0 border-b bg-muted/30"
              style={{ 
                width: timelineWidth,
                height: rulerHeight 
              }}
            >
              {/* Time markers */}
              {timeMarkers.map((marker, index) => (
                <div key={index}>
                  {/* Marker line */}
                  <div
                    className="absolute top-0 w-px bg-border"
                    style={{
                      left: marker.position,
                      height: rulerHeight
                    }}
                  />
                  {/* Time label */}
                  <div
                    className="absolute top-2 text-xs text-muted-foreground"
                    style={{
                      left: marker.position,
                      transform: index === 0 ? 'none' : 'translateX(-50%)'
                    }}
                  >
                    {formatTime(marker.time)}
                  </div>
                  {/* Unit label */}
                  <div
                    className="absolute bottom-2 text-xs text-muted-foreground opacity-70"
                    style={{
                      left: marker.position,
                      transform: index === 0 ? 'none' : 'translateX(-50%)'
                    }}
                  >
                    {index === 0 ? settings.timeScale : ''}
                  </div>
                </div>
              ))}
              
              {/* Instruction boundaries */}
              {timelineData.map((item) => (
                <div
                  key={`boundary-${item.id}`}
                  className="absolute top-0 w-px bg-primary/30"
                  style={{
                    left: item.scaledStartTime * settings.horizontalScale,
                    height: rulerHeight
                  }}
                />
              ))}
            </div>

            {/* Flag channels */}
            <div 
              className="absolute left-0"
              style={{ 
                top: rulerHeight,
                width: timelineWidth,
                height: settings.flagCount * flagRowHeight
              }}
            >
              {Array.from({ length: settings.flagCount }, (_, flagIndex) => (
                <div 
                  key={flagIndex} 
                  className="relative border-b border-border/50 flex items-center"
                  style={{ height: flagRowHeight }}
                >
                  {/* Flag label */}
                  <div className="absolute left-2 text-xs font-mono text-muted-foreground z-10 bg-background/80 px-1 rounded">
                    Flag {flagIndex}
                  </div>
                  
                  {/* Flag pulses */}
                  {timelineData.map(item => {
                    const isFlagHigh = (item.flags >> flagIndex) & 1;
                    if (!isFlagHigh) return null;
                    
                    const width = item.scaledDuration * settings.horizontalScale;
                    const left = item.scaledStartTime * settings.horizontalScale;
                    
                    return (
                      <div
                        key={`${item.id}-${flagIndex}`}
                        className={`absolute cursor-pointer transition-all hover:opacity-80 ${
                          getFlagColor(flagIndex)
                        } ${
                          selectedInstructionId === item.id ? 'ring-2 ring-primary ring-offset-1' : ''
                        }`}
                        style={{
                          left,
                          width: Math.max(width, 2),
                          height: flagRowHeight - 8,
                          top: 4,
                          borderRadius: '2px'
                        }}
                        onClick={() => onSelectInstruction(item.id)}
                        title={`Instruction ${item.index + 1}: ${item.opcode}\nDuration: ${formatTime(item.scaledDuration)} ${settings.timeScale}\nFlags: 0x${item.flags.toString(16).padStart(6, '0').toUpperCase()}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Instruction blocks overlay */}
            {settings.showOpcode && (
              <div 
                className="absolute left-0 pointer-events-none"
                style={{ 
                  top: rulerHeight,
                  width: timelineWidth,
                  height: settings.flagCount * flagRowHeight
                }}
              >
                {timelineData.map(item => {
                  const width = item.scaledDuration * settings.horizontalScale;
                  const left = item.scaledStartTime * settings.horizontalScale;
                  
                  return (
                    <div
                      key={`opcode-${item.id}`}
                      className="absolute border-l border-r border-primary/20 bg-primary/5 flex items-center justify-center"
                      style={{
                        left,
                        width: Math.max(width, 2),
                        top: 0,
                        height: settings.flagCount * flagRowHeight
                      }}
                    >
                      {width > 60 && (
                        <div className="text-xs font-mono text-primary/70 text-center transform -rotate-90 whitespace-nowrap">
                          {item.opcode}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}