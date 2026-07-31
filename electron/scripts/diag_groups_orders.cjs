const {app}=require('electron');
app.setName('Himmel Pharmaceutical');
const path=require('path');
app.setPath('userData',path.join(app.getPath('appData'),'Himmel Pharmaceutical'));
app.whenReady().then(()=>{
  const Database=require('better-sqlite3');
  const dbPath=path.join(app.getPath('userData'),'database','admin.db');
  const db=new Database(dbPath,{readonly:true});

  console.log('=== PRAGMA table_info(groups) ===');
  db.prepare('PRAGMA table_info(groups)').all().forEach(c=>console.log(c.cid,c.name,c.type,'notnull:',c.notnull,'dflt:',c.dflt_value));

  console.log('=== PRAGMA table_info(orders) ===');
  db.prepare('PRAGMA table_info(orders)').all().forEach(c=>console.log(c.cid,c.name,c.type,'notnull:',c.notnull));

  console.log('=== PRAGMA table_info(products) ===');
  db.prepare('PRAGMA table_info(products)').all().forEach(c=>console.log(c.cid,c.name,c.type,'notnull:',c.notnull));

  console.log('=== products column name test ===');
  try { db.prepare('SELECT name FROM products LIMIT 1').all(); console.log('products.name col: EXISTS'); }
  catch(e) { console.log('products.name col: MISSING -', e.message); }
  try { db.prepare('SELECT brand_name FROM products LIMIT 1').all(); console.log('products.brand_name: EXISTS'); }
  catch(e) { console.log('products.brand_name: MISSING -', e.message); }

  console.log('=== orders count ===');
  try { console.log(db.prepare('SELECT COUNT(*) as c FROM orders').get()); }
  catch(e) { console.log('orders count ERROR:', e.message); }

  console.log('=== findAll orders test ===');
  try {
    const r = db.prepare(`
      SELECT o.*, tm.name AS team_member_name, d.name AS doctor_name, i.name AS institution_name, a.name AS area_name
      FROM orders o
      JOIN team_members tm ON o.team_member_id = tm.id
      LEFT JOIN doctors d ON o.doctor_id = d.id
      LEFT JOIN institutions i ON o.institution_id = i.id
      JOIN areas a ON o.area_id = a.id
      ORDER BY o.order_date DESC
    `).all();
    console.log('findAll OK, rows:', r.length);
  } catch(e) { console.log('findAll ERROR:', e.message); }

  console.log('=== order_items p.name test ===');
  try {
    db.prepare('SELECT oi.*, p.name AS product_name FROM order_items oi JOIN products p ON oi.product_id = p.id LIMIT 1').all();
    console.log('order_items p.name: OK');
  } catch(e) { console.log('order_items p.name ERROR:', e.message); }

  console.log('=== order_items p.brand_name test ===');
  try {
    db.prepare('SELECT oi.*, p.brand_name AS product_name FROM order_items oi JOIN products p ON oi.product_id = p.id LIMIT 1').all();
    console.log('order_items p.brand_name: OK');
  } catch(e) { console.log('order_items p.brand_name ERROR:', e.message); }

  db.close();
  app.quit();
});
