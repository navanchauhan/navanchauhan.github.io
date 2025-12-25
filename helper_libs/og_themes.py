#!/usr/bin/env python
# coding: utf-8

"""
OG Image Theme Definitions and Generator

COMPLETELY REDESIGNED - Premium aesthetic themes with dramatically larger text.
Features:
- Title sizes: 88-120px for maximum visual impact
- Subtitle sizes: 36-52px for clear readability
- Modern, sophisticated color palettes
- Elegant decorative elements
- Professional-grade gradient backgrounds
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
    gradient_end: Optional[Tuple[int, int, int, int]] = None


@dataclass
class ThemeConfig:
    """Configuration for an OG image theme"""
    name: str
    colors: ThemeColors
    title_font_size: int = 96       # DRAMATICALLY larger for visual impact
    subtitle_font_size: int = 44    # Proportionally scaled
    line_width: int = 6
    padding: int = 60
    has_gradient: bool = False
    gradient_angle: float = 45.0    # Diagonal gradients look best


# =============================================================================
# PREMIUM AESTHETIC THEMES - Significantly larger text, modern color palettes
# =============================================================================

THEMES = {
    # -------------------------------------------------------------------------
    # CLASSIC & ELEGANT THEMES
    # -------------------------------------------------------------------------
    "classic": ThemeConfig(
        name="Classic Elegance",
        colors=ThemeColors(
            background=(252, 250, 245, 255),      # Warm cream
            title_color=(28, 22, 18),              # Deep espresso
            subtitle_color=(90, 78, 68),           # Warm taupe
            accent_color=(185, 142, 82),           # Antique gold
        ),
        title_font_size=100,
        subtitle_font_size=46,
        line_width=5,
        padding=65,
    ),
    
    "editorial": ThemeConfig(
        name="Editorial Premium",
        colors=ThemeColors(
            background=(255, 255, 255, 255),      # Pure white
            title_color=(12, 12, 12),              # Near black
            subtitle_color=(100, 100, 100),        # Medium gray
            accent_color=(220, 38, 38),            # Elegant red
        ),
        title_font_size=108,
        subtitle_font_size=44,
        line_width=4,
        padding=70,
    ),
    
    # -------------------------------------------------------------------------
    # MODERN & VIBRANT THEMES
    # -------------------------------------------------------------------------
    "modern": ThemeConfig(
        name="Modern Vibrant",
        colors=ThemeColors(
            background=(250, 251, 255, 255),      # Cool white
            title_color=(10, 10, 30),              # Deep ink
            subtitle_color=(75, 80, 100),          # Slate
            accent_color=(99, 102, 241),           # Vibrant indigo
            secondary_accent=(236, 72, 153),       # Pink accent
        ),
        title_font_size=102,
        subtitle_font_size=48,
        line_width=6,
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
        title_font_size=98,
        subtitle_font_size=46,
        line_width=5,
        padding=60,
    ),
    
    # -------------------------------------------------------------------------
    # DARK & PREMIUM THEMES
    # -------------------------------------------------------------------------
    "dark": ThemeConfig(
        name="Dark Premium",
        colors=ThemeColors(
            background=(8, 8, 12, 255),           # Deep black
            title_color=(255, 255, 255),          # Pure white
            subtitle_color=(180, 185, 195),        # Silver
            accent_color=(99, 102, 241),           # Indigo glow
            secondary_accent=(139, 92, 246),       # Violet
        ),
        title_font_size=104,
        subtitle_font_size=48,
        line_width=6,
        padding=55,
    ),
    
    "midnight": ThemeConfig(
        name="Midnight Luxe",
        colors=ThemeColors(
            background=(17, 24, 39, 255),         # Gray 900
            title_color=(255, 255, 255),          # White
            subtitle_color=(156, 163, 175),        # Gray 400
            accent_color=(251, 191, 36),           # Amber 400
            secondary_accent=(245, 158, 11),       # Amber 500
        ),
        title_font_size=100,
        subtitle_font_size=46,
        line_width=6,
        padding=60,
    ),
    
    # -------------------------------------------------------------------------
    # MINIMAL & CLEAN THEMES
    # -------------------------------------------------------------------------
    "minimal": ThemeConfig(
        name="Minimal Pure",
        colors=ThemeColors(
            background=(255, 255, 255, 255),      # Pure white
            title_color=(0, 0, 0),                 # Pure black
            subtitle_color=(75, 75, 75),           # Dark gray
            accent_color=(0, 0, 0),                # Black accent
        ),
        title_font_size=112,                      # Extra large for minimal
        subtitle_font_size=44,
        line_width=3,
        padding=75,
    ),
    
    "soft": ThemeConfig(
        name="Soft Minimal",
        colors=ThemeColors(
            background=(249, 250, 251, 255),      # Gray 50
            title_color=(31, 41, 55),              # Gray 800
            subtitle_color=(107, 114, 128),        # Gray 500
            accent_color=(156, 163, 175),          # Gray 400
        ),
        title_font_size=106,
        subtitle_font_size=46,
        line_width=4,
        padding=70,
    ),
    
    # -------------------------------------------------------------------------
    # GRADIENT THEMES - Premium visual effects
    # -------------------------------------------------------------------------
    "gradient_sunset": ThemeConfig(
        name="Sunset Glow",
        colors=ThemeColors(
            background=(255, 107, 107, 255),      # Coral start
            title_color=(255, 255, 255),          # White
            subtitle_color=(255, 248, 245),        # Warm white
            accent_color=(255, 255, 255),          # White
            secondary_accent=(255, 200, 87),       # Golden
            gradient_end=(255, 179, 71, 255),      # Orange end
        ),
        title_font_size=104,
        subtitle_font_size=50,
        line_width=7,
        padding=55,
        has_gradient=True,
        gradient_angle=135.0,
    ),
    
    "gradient_ocean": ThemeConfig(
        name="Ocean Depths",
        colors=ThemeColors(
            background=(15, 82, 186, 255),        # Deep blue start
            title_color=(255, 255, 255),          # White
            subtitle_color=(224, 242, 254),        # Ice blue
            accent_color=(56, 189, 248),           # Cyan
            secondary_accent=(34, 211, 238),       # Teal
            gradient_end=(6, 182, 212, 255),       # Cyan end
        ),
        title_font_size=102,
        subtitle_font_size=48,
        line_width=6,
        padding=55,
        has_gradient=True,
        gradient_angle=135.0,
    ),
    
    "gradient_purple": ThemeConfig(
        name="Royal Purple",
        colors=ThemeColors(
            background=(147, 51, 234, 255),       # Purple start
            title_color=(255, 255, 255),          # White
            subtitle_color=(245, 243, 255),        # Lavender white
            accent_color=(255, 255, 255),          # White
            secondary_accent=(236, 72, 153),       # Pink
            gradient_end=(236, 72, 153, 255),      # Pink end
        ),
        title_font_size=102,
        subtitle_font_size=48,
        line_width=6,
        padding=55,
        has_gradient=True,
        gradient_angle=120.0,
    ),
    
    "gradient_forest": ThemeConfig(
        name="Forest Dawn",
        colors=ThemeColors(
            background=(6, 78, 59, 255),          # Emerald 900 start
            title_color=(255, 255, 255),          # White
            subtitle_color=(220, 252, 231),        # Green 100
            accent_color=(52, 211, 153),           # Emerald 400
            secondary_accent=(167, 243, 208),      # Emerald 300
            gradient_end=(16, 185, 129, 255),      # Emerald 500 end
        ),
        title_font_size=100,
        subtitle_font_size=46,
        line_width=6,
        padding=58,
        has_gradient=True,
        gradient_angle=135.0,
    ),
    
    "gradient_noir": ThemeConfig(
        name="Noir Gradient",
        colors=ThemeColors(
            background=(30, 30, 35, 255),         # Dark start
            title_color=(255, 255, 255),          # White
            subtitle_color=(200, 200, 205),        # Light gray
            accent_color=(168, 162, 158),          # Stone 400
            secondary_accent=(120, 113, 108),      # Stone 500
            gradient_end=(64, 64, 70, 255),        # Lighter dark end
        ),
        title_font_size=106,
        subtitle_font_size=48,
        line_width=5,
        padding=60,
        has_gradient=True,
        gradient_angle=160.0,
    ),
    
    # -------------------------------------------------------------------------
    # COLORFUL & CREATIVE THEMES
    # -------------------------------------------------------------------------
    "creative": ThemeConfig(
        name="Creative Bold",
        colors=ThemeColors(
            background=(255, 237, 213, 255),      # Orange 100
            title_color=(124, 45, 18),             # Orange 900
            subtitle_color=(154, 52, 18),          # Orange 800
            accent_color=(249, 115, 22),           # Orange 500
            secondary_accent=(251, 146, 60),       # Orange 400
        ),
        title_font_size=98,
        subtitle_font_size=46,
        line_width=6,
        padding=58,
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
        title_font_size=100,
        subtitle_font_size=46,
        line_width=5,
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
        title_font_size=100,
        subtitle_font_size=46,
        line_width=5,
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
        title_font_size=100,
        subtitle_font_size=46,
        line_width=5,
        padding=60,
    ),
}


class OGImageGenerator:
    """Generator for Open Graph images with premium themes"""
    
    def __init__(self, width: int = 1200, height: int = 630):
        self.width = width
        self.height = height
    
    def _create_gradient_background(
        self, 
        start_color: Tuple[int, int, int, int], 
        end_color: Tuple[int, int, int, int],
        angle: float = 45.0
    ) -> Image.Image:
        """Create a smooth gradient background at specified angle"""
        img = Image.new('RGBA', (self.width, self.height))
        
        # Convert angle to radians
        angle_rad = math.radians(angle)
        
        # Calculate gradient direction
        cos_a = math.cos(angle_rad)
        sin_a = math.sin(angle_rad)
        
        # Calculate the length of the gradient line
        gradient_length = abs(self.width * cos_a) + abs(self.height * sin_a)
        
        for y in range(self.height):
            for x in range(self.width):
                # Project point onto gradient line
                # Normalize to 0-1 range
                projection = (x * cos_a + y * sin_a) / gradient_length
                projection = max(0, min(1, projection))
                
                # Interpolate colors with smooth easing
                t = projection
                # Apply smooth easing for more aesthetic gradient
                t = t * t * (3 - 2 * t)  # Smoothstep function
                
                r = int(start_color[0] + (end_color[0] - start_color[0]) * t)
                g = int(start_color[1] + (end_color[1] - start_color[1]) * t)
                b = int(start_color[2] + (end_color[2] - start_color[2]) * t)
                a = int(start_color[3] + (end_color[3] - start_color[3]) * t)
                
                img.putpixel((x, y), (r, g, b, a))
        
        return img
    
    def add_geometric_decorations(
        self, 
        img: Image.Image, 
        theme: ThemeConfig, 
        decoration_type: str = "circles"
    ) -> Image.Image:
        """Add elegant geometric decorations to the image"""
        draw = ImageDraw.Draw(img)
        accent = theme.colors.accent_color
        secondary = theme.colors.secondary_accent or accent
        
        if decoration_type == "circles":
            # Elegant floating circles - larger and more refined
            circles = [
                (self.width - 140, 80, 100),
                (self.width - 70, 180, 55),
                (100, self.height - 120, 70),
                (50, 100, 45),
            ]
            for x, y, r in circles:
                # Draw with slight transparency for elegance
                draw.ellipse(
                    [(x - r, y - r), (x + r, y + r)], 
                    outline=(*accent, 180), 
                    width=4
                )
            # Add a filled accent circle
            draw.ellipse(
                [(self.width - 200, self.height - 100), (self.width - 140, self.height - 40)],
                fill=(*secondary, 120)
            )
            
        elif decoration_type == "dots":
            # Refined dot pattern - subtle and elegant
            dot_size = 6
            spacing = 50
            for y in range(spacing, self.height, spacing):
                for x in range(spacing, self.width, spacing):
                    # Fade dots based on position
                    opacity = int(60 * (1 - x / self.width))
                    if opacity > 10:
                        draw.ellipse(
                            [(x - dot_size//2, y - dot_size//2), 
                             (x + dot_size//2, y + dot_size//2)],
                            fill=(*accent, opacity)
                        )
            
        elif decoration_type == "lines":
            # Modern line decorations - bold and architectural
            line_width = 4
            # Top right corner lines
            for i in range(4):
                offset = i * 25
                draw.line(
                    [(self.width - 250 + offset, 0), (self.width, 250 - offset)],
                    fill=(*accent, 150 - i * 30),
                    width=line_width
                )
            # Bottom left corner lines
            for i in range(3):
                offset = i * 25
                draw.line(
                    [(0, self.height - 200 + offset), (200 - offset, self.height)],
                    fill=(*secondary, 120 - i * 30),
                    width=line_width
                )
                
        elif decoration_type == "corner_accent":
            # Bold corner accent - premium feel
            corner_size = 180
            # Top left corner
            draw.polygon(
                [(0, 0), (corner_size, 0), (0, corner_size)],
                fill=(*accent, 60)
            )
            # Bottom right corner
            draw.polygon(
                [(self.width, self.height), 
                 (self.width - corner_size, self.height), 
                 (self.width, self.height - corner_size)],
                fill=(*secondary, 60)
            )
            # Add accent lines
            draw.line(
                [(corner_size + 20, 0), (0, corner_size + 20)],
                fill=(*accent, 180),
                width=5
            )
            
        elif decoration_type == "glow":
            # Subtle glow effect in corners
            for i in range(5):
                offset = i * 40
                opacity = 40 - i * 8
                draw.ellipse(
                    [(-100 - offset, -100 - offset), (200 + offset, 200 + offset)],
                    fill=(*accent, opacity)
                )
                draw.ellipse(
                    [(self.width - 200 - offset, self.height - 200 - offset),
                     (self.width + 100 + offset, self.height + 100 + offset)],
                    fill=(*secondary, opacity)
                )
        
        return img
    
    def generate(
        self,
        title: str,
        subtitle: str = "",
        theme_name: str = "modern",
        title_font: str = "Resources/assets/fonts/LM-bold.ttf",
        text_font: str = "Resources/assets/fonts/LM-regular.ttf",
        decorations: Optional[str] = None,
        overlay_image: Optional[Image.Image] = None,
    ) -> Image.Image:
        """Generate an OG image with the specified theme and content"""
        
        theme = THEMES.get(theme_name, THEMES["modern"])
        
        # Create background (gradient or solid)
        if theme.has_gradient and theme.colors.gradient_end:
            img = self._create_gradient_background(
                theme.colors.background,
                theme.colors.gradient_end,
                theme.gradient_angle
            )
        else:
            img = Image.new('RGBA', (self.width, self.height), theme.colors.background)
        
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
        
        # Load fonts with fallback - using LARGE sizes
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
        
        # Calculate text positions - LARGE text with generous spacing
        title_lines = self._wrap_text(title, title_font_obj, text_box_width)
        
        # Calculate total height - generous line spacing for readability
        line_height = int(theme.title_font_size * 1.15)
        total_title_height = len(title_lines) * line_height
        
        # Calculate subtitle height
        subtitle_height = 0
        if subtitle:
            subtitle_height = theme.subtitle_font_size * 2 + 35
        
        # Total content height
        content_height = total_title_height + 40 + subtitle_height
        
        # Starting Y position - perfect vertical centering
        start_y = max(theme.padding, (self.height - content_height) // 2)
        
        # Draw title lines - LARGE and prominent
        current_y = start_y
        for line in title_lines:
            bbox = title_font_obj.getbbox(line)
            text_width = bbox[2] - bbox[0]
            
            # Center text within the text box
            x_pos = text_x + (text_box_width - text_width) // 2
            draw.text((x_pos, current_y), line, font=title_font_obj, fill=theme.colors.title_color)
            current_y += line_height
        
        # Draw accent line - elegant separator
        line_y = current_y + 18
        line_length = min(text_box_width * 0.45, 400)  # Proportional line
        line_start_x = text_x + (text_box_width - line_length) // 2
        line_end_x = line_start_x + line_length
        
        # Draw accent line with rounded ends effect
        draw.line(
            [(line_start_x, line_y), (line_end_x, line_y)], 
            fill=theme.colors.accent_color, 
            width=theme.line_width
        )
        
        # Draw subtitle if provided - centered and clear
        if subtitle:
            subtitle_y = line_y + 28
            subtitle_lines = self._wrap_text(subtitle, subtitle_font_obj, text_box_width)
            
            for line in subtitle_lines:
                bbox = subtitle_font_obj.getbbox(line)
                text_width = bbox[2] - bbox[0]
                x_pos = text_x + (text_box_width - text_width) // 2
                draw.text((x_pos, subtitle_y), line, font=subtitle_font_obj, fill=theme.colors.subtitle_color)
                subtitle_y += int(theme.subtitle_font_size * 1.25)
        
        return img
    
    def _wrap_text(self, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
        """Wrap text to fit within max_width - optimized for large text"""
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
        
        # Limit to 3 lines maximum for readability with large text
        if len(lines) > 3:
            lines = lines[:3]
            # Add ellipsis to last line if truncated
            if len(lines[2]) > 3:
                lines[2] = lines[2][:-3] + '...'
        
        return lines
    
    def save(self, img: Image.Image, path: str) -> None:
        """Save the image to the specified path"""
        # Convert to RGB for PNG/JPEG if needed
        if img.mode == 'RGBA':
            # Create a white background and paste the image onto it
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            background.save(path)
        else:
            img.save(path)


def get_available_themes() -> List[str]:
    """Return list of available theme names"""
    return list(THEMES.keys())


def get_theme_info(theme_name: str) -> Optional[ThemeConfig]:
    """Get configuration for a specific theme"""
    return THEMES.get(theme_name)
