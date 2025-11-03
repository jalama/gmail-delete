#!/usr/bin/env python3
"""
Generate PNG icons for Gmail Bulk Deleter Chrome Extension
Requires: pip install pillow
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Error: This script requires Pillow library")
    print("Install it with: pip install pillow")
    exit(1)

def create_icon(size):
    """Create a trash can icon on red background"""
    # Create image with red background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background
    radius = int(size * 0.15)
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=radius,
        fill='#d93025'
    )

    # Scale factor for drawing trash can
    scale = size / 16

    # Draw trash can top bar
    top_bar_y = int(3 * scale)
    top_bar_height = max(1, int(scale))
    draw.rectangle(
        [(int(5 * scale), top_bar_y),
         (int(11 * scale), top_bar_y + top_bar_height)],
        fill='white'
    )

    # Draw trash can body outline
    line_width = max(1, int(scale * 0.8))
    body_coords = [
        (int(4 * scale), int(4 * scale)),
        (int(12 * scale), int(13 * scale))
    ]
    draw.rectangle(body_coords, outline='white', width=line_width)

    # Draw vertical lines inside trash can
    for x in [6, 8, 10]:
        draw.line(
            [(int(x * scale), int(6 * scale)),
             (int(x * scale), int(11 * scale))],
            fill='white',
            width=line_width
        )

    return img

def main():
    """Generate all three icon sizes"""
    sizes = [16, 48, 128]

    print("Generating icons...")
    for size in sizes:
        filename = f"icon{size}.png"
        icon = create_icon(size)
        icon.save(filename)
        print(f"✓ Created {filename}")

    print("\nAll icons generated successfully!")
    print("You can now load the extension in Chrome.")

if __name__ == '__main__':
    main()
