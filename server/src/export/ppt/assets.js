/**
 * Enterprise Asset Manager for PowerPoint Engine
 * Himmel Pharmaceutical Sales Management System
 */

const path = require('path');
const fs = require('fs');

// Shipped with the server (server/assets) so it is available on any host, serverless included.
const LOGO_FILE = path.join(__dirname, '..', '..', '..', 'assets', 'Himmel-Logo.png');

function loadLogoData() {
  try {
    return `image/png;base64,${fs.readFileSync(LOGO_FILE).toString('base64')}`;
  } catch (err) {
    return null;
  }
}

class AssetManager {
  constructor() {
    this.companyName = 'Himmel Pharmaceutical Ltd';
    this.defaultReportTitle = 'Enterprise Sales & Management Report';
    this.footerBranding = 'Himmel Pharmaceutical Sales & Management System  |  Confidential';
    // Embedded as data, so slides never depend on a file path at generation time.
    this.logoData = loadLogoData();
  }

  /**
   * Returns standard logo configuration for PowerPoint slides
   */
  getLogoConfig(overrides = {}) {
    return {
      data: this.logoData,
      companyName: this.companyName,
      fallbackText: 'HIMMEL PHARMACEUTICAL',
      width: overrides.width || 1.8,
      height: overrides.height || 0.5,
      x: overrides.x || 0.5,
      y: overrides.y || 0.4
    };
  }

  /**
   * Get Company Name
   */
  getCompanyName() {
    return this.companyName;
  }

  /**
   * Get Default Report Title
   */
  getReportTitle(customTitle) {
    return customTitle || this.defaultReportTitle;
  }

  /**
   * Get Footer Branding text
   */
  getFooterBranding() {
    return this.footerBranding;
  }
}

module.exports = new AssetManager();
