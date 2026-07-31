const path = require('path');
const fs = require('fs');

let packageVersion = '1.0.2';
try {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.version) {
      packageVersion = pkg.version;
    }
  }
} catch (e) {
  console.error('Failed to read package.json version in config.cjs:', e);
}

const config = {
  // Centralized toggle: 'development' or 'production'
  mode: 'production',
  
  version: packageVersion,
  dbVersion: packageVersion,
  
  // Safe default settings
  defaultCompany: 'Himmel Pharmaceutical',
  defaultApp: 'Himmel Sales Management'
};

module.exports = config;
