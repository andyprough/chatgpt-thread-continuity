# Privacy and data handling

- The extension runs only after its toolbar button is clicked on an active ChatGPT page.
- Browser permissions: `activeTab`, `scripting`. It has no persistent content script and no telemetry.
- To fetch the selected conversation's stored branch, it reads the active ChatGPT session and makes an authenticated **same-origin request to ChatGPT**. This is a network request to the service you're already using; it is not an upload to a separate analytics service.
- The temporary access token is held transiently in script memory; it is not written to a file, displayed, or logged intentionally.
- Transcript and manifest files are generated in the browser and downloaded only on user request.
- The initial Continuation Packet prompt puts **aggregate statistics and the conversation title**, not the transcript or attachment filenames, on the clipboard. The user decides whether to paste it into ChatGPT.
- Files downloaded by the user can be sensitive. Store them carefully. Never publish transcripts, source files or continuation packets in the code repository.
- The internal ChatGPT endpoint is undocumented and may change without notice. Its future behavior and retention rules are outside this extension's control.
