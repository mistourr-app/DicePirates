// Run once to generate PWA icons: node generate-icons.js
const { createCanvas } = require('canvas');
const fs = require('fs');

const sizes = [192, 512];
const svg = fs.readFileSync('./assets/icons/icon.svg', 'utf8');

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#0a0e1a';
  const r = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Anchor emoji
  ctx.font = `${size * 0.6}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚓', size / 2, size / 2);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(`./assets/icons/icon-${size}.png`, buf);
  console.log(`Generated icon-${size}.png`);
});
