const {app}=require('electron');
app.setName('Himmel Pharmaceutical');
const path=require('path');
app.setPath('userData',path.join(app.getPath('appData'),'Himmel Pharmaceutical'));

app.whenReady().then(()=>{
  const Database=require('better-sqlite3');
  const dbPath=path.join(app.getPath('userData'),'database','admin.db');
  const db=new Database(dbPath,{readonly:true});
  const log=(m)=>console.log(m);

  log('=== ALL TABLES ===');
  db.prepare("SELECT name,type FROM sqlite_master WHERE type='table' ORDER BY name").all()
    .forEach(r=>log('  TABLE: '+r.name));

  log('\n=== ALL VIEWS ===');
  db.prepare("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name").all()
    .forEach(r=>log('  VIEW: '+r.name));

  log('\n=== ALL TRIGGERS ===');
  db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name").all()
    .forEach(r=>log('  TRIGGER: '+r.name));

  log('\n=== PRAGMA integrity_check ===');
  const ic = db.prepare('PRAGMA integrity_check').all();
  ic.forEach(r=>log('  '+JSON.stringify(r)));

  log('\n=== PRAGMA table_info(areas) ===');
  db.prepare('PRAGMA table_info(areas)').all()
    .forEach(c=>log('  '+c.cid+' '+c.name+' '+c.type+' notnull:'+c.notnull));

  log('\n=== PRAGMA table_info(groups) ===');
  db.prepare('PRAGMA table_info(groups)').all()
    .forEach(c=>log('  '+c.cid+' '+c.name+' '+c.type+' notnull:'+c.notnull));

  log('\n=== Test: INSERT INTO orders (simulate) ===');
  try {
    const stmt = db.prepare('SELECT * FROM orders LIMIT 1');
    log('  orders SELECT: OK');
  } catch(e) { log('  orders SELECT ERROR: '+e.message); }

  db.close();
  app.quit();
});
