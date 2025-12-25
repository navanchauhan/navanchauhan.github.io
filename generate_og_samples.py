#!/usr/bin/env python
# coding: utf-8

"""
OG Image Theme Samples Generator

This script generates sample OG images for each available theme,
demonstrating the different visual styles available.
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from helper_libs.og_themes import OGImageGenerator, THEMES, get_available_themes


def generate_samples(output_dir: str = "Resources/images/og_theme_samples"):
    """Generate sample OG images for all available themes."""
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    generator = OGImageGenerator()
    
    # Sample content for demonstration
    sample_title = "Building a Modern Web Application with Python and JavaScript"
    sample_subtitle = "A comprehensive guide to full-stack development"
    
    themes = get_available_themes()
    
    print(f"Generating {len(themes)} theme samples...")
    print(f"Output directory: {output_dir}")
    print("-" * 50)
    
    for theme_name in themes:
        theme_config = THEMES[theme_name]
        output_path = os.path.join(output_dir, f"sample_{theme_name}.png")
        
        print(f"Generating: {theme_config.name} ({theme_name})")
        
        # Generate the image
        img = generator.generate(
            title=sample_title,
            subtitle=sample_subtitle,
            theme_name=theme_name,
            title_font="Resources/assets/fonts/LM-bold.ttf",
            text_font="Resources/assets/fonts/LM-regular.ttf",
        )
        
        # Save the image
        generator.save(img, output_path)
        print(f"  Saved: {output_path}")
    
    # Also generate samples with decorations for select themes
    decoration_samples = [
        ("modern", "circles"),
        ("minimal", "dots"),
        ("tech", "lines"),
        ("dark", "corner_accent"),
    ]
    
    print("\nGenerating decoration samples...")
    print("-" * 50)
    
    for theme_name, decoration in decoration_samples:
        output_path = os.path.join(output_dir, f"sample_{theme_name}_with_{decoration}.png")
        
        print(f"Generating: {theme_name} with {decoration} decoration")
        
        img = generator.generate(
            title=sample_title,
            subtitle=sample_subtitle,
            theme_name=theme_name,
            title_font="Resources/assets/fonts/LM-bold.ttf",
            text_font="Resources/assets/fonts/LM-regular.ttf",
            decorations=decoration,
        )
        
        generator.save(img, output_path)
        print(f"  Saved: {output_path}")
    
    print("\n" + "=" * 50)
    print("Sample generation complete!")
    print(f"Total samples generated: {len(themes) + len(decoration_samples)}")
    
    return output_dir


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate OG image theme samples")
    parser.add_argument(
        "--output-dir", "-o",
        default="Resources/images/og_theme_samples",
        help="Output directory for sample images"
    )
    parser.add_argument(
        "--list-themes", "-l",
        action="store_true",
        help="List available themes and exit"
    )
    
    args = parser.parse_args()
    
    if args.list_themes:
        print("Available OG Image Themes:")
        print("-" * 30)
        for name in get_available_themes():
            config = THEMES[name]
            print(f"  {name}: {config.name}")
        return
    
    generate_samples(args.output_dir)


if __name__ == "__main__":
    main()
