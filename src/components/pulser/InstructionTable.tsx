import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Clock, GripVertical } from 'lucide-react';
import { FlagInput } from './FlagInput';
import { cn } from '@/components/ui/utils';
import { 
  PulseInstruction, 
  OPCODE_OPTIONS, 
  VisualizationSettings, 
  TIME_SCALE_MULTIPLIERS,
  formatDurationInScale,
  parseDurationFromScale,
  getOptimalTimeScale
} from '@/types/pulser/pulse';

interface InstructionTableProps {
  instructions: PulseInstruction[];
  settings: VisualizationSettings;
  onInstructionsChange: (instructions: PulseInstruction[]) => void;
  selectedInstructionId?: string;
  onSelectInstruction: (id: string) => void;
}

interface DraggableRowProps {
  instruction: PulseInstruction;
  index: number;
  startTime: number;
  selectedInstructionId?: string;
  settings: VisualizationSettings;
  onSelectInstruction: (id: string) => void;
  updateInstruction: (id: string, field: keyof PulseInstruction, value: string | number) => void;
  removeInstruction: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  getInstructionTimeScale: (instruction: PulseInstruction) => string;
  formatDuration: (duration: number) => string;
  editingValues: Record<string, string>;
  setEditingValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function DraggableRow({
  instruction,
  index,
  startTime,
  selectedInstructionId,
  settings,
  onSelectInstruction,
  updateInstruction,
  removeInstruction,
  onDragStart,
  onDragOver,
  onDragEnd,
  draggedIndex,
  dragOverIndex,
  getInstructionTimeScale,
  formatDuration,
  editingValues,
  setEditingValues
}: DraggableRowProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragEnd();
  };

  const isDragging = draggedIndex === index;
  const isDropTarget = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;

