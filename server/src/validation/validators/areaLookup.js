// Shared by the Doctor, Institution and Team Member validators: when the form sends an area
// name instead of an id, find that area or create it (same behaviour as the SQLite version).
async function resolveOrCreateArea(db, entity) {
  let areaId = entity.areaId;
  const areaNameStr = entity.area || entity.areaName;
  if (!areaId && areaNameStr && typeof areaNameStr === 'string' && areaNameStr.trim().length > 0) {
    const areaRow = await db.get('SELECT id FROM areas WHERE LOWER(name) = ?', [areaNameStr.trim().toLowerCase()]);
    if (areaRow) {
      areaId = areaRow.id;
    } else {
      const ins = await db.get('INSERT INTO areas (name, is_active) VALUES (?, 1) RETURNING id', [areaNameStr.trim()]);
      areaId = ins.id;
    }
    entity.areaId = areaId;
  }
  return areaId;
}

module.exports = { resolveOrCreateArea };
