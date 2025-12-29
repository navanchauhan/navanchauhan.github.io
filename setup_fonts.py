#!/usr/bin/env python3
"""
Font Setup Script for OG Image Generation

This script downloads or copies required fonts for OG image generation.
It supports multiple font sources:
1. Google Drive (via rclone mount at ~/gdrive/fonts/)
2. Local system fonts
3. Google Fonts fallback (for open source alternatives)

Usage:
    python setup_fonts.py
"""

import os
import shutil
import sys
from pathlib import Path

# Font configuration
FONTS_DIR = Path("Resources/assets/fonts")
REQUIRED_FONTS = {
    "futura-bold.ttf": {
        "gdrive_source": Path(os.path.expanduser("~/gdrive/fonts/futura_bold.ttf")),
        "fallbacks": [
            "/System/Library/Fonts/Supplemental/Futura.ttc",  # macOS
            "/usr/share/fonts/truetype/futura/FuturaBT-Bold.ttf",  # Linux
        ]
    },
    "futura-light.ttf": {
        "gdrive_source": Path(os.path.expanduser("~/gdrive/fonts/futura_light.ttf")),
        "fallbacks": [
            "/System/Library/Fonts/Supplemental/Futura.ttc",  # macOS
            "/usr/share/fonts/truetype/futura/FuturaBT-Light.ttf",  # Linux
        ]
    },
}


def setup_fonts():
    """Download or copy required fonts to the Resources/assets/fonts/ directory."""
    # Create fonts directory if it doesn't exist
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create .gitkeep to ensure directory is tracked
    gitkeep = FONTS_DIR / ".gitkeep"
    if not gitkeep.exists():
        gitkeep.touch()
    
    fonts_installed = 0
    fonts_missing = []
    
    for font_name, sources in REQUIRED_FONTS.items():
        dest_path = FONTS_DIR / font_name
        
        # Skip if font already exists
        if dest_path.exists() and dest_path.stat().st_size > 1000:
            print(f"✓ {font_name} already exists")
            fonts_installed += 1
            continue
        
        # Try Google Drive source first
        gdrive_source = sources.get("gdrive_source")
        if gdrive_source and gdrive_source.exists():
            try:
                shutil.copy2(gdrive_source, dest_path)
                print(f"✓ {font_name} copied from Google Drive")
                fonts_installed += 1
                continue
            except Exception as e:
                print(f"  Warning: Could not copy from Google Drive: {e}")
        
        # Try fallback locations
        for fallback_path in sources.get("fallbacks", []):
            fallback = Path(fallback_path)
            if fallback.exists():
                try:
                    shutil.copy2(fallback, dest_path)
                    print(f"✓ {font_name} copied from {fallback_path}")
                    fonts_installed += 1
                    break
                except Exception as e:
                    print(f"  Warning: Could not copy from {fallback_path}: {e}")
        else:
            fonts_missing.append(font_name)
            print(f"✗ {font_name} not found")
    
    print()
    print(f"Fonts installed: {fonts_installed}/{len(REQUIRED_FONTS)}")
    
    if fonts_missing:
        print()
        print("Missing fonts:")
        for font in fonts_missing:
            print(f"  - {font}")
        print()
        print("Please manually copy fonts to Resources/assets/fonts/ or ensure")
        print("Google Drive is mounted at ~/gdrive/fonts/")
        return False
    
    return True


if __name__ == "__main__":
    print("Setting up fonts for OG image generation...")
    print()
    
    success = setup_fonts()
    
    if success:
        print()
        print("All fonts installed successfully!")
    else:
        sys.exit(1)
