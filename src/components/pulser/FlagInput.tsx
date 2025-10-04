import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { X, Flag } from 'lucide-react';

interface FlagInputProps {
  value: number;
  onChange: (value: number) => void;
  maxFlags?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function FlagInput({ value, onChange, maxFlags = 24, className, onClick }: FlagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Convert flag number to array of active flag indices
  const getActiveFlagIndices = (flags: number): number[] => {
    const indices: number[] = [];
    for (let i = 0; i < maxFlags; i++) {
      if ((flags >> i) & 1) {
        indices.push(i);
      }
    }
    return indices;
  };

  const activeFlagIndices = getActiveFlagIndices(value);

  // Update input value when external value changes (but not when user is typing)
  useEffect(() => {
    if (!isUserTyping) {
      setInputValue(activeFlagIndices.join(', '));
    }
  }, [value, activeFlagIndices, isUserTyping]);

  const parseInput = (input: string): number => {
    const trimmed = input.trim();
    
    if (trimmed === '') return 0;
    
    // Handle comma-separated flag indices (including single numbers)
    const indices = trimmed
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0 && n < maxFlags);
    
    return indices.reduce((flags, index) => flags | (1 << index), 0);
  };

  const handleInputChange = (inputValue: string) => {
    setIsUserTyping(true);
    setInputValue(inputValue);
    // Don't parse or call onChange on every keystroke - let user type freely
  };

  const handleInputFinished = () => {
    if (inputValue.trim() === '') {
      onChange(0);
    } else {
      const parsed = parseInput(inputValue);
      onChange(parsed);
    }
    setIsUserTyping(false);
  };

  const toggleFlag = (index: number) => {
    const newValue = value ^ (1 << index);
    onChange(newValue);
    // When using visual toggles, immediately update the display
    setIsUserTyping(false);
  };

  const formatFlags = (flags: number) => {
    return `0x${flags.toString(16).padStart(6, '0').toUpperCase()}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={`flex items-center gap-2 ${className}`} onClick={onClick}>
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInputFinished();
                e.currentTarget.blur();
              }
            }}
            placeholder="0,1,2 or single flag like 5"
            className="font-mono text-xs"
            onFocus={() => {
              setIsOpen(true);
              setIsUserTyping(true);
            }}
            onBlur={() => {
              handleInputFinished();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick(e);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <Flag className="w-3 h-3" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Flag Selection</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Click flags to toggle, or type comma-separated flag numbers:
            </p>
            
            {/* Visual flag toggles */}
            <div className="grid grid-cols-8 gap-1 mb-4">
              {Array.from({ length: maxFlags }, (_, i) => (
                <Button
                  key={i}
                  variant={activeFlagIndices.includes(i) ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => toggleFlag(i)}
                >
                  {i}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Active flags display */}
          {activeFlagIndices.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Active flags:</p>
              <div className="flex flex-wrap gap-1">
                {activeFlagIndices.map(index => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    Flag {index}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => toggleFlag(index)}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Format examples */}
          <div className="space-y-2 text-xs">
            <p className="font-medium">Input formats:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>• Multiple flags: <code>0,1,3</code> (flags 0, 1, and 3)</p>
              <p>• Single flag: <code>5</code> (just flag 5)</p>
              <p>• Empty for no flags</p>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Current value: <code className="font-mono">{formatFlags(value)}</code> = <code className="font-mono">0b{value.toString(2).padStart(8, '0')}</code>
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}