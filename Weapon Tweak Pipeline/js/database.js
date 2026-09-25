let WEAPONS_DB = [];
let ATTACHMENTS_DB = [];
const PROPERTIES_DB = [
  { key: "magazine", label: "Magazine size", path: "CLIP_AMMO_MAX", rawKey: "CLIP_AMMO_MAX", op: "SET", linksAmmo: true },
  { key: "fire_rate", label: "Fire rate (sec between shots)", path: "fire_mode_data.fire_rate", rawKey: "fire_rate", op: "SET", linksAuto: true },
  { key: "damage", label: "Damage", path: "stats.damage", rawKey: "damage", op: "ADD", warnOnSet: true },
  { key: "reload_not_empty", label: "Reload (mag not empty, sec)", path: "timers.reload_not_empty", rawKey: "reload_not_empty", op: "SET" },
  { key: "reload_empty", label: "Reload (mag empty, sec)", path: "timers.reload_empty", rawKey: "reload_empty", op: "SET" },
  { key: "stability", label: "Stability (lower recoil = more stable)", path: "stats.recoil", rawKey: "recoil", op: "ADD", inverse: true },
  { key: "accuracy", label: "Accuracy (lower spread = more accurate)", path: "stats.spread", rawKey: "spread", op: "ADD", inverse: true },
  { key: "concealment", label: "Concealment", path: "stats.concealment", rawKey: "concealment", op: "ADD" },
  { key: "alert_size", label: "Alert size (lower = quieter/stealthier)", path: "stats.alert_size", rawKey: "alert_size", op: "ADD", inverse: true },
  { key: "suppression", label: "Suppression", path: "stats.suppression", rawKey: "suppression", op: "ADD" }
];

async function loadDatabases() {
  const [weaponsRes, attachmentsRes] = await Promise.all([
    fetch("data/weapons.json"),
    fetch("data/attachments.json")
  ]);
  WEAPONS_DB = await weaponsRes.json();
  ATTACHMENTS_DB = await attachmentsRes.json();
}

function findWeapon(id) {
  return WEAPONS_DB.find(w => w.id === id);
}

function searchWeapons(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return WEAPONS_DB.filter(w =>
    w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)
  );
}

function addWeaponEntry(id, name) {
  if (!id) return null;
  let w = findWeapon(id);
  if (!w) {
    w = { id, name: name || id };
    WEAPONS_DB.push(w);
  }
  return w;
}


function getRawValue(weaponId, rawKey) {
  const w = findWeapon(weaponId);
  if (!w || !w.raw) return undefined;
  return w.raw[rawKey];
}

function addAttachmentEntry(id, type, weapon) {
  if (!id) return null;
  const entry = { id, type: type || "unknown", weapon: weapon || "" };
  ATTACHMENTS_DB.push(entry);
  return entry;
}

function getAttachmentsForWeapon(weaponId) {
  if (!weaponId) return ATTACHMENTS_DB;
  return ATTACHMENTS_DB.filter(a => a.weapon === weaponId || a.id.includes(weaponId));
}

function replaceWeaponsDb(newArray) {
  if (Array.isArray(newArray)) WEAPONS_DB = newArray;
}