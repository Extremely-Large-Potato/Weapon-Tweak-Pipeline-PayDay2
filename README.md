Markdown
# Weapon Tweak Pipeline

Weapon Tweak Pipeline is a local **PAYDAY 2 weapon tweaking and modding tool** that lets you customize weapon stats without manually writing Lua code.

Select a weapon, modify its properties, validate your changes, and export the result as a ready-to-install PAYDAY 2 mod.

## Features

- PAYDAY 2 weapon stat editor
- Modify weapon damage
- Modify magazine size
- Modify fire rate
- Modify reload speed
- Modify ammo pickup rate (Min/Max per box)
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
- Native, high-performance C# local launcher with zero antivirus false-positives

## Requirements

### Using the Launcher

The easiest way to run the application is by downloading the latest release from GitHub Releases.

The release contains the native `WeaponLauncher.exe` executable alongside the `Weapon Tweak Pipeline` application folder.

The launcher and application folder must be kept together in the same directory:

```text
Your-Mod-Folder/
├── WeaponLauncher.exe
└── Weapon Tweak Pipeline/
    ├── index.html
    ├── js/
    ├── data/
    └── libs/
Run WeaponLauncher.exe. The launcher automatically starts a local web server, opens the application in your default browser, and manages safe auto-shutdown when you close the tab.

Running from Source
The Weapon Tweak Pipeline folder contains the web application itself.

The source folder should not be opened directly via file:// protocol because the application loads its weapon and attachment databases dynamically using fetch().

To run the web app directly from source, start a local HTTP server from inside the Weapon Tweak Pipeline folder:

PowerShell
python -m http.server 8000
Then open:

Plaintext
http://localhost:8000
Building the C# Launcher
The native launcher can be built from the C# source code using .NET 8.

Requirements
.NET 8.0 SDK (or later)

Build Command
Navigate to the launcher project directory and run the following publish command to generate a standalone single-file executable:

PowerShell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o "./Publish"
The compiled executable will be created in the ./Publish directory. Place it next to the Weapon Tweak Pipeline folder.

Project Structure
Plaintext
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
├── Launcher/
│   ├── Program.cs
│   ├── WeaponLauncher.csproj
│   └── Launcher.ico
├── README.md
├── LICENSE
└── .gitignore
How It Works
Weapon Tweak Pipeline runs locally in your browser.

The web application loads weapon and attachment data from external JSON files, applies the selected changes, validates the configuration, generates the required Lua code, and packages the result into a ZIP file.

The native C# launcher provides the local HTTP server required by the application, handles heartbeat monitoring, and automatically opens the tool in the default browser.

Exported Mods
The tool can generate a ready-to-install PAYDAY 2 mod containing:

mod.txt

code.lua

Optional custom mod icon

The generated mod can be placed directly into your PAYDAY 2 mods directory.

License
This project is licensed under the MIT License.