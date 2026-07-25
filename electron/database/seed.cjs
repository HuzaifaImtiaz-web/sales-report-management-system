const logger = require('../logger.cjs');
const config = require('../config.cjs');

function seedDatabase(db) {
  logger.info(`Checking and seeding database tables (Mode: ${config.mode})...`);

  // Lookup builder helper
  const getLookup = (tableName, keyCol = 'name') => {
    const rows = db.prepare(`SELECT id, ${keyCol} FROM ${tableName}`).all();
    const map = {};
    rows.forEach(row => {
      map[row[keyCol]] = row.id;
    });
    return map;
  };

  const getRequiredId = (lookupMap, name, entityName) => {
    const id = lookupMap[name];
    if (id === undefined) {
      throw new Error(`Seeding Error: Required ${entityName} '${name}' was not found in the database lookup map!`);
    }
    return id;
  };

  db.transaction(() => {
    // 1. Seed unit types
    const unitTypes = [
      'Tablet', 'Capsule', 'Vial', 'Ampoule', 'Injection', 
      'Syrup Bottle', 'Sachet', 'Tube', 'Cream', 'Bottle', 
      'Strip', 'Pack', 'Box'
    ];
    let unitSeedCount = 0;
    const stmtUnit = db.prepare('INSERT OR IGNORE INTO unit_types (name) VALUES (?)');
    unitTypes.forEach(name => {
      const res = stmtUnit.run(name);
      if (res.changes > 0) unitSeedCount++;
    });

    // 2. Seed divisions and groups
    const divisions = ['Himmel', 'PMS', 'MSA'];
    const stmtDiv = db.prepare('INSERT OR IGNORE INTO divisions (name) VALUES (?)');
    divisions.forEach(name => stmtDiv.run(name));

    const divisionsMap = getLookup('divisions', 'name');

    const groups = [
      // Himmel Groups
      { divisionName: 'Himmel', name: 'Antibiotics', description: 'Antibiotics' },
      { divisionName: 'Himmel', name: 'Analgesics', description: 'Analgesics' },
      { divisionName: 'Himmel', name: 'Antidiabetics', description: 'Antidiabetics' },
      { divisionName: 'Himmel', name: 'Cardiovascular', description: 'Cardiovascular' },
      { divisionName: 'Himmel', name: 'Respiratory', description: 'Respiratory' },
      { divisionName: 'Himmel', name: 'Gastroenterology', description: 'Gastroenterology' },
      { divisionName: 'Himmel', name: 'General', description: 'General' },
      
      // PMS Groups
      { divisionName: 'PMS', name: 'Surgical', description: 'Surgical products' },
      { divisionName: 'PMS', name: 'ICU', description: 'ICU products' },
      { divisionName: 'PMS', name: 'Critical Care', description: 'Critical Care products' },
      
      // MSA Groups
      { divisionName: 'MSA', name: 'OTC', description: 'Over-the-counter' },
      { divisionName: 'MSA', name: 'Nutrition', description: 'Nutrition' },
      { divisionName: 'MSA', name: 'Vitamins', description: 'Vitamins' },
      { divisionName: 'MSA', name: 'Supplements', description: 'Supplements' }
    ];

    let groupSeedCount = 0;
    const stmtGroup = db.prepare('INSERT OR IGNORE INTO groups (division_id, name, description, is_active) VALUES (?, ?, ?, 1)');
    groups.forEach(g => {
      const divId = getRequiredId(divisionsMap, g.divisionName, 'Division');
      const res = stmtGroup.run(divId, g.name, g.description);
      if (res.changes > 0) groupSeedCount++;
    });

    // 3. Seed settings
    const settings = [
      { key: 'company_name', value: 'Himmel Pharmaceutical', group: 'general' },
      { key: 'app_name', value: 'Himmel Sales Management', group: 'general' },
      { key: 'currency', value: 'PKR', group: 'general' },
      { key: 'fiscal_year_start', value: 'July 1', group: 'general' },
      { key: 'fiscal_year_end', value: 'June 30', group: 'general' },
      { key: 'theme', value: 'Dark', group: 'general' },
      { key: 'backup_enabled', value: 'true', group: 'general' },
      { key: 'default_export_folder', value: 'C:\\Himmel\\exports', group: 'general' },
      { key: 'default_import_folder', value: 'C:\\Himmel\\imports', group: 'general' }
    ];
    let settingsSeedCount = 0;
    const stmtSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value, group_name) VALUES (?, ?, ?)');
    settings.forEach(s => {
      const res = stmtSetting.run(s.key, s.value, s.group);
      if (res.changes > 0) settingsSeedCount++;
    });

    // 4. Seed business years
    let bySeedCount = 0;
    const stmtBY = db.prepare(`
      INSERT OR IGNORE INTO business_years (year_name, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?)
    `);
    const res = stmtBY.run('2026-2027', '2026-07-01', '2027-06-30', 1);
    if (res.changes > 0) bySeedCount++;

    // Centralized Production vs Development check
    if (config.mode !== 'development') {
      logger.info('Production mode: Skip seeding dummy business records.');
      return;
    }

    // 5. Seed areas if empty or missing defaults
    const defaultAreas = [
      { name: 'Lahore Gulberg', code: 'LHR-001', description: 'Main city center area' },
      { name: 'Karachi Clifton', code: 'KHI-001', description: 'Seaside commercial zone' },
      { name: 'Islamabad F-10', code: 'ISB-001', description: 'Sector office zone' },
      { name: 'Faisalabad Civil Lines', code: 'FSD-001', description: 'Textile hub area' },
      { name: 'Peshawar University Road', code: 'PEW-001', description: 'Khyber medical hub' },
      { name: 'Multan Cantt', code: 'MUX-001', description: 'South Punjab zone' },
      { name: 'Sialkot Saddar', code: 'SKT-001', description: 'Industrial Export zone' }
    ];
    const stmtArea = db.prepare('INSERT OR IGNORE INTO areas (name, code, description, is_active) VALUES (?, ?, ?, 1)');
    defaultAreas.forEach(area => {
      stmtArea.run(area.name, area.code, area.description);
    });

    // Build lookup maps for Areas and Unit Types (always rebuilt dynamically)
    const areasMap = getLookup('areas', 'name');
    const unitTypesMap = getLookup('unit_types', 'name');

    // 6. Seed team members if missing defaults
    const defaultTeam = [
      { name: 'Ahmed Shah', email: 'ahmed.shah@himmel.com', phone: '03001112222', role: 'Rep', areaName: 'Lahore Gulberg' },
      { name: 'Zainab Fatima', email: 'zainab.fatima@himmel.com', phone: '03003334444', role: 'Rep', areaName: 'Karachi Clifton' },
      { name: 'Usman Ali', email: 'usman.ali@himmel.com', phone: '03005556666', role: 'Rep', areaName: 'Islamabad F-10' },
      { name: 'Mariam Khan', email: 'mariam.khan@himmel.com', phone: '03007778888', role: 'Rep', areaName: 'Faisalabad Civil Lines' },
      { name: 'Bilal Siddiqui', email: 'bilal.siddiqui@himmel.com', phone: '03009990000', role: 'Rep', areaName: 'Peshawar University Road' }
    ];
    const stmtTeam = db.prepare('INSERT OR IGNORE INTO team_members (name, email, phone, role, area_id, is_active) VALUES (?, ?, ?, ?, ?, 1)');
    defaultTeam.forEach(t => {
      stmtTeam.run(t.name, t.email, t.phone, t.role, getRequiredId(areasMap, t.areaName, 'Area'));
    });

    // Build lookup maps for Groups (rebuilt dynamically)
    const groupsMap = {};
    db.prepare('SELECT id, division_id, name FROM groups').all().forEach(g => {
      groupsMap[`${g.division_id}:${g.name.toLowerCase()}`] = g.id;
    });

    // 7. Seed products if missing defaults
    const defaultProducts = [
      { brandName: 'Amoxicillin 500mg', code: 'PROD-AMOX', division: 'Himmel', group: 'Antibiotics', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Injection', registrationNo: 'REG-10001', manufacturer: 'Himmel Pharmaceutical', qty: 10, unitTypeName: 'Vial', tp: 4500, mrp: 5000, description: 'Broad spectrum antibiotic' },
      { brandName: 'Paracetamol 650mg', code: 'PROD-PARA', division: 'Himmel', group: 'Analgesics', genericName: 'Paracetamol', strength: '650mg', dosageForm: 'Tablet', registrationNo: 'REG-10002', manufacturer: 'Himmel Pharmaceutical', qty: 20, unitTypeName: 'Tablet', tp: 2400, mrp: 2650, description: 'Pain and fever relief' },
      { brandName: 'Metformin 850mg', code: 'PROD-METF', division: 'Himmel', group: 'Antidiabetics', genericName: 'Metformin', strength: '850mg', dosageForm: 'Tablet', registrationNo: 'REG-10003', manufacturer: 'Himmel Pharmaceutical', qty: 30, unitTypeName: 'Capsule', tp: 11400, mrp: 12500, description: 'Diabetes management' },
      { brandName: 'Lipitor 10mg', code: 'PROD-LIPI', division: 'Himmel', group: 'Cardiovascular', genericName: 'Atorvastatin', strength: '10mg', dosageForm: 'Tablet', registrationNo: 'REG-10004', manufacturer: 'Himmel Pharmaceutical', qty: 10, unitTypeName: 'Tablet', tp: 9500, mrp: 10500, description: 'Cholesterol treatment' },
      { brandName: 'Ibuprofen 400mg', code: 'PROD-IBUP', division: 'Himmel', group: 'Analgesics', genericName: 'Ibuprofen', strength: '400mg', dosageForm: 'Tablet', registrationNo: 'REG-10005', manufacturer: 'Himmel Pharmaceutical', qty: 20, unitTypeName: 'Tablet', tp: 1800, mrp: 2000, description: 'Anti-inflammatory' },
      { brandName: 'Omeprazole 20mg', code: 'PROD-OMEP', division: 'Himmel', group: 'Gastroenterology', genericName: 'Omeprazole', strength: '20mg', dosageForm: 'Capsule', registrationNo: 'REG-10006', manufacturer: 'Himmel Pharmaceutical', qty: 10, unitTypeName: 'Capsule', tp: 5200, mrp: 5750, description: 'Acid reflux treatment' },
      { brandName: 'Augmentin 625mg', code: 'PROD-AUGM', division: 'Himmel', group: 'Antibiotics', genericName: 'Co-amoxiclav', strength: '625mg', dosageForm: 'Tablet', registrationNo: 'REG-10007', manufacturer: 'Himmel Pharmaceutical', qty: 14, unitTypeName: 'Tablet', tp: 15400, mrp: 17000, description: 'Bacterial infection medicine' },
      { brandName: 'Azithromycin 250mg', code: 'PROD-AZIT', division: 'Himmel', group: 'Antibiotics', genericName: 'Azithromycin', strength: '250mg', dosageForm: 'Tablet', registrationNo: 'REG-10008', manufacturer: 'Himmel Pharmaceutical', qty: 6, unitTypeName: 'Tablet', tp: 4020, mrp: 4450, description: 'Macrolide antibiotic' },
      { brandName: 'Ventolin Inhaler', code: 'PROD-VENT', division: 'Himmel', group: 'Respiratory', genericName: 'Salbutamol', strength: '100mcg', dosageForm: 'Inhaler', registrationNo: 'REG-10009', manufacturer: 'Himmel Pharmaceutical', qty: 1, unitTypeName: 'Bottle', tp: 850, mrp: 950, description: 'Asthma inhaler' },
      { brandName: 'Crestor 10mg', code: 'PROD-CRES', division: 'Himmel', group: 'Cardiovascular', genericName: 'Rosuvastatin', strength: '10mg', dosageForm: 'Tablet', registrationNo: 'REG-10010', manufacturer: 'Himmel Pharmaceutical', qty: 10, unitTypeName: 'Tablet', tp: 13500, mrp: 14850, description: 'High cholesterol regulator' }
    ];

    const stmtProduct = db.prepare(`
      INSERT OR IGNORE INTO products (
        division_id, group_id, product_code, brand_name, generic_name, strength, dosage_form,
        registration_no, manufacturer, pack_size, unit_type_id, tp, mrp, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `);

    defaultProducts.forEach(p => {
      const divId = getRequiredId(divisionsMap, p.division, 'Division');
      const groupId = groupsMap[`${divId}:${p.group.toLowerCase()}`];
      if (!groupId) {
        throw new Error(`Seeding Error: Group '${p.group}' under Division '${p.division}' was not found in lookup!`);
      }
      stmtProduct.run(
        divId,
        groupId,
        p.code,
        p.brandName,
        p.genericName,
        p.strength,
        p.dosageForm,
        p.registrationNo,
        p.manufacturer,
        p.qty,
        getRequiredId(unitTypesMap, p.unitTypeName, 'Unit Type'),
        p.tp,
        p.mrp,
        p.description
      );
    });

    // Rebuild lookup maps (always rebuilt dynamically)
    const productsMap = getLookup('products', 'name');
    const teamMembersMap = getLookup('team_members', 'name');
    const businessYearsMap = getLookup('business_years', 'year_name');

    // 8. Seed doctors if missing defaults
    const defaultDocs = [
      { name: 'Dr. Ayesha Khan', specialty: 'Cardiologist', hospital: 'Mayo Hospital', city: 'Lahore', address: 'Room 12, Cardiology Ward, Mayo Hospital, Lahore', notes: 'Preferred meeting time: Tuesday morning.', email: 'ayesha.khan@gmail.com', phone: '03001234567', areaName: 'Lahore Gulberg' },
      { name: 'Dr. Hamid Raza', specialty: 'General Physician', hospital: 'Jinnah Hospital', city: 'Karachi', address: 'Clinic Annex, Near Main Gate, Jinnah Hospital, Karachi', notes: 'Discuss cardiometabolic drugs.', email: 'hamid.raza@yahoo.com', phone: '03217654321', areaName: 'Karachi Clifton' },
      { name: 'Dr. Nadia Siddiqui', specialty: 'Pediatrician', hospital: 'Shifa International', city: 'Islamabad', address: 'Consultant Clinic 4, Shifa International Hospital, Islamabad', notes: 'Focus on pediatric allergy medicines.', email: 'nadia.siddiqui@shifa.com', phone: '03339876543', areaName: 'Islamabad F-10' },
      { name: 'Dr. Farhan Latif', specialty: 'ENT Specialist', hospital: 'Holy Family Hospital', city: 'Rawalpindi', address: 'Asghar Mall Road, Rawalpindi', notes: 'Focus on throat infections.', email: 'farhan.latif@outlook.com', phone: '03456789012', areaName: 'Faisalabad Civil Lines' },
      { name: 'Dr. Saima Riaz', specialty: 'Dermatologist', hospital: 'FIC Faisalabad', city: 'Faisalabad', address: 'Sargodha Road, Faisalabad', notes: 'Focus on topical products.', email: 'saima.riaz@gmail.com', phone: '03009988776', areaName: 'Peshawar University Road' },
      { name: 'Dr. Tariq Mehmood', specialty: 'Neurologist', hospital: 'Nishtar Hospital', city: 'Multan', address: 'Nishtar Road, Multan', notes: 'Focus on cognitive range.', email: 'tariq.mehmood@gmail.com', phone: '03005544332', areaName: 'Multan Cantt' },
      { name: 'Dr. Fatima Ali', specialty: 'Gynecologist', hospital: 'Lady Reading Hospital', city: 'Peshawar', address: 'Peshawar Road, Peshawar', notes: 'Focus on prenatal supplements.', email: 'fatima.ali@gmail.com', phone: '03006655443', areaName: 'Sialkot Saddar' }
    ];
    const stmtDoc = db.prepare('INSERT OR IGNORE INTO doctors (name, specialty, hospital, city, address, notes, email, phone, area_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
    defaultDocs.forEach(d => {
      stmtDoc.run(d.name, d.specialty, d.hospital, d.city, d.address, d.notes, d.email, d.phone, getRequiredId(areasMap, d.areaName, 'Area'));
    });

    // 9. Seed institutions if missing defaults
    const defaultInsts = [
      { name: 'Mayo Hospital', code: 'INST-MAYO', type: 'Hospital', city: 'Lahore', address: 'Gulberg Road, Lahore', contact_person: 'Dr. Tariq Mahmood', contact_number: '+92 300 1234567', notes: 'Largest public hospital.', areaName: 'Lahore Gulberg' },
      { name: 'Jinnah Hospital', code: 'INST-JINN', type: 'Hospital', city: 'Karachi', address: 'Clifton, Karachi', contact_person: 'Dr. Hamid Raza', contact_number: '+92 321 9876543', notes: 'High volume public hospital.', areaName: 'Karachi Clifton' },
      { name: 'Shifa International', code: 'INST-SHIF', type: 'Hospital', city: 'Islamabad', address: 'F-10, Islamabad', contact_person: 'Dr. Nadia Siddiqui', contact_number: '+92 333 5556667', notes: 'Premium private care.', areaName: 'Islamabad F-10' }
    ];
    const stmtInst = db.prepare('INSERT OR IGNORE INTO institutions (name, code, type, city, address, contact_person, contact_number, notes, area_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
    defaultInsts.forEach(i => {
      stmtInst.run(i.name, i.code, i.type, i.city, i.address, i.contact_person, i.contact_number, i.notes, getRequiredId(areasMap, i.areaName, 'Area'));
    });

    // Rebuild lookup maps (always rebuilt dynamically)
    const doctorsMap = getLookup('doctors', 'name');
    const institutionsMap = getLookup('institutions', 'name');

    // 10. Seed product targets if missing defaults
    const stmtTarget = db.prepare('INSERT OR IGNORE INTO product_targets (business_year_id, product_id, annual_target_qty, areas_distribution, notes) VALUES (?, ?, ?, ?, ?)');
    
    const activeYearId = getRequiredId(businessYearsMap, '2026-2027', 'Business Year');
    const p1Id = getRequiredId(productsMap, 'Amoxicillin 500mg', 'Product');
    const p3Id = getRequiredId(productsMap, 'Metformin 850mg', 'Product');

    const distP1 = [
      {
        areaName: 'Lahore Gulberg',
        percentage: 60,
        teamMembers: [
          { name: 'Ahmed Shah', percentage: 100 }
        ]
      },
      {
        areaName: 'Karachi Clifton',
        percentage: 40,
        teamMembers: [
          { name: 'Zainab Fatima', percentage: 100 }
        ]
      }
    ];
    const distP3 = [
      {
        areaName: 'Islamabad F-10',
        percentage: 100,
        teamMembers: [
          { name: 'Usman Ali', percentage: 100 }
        ]
      }
    ];

    stmtTarget.run(activeYearId, p1Id, 50000, JSON.stringify(distP1), 'Antibiotics target');
    stmtTarget.run(activeYearId, p3Id, 80000, JSON.stringify(distP3), 'Diabetes target');

    // 11. Seed orders if missing defaults
    const stmtOrder = db.prepare('INSERT OR IGNORE INTO orders (order_number, order_date, team_member_id, doctor_id, institution_id, area_id, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, 0.0, ?)');
    const stmtOrderItem = db.prepare('INSERT OR IGNORE INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)');

    const t1Id = getRequiredId(teamMembersMap, 'Ahmed Shah', 'Team Member');
    const t2Id = getRequiredId(teamMembersMap, 'Zainab Fatima', 'Team Member');
    const t3Id = getRequiredId(teamMembersMap, 'Usman Ali', 'Team Member');

    const d1Id = getRequiredId(doctorsMap, 'Dr. Ayesha Khan', 'Doctor');
    const d2Id = getRequiredId(doctorsMap, 'Dr. Hamid Raza', 'Doctor');
    const d3Id = getRequiredId(doctorsMap, 'Dr. Nadia Siddiqui', 'Doctor');

    const inst1Id = getRequiredId(institutionsMap, 'Mayo Hospital', 'Institution');
    const inst2Id = getRequiredId(institutionsMap, 'Jinnah Hospital', 'Institution');
    const inst3Id = getRequiredId(institutionsMap, 'Shifa International', 'Institution');

    const area1Id = getRequiredId(areasMap, 'Lahore Gulberg', 'Area');
    const area2Id = getRequiredId(areasMap, 'Karachi Clifton', 'Area');
    const area3Id = getRequiredId(areasMap, 'Islamabad F-10', 'Area');

    const p1 = db.prepare("SELECT id, pack_price FROM products WHERE name = 'Amoxicillin 500mg'").get();
    const p2 = db.prepare("SELECT id, pack_price FROM products WHERE name = 'Paracetamol 650mg'").get();
    const p3 = db.prepare("SELECT id, pack_price FROM products WHERE name = 'Metformin 850mg'").get();

    if (p1 && p2 && p3) {
      // Seed order 1
      let res = stmtOrder.run('PO-2026-001', '2026-07-10', t1Id, d1Id, inst1Id, area1Id, 'Completed');
      if (res.changes > 0) {
        let orderId = res.lastInsertRowid;
        stmtOrderItem.run(orderId, p1.id, 20, p1.pack_price, 20 * p1.pack_price);
        stmtOrderItem.run(orderId, p2.id, 15, p2.pack_price, 15 * p2.pack_price);
      }

      // Seed order 2
      res = stmtOrder.run('PO-2026-002', '2026-07-11', t2Id, d2Id, inst2Id, area2Id, 'Completed');
      if (res.changes > 0) {
        let orderId = res.lastInsertRowid;
        stmtOrderItem.run(orderId, p3.id, 30, p3.pack_price, 30 * p3.pack_price);
      }

      // Seed order 3
      res = stmtOrder.run('PO-2026-003', '2026-07-12', t3Id, d3Id, inst3Id, area3Id, 'Completed');
      if (res.changes > 0) {
        let orderId = res.lastInsertRowid;
        stmtOrderItem.run(orderId, p2.id, 40, p2.pack_price, 40 * p2.pack_price);
      }
    }

    // 12. Seed tasks if missing defaults
    const defaultTasks = [
      { text: 'Review June Area Targets', is_done: 1 },
      { text: 'Follow up with Dr. Hamid Raza', is_done: 0 },
      { text: 'Sign off Multan sales report', is_done: 0 },
      { text: 'Update product price listings', is_done: 0 }
    ];
    const stmtTask = db.prepare('INSERT INTO tasks (text, is_done) VALUES (?, ?)');
    const checkTask = db.prepare('SELECT COUNT(*) AS count FROM tasks WHERE text = ?');
    defaultTasks.forEach(task => {
      const exists = checkTask.get(task.text).count > 0;
      if (!exists) {
        stmtTask.run(task.text, task.is_done);
      }
    });

    // 13. Seed reminders if missing defaults
    const defaultReminders = [
      { title: 'Q2 Sales Review Meet', time: 'Today, 2:00 PM', type: 'meeting' },
      { title: 'Lahore Target Deadline', time: 'Jul 15, 5:00 PM', type: 'deadline' }
    ];
    const stmtReminder = db.prepare('INSERT INTO reminders (title, reminder_time, type) VALUES (?, ?, ?)');
    const checkReminder = db.prepare('SELECT COUNT(*) AS count FROM reminders WHERE title = ?');
    defaultReminders.forEach(r => {
      const exists = checkReminder.get(r.title).count > 0;
      if (!exists) {
        stmtReminder.run(r.title, r.time, r.type);
      }
    });

    logger.info('Database check and seeding execution complete.');
  })();
}

module.exports = { seedDatabase };
