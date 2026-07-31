const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function generateIconAssets() {
  const scriptPath = path.join(__dirname, 'generate_white_icon.cjs');
  console.log('Generating crisp white-badged icon.png and icon.ico assets...');
  
  try {
    const electronBin = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron.cmd');
    if (fs.existsSync(electronBin)) {
      execSync(`"${electronBin}" "${scriptPath}"`, { stdio: 'inherit' });
    } else {
      execSync(`npx electron "${scriptPath}"`, { stdio: 'inherit' });
    }
  } catch (err) {
    console.error('Error generating white icon assets:', err.message);
  }
}

generateIconAssets();
