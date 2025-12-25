#!/usr/bin/env python
# coding: utf-8

"""
OG Image Theme Definitions and Generator

This module provides multiple theme options for generating Open Graph images.
Each theme has a distinct visual style suitable for different types of content.
"""

from PIL import Image, ImageDraw, ImageFont
from dataclasses import dataclass
from typing import Tuple, Optional, List
import math


@dataclass
class ThemeColors:
    """Color scheme for a theme"""
    background: Tuple[int, int, int, int]
    title_color: Tuple[int, int, int]
    subtitle_color: Tuple[int, int, int]
    accent_color: Tuple[int, int, int]
    secondary_accent: Optional[Tuple[int, int, int]] = None


@dataclass
class ThemeConfig:
    """Configuration for an OG image theme"""
    name: str
    colors: ThemeColors
    title_font_size: int = 65
    subtitle_font_size: int = 32
    line_width: int = 5
    padding: int = 50


# Theme definitions
THEMES = {
    "classic": ThemeConfig(
        name="Classic",
        colors=ThemeColors(
            background=(238, 238, 238, 255),
            title_color=(49, 31, 19),
            subtitle_color=(0, 0, 0),
            accent_color=(176, 113, 84),
        ),
    ),
    "modern": ThemeConfig(
        name="Modern",
        colors=ThemeColors(
            background=(255, 255, 255, 255),
            title_color=(26, 26, 26),
            subtitle_color=(102, 102, 102),
            accent_color=(99, 102, 241),  # Indigo
            secondary_accent=(236, 72, 153),  # Pink
        ),
        title_font_size=68,
        line_width=4,
    ),
    "dark": ThemeConfig(
        name="Dark",
        colors=ThemeColors(
            background=(17, 24, 39, 255),  # Dark slate
            title_color=(243, 244, 246),  # Light gray
            subtitle_color=(156, 163, 175),  # Medium gray
            accent_color=(59, 130, 246),  # Blue
            secondary_accent=(139, 92, 246),  # Purple
        ),
        title_font_size=65,
    ),
    "minimal": ThemeConfig(
        name="Minimal",
        colors=ThemeColors(
            background=(250, 250, 250, 255),
            title_color=(23, 23, 23),
            subtitle_color=(115, 115, 115),
            accent_color=(23, 23, 23),
        ),
        title_font_size=60,
        line_width=2,
        padding=80,
    ),
    "gradient_sunset": ThemeConfig(
        name="Gradient Sunset",
        colors=ThemeColors(
            background=(255, 107, 107, 255),  # Start color (will be overridden by gradient)
            title_color=(255, 255, 255),
            subtitle_color=(255, 255, 255),
            accent_color=(255, 255, 255),
            secondary_accent=(254, 202, 87),  # Yellow
        ),
        title_font_size=70,
    ),
    "gradient_ocean": ThemeConfig(
        name="Gradient Ocean",
        colors=ThemeColors(
            background=(0, 82, 156, 255),  # Deep blue (will be overridden)
            title_color=(255, 255, 255),
            subtitle_color=(224, 247, 250),
            accent_color=(0, 255, 200),  # Cyan
            secondary_accent=(0, 184, 148),  # Teal
        ),
        title_font_size=68,
    ),
    "gradient_purple": ThemeConfig(
        name="Gradient Purple",
        colors=ThemeColors(
            background=(102, 51, 153, 255),  # Purple (will be overridden)
            title_color=(255, 255, 255),
            subtitle_color=(237, 231, 246),
            accent_color=(255, 193, 7),  # Gold
            secondary_accent=(255, 87, 51),  # Orange
        ),
        title_font_size=68,
    ),
    "retro": ThemeConfig(
        name="Retro",
        colors=ThemeColors(
            background=(255, 248, 220, 255),  # Cream/Cornsilk
            title_color=(139, 69, 19),  # Saddle brown
            subtitle_color=(101, 67, 33),  # Dark brown
            accent_color=(205, 92, 92),  # Indian red
            secondary_accent=(184, 134, 11),  # Dark goldenrod
        ),
        title_font_size=62,
        line_width=6,
    ),
    "tech": ThemeConfig(
        name="Tech",
        colors=ThemeColors(
            background=(13, 17, 23, 255),  # GitHub dark
            title_color=(201, 209, 217),
            subtitle_color=(139, 148, 158),
            accent_color=(88, 166, 255),  # Blue
            secondary_accent=(63, 185, 80),  # Green
        ),
        title_font_size=64,
    ),
    "nature": ThemeConfig(
        name="Nature",
        colors=ThemeColors(
            background=(240, 244, 240, 255),  # Light sage
            title_color=(34, 87, 61),  # Forest green
            subtitle_color=(73, 109, 86),  # Medium green
            accent_color=(139, 195, 74),  # Light green
            secondary_accent=(76, 175, 80),  # Green
        ),
        title_font_size=65,
    ),
}