  return (
    <TableRow
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "cursor-pointer transition-all",
        selectedInstructionId === instruction.id && "bg-muted",
        isDragging && "opacity-50",
        isDropTarget && "border-t-2 border-primary"
      )}
      onClick={() => onSelectInstruction(instruction.id)}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <div
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          {index + 1}
        </div>
      </TableCell>
      <TableCell>
        <FlagInput
          value={instruction.flags}
          onChange={(value) => updateInstruction(instruction.id, 'flags', value)}
          maxFlags={settings.flagCount}
          className="w-48"
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell>
        <Select
          value={instruction.opcode}
          onValueChange={(value) => updateInstruction(instruction.id, 'opcode', value)}
        >
          <SelectTrigger onClick={(e) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCODE_OPTIONS.map(opcode => (
              <SelectItem key={opcode} value={opcode}>
                {opcode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={instruction.data}
          onChange={(e) => updateInstruction(instruction.id, 'data', parseInt(e.target.value) || 0)}
          className="w-20"
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          value={editingValues[instruction.id] || formatDurationInScale(instruction.duration, getInstructionTimeScale(instruction) as 'ns' | 'μs' | 'ms' | 's')}
          onChange={(e) => {
            setEditingValues(prev => ({
              ...prev,
              [instruction.id]: e.target.value
            }));
          }}
          onBlur={(e) => {
            const value = e.target.value;
            if (value.trim() === '') {
              // Reset to formatted value if empty
              const formattedValue = formatDurationInScale(instruction.duration, getInstructionTimeScale(instruction) as 'ns' | 'μs' | 'ms' | 's');
              setEditingValues(prev => ({
                ...prev,
                [instruction.id]: formattedValue
              }));
              return;
            }
            
            const numericValue = parseFloat(value);
            if (isNaN(numericValue)) {
              // Reset to formatted value if invalid
              const formattedValue = formatDurationInScale(instruction.duration, getInstructionTimeScale(instruction) as 'ns' | 'μs' | 'ms' | 's');
              setEditingValues(prev => ({
                ...prev,
                [instruction.id]: formattedValue
              }));
              return;
            }
            
            const timeScale = getInstructionTimeScale(instruction);
            const durationNs = parseDurationFromScale(numericValue.toString(), timeScale as 'ns' | 'μs' | 'ms' | 's');
            updateInstruction(instruction.id, 'duration', durationNs);
            
            // Update the editing value to the formatted version
            const formattedValue = formatDurationInScale(durationNs, timeScale as 'ns' | 'μs' | 'ms' | 's');
            setEditingValues(prev => ({
              ...prev,
              [instruction.id]: formattedValue
            }));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-24"
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Select
            value={getInstructionTimeScale(instruction)}
            onValueChange={(value) => updateInstruction(instruction.id, 'displayTimeScale', value)}
          >
            <SelectTrigger 
              onClick={(e) => e.stopPropagation()}
              className="w-16"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ns">ns</SelectItem>
              <SelectItem value="μs">μs</SelectItem>
              <SelectItem value="ms">ms</SelectItem>
              <SelectItem value="s">s</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              const optimalScale = getOptimalTimeScale(instruction.duration);
              updateInstruction(instruction.id, 'displayTimeScale', optimalScale);
            }}
            title="Auto-select optimal time scale"
          >
            <Clock className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
      {settings.showTiming && (
        <TableCell className="font-mono text-sm">
          {formatDuration(startTime)}
        </TableCell>
      )}
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            removeInstruction(instruction.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function InstructionTable({ 
  instructions, 
  settings,
  onInstructionsChange, 
  selectedInstructionId, 
  onSelectInstruction 
}: InstructionTableProps) {
  // State to track editing values for duration inputs
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialize editing values when instructions change
  useEffect(() => {
    const newEditingValues: Record<string, string> = {};
    instructions.forEach(instruction => {
      if (!editingValues[instruction.id]) {
        newEditingValues[instruction.id] = formatDurationInScale(
          instruction.duration, 
          getInstructionTimeScale(instruction)
        );
      }
    });
    if (Object.keys(newEditingValues).length > 0) {
      setEditingValues(prev => ({ ...prev, ...newEditingValues }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructions]);

  const addInstruction = () => {
    const newInstruction: PulseInstruction = {
      id: `inst_${Date.now()}`,
      flags: 0,
      opcode: 'CONTINUE',
      data: 0,
      duration: 1000,
      length: 1000,
      displayTimeScale: 'μs' // default to microseconds
    };
    onInstructionsChange([...instructions, newInstruction]);
  };

  const removeInstruction = (id: string) => {
    onInstructionsChange(instructions.filter(inst => inst.id !== id));
  };

  const updateInstruction = (id: string, field: keyof PulseInstruction, value: string | number) => {
    const updated = instructions.map(inst => {
      if (inst.id === id) {
        const updatedInst = { ...inst, [field]: value };
        if (field === 'duration') {
          updatedInst.length = typeof value === 'string' ? parseFloat(value) || 0 : value;
        }
        return updatedInst;
      }
      return inst;
    });
    onInstructionsChange(updated);

    // Update editing value when time scale changes
    if (field === 'displayTimeScale') {
      const instruction = instructions.find(inst => inst.id === id);
      if (instruction) {
        const newFormattedValue = formatDurationInScale(
          instruction.duration,
          value as 'ns' | 'μs' | 'ms' | 's'
        );
        setEditingValues(prev => ({
          ...prev,
          [id]: newFormattedValue
        }));
      }
    }
  };

  const getInstructionTimeScale = (instruction: PulseInstruction) => {
    return instruction.displayTimeScale || getOptimalTimeScale(instruction.duration);
  };

  const formatDuration = (duration: number) => {
    const multiplier = TIME_SCALE_MULTIPLIERS[settings.timeScale];
    const scaledDuration = duration / multiplier;
    return scaledDuration.toFixed(scaledDuration < 1 ? 3 : 0);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newInstructions = [...instructions];
      const draggedInstruction = newInstructions[draggedIndex];
      
      // Remove the dragged item
      newInstructions.splice(draggedIndex, 1);
      
      // Insert at the new position
      const insertIndex = draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
      newInstructions.splice(insertIndex, 0, draggedInstruction);
      
      onInstructionsChange(newInstructions);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3>Pulse Instructions</h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              const updatedInstructions = instructions.map(inst => ({
                ...inst,
                displayTimeScale: getOptimalTimeScale(inst.duration)
              }));
              onInstructionsChange(updatedInstructions);
            }}
            variant="outline"
            size="sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Auto Time Scales
          </Button>
          <Button onClick={addInstruction} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Instruction
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">#</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Opcode</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="w-24">Unit</TableHead>
              {settings.showTiming && <TableHead>Start Time ({settings.timeScale})</TableHead>}
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructions.map((instruction, index) => {
              const startTime = instructions
                .slice(0, index)
                .reduce((sum, inst) => sum + (inst.length || 0), 0);
              
              return (
                <DraggableRow
                  key={instruction.id}
                  instruction={instruction}
                  index={index}
                  startTime={startTime}
                  selectedInstructionId={selectedInstructionId}
                  settings={settings}
                  onSelectInstruction={onSelectInstruction}
                  updateInstruction={updateInstruction}
                  removeInstruction={removeInstruction}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  draggedIndex={draggedIndex}
                  dragOverIndex={dragOverIndex}
                  getInstructionTimeScale={getInstructionTimeScale}
                  formatDuration={formatDuration}
                  editingValues={editingValues}
                  setEditingValues={setEditingValues}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}