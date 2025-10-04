#!/usr/bin/env python3
"""
Path verification test for Python service integration
"""

import sys
import os
import json

def test_path_resolution():
    """Test that we can resolve the Python script correctly"""
    
    # Test from src-tauri directory (where Tauri runs)
    src_tauri_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(src_tauri_dir, "pulserblaster.py")
    
    print(f"Current directory: {os.getcwd()}")
    print(f"Script directory: {src_tauri_dir}") 
    print(f"Full script path: {script_path}")
    print(f"Script exists: {os.path.exists(script_path)}")
    
    if os.path.exists(script_path):
        # Try to import the module
        sys.path.insert(0, src_tauri_dir)
        try:
            from pulserblaster import PulseBlaster, PBInstruction
            print("✓ Successfully imported PulseBlaster wrapper")
            
            # Test basic functionality
            test_config = {"board": 0, "core_clock_MHz": 500.0, "debug": True}
            result = {
                "status": "success",
                "message": "Path resolution and import working correctly",
                "config": test_config
            }
            print(json.dumps(result, indent=2))
            
        except Exception as e:
            error_result = {
                "status": "error", 
                "message": f"Import failed: {str(e)}"
            }
            print(json.dumps(error_result, indent=2))
    else:
        error_result = {
            "status": "error",
            "message": f"Script not found at {script_path}"
        }
        print(json.dumps(error_result, indent=2))

if __name__ == "__main__":
    test_path_resolution()