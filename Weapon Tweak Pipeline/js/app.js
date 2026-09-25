let weaponConfigs = {};
let currentWeaponId = null;

const $ = id => document.getElementById(id);

function onSearchInput() {
  const q = $('weaponSearch').value;
  const box = $('searchResults');
  if (!q.trim()) { box.style.display = 'none'; return; }
  const matches = searchWeapons(q);
  box.innerHTML = matches.length
    ? matches.map(w => `<div class="item" onclick="pickWeapon('${w.id}')">${w.name}<div class="id">${w.id}</div></div>`).join('')
    : `<div class="item" style="color:var(--text-dim);">No match - add it below as a new weapon.</div>`;
  box.style.display = 'block';
}

function pickWeapon(id) {
  currentWeaponId = id;
  $('searchResults').style.display = 'none';
  const w = findWeapon(id);
  $('weaponSearch').value = w ? w.name : id;
  renderCurrentPick();
  renderRawStats(id);
  loadPropertyFormFor(id);
}

function renderCurrentPick() {
  const w = findWeapon(currentWeaponId);
  const box = $('currentPick');
  if (!w) { box.style.display = 'none'; return; }
  box.style.display = 'flex';
  box.innerHTML = `<div><strong>${w.name}</strong> <span style="color:var(--text-dim);font-family:var(--mono);font-size:11px;">${w.id}</span></div>`;
}

function renderRawStats(id) {
  const box = $('baselineBox');
  const w = findWeapon(id);
  if (!w || !w.raw || Object.keys(w.raw).length === 0) {
    box.style.display = 'block';
    box.innerHTML = `<div class="hint">No extracted data for this weapon yet - this one was added manually rather than pulled from weapontweakdata.lua.</div>`;
    return;
  }
  box.style.display = 'block';
  const rows = PROPERTIES_DB
    .map(p => {
      const v = w.raw[p.rawKey];
      return v === undefined ? '' : `<div><label>${p.label}</label><input type="text" value="${v}" readonly></div>`;
    })
    .filter(Boolean)
    .join('');
  box.innerHTML = `<div class="hint" style="margin-bottom:6px;">Real values extracted from weapontweakdata.lua - read-only, this is what you're SET/ADD/MULTIPLY-ing from below.</div><div class="grid">${rows}</div>`;
}

function renderConfirmedProps() {
  $('confirmedProps').innerHTML = PROPERTIES_DB.map(p => `
    <div class="prop-row" data-key="${p.key}">
      <input type="checkbox" id="chk_${p.key}">
      <div class="pname">${p.label}<span class="path">self.&lt;id&gt;.${p.path}</span>${p.inverse ? `<span class="inverse-note">lower raw value = better in-game. Current: ${getRawValue(currentWeaponId, p.rawKey) ?? '-'}. To improve it: SET below that number, ADD a negative number, or MULTIPLY by less than 1.</span>` : ''}</div>
      <select id="op_${p.key}">
        <option value="SET" ${p.op === 'SET' ? 'selected' : ''}>SET</option>
        <option value="ADD" ${p.op === 'ADD' ? 'selected' : ''}>ADD</option>
        <option value="MULTIPLY">MULTIPLY</option>
      </select>
      <input type="number" id="val_${p.key}" step="0.01" placeholder="value">
      <span></span>
    </div>
  `).join('');
}

function addCustomPropRow(prefill) {
  const row = document.createElement('div');
  row.className = 'prop-row';
  const uid = 'c' + Math.random().toString(36).slice(2, 8);
  row.id = uid;
  row.innerHTML = `
    <input type="checkbox" checked>
    <input type="text" placeholder="e.g. stats.stability" class="cpath" value="${prefill ? prefill.path : ''}">
    <select class="cop">
      <option value="SET" ${prefill && prefill.op === 'SET' ? 'selected' : ''}>SET</option>
      <option value="ADD" ${!prefill || prefill.op === 'ADD' ? 'selected' : ''}>ADD</option>
      <option value="MULTIPLY" ${prefill && prefill.op === 'MULTIPLY' ? 'selected' : ''}>MULTIPLY</option>
    </select>
    <input type="number" class="cval" step="0.01" placeholder="value" value="${prefill ? prefill.value : ''}">
    <button onclick="document.getElementById('${uid}').remove()">✕</button>
  `;
  $('customPropRows').appendChild(row);
}

function resetPropertyForm() {
  PROPERTIES_DB.forEach(p => {
    $('chk_' + p.key).checked = false;
    $('val_' + p.key).value = '';
    $('op_' + p.key).value = p.op;
  });
  $('customPropRows').innerHTML = '';
}

