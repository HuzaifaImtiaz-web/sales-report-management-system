/**
 * Theme Configuration for Enterprise PowerPoint Engine
 * Himmel Pharmaceutical Sales Management System
 */

const THEME = {
  colors: {
    primary: '9E1B1E',      // Himmel Red
    secondary: '1E293B',    // Dark Slate
    accent: '0284C7',       // Enterprise Blue
    white: 'FFFFFF',        // White
    lightGray: 'F8FAFC',    // Light Gray Background
    mediumGray: 'E2E8F0',   // Border Gray
    darkGray: '334155',     // Text Dark Gray
    subtleText: '64748B',   // Subtitle Gray
    mutedText: '94A3B8',    // Muted Gray
    success: '16A34A',      // Success Green
    warning: 'D97706'       // Warning Amber
  },

  typography: {
    fontFace: 'Segoe UI',
    fallbackFont: 'Calibri',
    titleSize: 22,
    subtitleSize: 13,
    headerSize: 18,
    bodySize: 11,
    smallSize: 9,
    captionSize: 8
  },

  common: {
    margins: { top: 0.4, bottom: 0.4, left: 0.5, right: 0.5 },
    cardRadius: 0.1,
    tableStyles: {
      headerFill: '1E293B',
      headerTextColor: 'FFFFFF',
      headerFontBold: true,
      headerFontSize: 10,
      rowAlternateFill: 'F8FAFC',
      rowBaseFill: 'FFFFFF',
      rowTextColor: '334155',
      rowFontSize: 9,
      borderColor: 'CBD5E1',
      borderWidth: 0.5
    },
    headerStyles: {
      height: 0.6,
      fontSize: 18,
      fontWeight: true,
      color: '1E293B',
      subtitleColor: '64748B'
    },
    footerStyles: {
      height: 0.35,
      fontSize: 8,
      textColor: '94A3B8',
      dividerColor: 'E2E8F0',
      companyBranding: 'Himmel Pharmaceutical Ltd'
    }
  }
};

module.exports = THEME;
