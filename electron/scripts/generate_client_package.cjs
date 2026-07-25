const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

async function buildClientDeliveryPackage() {
  const rootDir = process.cwd();
  const deliveryDir = path.join(rootDir, 'Client_Delivery');

  console.log('================================================================');
  console.log('BUILDING ENTERPRISE CLIENT DELIVERY PACKAGE');
  console.log(`Output Directory: ${deliveryDir}`);
  console.log('================================================================\n');

  // Create folder structure
  const subDirs = ['Installer', 'Documentation', 'Sample_Backups', 'Release'];
  subDirs.forEach(sub => {
    const dirPath = path.join(deliveryDir, sub);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // --- PART 1: COPY INSTALLER ARTIFACTS ---
  console.log('1. Copying Installer Executables & Manifests...');
  const distDir = path.join(rootDir, 'dist');
  
  if (fs.existsSync(distDir)) {
    const distFiles = fs.readdirSync(distDir);
    distFiles.forEach(file => {
      if (file.endsWith('.exe') || file.endsWith('.yml') || file.endsWith('.blockmap')) {
        const src = path.join(distDir, file);
        const dest = path.join(deliveryDir, 'Installer', file);
        fs.copyFileSync(src, dest);
        const sizeMB = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
        console.log(`  ✓ Copied Installer/${file} (${sizeMB} MB)`);
      }
    });
  } else {
    console.warn(`  ⚠ dist directory not found: ${distDir}`);
  }

  // --- PART 2: GENERATE README_FIRST.txt ---
  console.log('\n2. Generating README_FIRST.txt...');
  const readmeContent = `================================================================
HIMMEL PHARMACEUTICAL SALES MANAGEMENT SYSTEM
Version 1.0.0 — Enterprise First Release (RC1)
================================================================

WELCOME TO HIMMEL SALES MANAGEMENT SYSTEM!
Thank you for choosing Himmel Pharmaceutical Sales Management System for your business operations.

----------------------------------------------------------------
1. SYSTEM REQUIREMENTS
----------------------------------------------------------------
• Operating System: Windows 10 / Windows 11 (64-bit)
• Memory (RAM): 4 GB minimum (8 GB recommended)
• Storage: 500 MB free disk space for application & database
• Resolution: 1280 x 720 minimum (1920 x 1080 recommended)

----------------------------------------------------------------
2. QUICK START & INSTALLATION
----------------------------------------------------------------
Option A: Standard Installation (Recommended)
1. Open the "Installer" folder in this distribution package.
2. Double-click "Himmel_Pharmaceutical_Sales_Management_Setup_1.0.0.exe".
3. Follow the installation wizard prompts.
4. Launch the application from your Desktop or Start Menu shortcut.

Option B: Portable Execution (No Installation Required)
1. Open the "Installer" folder.
2. Double-click "Himmel_Pharmaceutical_Sales_Management_Portable_1.0.0.exe".
3. The application will launch immediately without needing administrative installation rights.

----------------------------------------------------------------
3. DEFAULT ADMINISTRATOR LOGIN
----------------------------------------------------------------
On first execution, the system automatically initializes itself and creates the default administrator account:

   Username:  admin
   Password:  Password123!

----------------------------------------------------------------
4. FIRST LOGIN INSTRUCTIONS & SECURITY ADVICE
----------------------------------------------------------------
• CHANGE DEFAULT PASSWORD IMMEDIATELY:
  Log in as 'admin', navigate to Settings -> Account -> Change Password, and update the default password to a strong custom passphrase.

• FIRST-RUN SYSTEM INITIALIZATION:
  The application automatically seeds required unit types, divisions, product groups, and default business settings on first boot.

----------------------------------------------------------------
5. BACKUP LOCATION & RECOVERY
----------------------------------------------------------------
• Automated Backups are stored in:
  AppData\\Roaming\\Himmel Pharmaceutical\\UserData\\backups\\

• Emergency Recovery:
  In the event of lost credentials, access Recovery Mode from the Login screen or run 'node electron/scripts/recover_admin.cjs' from an administrator terminal.

----------------------------------------------------------------
6. UPDATE SYSTEM INFORMATION
----------------------------------------------------------------
• Integrated Auto-Update Engine:
  The system includes electron-updater capabilities connecting directly to published GitHub releases.
• 100% Data Preservation:
  Binary updates replace application code while keeping database files, backups, exports, and configuration files completely intact.

----------------------------------------------------------------
7. SUPPORT CONTACT
----------------------------------------------------------------
For technical assistance, system deployment guidance, or software support:

   Himmel Pharmaceutical Software Engineering & Support
   Email:   support@himmelpharmaceutical.com
   Phone:   +92 (300) 123-4567
   Website: https://www.himmelpharmaceutical.com

----------------------------------------------------------------
8. VERSION NUMBER & BUILD STAMP
----------------------------------------------------------------
Version: v1.0.0 (Production Release Candidate 1)
Build Date: July 25, 2026

================================================================
Copyright © 2026 Himmel Pharmaceutical Ltd. All rights reserved.
================================================================
`;
  fs.writeFileSync(path.join(deliveryDir, 'README_FIRST.txt'), readmeContent, 'utf-8');
  console.log('  ✓ README_FIRST.txt created');

  // --- PART 3: CONVERT MARKDOWN GUIDES TO PDF IN DOCUMENTATION ---
  console.log('\n3. Converting Markdown Documentation to PDF format...');
  const mdDocs = [
    'ADMIN_GUIDE.md',
    'USER_GUIDE.md',
    'INSTALLATION_GUIDE.md',
    'BACKUP_RESTORE_GUIDE.md',
    'RECOVERY_MODE_GUIDE.md',
    'CHANGELOG.md',
    'RELEASE_NOTES.md',
    'TROUBLESHOOTING.md'
  ];

  for (const docFile of mdDocs) {
    const mdPath = path.join(rootDir, docFile);
    const pdfFileName = docFile.replace('.md', '.pdf');
    const pdfPath = path.join(deliveryDir, 'Documentation', pdfFileName);

    if (fs.existsSync(mdPath)) {
      const mdText = fs.readFileSync(mdPath, 'utf-8');
      await createPdfFromText(mdText, pdfPath, docFile.replace('.md', '').replace(/_/g, ' '));
      console.log(`  ✓ Generated Documentation/${pdfFileName}`);
    } else {
      console.warn(`  ⚠ Source markdown missing: ${mdPath}`);
    }
  }

  // --- PART 4: COPY RELEASE REPORTS TO RELEASE/ ---
  console.log('\n4. Copying Release Reports to Release/...');
  const releaseReports = [
    'VERSION_HISTORY.md',
    'RELEASE_CANDIDATE_REPORT.md',
    'PHASE19_REPORT.md'
  ];

  releaseReports.forEach(repFile => {
    const src = path.join(rootDir, repFile);
    const dest = path.join(deliveryDir, 'Release', repFile);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Copied Release/${repFile}`);
    } else {
      console.warn(`  ⚠ Release report missing: ${src}`);
    }
  });

  // --- PART 5: GENERATE SAMPLE BACKUP IN SAMPLE_BACKUPS/ ---
  console.log('\n5. Creating Sample Backup file in Sample_Backups/...');
  const sampleBackupPath = path.join(deliveryDir, 'Sample_Backups', 'Himmel_Sample_Initial_Backup_v1.0.0.himmelbackup');
  fs.writeFileSync(sampleBackupPath, JSON.stringify({
    system: "Himmel Pharmaceutical Sales Management System",
    version: "1.0.0",
    backupDate: new Date().toISOString(),
    type: "Initial Schema Backup",
    status: "Verified"
  }, null, 2), 'utf-8');
  console.log('  ✓ Sample_Backups/Himmel_Sample_Initial_Backup_v1.0.0.himmelbackup created');

  console.log('\n================================================================');
  console.log('CLIENT DELIVERY PACKAGE BUILT SUCCESSFULLY!');
  console.log('================================================================\n');
}

function createPdfFromText(text, outputPath, docTitle) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Header
    doc.fillColor('#8B0000').fontSize(20).text(`Himmel Pharmaceutical Sales System`, { align: 'center' });
    doc.fillColor('#333333').fontSize(14).text(docTitle.toUpperCase(), { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#8B0000').lineWidth(1.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1.5);

    // Body content parsing
    doc.fillColor('#222222').fontSize(10);
    const lines = text.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        doc.moveDown(0.8);
        doc.fillColor('#8B0000').fontSize(14).text(trimmed.replace(/^#\s+/, ''), { underline: false });
        doc.fillColor('#222222').fontSize(10);
      } else if (trimmed.startsWith('## ')) {
        doc.moveDown(0.6);
        doc.fillColor('#8B0000').fontSize(12).text(trimmed.replace(/^##\s+/, ''));
        doc.fillColor('#222222').fontSize(10);
      } else if (trimmed.startsWith('### ')) {
        doc.moveDown(0.4);
        doc.fillColor('#444444').fontSize(11).text(trimmed.replace(/^###\s+/, ''), { bold: true });
        doc.fillColor('#222222').fontSize(10);
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        doc.text(`  • ${trimmed.substring(2)}`, { indent: 10 });
      } else if (trimmed.length > 0) {
        doc.text(line);
      } else {
        doc.moveDown(0.3);
      }
    });

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#888888').text(
        `Himmel Pharmaceutical Ltd — Official Documentation | Page ${i + 1} of ${pageCount}`,
        50,
        780,
        { align: 'center' }
      );
    }

    doc.end();
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

buildClientDeliveryPackage().catch(err => {
  console.error('❌ Failed to build Client Delivery package:', err);
  process.exit(1);
});
