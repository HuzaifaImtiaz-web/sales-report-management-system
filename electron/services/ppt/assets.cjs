/**
 * Enterprise Asset Manager for PowerPoint Engine
 * Himmel Pharmaceutical Sales Management System
 */

const path = require('path');
const fs = require('fs');

class AssetManager {
  constructor() {
    this.companyName = 'Himmel Pharmaceutical Ltd';
    this.defaultReportTitle = 'Enterprise Sales & Management Report';
    this.footerBranding = 'Himmel Pharmaceutical Sales & Management System  |  Confidential';
    this.logoPath = this.resolveLogoPath();
  }

  /**
   * Resolve absolute path for Himmel logo file
   */
  resolveLogoPath() {
    const candidates = [
      path.join(__dirname, '../../src/assets/logos/Himmel-Logo.png'),
      path.join(__dirname, '../../../src/assets/logos/Himmel-Logo.png'),
      path.join(process.cwd(), 'src/assets/logos/Himmel-Logo.png'),
      path.join(process.cwd(), 'build/icon.ico')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return null;
  }

  /**
   * Returns standard logo configuration for PowerPoint slides
   */
  getLogoConfig(overrides = {}) {
    return {
      path: this.logoPath,
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
