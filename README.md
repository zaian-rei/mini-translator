# Translator

A compact Tauri desktop translator with Dark and Grey Monochrome themes. It uses LibreTranslate and defaults to a server running on the same computer.

## Run the editable project

Install the project dependencies with `npm install`, then start the desktop preview:

```sh
npm run tauri dev
```

## Run LibreTranslate locally for free

Install and open Docker Desktop (Windows or macOS), or install Docker Engine (Linux). Then run this one-line command in a terminal to download and start LibreTranslate with the 25 major languages used by this app:

```sh
docker run -d --name libretranslate -p 5000:5000 -e LT_LOAD_ONLY=en,ar,bn,zh,nl,fr,de,el,hi,id,it,ja,ko,ms,fa,pl,pt,ru,es,tl,th,tr,uk,ur,vi -v libretranslate_models:/home/libretranslate/.local:rw libretranslate/libretranslate:latest
```

Docker downloads the LibreTranslate image and its language models the first time it runs. The model volume keeps the downloaded models when you stop the server, so they do not need to be downloaded again on each start. The first start can take several minutes and needs an internet connection.

To start it again later, run `docker start libretranslate`. To stop it, run `docker stop libretranslate`. Keep it running while using Translator. The app connects to `http://localhost:5000` by default and loads the languages and supported translation pairs from that server. The 25 language choices are Arabic, Bengali, Chinese, Dutch, English, French, German, Greek, Hindi, Indonesian, Italian, Japanese, Korean, Malay, Persian, Polish, Portuguese, Russian, Spanish, Tagalog, Thai, Turkish, Ukrainian, Urdu, and Vietnamese. LibreTranslate's installed models determine which translation pairs are available.

LibreTranslate is free and open source to self-host. The app sends text to the local server at `http://localhost:5000`.

## Build for Windows, Linux, and macOS

The workflow in `.github/workflows/build-installers.yml` builds installers on native GitHub runners:

- Windows x64: MSI and setup EXE
- Linux x64: Debian package and AppImage
- macOS: DMG

Push the project to a GitHub repository to run the workflow. It runs on pushes to `main` or manually from the Actions tab, then saves installers as workflow artifacts. The workflow targets x64 Windows and Linux machines.

## Translation behavior and limits

- The app accepts up to 1,000 characters per request. Your LibreTranslate server may apply a lower limit.
- The language menus include 25 major languages and update to the languages available from the connected LibreTranslate server. Translation pairs depend on the models installed on that server.
- Translation requires the LibreTranslate server to be running. With local models downloaded, a local server can translate without sending text to a hosted translation company.
- Spelling suggestions and autocorrection depend on the operating system's text input support and settings.
