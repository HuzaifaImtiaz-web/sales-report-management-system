const fs = require('fs');
const path = require('path');

function generateIconAssets() {
  const buildDir = path.join(__dirname, '..', '..', 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const logoPath = path.join(__dirname, '..', '..', 'src', 'assets', 'logos', 'Himmel-sale-logo.png');
  const iconPngPath = path.join(buildDir, 'icon.png');
  const iconIcoPath = path.join(buildDir, 'icon.ico');

  if (fs.existsSync(logoPath)) {
    // Copy png to build/icon.png
    fs.copyFileSync(logoPath, iconPngPath);
    console.log(`Copied ${logoPath} to ${iconPngPath}`);

    const pngBuffer = fs.readFileSync(logoPath);
    
    // Construct ICO header with embedded PNG payload
    const icoHeader = Buffer.alloc(22);
    // Reserved (2 bytes) = 0
    icoHeader.writeUInt16LE(0, 0);
    // Type (2 bytes) = 1 (ICO)
    icoHeader.writeUInt16LE(1, 2);
    // Number of images (2 bytes) = 1
    icoHeader.writeUInt16LE(1, 4);

    // Image Entry
    // Width (1 byte): 0 represents 256px
    icoHeader.writeUInt8(0, 6);
    // Height (1 byte): 0 represents 256px
    icoHeader.writeUInt8(0, 7);
    // Color palette (1 byte) = 0
    icoHeader.writeUInt8(0, 8);
    // Reserved (1 byte) = 0
    icoHeader.writeUInt8(0, 9);
    // Color planes (2 bytes) = 1
    icoHeader.writeUInt16LE(1, 10);
    // Bits per pixel (2 bytes) = 32
    icoHeader.writeUInt16LE(32, 12);
    // Data size (4 bytes)
    icoHeader.writeUInt32LE(pngBuffer.length, 14);
    // Data offset (4 bytes) = 22
    icoHeader.writeUInt32LE(22, 18);

    const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);
    fs.writeFileSync(iconIcoPath, icoBuffer);
    console.log(`Successfully generated Windows ICO file at ${iconIcoPath} (Size: ${icoBuffer.length} bytes)`);
  } else {
    console.error(`Logo file not found at ${logoPath}`);
  }
}

generateIconAssets();
