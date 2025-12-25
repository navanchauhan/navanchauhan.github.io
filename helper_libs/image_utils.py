#!/usr/bin/env python
# coding: utf-8

# Copyright 2011 Álvaro Justen [alvarojusten at gmail dot com]
# License: GPL <http://www.gnu.org/copyleft/gpl.html>
# Extended with theme support for OG images

from PIL import Image, ImageDraw, ImageFont
from typing import Optional, List

# Import the new theming system
from .og_themes import OGImageGenerator, THEMES, get_available_themes, get_theme_info


class ImageText(object):
    def __init__(self, filename_or_size, mode='RGBA', background=(0, 0, 0, 0),
                 encoding='utf8'):
        if isinstance(filename_or_size, str):
            self.filename = filename_or_size
            self.image = Image.open(self.filename)
            self.size = self.image.size
        elif isinstance(filename_or_size, (list, tuple)):
            self.size = filename_or_size
            self.image = Image.new(mode, self.size, color=background)
            self.filename = None
        self.draw = ImageDraw.Draw(self.image)
        self.encoding = encoding

    def line(self, shape, fill, width=10):
        self.draw.line(shape,fill=fill, width=width)

    def save(self, filename=None):
        self.image.save(filename or self.filename)

    def paste(self, image, coords):
        self.image.paste(image, coords)

    def get_font_size(self, text, font, max_width=None, max_height=None):
        if max_width is None and max_height is None:
            raise ValueError('You need to pass max_width or max_height')
        font_size = 1
        text_size = self.get_text_size(font, font_size, text)
        if (max_width is not None and text_size[0] > max_width) or \
           (max_height is not None and text_size[1] > max_height):
            raise ValueError("Text can't be filled in only (%dpx, %dpx)" % \
                    text_size)
        while True:
            if (max_width is not None and text_size[0] >= max_width) or \
               (max_height is not None and text_size[1] >= max_height):
                return font_size - 1
            font_size += 1
            text_size = self.get_text_size(font, font_size, text)

    def write_text(self, coords, text, font_filename, font_size=11,
                   color=(0, 0, 0), max_width=None, max_height=None):
        if isinstance(text, str):
            x,y = coords
            text = text#.decode(self.encoding)
        if font_size == 'fill' and \
           (max_width is not None or max_height is not None):
            font_size = self.get_font_size(text, font_filename, max_width,
                                           max_height)
        text_size = self.get_text_size(font_filename, font_size, text)
        font = ImageFont.truetype(font_filename, font_size)
        if x == 'center':
            x = (self.size[0] - text_size[0]) / 2
        if y == 'center':
            y = (self.size[1] - text_size[1]) / 2
        self.draw.text((x, y), text, font=font, fill=color)
        return text_size

    def get_text_size(self, font_filename, font_size, text):
        font = ImageFont.truetype(font_filename, font_size)
        return font.getbbox(text)[2:4]

    def write_text_box(self, coords, text, box_width, font_filename,
                       font_size=11, color=(0, 0, 0), place='left',
                       justify_last_line=False):
        x,y = coords
        lines = []
        line = []
        words = text.split()
        for word in words:
            new_line = ' '.join(line + [word])
            size = self.get_text_size(font_filename, font_size, new_line)
            text_height = size[1]
            if size[0] <= box_width:
                line.append(word)
            else:
                lines.append(line)
                line = [word]
        if line:
            lines.append(line)
        lines = [' '.join(line) for line in lines if line]
        height = y
        for index, line in enumerate(lines):
            height += text_height
            if place == 'left':
                self.write_text((x, height), line, font_filename, font_size,
                                color)
            elif place == 'right':
                total_size = self.get_text_size(font_filename, font_size, line)
                x_left = x + box_width - total_size[0]
                self.write_text((x_left, height), line, font_filename,
                                font_size, color)
            elif place == 'center':
                total_size = self.get_text_size(font_filename, font_size, line)
                x_left = int(x + ((box_width - total_size[0]) / 2))
                self.write_text((x_left, height), line, font_filename,
                                font_size, color)
            elif place == 'justify':
                words = line.split()
                if (index == len(lines) - 1 and not justify_last_line) or \
                   len(words) == 1:
                    self.write_text((x, height), line, font_filename, font_size,
                                    color)
                    continue
                line_without_spaces = ''.join(words)
                total_size = self.get_text_size(font_filename, font_size,
                                                line_without_spaces)
                space_width = (box_width - total_size[0]) / (len(words) - 1.0)
                start_x = x
                for word in words[:-1]:
                    self.write_text((start_x, height), word, font_filename,
                                    font_size, color)
                    word_size = self.get_text_size(font_filename, font_size,
                                                    word)
                    start_x += word_size[0] + space_width
                last_word_size = self.get_text_size(font_filename, font_size,
                                                    words[-1])
                last_word_x = x + box_width - last_word_size[0]
                self.write_text((last_word_x, height), words[-1], font_filename,
                                font_size, color)
        return (box_width, height - y)


