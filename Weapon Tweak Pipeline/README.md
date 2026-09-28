# Weapon Tweak Pipeline

A local tool for building PAYDAY 2 weapon-stat mods: pick a gun, choose
what to change, and export a mod folder ready to drop into your game.
No Lua experience required — the tool writes the code for you.

---

## 1. First run

This is a small multi-file website (`index.html` + `js/` + `data/`),
**not** something you can just double-click and open. Browsers block
a page from loading its own data files (`data/weapons.json`,
`data/attachments.json`) when opened directly as a file — you'll see
a red error banner if you try.

**Easiest option — the launcher:** if you have `launcher.py` (or a
`.exe` built from it) sitting next to this folder, just run it. It
starts a tiny local server, opens your browser to the tool
automatically, hides its own console window after a moment, and
shuts itself down on its own once you close the browser tab. Nothing
to configure.

**Manual option, if you don't have the launcher:** open a terminal in
this folder and run one of:
```
python -m http.server 8000
```
then open `http://localhost:8000` in your browser. (See the bottom of
this file for other ways to serve it.)

---

## 2. How the tool is laid out

- **Column 1 — Find a weapon.** Type a gun's name (or its internal ID,
  like `hcar`) to search. Selecting one shows a read-only panel of its
  **real current stats**, extracted directly from the game's own
  files — not guesses. This is what you're changing *from*.
- **Column 2 — Properties & operation.** Tick the stats you want to
  change, pick how to apply each one, and enter a value.
- **Column 3 — Validator, code, and export.** Checks your choices for
  mistakes before you export, shows the generated Lua and mod.txt,
  and builds the final ZIP.

You can configure as many weapons as you like in one mod — just
search for the next gun, set it up, and hit "Save this weapon's
config" again.

---

## 3. The three operations — SET, ADD, MULTIPLY

Every stat is changed one of three ways:

| Operation | What it does | Example |
|---|---|---|
| **SET** | Replaces the value completely, ignoring what it was before | `SET 120` → magazine becomes exactly 120 |
| **ADD** | Adds (or subtracts, with a negative number) to the current value | `ADD -4` on a stat currently at 16 → becomes 12 |
| **MULTIPLY** | Scales the current value by a factor | `MULTIPLY 0.7` on 16 → becomes 11.2 |

For most stats, **higher = better**, so a positive `ADD` or a
`MULTIPLY` above 1 makes it better. **Three stats are the opposite**
(see below) — the tool will show a warning if you pick a direction
that actually makes things worse.

---

## 4. What each stat actually does

### Magazine size
How many rounds fit in one magazine before reloading. Changing this
also automatically updates total carried ammo to match (mag size ×
number of reloads carried), so your total ammo scales sensibly —
you don't need to touch that separately.

### Fire rate (seconds between shots)
This is the *time gap* between shots, **not** rounds-per-minute — so
a **smaller** number means a **faster** gun. Roughly: 0.1 ≈ 600 RPM,
0.07 ≈ 857 RPM, 0.05 ≈ 1200 RPM. For fully-automatic weapons, the tool
also patches the auto-fire table to match, so tap-firing and holding
the trigger stay consistent.

### Damage
The in-game number you see in the blackmarket (e.g. "240") isn't the
raw value the game stores — it's calculated from it. Because of that,
**ADD is strongly recommended over SET** here: adding or subtracting
from the current value gives a predictable result, while setting an
absolute number won't reliably match what you expect to see on the
stat screen. The tool warns you if you pick SET on damage.

### Reload (mag not empty / mag empty)
Two separate timers, both in seconds. "Mag not empty" is a tactical
reload (some ammo left); "mag empty" is a full reload from zero.
These are direct seconds — lower is faster.

### Stability *(higher raw value is better — corrected)*
This is internally the weapon's **recoil** field, but don't let the
name fool you: it's not a literal "amount of kick" — it's a
game-balance point value, and **higher is better**, exactly like the
stat it maps to on the blackmarket screen. Confirmed independently
by community modding documentation and by direct in-game testing.
**To make a gun MORE stable:** `SET` above its current value, `ADD`
a *positive* number, or `MULTIPLY` above 1. (An earlier version of
this tool and README had this backwards — if you built a mod before
this correction, double-check any stability changes you made.)

