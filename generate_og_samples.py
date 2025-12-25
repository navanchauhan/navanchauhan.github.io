#!/usr/bin/env python
# coding: utf-8

"""
OG Image Theme Samples Generator

This script generates sample OG images for each available theme,
using actual titles from random posts in Content/posts/.
"""

import os
import sys
import random
import re

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from helper_libs.og_themes import OGImageGenerator, THEMES, get_available_themes


def parse_post_metadata(filepath):
    """Parse the title and description from a markdown post."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Get title from first h1 heading
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else "Untitled Post"
    
    # Get description from front matter
    desc_match = re.search(r'^description:\s*(.+)$', content, re.MULTILINE)
    description = desc_match.group(1).strip() if desc_match else ""
    
    # Check if draft
    draft_match = re.search(r'^draft:\s*true', content, re.MULTILINE)
    is_draft = bool(draft_match)
    
    return title, description, is_draft


def get_random_posts(posts_dir="Content/posts", count=20, seed=2025):
    """Get random post metadata for reproducible sample generation."""
    posts = []
    for filename in sorted(os.listdir(posts_dir)):  # Sort for reproducibility
        if filename.endswith('.md'):
            filepath = os.path.join(posts_dir, filename)
            title, description, is_draft = parse_post_metadata(filepath)
            if not is_draft:  # Skip drafts
                posts.append((title, description))
    
    random.seed(seed)  # Fixed seed for reproducibility
    random.shuffle(posts)
    return posts[:count]


def generate_samples(output_dir: str = "Resources/images/og_theme_samples", use_posts: bool = True):
    """Generate sample OG images for all available themes."""
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    generator = OGImageGenerator()
    
    # Get sample content
    if use_posts and os.path.exists("Content/posts"):
        posts = get_random_posts("Content/posts", count=20)
        print("Using random posts for sample content...")
    else:
        # Fallback to default sample content
        posts = [
            ("Building a Modern Web Application with Python and JavaScript",
             "A comprehensive guide to full-stack development"),
        ] * 20
        print("Using default sample content...")
    
    themes = get_available_themes()
    
    print(f"Generating {len(themes)} theme samples...")
    print(f"Output directory: {output_dir}")
    print("-" * 50)
    
    for i, theme_name in enumerate(themes):
        theme_config = THEMES[theme_name]
        output_path = os.path.join(output_dir, f"sample_{theme_name}.png")
        
        # Use a post from our selection
        sample_title, sample_subtitle = posts[i % len(posts)]
        
        print(f"Generating: {theme_config.name} ({theme_name})")
        print(f"  Title: {sample_title[:60]}{'...' if len(sample_title) > 60 else ''}")
        
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
    
    for j, (theme_name, decoration) in enumerate(decoration_samples):
        output_path = os.path.join(output_dir, f"sample_{theme_name}_with_{decoration}.png")
        
        # Use different posts for decoration samples
        sample_title, sample_subtitle = posts[(len(themes) + j) % len(posts)]
        
        print(f"Generating: {theme_name} with {decoration} decoration")
        print(f"  Title: {sample_title[:60]}{'...' if len(sample_title) > 60 else ''}")
        
        img = generator.generate(
            title=sample_title,
            subtitle=sample_subtitle,
            theme_name=theme_name,
            title_font="Resources/assets/fonts/LM-bold.ttf",
            text_font="Resources/assets/fonts/LM-regular.ttf",
            decoration=decoration,
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
    parser.add_argument(
        "--no-posts",
        action="store_true",
        help="Use default sample content instead of posts"
    )
    
    args = parser.parse_args()
    
    if args.list_themes:
        print("Available OG Image Themes:")
        print("-" * 30)
        for name in get_available_themes():
            config = THEMES[name]
            print(f"  {name}: {config.name}")
        return
    
    generate_samples(args.output_dir, use_posts=not args.no_posts)


if __name__ == "__main__":
    main()