function loadPropertyFormFor(id) {
  renderConfirmedProps();
  $('customPropRows').innerHTML = '';
  const cfg = weaponConfigs[id];
  if (!cfg) return;
  Object.entries(cfg.propValues || {}).forEach(([key, v]) => {
    if (!$('chk_' + key)) return;
    $('chk_' + key).checked = true;
    $('val_' + key).value = v.value;
    $('op_' + key).value = v.op;
  });
  (cfg.custom || []).forEach(c => addCustomPropRow(c));
}

function saveWeaponConfig() {
  const id = currentWeaponId;
  if (!id) { alert('Pick a weapon first.'); return; }
  const propValues = {};
  PROPERTIES_DB.forEach(p => {
    if ($('chk_' + p.key).checked) {
      const val = $('val_' + p.key).value.trim();
      if (val !== '') propValues[p.key] = { value: val, op: $('op_' + p.key).value };
    }
  });
  const custom = [];
  document.querySelectorAll('#customPropRows .prop-row').forEach(row => {
    const path = row.querySelector('.cpath').value.trim();
    const val = row.querySelector('.cval').value.trim();
    const op = row.querySelector('.cop').value;
    if (path && val !== '') custom.push({ path, op, value: val });
  });
  weaponConfigs[id] = { propValues, custom };
  render();
}

function removeWeaponConfig(id) {
  delete weaponConfigs[id];
  render();
}

function validateAll() {
  const errors = [], warnings = [];
  const ids = Object.keys(weaponConfigs);
  if (ids.length === 0) errors.push('No weapon has a saved configuration yet.');

  ids.forEach(id => {
    if (!findWeapon(id)) errors.push(`Weapon "${id}" is not in the database.`);
    const cfg = weaponConfigs[id];
    if (Object.keys(cfg.propValues).length === 0 && cfg.custom.length === 0) {
      warnings.push(`"${id}" is saved but has no properties set - it will produce an empty block.`);
    }
    Object.entries(cfg.propValues).forEach(([key, v]) => {
      if (isNaN(parseFloat(v.value))) errors.push(`"${id}" → ${key}: value "${v.value}" is not a number.`);
      const def = PROPERTIES_DB.find(p => p.key === key);
      if (def && def.warnOnSet && v.op === 'SET') {
        warnings.push(`"${id}" → damage uses SET - the in-game displayed number is derived, not raw, so ADD (relative) is usually safer.`);
      }
      if (def && def.inverse) {
        const current = getRawValue(id, def.rawKey);
        const val = parseFloat(v.value);
        if (v.op === 'ADD' && val > 0) {
          warnings.push(`"${id}" → ${def.label.split(' (')[0]} uses ADD with a positive number - since lower is better for this stat, this makes it WORSE. Use a negative number to improve it.`);
        } else if (v.op === 'MULTIPLY' && val >= 1) {
          warnings.push(`"${id}" → ${def.label.split(' (')[0]} uses MULTIPLY by ${val} - since lower is better, a number ≥ 1 makes it the same or WORSE. Use a number below 1 (e.g. 0.75) to improve it.`);
        } else if (v.op === 'SET' && current !== undefined && val >= current) {
          warnings.push(`"${id}" → ${def.label.split(' (')[0]} uses SET to ${val}, which is at or above the current value (${current}). Since lower is better for this stat, that won't improve it - set it below ${current} instead.`);
        }
      }
    });
    cfg.custom.forEach(c => {
      if (isNaN(parseFloat(c.value))) errors.push(`"${id}" → custom path "${c.path}": value is not a number.`);
      if (!/^[a-zA-Z0-9_.]+$/.test(c.path)) errors.push(`"${id}" → custom path "${c.path}" has invalid characters for a Lua field path.`);
    });
  });

  return { errors, warnings };
}

function renderValidator() {
  const { errors, warnings } = validateAll();
  let html = errors.length
    ? `<div class="validator-box bad"><strong>${errors.length} issue(s) found</strong><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul></div>`
    : `<div class="validator-box ok">No blocking issues.</div>`;
  html += warnings.map(w => `<div class="warn">${w}</div>`).join('');
  $('validatorOut').innerHTML = html;
  return errors.length === 0;
}

function applyOp(target, op, value) {
  if (op === 'SET') return `${target} = ${value}`;
  if (op === 'ADD') return `${target} = ${target} ${value.toString().startsWith('-') ? '' : '+ '}${value}`;
  if (op === 'MULTIPLY') return `${target} = ${target} * ${value}`;
  return `${target} = ${value}`;
}

