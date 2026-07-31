const {app}=require('electron');
app.setName('Himmel Pharmaceutical');
const path=require('path');
app.setPath('userData',path.join(app.getPath('appData'),'Himmel Pharmaceutical'));

app.whenReady().then(()=>{
  const Database=require('better-sqlite3');
  const dbPath=path.join(app.getPath('userData'),'database','admin.db');
  const db=new Database(dbPath, {readonly: true});
  const log=(m)=>console.log(m);

  log('=== ALL TABLES (including temp) ===');
  db.prepare("SELECT name, type, sql FROM sqlite_master ORDER BY type, name").all()
    .forEach(r=>log(`  [${r.type}] ${r.name}`));

  log('\n=== SEARCH FOR areas_temp IN SQL DEFINITIONS ===');
  db.prepare("SELECT name, type, sql FROM sqlite_master WHERE sql LIKE '%areas_temp%'").all()
    .forEach(r=>log(`  FOUND in [${r.type}] ${r.name}:\n    ${r.sql}`));

  log('\n=== SEARCH FOR areas IN ALL TRIGGERS ===');
  db.prepare("SELECT name, sql FROM sqlite_master WHERE type='trigger' AND sql LIKE '%areas%'").all()
    .forEach(r=>log(`  TRIGGER: ${r.name}\n  SQL: ${r.sql}\n`));

  log('\n=== FULL TRIGGER SQL: trg_areas_updated ===');
  db.prepare("SELECT sql FROM sqlite_master WHERE name='trg_areas_updated'").all()
    .forEach(r=>log(r.sql));

  log('\n=== PRAGMA table_info(areas) ===');
  db.prepare("PRAGMA table_info(areas)").all()
    .forEach(c=>log(`  ${c.cid} ${c.name} ${c.type} notnull:${c.notnull}`));

  log('\n=== PRAGMA table_list ===');
  try {
    db.prepare("PRAGMA table_list").all()
      .forEach(r=>log(`  ${r.schema}.${r.name}  type=${r.type}`));
  } catch(e) { log('table_list not supported: '+e.message); }

  log('\n=== Test simulate INSERT INTO orders ===');
  try {
    db.prepare(`
      SELECT * FROM orders
      JOIN team_members tm ON orders.team_member_id = tm.id
      JOIN areas a ON orders.area_id = a.id
      LIMIT 0
    `).all();
    log('  orders JOIN areas: OK');
  } catch(e) { log('  ERROR: '+e.message); }

  db.close();
  app.quit();
});
