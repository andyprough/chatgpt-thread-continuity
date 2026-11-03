# Publishing to GitHub and installing permanently

Repository name suggestion: **`andyprough/chatgpt-thread-continuity`**.

## Before publication

- Confirm there are **no actual conversation exports, case files, client materials, keys, cookies, or browser profiles** in this directory.
- Decide whether to add an explicit open-source license. None has been chosen; publishing source by itself does not grant permission to reuse.
- Avoid committing Mozilla-signed XPI files into the git history; attach the signed XPI to a GitHub Release instead.

## Create the repository with GitHub CLI

Run these commands **from the extracted source directory** on a machine already authenticated to your intended GitHub account (`gh auth login`).

```bash
gh auth status
git init
git add .
git commit -m "Initial public source: ChatGPT Thread Continuity 0.2.3"
git branch -M main
gh repo create andyprough/chatgpt-thread-continuity --public --source . --remote origin --push
```

**If that repository already exists**, do not run the create command. Instead inspect its state and add/push to the existing repo intentionally; don't overwrite existing branches.

## Create an unsigned package

```bash
bash scripts/package.sh
```

This creates `dist/chatgpt-thread-continuity-0.2.3-unsigned.xpi` and `dist/chatgpt-thread-continuity-0.2.3-source.zip`. The unsigned XPI is for Mozilla signing, not permanent end-user installation.

## Signing, upgrading, and discoverability

1. Sign in to the Mozilla Add-on Developer Hub.
2. Locate the existing **unlisted/self-distributed** add-on matching ID `chatgpt-thread-continuity@local`.
3. Upload a **new version** `0.2.3`, not an unrelated new add-on; retain the existing ID so Firefox recognizes it as an update.
4. Download Mozilla's signed XPI.
5. On GitHub, create a Release/tag `v0.2.3`, and attach the **signed** XPI and source ZIP.
6. Put the GitHub Release link at the top of the README, and add repository description/topics such as `firefox-extension`, `mullvad-browser`, `chatgpt`, `conversation-export`, `continuity`.

For permanent installs: `about:addons` → gear → **Install Add-on From File…** → signed XPI. Allow use in private windows if prompted.

The extension fetches ChatGPT's undocumented internal API; future browser/ChatGPT changes may require maintenance. Sign and publish new versions, without changing the add-on ID.

## Mozilla Add-ons validator and desktop/Android compatibility (0.2.3)

The 0.2.2 package passed with one warning because Firefox for Android introduced `data_collection_permissions` support in version 142, whereas Firefox Desktop introduced it in version 140. Version 0.2.3 explicitly declares **different** minimums in the manifest:

```json
"browser_specific_settings": {
  "gecko": {
    "id": "chatgpt-thread-continuity@local",
    "strict_min_version": "140.0",
    "data_collection_permissions": {"required": ["none"]}
  },
  "gecko_android": {"strict_min_version": "142.0"}
}
```

**Important**: Adding a `gecko_android` key may signal that Android is eligible to AMO. The extension is currently developed for and tested only on desktop Firefox/Mullvad Browser. In Mozilla Add-ons version/platform settings, select or retain **Firefox Desktop only**, if possible, and do not claim Android support. Should the AMO workflow automatically enable Android and not allow it to be disabled, we should prefer accurate desktop-only distribution with an innocuous warning rather than distributing an untested Android add-on.

Submit the **unsigned XPI inside the distribution ZIP** to the existing unlisted Mozilla listing, and install the newly signed output after validation. The v0.2.3 build retains the same add-on ID and existing code/permissions. The AMO site is the authoritative source of final validation results; local checks cannot guarantee zero warnings.
