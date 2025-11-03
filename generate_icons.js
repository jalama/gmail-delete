#!/usr/bin/env node
/**
 * Generate PNG icons for Gmail Bulk Deleter Chrome Extension
 * Run with: node generate_icons.js
 *
 * This uses the canvas package. Install with: npm install canvas
 */

const fs = require('fs');

// Check if canvas is available
let Canvas;
try {
  Canvas = require('canvas');
} catch (err) {
  console.error('Error: This script requires the "canvas" package');
  console.error('Install it with: npm install canvas');
  process.exit(1);
}

function createIcon(size) {
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background with rounded corners
  ctx.fillStyle = '#d93025';
  const radius = size * 0.15;

  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Draw trash can icon
  const scale = size / 16;
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(1, scale * 0.8);

  // Top bar of trash can
  ctx.fillRect(5 * scale, 3 * scale, 6 * scale, scale);

  // Can body outline
  ctx.strokeRect(4 * scale, 4 * scale, 8 * scale, 9 * scale);

  // Vertical lines inside trash can
  ctx.beginPath();
  ctx.moveTo(6 * scale, 6 * scale);
  ctx.lineTo(6 * scale, 11 * scale);
  ctx.moveTo(8 * scale, 6 * scale);
  ctx.lineTo(8 * scale, 11 * scale);
  ctx.moveTo(10 * scale, 6 * scale);
  ctx.lineTo(10 * scale, 11 * scale);
  ctx.stroke();

  return canvas;
}

async function main() {
  const sizes = [16, 48, 128];

  console.log('Generating icons...');

  for (const size of sizes) {
    const canvas = createIcon(size);
    const buffer = canvas.toBuffer('image/png');
    const filename = `icon${size}.png`;

    fs.writeFileSync(filename, buffer);
    console.log(`✓ Created ${filename}`);
  }

  console.log('\nAll icons generated successfully!');
  console.log('You can now load the extension in Chrome.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