function buildWeaponBlock(id) {
  const cfg = weaponConfigs[id];
  if (!cfg) return '';
  const wDef = findWeapon(id);
  const lines = [`-- ${wDef ? wDef.name : id}`];
  Object.entries(cfg.propValues).forEach(([key, v]) => {
    const def = PROPERTIES_DB.find(p => p.key === key);
    if (!def) return;
    lines.push(applyOp(`self.${id}.${def.path}`, v.op, v.value));
    if (def.linksAmmo) lines.push(`self.${id}.AMMO_MAX = self.${id}.CLIP_AMMO_MAX * self.${id}.NR_CLIPS_MAX`);
    if (def.linksAuto) lines.push(`self.${id}.auto.fire_rate = ${v.value}`);
  });
  cfg.custom.forEach(c => lines.push(applyOp(`self.${id}.${c.path}`, c.op, c.value)));
  return lines.join('\n');
}

function luaOutput() {
  const ids = Object.keys(weaponConfigs);
  if (ids.length === 0) return '-- configure and save a weapon to see generated code';
  const blocks = ids.map(buildWeaponBlock).filter(Boolean).join('\n\n');
  return `local old_init = WeaponTweakData.init\nfunction WeaponTweakData:init(tweak_data)\n\told_init(self, tweak_data)\n\n${indent(blocks)}\nend`;
}
function indent(t) { return t.split('\n').map(l => l ? '\t' + l : l).join('\n'); }

function modOutput() {
  const name = $('modName').value.trim() || 'Weapon Tweaks';
  const author = $('modAuthor').value.trim() || 'MR Potato';
  const description = $('modDescription').value.trim() || 'Custom weapon stat tweaks built with the Weapon Tweak Pipeline';
  return `{
    "name" : "${esc(name)}",
    "description" : "${esc(description)}",
    "author" : "${esc(author)}",
    "blt_version" : 2,
    "hooks" : [
    {
        "hook_id" : "lib/tweak_data/weapontweakdata",
        "script_path" : "code.lua"
    }
    ]
}`;
}
function esc(s) { return s.replace(/"/g, '\\"'); }

/* ---------- RENDER ---------- */
function render() {
  const ids = Object.keys(weaponConfigs);
  $('emptyNote').style.display = ids.length ? 'none' : 'block';
  $('weaponList').innerHTML = ids.map(id => {
    const wDef = findWeapon(id);
    const cfg = weaponConfigs[id];
    const count = Object.keys(cfg.propValues).length + cfg.custom.length;
    return `<div class="weapon-chip">
      <div><strong>${wDef ? wDef.name : id}</strong><div class="meta">${id} · ${count} stat(s)</div></div>
      <div class="actions">
        <button onclick="pickWeapon('${id}')">edit</button>
        <button onclick="removeWeaponConfig('${id}')">remove</button>
      </div>
    </div>`;
  }).join('');
  $('luaOut').textContent = luaOutput();
  $('modOut').textContent = modOutput();
  renderValidator();
}

/* ---------- COPY / DOWNLOAD / ZIP ---------- */
function copyText(sourceId, flashId) {
  navigator.clipboard.writeText($(sourceId).textContent).then(() => {
    $(flashId).classList.add('show');
    setTimeout(() => $(flashId).classList.remove('show'), 1000);
  });
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportZip() {
  if (!renderValidator()) { alert('Fix the validator errors before exporting.'); return; }
  const modName = $('modName').value.trim() || 'Weapon Tweaks';
  const folderName = modName.replace(/[^a-z0-9 _-]/gi, '').trim() || 'Weapon Tweaks';

  const zip = new JSZip();
  const folder = zip.folder(folderName);
  folder.file('mod.txt', modOutput());
  folder.file('code.lua', luaOutput());

  const iconInput = $('iconFile');
  if (iconInput.files && iconInput.files[0]) {
    folder.file('icon.png', await iconInput.files[0].arrayBuffer());
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = folderName + '.zip';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- BOOT ---------- */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) $('searchResults').style.display = 'none';
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadDatabases();
  } catch (err) {
    document.body.insertAdjacentHTML('afterbegin',
      `<div style="background:#b3453a;color:#fff;padding:10px 16px;font-family:sans-serif;font-size:13px;">
        Could not load data/weapons.json and data/attachments.json - this page needs to be served over
        http(s), not opened directly as a file. Run a local server (see README.md) and reload.
       </div>`);
    console.error(err);
    return;
  }
  renderConfirmedProps();
  render();
});
