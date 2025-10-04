#!/usr/bin/env python3
"""
Simple test script for Python bridge - used to verify Tauri <-> Python communication.
"""

import sys
import json
import os

# Add the current directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

def main():
    try:
        # Test SpinAPI availability
        import spinapi as sp
        spinapi_version = sp.pb_get_version().decode('utf-8')
        
        # Test PulseBlaster wrapper
        from pulserblaster import PulseBlaster, PBInstruction
        
        # Create a simple test result
        result = {
            "status": "success",
            "message": "Python bridge is working",
            "data": {
                "spinapi_version": spinapi_version,
                "python_version": sys.version,
                "wrapper_available": True,
                "venv_python": sys.prefix != sys.base_prefix
            }
        }
        
        # Output JSON for Tauri to read
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Python bridge test failed: {str(e)}",
            "data": None
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()