"""
PulseBlaster Python Wrapper Package

This package provides a high-level Python interface for SpinCore PulseBlaster hardware.
"""

from .pulserblaster import PulseBlaster, PBInstruction

__all__ = ['PulseBlaster', 'PBInstruction']
__version__ = '1.0.0'