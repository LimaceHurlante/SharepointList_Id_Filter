# SharePoint Filter ID

Quickly filter any SharePoint list by **ID** straight from your Chrome / Edge toolbar.

## Features
- Injects the URL parameters `FilterField1=ID`, `FilterValue1=<your ID>`, `FilterType1=Counter`.
- Clean popup (shortcut **Alt + Shift + S**) with auto‑focus on the ID field.
- Automatic 🇬🇧 / 🇫🇷 locale using the `chrome.i18n` API.

## Quick install
### Chrome / Edge (Developer Mode)
1. Clone or download this repo.
2. Open `chrome://extensions` **or** `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the folder.

### Uninstall
Remove it from the extensions page (bin icon on Chrome, *Remove* on Edge).

## Usage
1. Navigate to any SharePoint list view.
2. Click the **SP Filter** icon.
3. Enter the target ID and hit **Enter** or **OK**.
4. The page reloads with the filter applied and the popup auto‑closes.

## Development notes
- Manifest V3 only, no remote scripts.
- Translations live in `_locales/`.
- Run directly:
  ```bash
  # Chrome
  chrome --load-extension=$(pwd)
  ```
- Increment the `version` field in `manifest.json` before every tag.

## Publishing later
A complete Chrome Web Store & Edge Add‑ons checklist is available in `docs/publishing.md`.

## License
MIT – see LICENSE.

## Author
[Zacharie Cortes](https://www.linkedin.com/in/zacharie-cortes-b3b87517/)

