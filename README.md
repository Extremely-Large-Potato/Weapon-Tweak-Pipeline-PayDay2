# Weapon Tweak Pipeline

Weapon Tweak Pipeline is a local **PAYDAY 2 weapon tweaking and modding tool** that lets you customize weapon stats without manually writing Lua code.

Select a weapon, modify its properties, validate your changes, and export the result as a ready-to-install PAYDAY 2 mod.

## Features

- PAYDAY 2 weapon stat editor
- Modify weapon damage
- Modify magazine size
- Modify fire rate
- Modify reload speed
- Modify accuracy and stability
- Modify concealment, suppression, alert size, and other properties
- SET, ADD, and MULTIPLY operations
- Support for multiple weapons in one mod
- Built-in configuration validator
- Automatic Lua code generation
- Automatic `mod.txt` generation
- Ready-to-install ZIP export
- Weapon database with PAYDAY 2 weapon data
- Weapon attachment database
- Custom Lua property paths
- Local launcher for easy setup

## Requirements

### Using the Launcher

The easiest way to run the application is by downloading the latest release.

The release contains the launcher executable and the `Weapon Tweak Pipeline` application folder.

The launcher and application folder must be kept together.

Your directory should look like this:

```text
Weapon Tweak Pipeline/
├── Weapon Tweak Pipeline.exe
└── Weapon Tweak Pipeline/
    ├── index.html
    ├── js/
    ├── data/
    └── libs/

Run:

Weapon Tweak Pipeline.exe

The launcher starts a local web server, opens the application in your browser, and serves the required JSON database files.

Running from Source

The Weapon Tweak Pipeline folder contains the web application itself.

The included launcher executable is provided separately through the GitHub Releases.

The source folder is not intended to be opened directly with file://, because the application loads its weapon and attachment databases using fetch().

To run the application directly from source, start a local HTTP server from inside the Weapon Tweak Pipeline folder:

python -m http.server 8000

Then open:

http://localhost:8000
Building the Launcher

The launcher can be built from launcher.py using Python and PyInstaller.

Requirements
Windows
Python 3
PyInstaller

Install PyInstaller:

python -m pip install pyinstaller

Build the executable:

python -m PyInstaller --onefile --noconsole --icon=launcher.ico --name="Weapon Tweak Pipeline" launcher.py

The executable will be created in:

dist/Weapon Tweak Pipeline.exe

After building, place the executable next to the Weapon Tweak Pipeline folder.

Project Structure
Weapon-Tweak-Pipeline-PayDay2/
├── Weapon Tweak Pipeline/
│   ├── index.html
│   ├── js/
│   │   ├── app.js
│   │   ├── database.js
│   │   └── keepalive.js
│   ├── data/
│   │   ├── weapons.json
│   │   └── attachments.json
│   └── libs/
│       └── jszip.min.js
├── launcher.py
├── README.md
├── LICENSE
└── .gitignore
How It Works

Weapon Tweak Pipeline runs locally in your browser.

The web application loads weapon and attachment data from external JSON files, applies the selected changes, validates the configuration, generates the required Lua code, and packages the result into a ZIP file.

The launcher provides the local HTTP server required by the application and automatically opens the tool in the default browser.

The web application and its database files remain outside the launcher executable so they can be updated without rebuilding the launcher.

Exported Mods

The tool can generate a ready-to-install PAYDAY 2 mod containing:

mod.txt
code.lua
Optional custom mod icon

The generated mod can then be placed in the PAYDAY 2 mods directory.

License

This project is licensed under the MIT License.
