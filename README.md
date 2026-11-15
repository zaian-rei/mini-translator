# Translator

A compact Tauri desktop translator with Dark and Grey Monochrome themes. It uses LibreTranslate and defaults to a server running on the same computer.

## Run the editable project

Install the project dependencies with `npm install`, then start the desktop preview:

```sh
npm run tauri dev
```

## Run LibreTranslate locally for free

On macOS, use Python 3.12 to avoid native dependency build problems with very new Python versions:

```sh
brew install python@3.12
python3.12 -m venv ~/libretranslate312
source ~/libretranslate312/bin/activate
python -m pip install libretranslate
libretranslate --load-only en,ar,bn,zh,nl,fr,de,el,hi,id,it,ja,ko,ms,fa,pl,pt,ru,es,tl,th,tr,uk,ur,vi
```

Keep the LibreTranslate terminal running while you use Translator. The app connects to `http://localhost:5000` by default and loads the language list from that server. The command enables these 25 languages; LibreTranslate downloads the needed models when it starts. The first launch may take a while.

LibreTranslate is free and open source to self-host. The app sends text to the local server at `http://localhost:5000`.

## Build for Windows, Linux, and macOS

The workflow in `.github/workflows/build-installers.yml` builds installers on native GitHub runners:

- Windows x64: MSI and setup EXE
- Linux x64: Debian package and AppImage
- macOS: DMG

Push the project to a GitHub repository to run the workflow. It runs on pushes to `main` or manually from the Actions tab, then saves installers as workflow artifacts. The workflow targets x64 Windows and Linux machines.

## Translation behavior and limits

- The app accepts up to 1,000 characters per request. Your LibreTranslate server may apply a lower limit.
- The language menus start with 25 major languages and update to the languages available from the connected LibreTranslate server. Translation pairs depend on the models installed on that server.
- Translation requires the LibreTranslate server to be running. With local models downloaded, a local server can translate without sending text to a hosted translation company.
- Spelling suggestions and autocorrection depend on the operating system's text input support and settings.
