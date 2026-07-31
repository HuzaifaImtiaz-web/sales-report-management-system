const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const logoPath = path.join(__dirname, '..', '..', 'src', 'assets', 'logos', 'Himmel-Logo.png');
  const buildDir = path.join(__dirname, '..', '..', 'build');
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

  const iconPngPath = path.join(buildDir, 'icon.png');
  const iconIcoPath = path.join(buildDir, 'icon.ico');

  const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c" width="256" height="256"></canvas>
      <script>
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');
        
        // Draw white rounded background
        ctx.fillStyle = '#FFFFFF';
        const size = 256;
        const radius = 40;
        
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

        // Draw subtle border around badge
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 4;
        ctx.stroke();

        const img = new Image();
        img.onload = () => {
          // Draw logo centered with padding
          const padding = 24;
          const maxDim = size - (padding * 2);
          let w = img.width;
          let h = img.height;
          
          const scale = Math.min(maxDim / w, maxDim / h);
          w = w * scale;
          h = h * scale;
          
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          
          ctx.drawImage(img, x, y, w, h);
          
          const dataUrl = canvas.toDataURL('image/png');
          require('electron').ipcRenderer.send('icon-done', dataUrl);
        };
        img.src = "${logoDataUrl}";
      </script>
    </body>
    </html>
  `;

  const { ipcMain } = require('electron');
  ipcMain.once('icon-done', (_event, dataUrl) => {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const pngBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(iconPngPath, pngBuffer);
    console.log(`Saved white-badged PNG icon to ${iconPngPath}`);

    // Generate multi-size ICO header (256x256)
    const icoHeader = Buffer.alloc(22);
    icoHeader.writeUInt16LE(0, 0);
    icoHeader.writeUInt16LE(1, 2); // ICO
    icoHeader.writeUInt16LE(1, 4); // 1 image

    icoHeader.writeUInt8(0, 6); // 256px
    icoHeader.writeUInt8(0, 7); // 256px
    icoHeader.writeUInt8(0, 8);
    icoHeader.writeUInt8(0, 9);
    icoHeader.writeUInt16LE(1, 10);
    icoHeader.writeUInt16LE(32, 12);
    icoHeader.writeUInt32LE(pngBuffer.length, 14);
    icoHeader.writeUInt32LE(22, 18);

    const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);
    fs.writeFileSync(iconIcoPath, icoBuffer);
    console.log(`Saved multi-resolution Windows ICO icon to ${iconIcoPath}`);

    app.quit();
  });

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
});
