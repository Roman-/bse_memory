# BSE Memory Sports Trainer

Free online memory sports competition simulator. Client-side only (no backend), vanilla JS + jQuery + Bootstrap 4, no build system.

Live at: https://bestsiteever.net/memory

## Architecture

### Tech Stack
- Vanilla JavaScript with jQuery 3.3.1 for DOM manipulation
- Bootstrap 4 for responsive UI, modals, grid
- Font Awesome for icons
- DarkReader for night mode
- No build system — scripts loaded directly via `<script>` tags in `index.html`

### Project Structure
```
index.html              — Single HTML entry point, loads all scripts/styles
js/
  3rd_party/            — jQuery, Bootstrap, Popper.js
  init.js               — $(document).ready startup, hotkeys
  global.js             — Global state (Glob object)
  layouts.js            — Main page layouts: loMain(), loAbout(), loLanguage(), navbar
  game.js               — Game class: settings form, game flow (get ready → memo → distraction → recall → review)
  memo.js               — MemoEngine: item generation, display, sequence management
  wordsengine.js        — WordsEngine: dictionary metadata, loading, matching, custom dict CRUD
  dictmanager.js        — DictManager: custom dictionary management UI (fullscreen modal)
  setuplayout.js        — SetupLay/Fields: game settings form field builders
  mnemobrowser.js       — MnemoBrowser: mnemonic image lookup/learn/search/edit (fullscreen modal)
  mnemonic.js           — MnemonicEngine: mnemonic image data management
  pbtracker.js          — Personal best tracking
  saveload.js           — saveLocal()/loadLocal() localStorage wrappers
  i18n.js               — Translations (EN/RU) via tr() function and Glob.localeMap
  helpers.js            — Utilities: showBsModal(), shuffle(), msToHumanReadable(), Levenshtein distance
  darkreader.js         — DarkReader library
  tinycolor.js          — TinyColor library
  bootstrap-input-spinner.js — Numeric input spinner widget
data/dicts/             — Built-in dictionary text files (one word per line)
css/
  main.css              — Global styles
  games.css             — Game-specific styles, animations
  fa.min.css            — Font Awesome
sounds/digits_sounds/   — Audio files for spoken numbers event
img/                    — Icons and event images
```

### Navigation / Routing
Single-page app with no URL router. Pages are rendered by replacing `#mainLayout` content via jQuery:
```js
$("#mainLayout").empty().append(newContent);
```
Key layout functions: `loMain()`, `loSettings()`, `loGetReady()`, `loGame()`, `loDistraction()`, `loRecall()`, `loReview()`.

Fullscreen features (MnemoBrowser, DictManager) use Bootstrap modals via `showBsModal()`.

### Game Flow
```
Home (loMain) → Settings (loSettings) → Get Ready (loGetReady) → Game (loGame)
→ [Distraction (loDistraction)] → Recall (loRecall) → Review (loReview)
```

### Settings System
- `SetupLay.getSetupFields(setup)` returns an array of field objects `{label, descr, input, after?}` per event type
- `jqSettings()` in game.js renders them into a Bootstrap form with main/advanced sections
- `Game.setupToJson()` reads DOM values back into a setup object
- Settings persist to localStorage as `Game-{eventName}` JSON

### Persistence (localStorage)
- `saveLocal(name, value)` / `loadLocal(name, defaultValue)` in saveload.js
- Game settings: `Game-{eventName}`
- Night mode: `Glob.nightModeOn`
- Language: `memolocale`
- Mnemonic images: `MnemonicEngine.imgsRawString`
- Custom dictionaries index: `CustomDicts` (JSON object mapping keys to `{name, lang}`)
- Custom dictionary words: `CustomDict-{key}` (plain text, one word per line)

### Internationalization
- `tr(key)` in i18n.js looks up `Glob.localeMap[key][Glob.currentLocale]`
- Falls back to English (the key itself) if no translation found
- Supported locales: EN, RU

## Disciplines (Events)
1. **Numbers** — random digit sequences
2. **Binary** — 1s and 0s
3. **Words** — from selected dictionaries (built-in or custom)
4. **Spoken numbers** — audio-based digit memorization
5. **Colors** — random RGB colors with fuzzy matching

## Words / Dictionaries

### Built-in Dictionaries
Defined in `WordsEngine.dicts` (wordsengine.js). Each entry: `key => {name, descr, lang}`. Files in `data/dicts/{key}.txt`, one word per line, loaded via AJAX.

### Custom Dictionaries
- Stored in localStorage with `custom-` key prefix and `custom: true` flag in metadata
- `WordsEngine.loadCustomDicts()` merges them into `WordsEngine.dicts` at startup (called from init.js)
- `WordsEngine.cacheDict()` loads custom dicts from localStorage instead of AJAX
- CRUD: `saveCustomDict()`, `deleteCustomDict()`, `resetCustomDicts()`
- UI: `DictManager` in dictmanager.js — fullscreen modal with list/edit views
- "Manage Dictionaries" button appears below the dictionary select in Words settings
