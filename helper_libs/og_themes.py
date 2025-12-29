#!/usr/bin/env python
# coding: utf-8

"""
OG Image Theme Definitions and Generator

Professional OG Image Generator with elegant, balanced designs.
Features:
- Readable title sizes (72-88px) that look professional
- Proportional subtitle sizes (32-40px) for clarity
- Modern, sophisticated color palettes
- Elegant decorative elements
- Professional-grade gradient backgrounds with smooth diagonal rendering
"""

from PIL import Image, ImageDraw, ImageFont
from dataclasses import dataclass
from typing import Tuple, Optional, List
import math
import numpy as np
import os


def find_font(font_path: str) -> str:
    """Find font file, checking multiple locations."""
    # If the path exists as-is, return it
    if os.path.exists(font_path):
        return font_path
    
    # Try Google Drive location
    font_name = os.path.basename(font_path)
    gdrive_locations = [
        os.path.expanduser(f"~/gdrive/fonts/{font_name}"),
        os.path.expanduser(f"~/gdrive/fonts/{font_name.replace('-', '_')}"),
    ]
    
    for loc in gdrive_locations:
        if os.path.exists(loc):
            return loc
    
    # Try system font locations
    system_locations = [
        f"/usr/share/fonts/truetype/{font_name}",
        f"/usr/share/fonts/{font_name}",
        f"/System/Library/Fonts/{font_name}",
    ]
    
    for loc in system_locations:
        if os.path.exists(loc):
            return loc
    
    # Return original path, let PIL handle the error
    return font_path


@dataclass
class ThemeColors:
    """Color scheme for a theme"""
    background: Tuple[int, int, int, int]
    title_color: Tuple[int, int, int]
    subtitle_color: Tuple[int, int, int]
    accent_color: Tuple[int, int, int]
    secondary_accent: Optional[Tuple[int, int, int]] = None
    gradient_end: Optional[Tuple[int, int, int, int]] = None


@dataclass
class ThemeConfig:
    """Configuration for an OG image theme"""
    name: str
    colors: ThemeColors
    title_font_size: int = 80
    subtitle_font_size: int = 36
    metadata_font_size: int = 24
    line_width: int = 4
    padding: int = 60
    has_gradient: bool = False
    gradient_angle: float = 45.0


# =============================================================================
# REDESIGNED THEMES - Professional, balanced typography
# =============================================================================