class OGImageGenerator:
    """Generator for Open Graph images with multiple theme support"""
    
    def __init__(self, width: int = 1200, height: int = 630):
        self.width = width
        self.height = height
    
    def create_gradient_background_fast(
        self, 
        color1: Tuple[int, int, int], 
        color2: Tuple[int, int, int],
        direction: str = "diagonal"
    ) -> Image.Image:
        """Create a gradient background using a faster method"""
        import numpy as np
        
        arr = np.zeros((self.height, self.width, 4), dtype=np.uint8)
        
        if direction == "horizontal":
            for x in range(self.width):
                ratio = x / self.width
                r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
                g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
                b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
                arr[:, x] = [r, g, b, 255]
        elif direction == "vertical":
            for y in range(self.height):
                ratio = y / self.height
                r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
                g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
                b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
                arr[y, :] = [r, g, b, 255]
        else:  # diagonal
            for y in range(self.height):
                for x in range(self.width):
                    ratio = (x + y) / (self.width + self.height)
                    r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
                    g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
                    b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
                    arr[y, x] = [r, g, b, 255]
        
        return Image.fromarray(arr, 'RGBA')
    
    def add_geometric_decorations(
        self, 
        img: Image.Image, 
        theme: ThemeConfig, 
        style: str = "circles"
    ) -> Image.Image:
        """Add geometric decorations to the image"""
        draw = ImageDraw.Draw(img)
        accent = theme.colors.accent_color + (50,)  # Semi-transparent
        
        if style == "circles":
            # Add decorative circles in corners
            draw.ellipse([(-100, -100), (200, 200)], fill=accent)
            draw.ellipse([(self.width - 150, self.height - 150), 
                         (self.width + 100, self.height + 100)], fill=accent)
        elif style == "lines":
            # Add diagonal lines
            for i in range(-self.height, self.width + self.height, 80):
                draw.line([(i, 0), (i + self.height, self.height)], 
                         fill=accent, width=2)
        elif style == "dots":
            # Add dot pattern
            for x in range(0, self.width, 40):
                for y in range(0, self.height, 40):
                    draw.ellipse([(x-3, y-3), (x+3, y+3)], fill=accent)
        elif style == "corner_accent":
            # Add corner accent shapes
            points = [(0, 0), (200, 0), (0, 200)]
            draw.polygon(points, fill=accent)
            points = [(self.width, self.height), (self.width - 200, self.height), 
                     (self.width, self.height - 200)]
            draw.polygon(points, fill=accent)
        
        return img
    
    def generate(
        self,
        title: str,
        subtitle: str = "",
        theme_name: str = "classic",
        title_font: str = "fonts/futura_bold.ttf",
        text_font: str = "fonts/futura_light.ttf",
        overlay_image: Optional[Image.Image] = None,
        decorations: Optional[str] = None,
    ) -> Image.Image:
        """Generate an OG image with the specified theme"""
        
        theme = THEMES.get(theme_name, THEMES["classic"])
        
        # Create background
        if theme_name.startswith("gradient_"):
            if theme_name == "gradient_sunset":
                color1 = (255, 107, 107)  # Coral
                color2 = (254, 202, 87)   # Yellow
            elif theme_name == "gradient_ocean":
                color1 = (0, 82, 156)     # Deep blue
                color2 = (0, 184, 148)    # Teal
            elif theme_name == "gradient_purple":
                color1 = (102, 51, 153)   # Purple
                color2 = (255, 87, 51)    # Orange-red
            else:
                color1 = theme.colors.background[:3]
                color2 = theme.colors.accent_color
            
            try:
                img = self.create_gradient_background_fast(color1, color2, "diagonal")
            except ImportError:
                img = Image.new('RGBA', (self.width, self.height), color=theme.colors.background)
        else:
            img = Image.new('RGBA', (self.width, self.height), color=theme.colors.background)
        
        draw = ImageDraw.Draw(img)
        
        # Add decorations if specified
        if decorations:
            img = self.add_geometric_decorations(img, theme, decorations)
            draw = ImageDraw.Draw(img)
        
        # Handle overlay image (like DallE base images)
        if overlay_image:
            # Resize and position overlay
            overlay = overlay_image.copy()
            overlay = overlay.resize((500, 500), Image.Resampling.LANCZOS)
            # Position on right side
            img.paste(overlay, (650, 65), overlay if overlay.mode == 'RGBA' else None)
            text_box_width = 550
            text_x = theme.padding
        else:
            text_box_width = self.width - (theme.padding * 2)
            text_x = theme.padding
        
        # Load fonts with fallback
        try:
            title_font_obj = ImageFont.truetype(title_font, theme.title_font_size)
        except OSError:
            try:
                title_font_obj = ImageFont.truetype("Resources/assets/fonts/LM-bold.ttf", theme.title_font_size)
            except OSError:
                title_font_obj = ImageFont.load_default()
        
        try:
            subtitle_font_obj = ImageFont.truetype(text_font, theme.subtitle_font_size)
        except OSError:
            try:
                subtitle_font_obj = ImageFont.truetype("Resources/assets/fonts/LM-regular.ttf", theme.subtitle_font_size)
            except OSError:
                subtitle_font_obj = ImageFont.load_default()
        
        # Calculate text positions
        title_lines = self._wrap_text(title, title_font_obj, text_box_width)
        
        # Calculate total height needed
        line_height = theme.title_font_size + 10
        total_title_height = len(title_lines) * line_height
        
        # Starting Y position - center title area vertically in upper portion
        start_y = max(theme.padding, (self.height // 2 - total_title_height) // 2)
        
        # Draw title lines
        current_y = start_y
        for line in title_lines:
            bbox = title_font_obj.getbbox(line)
            text_width = bbox[2] - bbox[0]
            
            # Center text within the text box
            x_pos = text_x + (text_box_width - text_width) // 2
            draw.text((x_pos, current_y), line, font=title_font_obj, fill=theme.colors.title_color)
            current_y += line_height
        
        # Draw accent line
        line_y = current_y + 30
        line_start_x = text_x + text_box_width // 4
        line_end_x = text_x + 3 * text_box_width // 4
        
        draw.line(
            [(line_start_x, line_y), (line_end_x, line_y)], 
            fill=theme.colors.accent_color, 
            width=theme.line_width
        )
        
        # Draw subtitle if provided
        if subtitle:
            subtitle_y = line_y + 40
            subtitle_lines = self._wrap_text(subtitle, subtitle_font_obj, text_box_width)
            
            for line in subtitle_lines:
                bbox = subtitle_font_obj.getbbox(line)
                text_width = bbox[2] - bbox[0]
                x_pos = text_x + (text_box_width - text_width) // 2
                draw.text((x_pos, subtitle_y), line, font=subtitle_font_obj, fill=theme.colors.subtitle_color)
                subtitle_y += theme.subtitle_font_size + 8
        
        return img
    
    def _wrap_text(self, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
        """Wrap text to fit within max_width"""
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = font.getbbox(test_line)
            width = bbox[2] - bbox[0]
            
            if width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines
    
    def save(self, img: Image.Image, path: str) -> None:
        """Save the image to the specified path"""
        # Convert to RGB for PNG if needed
        if img.mode == 'RGBA':
            # Create a white background and paste the image onto it
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
            background.save(path)
        else:
            img.save(path)


def get_available_themes() -> List[str]:
    """Return list of available theme names"""
    return list(THEMES.keys())


def get_theme_info(theme_name: str) -> Optional[ThemeConfig]:
    """Get configuration for a specific theme"""
    return THEMES.get(theme_name)
