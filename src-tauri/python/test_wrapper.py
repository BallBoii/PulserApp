#!/usr/bin/env python3
"""
Test script for PulseBlaster Python wrapper integration.
Run this to verify your Python wrapper works before using with Tauri.
"""

import sys
import os
import json

# Add the current directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

try:
    from pulserblaster import PulseBlaster, PBInstruction
    print("✓ Successfully imported PulseBlaster wrapper")
except ImportError as e:
    print(f"✗ Failed to import PulseBlaster wrapper: {e}")
    sys.exit(1)

try:
    import spinapi as sp
    print("✓ SpinAPI module available")
except ImportError as e:
    print(f"✗ SpinAPI not available: {e}")
    print("  Install with: pip install spinapi")
    sys.exit(1)

def test_basic_functionality():
    """Test basic PulseBlaster functionality."""
    print("\n=== Testing Basic Functionality ===")
    
    # Test configuration
    config = {
        'board': 0,
        'core_clock_MHz': 500.0,
        'debug': True
    }
    
    # Test instruction creation
    test_instructions = [
        PBInstruction(flags=[0, 1], opcode="CONTINUE", duration=1000, units="us"),
        PBInstruction(flags=[], opcode="STOP", duration=100, units="ns")
    ]
    
    print(f"✓ Created test instructions: {len(test_instructions)} items")
    
    # Test validation (without hardware)
    try:
        pb = PulseBlaster(**config)
        warnings = pb.validate_program(test_instructions)
        print(f"✓ Program validation works: {len(warnings)} warnings")
        for warning in warnings:
            print(f"  - {warning}")
    except Exception as e:
        print(f"✗ Validation failed: {e}")
        return False
    
    return True

def test_hardware_connection():
    """Test actual hardware connection (optional)."""
    print("\n=== Testing Hardware Connection ===")
    
    config = {
        'board': 0,
        'core_clock_MHz': 500.0,
        'debug': True
    }
    
    try:
        with PulseBlaster(**config) as pb:
            print("✓ Hardware connection successful")
            
            # Test status
            status = pb.status_bits()
            print(f"✓ Status bits: {status}")
            
            # Test simple blink programming
            pb.program_simple_blink([0], 1000, 1000)
            print("✓ Simple blink programmed")
            
            return True
            
    except Exception as e:
        print(f"✗ Hardware test failed: {e}")
        print("  This is normal if no hardware is connected")
        return False

def test_json_interface():
    """Test JSON serialization for Tauri interface."""
    print("\n=== Testing JSON Interface ===")
    
    # Test instruction serialization
    instructions_data = [
        {
            'flags': [0, 1],
            'opcode': 'CONTINUE',
            'data': 0,
            'duration': 1.0,
            'units': 's'
        },
        {
            'flags': 0,
            'opcode': 'STOP',
            'data': 0,
            'duration': 0.1,
            'units': 's'
        }
    ]
    
    try:
        # Simulate what Tauri bridge does
        instructions = []
        for inst_data in instructions_data:
            inst = PBInstruction(
                flags=inst_data['flags'],
                opcode=inst_data['opcode'],
                data=inst_data['data'],
                duration=inst_data['duration'],
                units=inst_data['units']
            )
            instructions.append(inst)
        
        print(f"✓ JSON to PBInstruction conversion: {len(instructions)} items")
        
        # Test result JSON
        result = {
            "status": "success", 
            "message": "Test completed",
            "warnings": []
        }
        result_json = json.dumps(result)
        print(f"✓ Result JSON serialization: {len(result_json)} chars")
        
        return True
        
    except Exception as e:
        print(f"✗ JSON interface test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("PulseBlaster Python Wrapper Test")
    print("=" * 40)
    
    success = True
    
    success &= test_basic_functionality()
    success &= test_json_interface()
    
    # Hardware test is optional
    test_hardware_connection()
    
    print("\n" + "=" * 40)
    if success:
        print("✓ All core tests passed - Python wrapper is ready!")
        print("\nYou can now use the Python Hardware Control in your Tauri app.")
    else:
        print("✗ Some tests failed - check the issues above")
        sys.exit(1)

if __name__ == "__main__":
    main()