class ThemedOGImage:
    """
    High-level wrapper for generating themed OG images.
    
    Available themes:
        - classic: Original style with warm browns and cream background
        - modern: Clean white background with indigo accent
        - dark: Dark slate background for night mode aesthetics
        - minimal: Simple, minimalistic design with thin accents
        - gradient_sunset: Vibrant coral to yellow gradient
        - gradient_ocean: Deep blue to teal gradient
        - gradient_purple: Purple to orange-red gradient
        - retro: Vintage cream and brown palette
        - tech: GitHub-dark inspired dark theme
        - nature: Fresh green and earthy tones
    
    Available decorations:
        - circles: Decorative circles in corners
        - dots: Subtle dot pattern
        - lines: Diagonal line pattern
        - corner_accent: Triangle accents in corners
    
    Usage:
        og = ThemedOGImage()
        og.generate(
            title="My Blog Post Title",
            subtitle="A brief description of the post",
            theme="modern",
            decorations="circles"
        )
        og.save("output.png")
    """
    
    def __init__(self, width: int = 1200, height: int = 630):
        self.generator = OGImageGenerator(width, height)
        self.image: Optional[Image.Image] = None
        self.width = width
        self.height = height
    
    def generate(
        self,
        title: str,
        subtitle: str = "",
        theme: str = "classic",
        title_font: str = "fonts/futura_bold.ttf",
        text_font: str = "fonts/futura_light.ttf",
        overlay_image_path: Optional[str] = None,
        decorations: Optional[str] = None,
    ) -> 'ThemedOGImage':
        """
        Generate an OG image with the specified theme.
        
        Args:
            title: Main title text
            subtitle: Secondary text (description, tags, date, etc.)
            theme: Theme name (see class docstring for available themes)
            title_font: Path to title font file
            text_font: Path to subtitle font file
            overlay_image_path: Optional path to an image to overlay (e.g., DallE image)
            decorations: Optional decoration style (circles, lines, dots, corner_accent)
        
        Returns:
            self for method chaining
        """
        overlay_image = None
        if overlay_image_path:
            try:
                overlay_image = Image.open(overlay_image_path)
            except Exception:
                pass
        
        self.image = self.generator.generate(
            title=title,
            subtitle=subtitle,
            theme_name=theme,
            title_font=title_font,
            text_font=text_font,
            overlay_image=overlay_image,
            decorations=decorations,
        )
        return self
    
    def save(self, path: str) -> None:
        """Save the generated image to the specified path."""
        if self.image:
            self.generator.save(self.image, path)
    
    def get_image(self) -> Optional[Image.Image]:
        """Get the PIL Image object."""
        return self.image
    
    @staticmethod
    def list_themes() -> List[str]:
        """List all available theme names."""
        return get_available_themes()
    
    @staticmethod
    def get_theme_details(theme_name: str):
        """Get details about a specific theme."""
        return get_theme_info(theme_name)


# Export for convenience
__all__ = [
    'ImageText',
    'ThemedOGImage',
    'OGImageGenerator',
    'THEMES',
    'get_available_themes',
    'get_theme_info',
]