THEMES = {
    # -------------------------------------------------------------------------
    # CLASSIC & ELEGANT THEMES
    # -------------------------------------------------------------------------
    "classic": ThemeConfig(
        name="Classic Elegance",
        colors=ThemeColors(
            background=(252, 250, 245, 255),      # Warm cream
            title_color=(35, 30, 25),              # Deep espresso
            subtitle_color=(100, 90, 80),          # Warm taupe
            accent_color=(178, 134, 75),           # Antique gold
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=65,
    ),
    
    "editorial": ThemeConfig(
        name="Editorial Premium",
        colors=ThemeColors(
            background=(255, 255, 255, 255),      # Pure white
            title_color=(20, 20, 20),              # Near black
            subtitle_color=(110, 110, 110),        # Medium gray
            accent_color=(200, 30, 30),            # Elegant red
        ),
        title_font_size=84,
        subtitle_font_size=34,
        line_width=4,
        padding=60,
    ),
    
    # -------------------------------------------------------------------------
    # MODERN & VIBRANT THEMES
    # -------------------------------------------------------------------------
    "modern": ThemeConfig(
        name="Modern Vibrant",
        colors=ThemeColors(
            background=(248, 250, 255, 255),      # Cool white
            title_color=(20, 20, 40),              # Deep ink
            subtitle_color=(80, 85, 105),          # Slate
            accent_color=(99, 102, 241),           # Vibrant indigo
            secondary_accent=(236, 72, 153),       # Pink accent
        ),
        title_font_size=82,
        subtitle_font_size=36,
        line_width=4,
        padding=55,
    ),
    
    "tech": ThemeConfig(
        name="Tech Forward",
        colors=ThemeColors(
            background=(15, 23, 42, 255),         # Slate 900
            title_color=(248, 250, 252),          # Slate 50
            subtitle_color=(148, 163, 184),        # Slate 400
            accent_color=(56, 189, 248),           # Sky 400
            secondary_accent=(34, 211, 238),       # Cyan 400
        ),
        title_font_size=78,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
    ),
    
    # -------------------------------------------------------------------------
    # DARK & PREMIUM THEMES
    # -------------------------------------------------------------------------
    "dark": ThemeConfig(
        name="Dark Premium",
        colors=ThemeColors(
            background=(12, 12, 16, 255),         # Deep black
            title_color=(255, 255, 255),          # Pure white
            subtitle_color=(170, 175, 185),        # Silver
            accent_color=(99, 102, 241),           # Indigo glow
            secondary_accent=(139, 92, 246),       # Violet
        ),
        title_font_size=82,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
    ),
    
    "midnight": ThemeConfig(
        name="Midnight Luxe",
        colors=ThemeColors(
            background=(17, 24, 39, 255),         # Gray 900
            title_color=(255, 251, 235),          # Amber 50
            subtitle_color=(156, 163, 175),        # Gray 400
            accent_color=(251, 191, 36),           # Amber 400
            secondary_accent=(245, 158, 11),       # Amber 500
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
    ),
    
    # -------------------------------------------------------------------------
    # MINIMAL THEMES
    # -------------------------------------------------------------------------
    "minimal": ThemeConfig(
        name="Minimal Pure",
        colors=ThemeColors(
            background=(255, 255, 255, 255),      # Pure white
            title_color=(0, 0, 0),                 # Black
            subtitle_color=(100, 100, 100),        # Gray
            accent_color=(0, 0, 0),                # Black accent
        ),
        title_font_size=88,
        subtitle_font_size=34,
        line_width=3,
        padding=70,
    ),
    
    "soft": ThemeConfig(
        name="Soft Minimal",
        colors=ThemeColors(
            background=(250, 250, 250, 255),      # Soft white
            title_color=(55, 55, 60),              # Soft black
            subtitle_color=(130, 130, 135),        # Medium gray
            accent_color=(75, 75, 80),             # Dark gray
        ),
        title_font_size=82,
        subtitle_font_size=36,
        line_width=3,
        padding=65,
    ),
    
    # -------------------------------------------------------------------------
    # GRADIENT THEMES - Smooth, professional gradients
    # -------------------------------------------------------------------------
    "gradient_sunset": ThemeConfig(
        name="Sunset Glow",
        colors=ThemeColors(
            background=(251, 146, 60, 255),       # Orange 400
            title_color=(255, 255, 255),
            subtitle_color=(255, 237, 213),        # Orange 100
            accent_color=(255, 255, 255),
            gradient_end=(244, 63, 94, 255),      # Rose 500
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
        has_gradient=True,
        gradient_angle=135.0,
    ),
    
    "gradient_ocean": ThemeConfig(
        name="Ocean Deep",
        colors=ThemeColors(
            background=(30, 64, 175, 255),        # Blue 800
            title_color=(255, 255, 255),
            subtitle_color=(191, 219, 254),        # Blue 200
            accent_color=(147, 197, 253),          # Blue 300
            gradient_end=(6, 182, 212, 255),      # Cyan 500
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
        has_gradient=True,
        gradient_angle=135.0,
    ),
    
    "gradient_purple": ThemeConfig(
        name="Purple Dream",
        colors=ThemeColors(
            background=(126, 34, 206, 255),       # Purple 600
            title_color=(255, 255, 255),
            subtitle_color=(233, 213, 255),        # Purple 200
            accent_color=(216, 180, 254),          # Purple 300
            gradient_end=(236, 72, 153, 255),     # Pink 500
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
        has_gradient=True,
        gradient_angle=135.0,
    ),
    
    "gradient_forest": ThemeConfig(
        name="Forest Emerald",
        colors=ThemeColors(
            background=(5, 150, 105, 255),        # Emerald 600
            title_color=(255, 255, 255),
            subtitle_color=(209, 250, 229),        # Emerald 100
            accent_color=(167, 243, 208),          # Emerald 200
            gradient_end=(20, 184, 166, 255),     # Teal 500
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
        has_gradient=True,
        gradient_angle=135.0,
    ),
    
    "gradient_noir": ThemeConfig(
        name="Noir Elegance",
        colors=ThemeColors(
            background=(55, 65, 81, 255),         # Gray 700
            title_color=(255, 255, 255),
            subtitle_color=(209, 213, 219),        # Gray 300
            accent_color=(156, 163, 175),          # Gray 400
            gradient_end=(17, 24, 39, 255),       # Gray 900
        ),
        title_font_size=82,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
        has_gradient=True,
        gradient_angle=135.0,
    ),
    
    # -------------------------------------------------------------------------
    # COLORFUL ACCENT THEMES
    # -------------------------------------------------------------------------
    "creative": ThemeConfig(
        name="Creative Bold",
        colors=ThemeColors(
            background=(255, 247, 237, 255),      # Orange 50
            title_color=(124, 45, 18),             # Orange 900
            subtitle_color=(180, 83, 9),           # Orange 700
            accent_color=(234, 88, 12),            # Orange 600
            secondary_accent=(249, 115, 22),       # Orange 500
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
    ),
    
    "nature": ThemeConfig(
        name="Nature Fresh",
        colors=ThemeColors(
            background=(240, 253, 244, 255),      # Green 50
            title_color=(20, 83, 45),              # Green 900
            subtitle_color=(22, 101, 52),          # Green 800
            accent_color=(34, 197, 94),            # Green 500
            secondary_accent=(74, 222, 128),       # Green 400
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
    ),
    
    "rose": ThemeConfig(
        name="Rose Garden",
        colors=ThemeColors(
            background=(255, 241, 242, 255),      # Rose 50
            title_color=(136, 19, 55),             # Rose 900
            subtitle_color=(159, 18, 57),          # Rose 800
            accent_color=(244, 63, 94),            # Rose 500
            secondary_accent=(251, 113, 133),      # Rose 400
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
    ),
    
    "azure": ThemeConfig(
        name="Azure Sky",
        colors=ThemeColors(
            background=(240, 249, 255, 255),      # Sky 50
            title_color=(12, 74, 110),             # Sky 900
            subtitle_color=(3, 105, 161),          # Sky 700
            accent_color=(14, 165, 233),           # Sky 500
            secondary_accent=(56, 189, 248),       # Sky 400
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
    ),
    
    "retro": ThemeConfig(
        name="Retro Vibes",
        colors=ThemeColors(
            background=(254, 249, 231, 255),      # Vintage cream
            title_color=(92, 64, 51),              # Brown
            subtitle_color=(133, 106, 82),         # Light brown
            accent_color=(180, 83, 9),             # Amber 700
            secondary_accent=(217, 119, 6),        # Amber 600
        ),
        title_font_size=80,
        subtitle_font_size=36,
        line_width=4,
        padding=60,
    ),
}


class OGImageGenerator:
    """Generator for themed Open Graph images with professional design."""
    
    def __init__(self, width: int = 1200, height: int = 630):
        """Initialize the generator with image dimensions."""
        self.width = width
        self.height = height
    
    def _create_gradient_background(
        self, 
        color1: Tuple[int, int, int, int], 
        color2: Tuple[int, int, int, int],
        angle: float = 45.0
    ) -> Image.Image:
        """Create a smooth gradient background using NumPy for performance."""
        img = Image.new('RGBA', (self.width, self.height))
        arr = np.zeros((self.height, self.width, 4), dtype=np.uint8)
        
        # Convert angle to radians
        angle_rad = math.radians(angle)
        
        # Calculate gradient direction
        cos_a = math.cos(angle_rad)
        sin_a = math.sin(angle_rad)
        
        # Create coordinate grids using NumPy broadcasting
        x_grid = np.arange(self.width)
        y_grid = np.arange(self.height)
        x_mesh, y_mesh = np.meshgrid(x_grid, y_grid)
        
        # Calculate the projection onto gradient direction
        projection = x_mesh * cos_a + y_mesh * sin_a
        max_proj = self.width * abs(cos_a) + self.height * abs(sin_a)
        
        # Normalize to 0-1 range with smooth easing
        ratio = projection / max_proj
        # Apply smooth easing for more natural gradient
        ratio = ratio * ratio * (3 - 2 * ratio)  # smoothstep
        
        # Compute colors using vectorized operations
        arr[:, :, 0] = (color1[0] * (1 - ratio) + color2[0] * ratio).astype(np.uint8)
        arr[:, :, 1] = (color1[1] * (1 - ratio) + color2[1] * ratio).astype(np.uint8)
        arr[:, :, 2] = (color1[2] * (1 - ratio) + color2[2] * ratio).astype(np.uint8)
        arr[:, :, 3] = 255
        
        return Image.fromarray(arr, 'RGBA')
    
    def _draw_decoration(
        self, 
        draw: ImageDraw.ImageDraw, 
        decoration: str, 
        theme: ThemeConfig
    ) -> None:
        """Draw decorative elements based on the specified style."""
        accent = theme.colors.accent_color
        secondary = theme.colors.secondary_accent or accent
        
        if decoration == "circles":
            # Elegant corner circles
            # Top-right cluster
            draw.ellipse([self.width-130, 35, self.width-50, 115], 
                        outline=(*accent, 100), width=2)
            draw.ellipse([self.width-95, 55, self.width-35, 115], 
                        fill=(*secondary, 50))
            # Bottom-left cluster  
            draw.ellipse([35, self.height-130, 115, self.height-50], 
                        outline=(*accent, 100), width=2)
            draw.ellipse([55, self.height-95, 115, self.height-35], 
                        fill=(*secondary, 50))
            
        elif decoration == "dots":
            # Subtle dot pattern
            dot_spacing = 35
            dot_size = 3
            for x in range(60, self.width - 60, dot_spacing):
                for y in range(60, self.height - 60, dot_spacing):
                    # Create a subtle gradient pattern
                    alpha = int(25 + 15 * math.sin(x * 0.02) * math.cos(y * 0.02))
                    draw.ellipse([x-dot_size, y-dot_size, x+dot_size, y+dot_size], 
                               fill=(*accent, alpha))
                    
        elif decoration == "lines":
            # Elegant diagonal lines
            line_spacing = 45
            line_alpha = 40
            for offset in range(-self.height, self.width, line_spacing):
                start_x = max(0, offset)
                start_y = max(0, -offset)
                end_x = min(self.width, offset + self.height)
                end_y = min(self.height, self.height - offset)
                draw.line([(start_x, start_y), (end_x, end_y)], 
                         fill=(*accent, line_alpha), width=1)
                         
        elif decoration == "corner_accent":
            # Modern corner triangles
            corner_size = 100
            # Top-left
            draw.polygon([
                (0, 0), (corner_size, 0), (0, corner_size)
            ], fill=(*accent, 80))
            # Bottom-right
            draw.polygon([
                (self.width, self.height), 
                (self.width - corner_size, self.height), 
                (self.width, self.height - corner_size)
            ], fill=(*secondary, 80))
    
    def generate(
        self,
        title: str,
        subtitle: str = "",
        theme_name: str = "modern",
        decoration: Optional[str] = None,
        overlay_image: Optional[str] = None,
        title_font: str = "Resources/assets/fonts/futura-bold.ttf",
        text_font: str = "Resources/assets/fonts/futura-light.ttf",
        tags: Optional[List[str]] = None,
        date_published: Optional[str] = None,
    ) -> Image.Image:
        """Generate an OG image with the specified theme and content."""
        
        theme = THEMES.get(theme_name, THEMES["modern"])
        
        # Create background
        if theme.has_gradient and theme.colors.gradient_end:
            img = self._create_gradient_background(
                theme.colors.background,
                theme.colors.gradient_end,
                theme.gradient_angle
            )
        else:
            img = Image.new('RGBA', (self.width, self.height), theme.colors.background)
        
        draw = ImageDraw.Draw(img, 'RGBA')
        
        # Draw decorations if specified
        if decoration:
            self._draw_decoration(draw, decoration, theme)
        
        # Calculate text area
        if overlay_image:
            text_box_width = int(self.width * 0.55) - (theme.padding * 2)
            text_x = theme.padding
        else:
            text_box_width = self.width - (theme.padding * 2)
            text_x = theme.padding
        
        # Load fonts with fallback (checking multiple locations)
        title_font_path = find_font(title_font)
        text_font_path = find_font(text_font)
        
        try:
            title_font_obj = ImageFont.truetype(title_font_path, theme.title_font_size)
        except OSError:
            try:
                title_font_obj = ImageFont.truetype(find_font("Resources/assets/fonts/futura-bold.ttf"), theme.title_font_size)
            except OSError:
                title_font_obj = ImageFont.load_default()
        
        try:
            subtitle_font_obj = ImageFont.truetype(text_font_path, theme.subtitle_font_size)
        except OSError:
            try:
                subtitle_font_obj = ImageFont.truetype(find_font("Resources/assets/fonts/futura-light.ttf"), theme.subtitle_font_size)
            except OSError:
                subtitle_font_obj = ImageFont.load_default()
        
        # Calculate text positions
        title_lines = self._wrap_text(title, title_font_obj, text_box_width)
        
        # Calculate line height with comfortable spacing
        line_height = int(theme.title_font_size * 1.2)
        total_title_height = len(title_lines) * line_height
        
        # Calculate subtitle height
        subtitle_height = 0
        if subtitle:
            subtitle_height = theme.subtitle_font_size + 40
        
        # Accent line height
        accent_line_height = 30
        
        # Total content height
        content_height = total_title_height + accent_line_height + subtitle_height
        
        # Starting Y position - good vertical centering
        start_y = max(theme.padding, (self.height - content_height) // 2)
        
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
        line_y = current_y + 15
        line_length = min(text_box_width * 0.3, 250)
        line_start_x = text_x + (text_box_width - line_length) // 2
        line_end_x = line_start_x + line_length
        
        draw.line(
            [(line_start_x, line_y), (line_end_x, line_y)], 
            fill=theme.colors.accent_color, 
            width=theme.line_width
        )
        
        # Draw subtitle if provided
        if subtitle:
            subtitle_y = line_y + 25
            subtitle_lines = self._wrap_text(subtitle, subtitle_font_obj, text_box_width)
            
            for line in subtitle_lines:
                bbox = subtitle_font_obj.getbbox(line)
                text_width = bbox[2] - bbox[0]
                x_pos = text_x + (text_box_width - text_width) // 2
                draw.text((x_pos, subtitle_y), line, font=subtitle_font_obj, fill=theme.colors.subtitle_color)
                subtitle_y += int(theme.subtitle_font_size * 1.4)
        
        # Draw metadata (tags and date) at bottom of image
        if tags or date_published:
            try:
                metadata_font_obj = ImageFont.truetype(text_font, theme.metadata_font_size)
            except OSError:
                metadata_font_obj = subtitle_font_obj
            
            metadata_y = self.height - theme.padding - theme.metadata_font_size
            
            # Format metadata text
            metadata_parts = []
            if date_published:
                metadata_parts.append(date_published)
            if tags and len(tags) > 0:
                # Limit to first 3 tags and format nicely
                display_tags = tags[:3]
                metadata_parts.append(" · ".join(display_tags))
            
            if metadata_parts:
                metadata_text = "  |  ".join(metadata_parts)
                bbox = metadata_font_obj.getbbox(metadata_text)
                text_width = bbox[2] - bbox[0]
                x_pos = text_x + (text_box_width - text_width) // 2
                draw.text((x_pos, metadata_y), metadata_text, font=metadata_font_obj, fill=theme.colors.subtitle_color)
        
        return img
    
    def _wrap_text(self, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
        """Wrap text to fit within max_width."""
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
        
        # Limit to 3 lines maximum for readability
        if len(lines) > 3:
            lines = lines[:3]
            # Add ellipsis to last line if truncated
            if len(lines[2]) > 3:
                lines[2] = lines[2][:-3] + '...'
        
        return lines
    
    def save(self, img: Image.Image, path: str) -> None:
        """Save the image to the specified path."""
        if img.mode == 'RGBA':
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            background.save(path)
        else:
            img.save(path)


def get_available_themes() -> List[str]:
    """Return list of available theme names."""
    return list(THEMES.keys())


def get_theme_info(theme_name: str) -> Optional[ThemeConfig]:
    """Get configuration for a specific theme."""
    return THEMES.get(theme_name)
