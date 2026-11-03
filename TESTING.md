# Testing v0.2.3

## Automated checks performed

- `node --check background.js` — passed.
- `node --check content/exporter-main.js` — passed.
- `node scripts/test-initial-prompt.js` — passed using sample 218-message / 68,408-word / 91,211-token / 214-file / 89-upload-turn values.
- ZIP/XPI archive CRC checks — passed.

## Additional automated browser check

- Headless Chromium DOM smoke test — passed with a mocked (non-authenticated) conversation: metrics, downloads, first-packet prompt button, complete beginning/end excerpts, panel close/reopen, safe treatment of malicious-looking filename/message text, and failure-state rendering. This does not replace a test in authenticated Mullvad Browser.
- JavaScript source now contains no `innerHTML` assignments; all dynamic response, filename, and error text is inserted through DOM text nodes.
- Manifest minimum is Firefox 140.0, matching stable Mullvad Browser 15.x (Firefox ESR 140). Android remains untested; the manifest now declares a separate Android minimum of 142.0 to address the Mozilla validator warning. Distribution remains intended for Desktop Firefox only.

## Manual Firefox/Mullvad test required

Authenticated ChatGPT's internal conversation endpoint is unavailable in an offline build environment, so **the updated extension has not yet been browser-tested**.

1. Temporarily load `manifest.json` in `about:debugging`, or sign the update after verifying it.
2. On a saved ChatGPT thread click the toolbar icon and check the first and last transcript excerpts.
3. Verify TXT, Markdown, and CSV downloads still work.
4. Click **Create first continuation packet + thread stats** and paste the result into a local editor. Verify it contains the correct *current* title, message count, word totals, token estimate, upload count, upload turns, guidance, and the generic prompt.
5. Confirm the initial prompt works for a non-software conversation, such as travel or a generic document-review test.
6. Check that the three older prompt buttons still copy.
7. Check the extension reports that context figures are estimates, not actual model token usage.
8. If successful, submit v0.2.3 with the original add-on ID to Mozilla for a new signed XPI.
