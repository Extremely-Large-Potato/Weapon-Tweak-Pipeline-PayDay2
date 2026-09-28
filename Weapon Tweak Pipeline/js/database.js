/* database.js
 * Owns all data: the weapons/attachments databases loaded from /data,
 * the confirmed-properties list, and plain CRUD helpers.
 * No DOM code lives here — app.js is the only file that touches the page.
 */

let WEAPONS_DB = [];
let ATTACHMENTS_DB = [];

// Confirmed stat paths — only things we've actually verified against the
// real extracted weapontweakdata.lua (see rawKey, which maps each one to
// the matching field in a weapon's "raw" object in weapons.json).
// "custom" stats (typed in by the user at runtime) are handled in app.js.
const PROPERTIES_DB = [
  { key: "magazine", label: "Magazine size", path: "CLIP_AMMO_MAX", rawKey: "CLIP_AMMO_MAX", op: "SET", linksAmmo: true },
  { key: "fire_rate", label: "Fire rate (sec between shots)", path: "fire_mode_data.fire_rate", rawKey: "fire_rate", op: "SET", linksAuto: true },
  { key: "damage", label: "Damage", path: "stats.damage", rawKey: "damage", op: "ADD", warnOnSet: true },
  { key: "reload_not_empty", label: "Reload (mag not empty, sec)", path: "timers.reload_not_empty", rawKey: "reload_not_empty", op: "SET" },
  { key: "reload_empty", label: "Reload (mag empty, sec)", path: "timers.reload_empty", rawKey: "reload_empty", op: "SET" },
  { key: "stability", label: "Stability (higher = more stable)", path: "stats.recoil", rawKey: "recoil", op: "ADD" },
  { key: "accuracy", label: "Accuracy (higher = more accurate)", path: "stats.spread", rawKey: "spread", op: "ADD" },
  { key: "concealment", label: "Concealment", path: "stats.concealment", rawKey: "concealment", op: "ADD" },
  { key: "alert_size", label: "Alert size (lower = quieter/stealthier — unverified, test in-game before trusting this)", path: "stats.alert_size", rawKey: "alert_size", op: "ADD", inverse: true },
  { key: "suppression", label: "Suppression", path: "stats.suppression", rawKey: "suppression", op: "ADD" },
  // اضافه کردن به PROPERTIES_DB
{
    key: "ammo_pickup_min",
    label: "Ammo Pickup (Min)",
    path: "AMMO_PICKUP[1]",
    rawKey: "ammo_pickup_min",
    op: "SET"
},
{
    key: "ammo_pickup_max",
    label: "Ammo Pickup (Max)",
    path: "AMMO_PICKUP[2]",
    rawKey: "ammo_pickup_max",
    op: "SET"
}
];

/**
 * Loads weapons.json and attachments.json from /data.
 * Must be served over http(s):// — browsers block fetch() of local
 * files under file://, so this will fail silently if you just
 * double-click index.html. Run a local server instead (see README).
 */
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

/**
 * Real current value for a confirmed property, pulled from the weapon's
 * extracted "raw" data (see rawKey on PROPERTIES_DB entries). Returns
 * undefined if this weapon has no extracted data for that field (e.g. a
 * weapon you added manually, or a field the parser couldn't read
 * because it was a non-literal Lua expression rather than a plain number).
 */
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
