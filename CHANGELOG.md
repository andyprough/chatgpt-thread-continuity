# Changelog

## 0.2.3 — 2026-11-02

- Set separate minimum Firefox versions: desktop `gecko.strict_min_version` stays at `140.0` for Mullvad Browser / ESR 140; `gecko_android.strict_min_version` is `142.0` to satisfy the Android-specific Mozilla manifest validator.
- This Android manifest entry is for accurate compatibility metadata; Android execution remains untested and is not an intended distribution target. Set the Mozilla Add-ons platform/compatibility selection to **Desktop Firefox only**, if that control is available, and do not describe Android as supported.
- JavaScript, extension permissions, add-on ID, exports, and continuation-prompt functionality are unchanged.

# Changelog

## 0.2.2 — 2026-11-02

- Fixed Mullvad Browser 15.x installation compatibility: desktop Firefox minimum lowered from 142.0 to 140.0, which is the supported Gecko version for Mozilla built-in data-collection declarations.
- Omitted `gecko_android` in this intermediate build; Mozilla validator subsequently reported an Android minimum-version warning.
- No JavaScript or extension permissions changed; same add-on ID. Previous Mozilla-signed 0.2.1 remains cryptographically valid but requires Firefox 142+ and therefore cannot install in stable Mullvad Browser 15.x.

## 0.2.1 — 2026-11-02

- Responded to Mozilla Add-ons validation warnings: raised the Firefox minimum version to 142.0 (covers both desktop 140 and Android 142 data-collection support checks without declaring untested Android support).
- Replaced all `innerHTML` assignments with element creation and `textContent`/`replaceChildren` to prevent conversation text, attachment names, and server error messages from being interpreted as HTML.
- Retained extension ID, permissions, export formats, first-packet prompt, and existing interaction behavior.
- Added basic browser DOM smoke testing, including hostile-looking input and the API failure display.

## 0.2.0 — 2026-11-02

- Added **Create first continuation packet + thread stats** button.
- Copies a domain-neutral first-packet prompt (software, legal, tax, travel, analysis, etc.) and the current conversation's measured visible transcript statistics.
- Explicitly requires a durable baseline, milestone-based rolling updates, and a successor-thread opening prompt; does not end the current chat.
- Preserved the existing signed add-on ID and prior export, audit, rolling-update, and transition buttons.
- Added public-repository documentation, safe publishing instructions, and a source-packaging script.

## 0.1.0 — 2026-07-19

- Initial Firefox/Mullvad Browser extension: full saved branch retrieval, visible word/token estimation, TXT/Markdown downloads, attachment manifest, context guidance, and three copyable prompts.
