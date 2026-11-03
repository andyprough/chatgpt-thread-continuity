# ChatGPT Thread Continuity

A **click-to-run, local-export Firefox/Mullvad Browser extension** for working across long ChatGPT conversations. It analyzes the complete **current saved conversation branch** (subject to the availability of ChatGPT's internal endpoint), estimates the length of the visible transcript, inventories upload metadata, and provides continuity-packet prompts.

**Version:** 0.2.3 · **Add-on ID:** `chatgpt-thread-continuity@local` (unchanged from 0.1.0 for upgrades).

## Features

- Retrieves the current saved ChatGPT conversation branch, including earlier messages that aren't mounted in the page DOM.
- Exports full **TXT** and **Markdown** transcripts and a **CSV upload manifest**.
- Displays message count, word count, rough visible-token estimate, upload counts, and conservative workflow guidance.
- Provides **Create first continuation packet + thread stats**, a new single-click button that copies a **generic** first-packet prompt followed by the current thread's actual measurements, ready to paste into that same chat.
- Also includes a context-integrity audit prompt, a rolling-packet update prompt, and a final transition-audit prompt.
- Lets you verify the first and final conversation excerpts before relying on the export.

**Important:** Visible-text estimates are **not** OpenAI's active context-token counts. Retrieved document passages, instructions, hidden summaries, etc. are unknown. These are conservative workflow guidelines, not OpenAI limits. Neither this extension nor its prompts guarantee complete recall.

## Quick start (temporary installation)

1. Download the source ZIP from [Releases](../../releases) or this repo's **Code → Download ZIP** (if no release is available yet).
2. Extract it, and locate the folder containing `manifest.json`.
3. In Firefox/Mullvad Browser open `about:debugging` → **This Firefox** → **Load Temporary Add-on** → select `manifest.json`.
4. Allow the extension in private windows if your browser asks.
5. Open an existing, saved ChatGPT conversation (`https://chatgpt.com/c/...`), wait for the response to finish, and click the extension toolbar icon.
6. Click **Create first continuation packet + thread stats**. Paste the copied content into the same chat.
7. Save the resulting packet as a `.md` file or ZIP when ChatGPT makes one available; keep rolling versions locally and transition at a suitable milestone.

Temporary extensions are removed when Firefox restarts.

## Permanent install / updates

Mozilla-signed XPI files are required by ordinary Firefox-family release builds. **The unsigned XPI created by the packaging script will not permanently install.** Submit an XPI to the **unlisted/self-distributed** track at [addons.mozilla.org/developers](https://addons.mozilla.org/developers/) and install the Mozilla-signed output. For easy public access, attach that signed XPI to a GitHub Release (not to the source tree). To update an existing installation, preserve the same add-on ID and submit the new version for signing.

The source ZIP is also useful for temporary installations. See [PUBLISHING.md](PUBLISHING.md) and the [manual test checklist](TESTING.md).

## Privacy & limitations

The extension is manually activated; its permissions are only `activeTab` and `scripting`. It does not send information to a third-party collection service, contain analytics, or run across arbitrary sites on a schedule. It uses your current ChatGPT signed-in session to make a same-origin request to ChatGPT's **undocumented internal conversation endpoint**; ChatGPT may change or restrict that interface. Exports are created locally and contain potentially confidential conversation text. See [PRIVACY.md](PRIVACY.md).

**Don't commit actual transcripts, source documents, or sensitive continuation packets to this public repository.** Prompts and usage estimates are not stored by the extension.

## Development

This is a plain JavaScript Manifest V2 Firefox WebExtension; no npm install or build framework is required.

```bash
node --check background.js
node --check content/exporter-main.js
node scripts/test-initial-prompt.js
bash scripts/package.sh
```

`package.sh` writes an unsigned XPI and source ZIP in `dist/` without shipping Git metadata or exported data.

## Known limitations

- Supports saved conversation URLs with `/c/<UUID>`; temporary chats or changed URL structures may not work.
- The file manifest is inferred from undocumented conversation metadata, and may be incomplete.
- Uploaded file *contents* are not embedded in transcripts and do not become magically available to the next thread.
- The extension cannot know if old parts of the thread remain in the model's active context.
- Clipboard access may be blocked by browser settings; the panel reports copy failures.

## License

**A redistribution/reuse license has not been selected yet.** The repository may be published for viewing and personal installation, but third-party redistribution or modification rights are not granted by a public GitHub repository alone. The owner can add an explicit license later (for example MIT) after deciding the desired terms.

**Compatibility:** Firefox Desktop 140.0 or later (including Mullvad Browser 15.x based on Firefox ESR 140). The manifest declares an Android minimum of 142.0 to satisfy Mozilla compatibility validation, but **Android has not been tested and is not a supported target**. Limit AMO distribution to desktop where configurable.