### Accuracy *(higher raw value is better)*
Internally this is **spread**, and by the same logic as stability,
higher is better here too — not lower, despite what "spread" might
suggest. Improve it with `ADD` positive, `MULTIPLY` above 1, or `SET`
above the current value.

### Concealment
Higher is better here — a higher concealment value means less
detection risk and a lower chance of guards noticing your loadout.
Normal direction: `ADD` a positive number or `MULTIPLY` above 1 to
improve it.

### Alert size *(inverse — lower raw value is better, but unverified)*
Roughly, how large an area your presence can alert if things go loud
— smaller should be stealthier. **Unlike stability and accuracy
above, this one has not been confirmed with an actual in-game test**
— it's still based on the field name alone. Given that stability and
accuracy both turned out to work the opposite of what their names
suggested, treat this direction as a guess until someone verifies it
in-game. Change it in small steps and check the effect before relying
on it.

### Suppression
How effectively the weapon suppresses enemies (pins them down,
reduces their accuracy) while firing. Higher is better — normal
direction, same as concealment.

### Custom / unverified stat
For anything not covered above. You type the exact Lua field path
yourself (e.g. `stats.zoom`). This works for genuinely valid paths,
but if you get the field name wrong, it will silently do nothing —
the game won't error, it just won't change anything, since the field
doesn't exist. Test one at a time if you're experimenting here.

---

## 5. The validator

Before you can export, the tool checks your setup and shows either:
- **A red box** — something will actually break or fail to apply
  (non-numeric values, invalid custom paths, no weapons configured
  at all). Export is blocked until these are fixed.
- **Yellow warnings** — not blocking, but worth reading. Most common
  ones: using SET on damage (see above), or picking a direction on
  stability/accuracy/alert size that makes the stat worse instead of
  better.

---

## 6. Exporting and installing the mod

1. Fill in **Mod / folder name**, **Author**, and optionally a
   **Description** — leave the description blank to use a sensible
   default.
2. Optionally attach an **icon.png**.
3. Click **Build ZIP**. This downloads a `.zip` named after your mod,
   containing a folder with `mod.txt`, `code.lua`, and the icon if you
   added one.
4. **Unzip it directly into your PAYDAY 2 `mods` folder** (the same
   place SuperBLT/BeardLib and your other mods live) — the folder
   inside the zip should end up as a direct subfolder of `mods`, not
   nested inside another folder.
5. Launch the game. Open the BLT/Mods menu and confirm your mod shows
   up with no red error text.
6. Test the weapon in-game. If something looks wrong (or the game
   won't start), check the BLT log for errors — a bad hand-typed
   custom stat path is the most likely cause, since those aren't
   checked against the real game data the way the built-in stats are.

---

## 7. Where the data comes from (and its limits)

`data/weapons.json` (219 weapons) and `data/attachments.json` (1,878
attachment IDs) were extracted directly from the game's own
`weapontweakdata.lua` and `weaponfactorytweakdata.lua` — not
hand-typed guesses. A small number of fields (12, across the whole
weapon dataset) were left out on purpose rather than guessed at,
because they were Lua expressions referencing something else instead
of a plain number.

One known quirk worth knowing: the raw extracted value for a stat
doesn't always exactly match what you see on the in-game blackmarket
screen for that same weapon — we found one case (a sniper's magazine
size) where the displayed number was higher than the raw value,
likely due to a skill, perk, or other bonus being active when it was
checked in-game. The read-only "real values" panel in the tool always
shows the raw extracted number, which is what your SET/ADD/MULTIPLY
actually operates on — treat the in-game display as a separate,
possibly-modified view of that same underlying value.

---

## 8. Alternative ways to serve the folder (if not using the launcher)

**Node.js:**
```
npx http-server -p 8000
```

**VS Code:** install the "Live Server" extension, right-click
`index.html`, choose "Open with Live Server."

Any of these serve the folder over `http://`, which is required for
the page to load its own JSON data correctly.

## Folder structure

```
Weapon Tweak Pipeline/
├── index.html          markup + styles only
├── js/
│   ├── database.js     data layer — loads/holds weapons + attachments + property definitions
│   ├── app.js           UI layer — search, property form, validator, Lua generator, ZIP export
│   └── keepalive.js     pings the launcher so it knows the tab is still open
├── data/
│   ├── weapons.json      219 weapons with real extracted stats
│   └── attachments.json  1,878 real attachment/part IDs
└── libs/
    └── jszip.min.js     local copy, no CDN dependency
```
