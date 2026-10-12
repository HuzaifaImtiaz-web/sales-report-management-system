/**
 * Master Slide Layout & Reusable Helper Module
 * Himmel Pharmaceutical Sales Management System
 */

const THEME = require('./theme');
const AssetManager = require('./assets');

class MasterSlideLayout {
  /**
   * Helper: Add logo to slide
   */
  createLogo(slide, options = {}) {
    const logoConfig = AssetManager.getLogoConfig(options);
    const x = options.x !== undefined ? options.x : logoConfig.x;
    const y = options.y !== undefined ? options.y : logoConfig.y;
    const w = options.w !== undefined ? options.w : logoConfig.width;
    const h = options.h !== undefined ? options.h : logoConfig.height;

    if (logoConfig.data) {
      slide.addImage({
        data: logoConfig.data,
        x,
        y,
        w,
        h
      });
    } else {
      slide.addText(logoConfig.fallbackText, {
        x,
        y,
        w: w + 1.0,
        h,
        fontSize: 14,
        fontFace: THEME.typography.fontFace,
        color: THEME.colors.primary,
        bold: true
      });
    }
  }

  /**
   * Helper: Create Slide Header
   */
  createHeader(slide, categoryOrSection = '') {
    // Header accent bar at the top
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.1,
      fill: { color: THEME.colors.primary },
      line: { color: THEME.colors.primary, width: 0 }
    });

    if (categoryOrSection) {
      slide.addText(categoryOrSection.toUpperCase(), {
        x: 0.5,
        y: 0.2,
        w: 9.0,
        h: 0.3,
        fontSize: THEME.typography.smallSize,
        fontFace: THEME.typography.fontFace,
        color: THEME.colors.subtleText,
        bold: true
      });
    }
  }

  /**
   * Helper: Create Slide Title & Subtitle
   */
  createTitle(slide, titleText, subtitleText = '') {
    const yPos = subtitleText ? 0.45 : 0.45;
    slide.addText(titleText, {
      x: 0.5,
      y: yPos,
      w: 9.0,
      h: 0.5,
      fontSize: THEME.typography.headerSize,
      fontFace: THEME.typography.fontFace,
      color: THEME.colors.secondary,
      bold: true
    });

    if (subtitleText) {
      slide.addText(subtitleText, {
        x: 0.5,
        y: yPos + 0.45,
        w: 9.0,
        h: 0.35,
        fontSize: THEME.typography.bodySize,
        fontFace: THEME.typography.fontFace,
        color: THEME.colors.subtleText
      });
    }
  }

  /**
   * Helper: Create Page Number
   */
  createPageNumber(slide, pageNum, totalPages) {
    if (!pageNum) return;
    const pageStr = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
    slide.addText(pageStr, {
      x: 10.5,
      y: 7.1,
      w: 2.3,
      h: 0.3,
      fontSize: THEME.common.footerStyles.fontSize,
      fontFace: THEME.typography.fontFace,
      color: THEME.common.footerStyles.textColor,
      align: 'right'
    });
  }

  /**
   * Helper: Create Slide Footer (Branding + Page Number)
   */
  createFooter(slide, pageNum = null, totalPages = null) {
    // Divider line above footer
    slide.addShape('line', {
      x: 0.5,
      y: 7.0,
      w: 12.33,
      h: 0,
      line: { color: THEME.common.footerStyles.dividerColor, width: 1 }
    });

    // Confidentiality & Branding Text
    slide.addText(AssetManager.getFooterBranding(), {
      x: 0.5,
      y: 7.1,
      w: 9.0,
      h: 0.3,
      fontSize: THEME.common.footerStyles.fontSize,
      fontFace: THEME.typography.fontFace,
      color: THEME.common.footerStyles.textColor
    });

    // Call Page Number helper
    if (pageNum) {
      this.createPageNumber(slide, pageNum, totalPages);
    }
  }
}

module.exports = new MasterSlideLayout();
