#!/usr/bin/env python3
"""
Generate snake tile images for Snake in a Box game
Creates 5 tiles: head, tail, straight body, bend right, bend left
All 64x64 pixels, cartoon pixel-art style, transparent background
"""

from PIL import Image, ImageDraw
import os

# Configuration
TILE_SIZE = 64
SNAKE_COLOR = (34, 139, 34)  # Forest green
SNAKE_DARK = (25, 100, 25)   # Darker green for shading
SNAKE_LIGHT = (50, 205, 50)  # Lighter green for highlights
EYE_COLOR = (255, 255, 255)  # White
PUPIL_COLOR = (0, 0, 0)      # Black
TONGUE_COLOR = (220, 20, 60) # Crimson red
SNAKE_WIDTH = 32  # Width of snake body

OUTPUT_DIR = "assets/images/snake"

def create_snake_head():
    """Create snake head tile with eyes and tongue"""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Main head shape (rounded rectangle pointing right)
    # Body of head
    draw.ellipse([8, 16, 40, 48], fill=SNAKE_COLOR, outline=SNAKE_DARK, width=2)
    draw.rectangle([24, 16, 56, 48], fill=SNAKE_COLOR, outline=None)
    
    # Rounded front of head
    draw.ellipse([40, 16, 60, 48], fill=SNAKE_COLOR, outline=SNAKE_DARK, width=2)
    
    # Add highlight on top
    draw.ellipse([44, 20, 54, 28], fill=SNAKE_LIGHT, outline=None)
    
    # Eyes (two white circles with black pupils)
    # Left eye
    draw.ellipse([42, 24, 50, 32], fill=EYE_COLOR, outline=SNAKE_DARK, width=1)
    draw.ellipse([45, 27, 48, 30], fill=PUPIL_COLOR, outline=None)
    
    # Right eye
    draw.ellipse([42, 36, 50, 44], fill=EYE_COLOR, outline=SNAKE_DARK, width=1)
    draw.ellipse([45, 39, 48, 42], fill=PUPIL_COLOR, outline=None)
    
    # Forked tongue sticking out
    draw.line([56, 28, 62, 26], fill=TONGUE_COLOR, width=2)
    draw.line([56, 36, 62, 38], fill=TONGUE_COLOR, width=2)
    
    return img

def create_snake_tail():
    """Create snake tail tile (tapered end)"""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Tail tapers from left to right
    # Draw as a polygon that tapers to a point
    points = [
        (8, 16),   # Top left
        (8, 48),   # Bottom left
        (48, 36),  # Bottom middle
        (56, 32),  # Tip
        (48, 28),  # Top middle
    ]
    draw.polygon(points, fill=SNAKE_COLOR, outline=SNAKE_DARK)
    
    # Add some scales/texture
    for i in range(3):
        x = 16 + i * 12
        y = 28 + (i % 2) * 4
        draw.ellipse([x, y, x+8, y+8], fill=SNAKE_LIGHT, outline=None)
    
    return img

def create_straight_body():
    """Create straight body segment (horizontal)"""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Horizontal tube
    draw.rectangle([0, 16, 64, 48], fill=SNAKE_COLOR, outline=None)
    
    # Top and bottom borders
    draw.line([0, 16, 64, 16], fill=SNAKE_DARK, width=2)
    draw.line([0, 48, 64, 48], fill=SNAKE_DARK, width=2)
    
    # Add highlight stripe along top
    draw.rectangle([0, 18, 64, 24], fill=SNAKE_LIGHT, outline=None)
    
    # Add some scale texture
    for i in range(5):
        x = 8 + i * 12
        draw.ellipse([x, 28, x+6, 34], fill=SNAKE_DARK, outline=None)
    
    return img

def create_bend_right():
    """Create 90-degree bend turning right (from left to down)"""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw the bend as two rectangles meeting at corner
    # Horizontal part (coming from left)
    draw.rectangle([0, 16, 32, 48], fill=SNAKE_COLOR, outline=None)
    
    # Vertical part (going down)
    draw.rectangle([16, 32, 48, 64], fill=SNAKE_COLOR, outline=None)
    
    # Draw borders
    draw.line([0, 16, 32, 16], fill=SNAKE_DARK, width=2)  # Top of horizontal
    draw.line([48, 32, 48, 64], fill=SNAKE_DARK, width=2)  # Right of vertical
    draw.line([16, 64, 48, 64], fill=SNAKE_DARK, width=2)  # Bottom of vertical
    draw.line([0, 48, 16, 48], fill=SNAKE_DARK, width=2)  # Bottom of horizontal part
    draw.line([16, 32, 16, 48], fill=SNAKE_DARK, width=2)  # Left of vertical part
    
    # Add rounded corner
    draw.pieslice([16, 16, 48, 48], 0, 90, fill=SNAKE_COLOR, outline=SNAKE_DARK, width=2)
    
    # Add highlight
    draw.arc([18, 18, 46, 46], 0, 90, fill=SNAKE_LIGHT, width=4)
    
    return img

def create_bend_left():
    """Create 90-degree bend turning left (from left to up)"""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw the bend as two rectangles meeting at corner
    # Horizontal part (coming from left)
    draw.rectangle([0, 16, 32, 48], fill=SNAKE_COLOR, outline=None)
    
    # Vertical part (going up)
    draw.rectangle([16, 0, 48, 32], fill=SNAKE_COLOR, outline=None)
    
    # Draw borders
    draw.line([0, 48, 32, 48], fill=SNAKE_DARK, width=2)  # Bottom of horizontal
    draw.line([48, 0, 48, 32], fill=SNAKE_DARK, width=2)  # Right of vertical
    draw.line([16, 0, 48, 0], fill=SNAKE_DARK, width=2)  # Top of vertical
    draw.line([0, 16, 16, 16], fill=SNAKE_DARK, width=2)  # Top of horizontal part
    draw.line([16, 16, 16, 32], fill=SNAKE_DARK, width=2)  # Left of vertical part
    
    # Add rounded corner
    draw.pieslice([16, 16, 48, 48], 270, 360, fill=SNAKE_COLOR, outline=SNAKE_DARK, width=2)
    
    # Add highlight
    draw.arc([18, 18, 46, 46], 270, 360, fill=SNAKE_LIGHT, width=4)
    
    return img

def create_covered_tile():
    """Create a covered/hidden tile"""
    img = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Gray tile with border
    draw.rectangle([2, 2, 62, 62], fill=(100, 100, 100), outline=(50, 50, 50), width=2)
    
    # Add some texture/pattern
    draw.rectangle([8, 8, 56, 56], fill=(120, 120, 120), outline=None)
    draw.rectangle([12, 12, 52, 52], fill=(100, 100, 100), outline=None)
    
    # Add question mark
    draw.text((24, 20), "?", fill=(200, 200, 200))
    
    return img

def main():
    """Generate all snake tiles"""
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Generate tiles
    tiles = {
        'head.png': create_snake_head(),
        'tail.png': create_snake_tail(),
        'straight.png': create_straight_body(),
        'bend_right.png': create_bend_right(),
        'bend_left.png': create_bend_left(),
        'covered.png': create_covered_tile(),
    }
    
    # Save tiles
    for filename, img in tiles.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        img.save(filepath, 'PNG')
        print(f"Created: {filepath}")
    
    print(f"\nAll tiles created successfully in {OUTPUT_DIR}/")

if __name__ == '__main__':
    main()