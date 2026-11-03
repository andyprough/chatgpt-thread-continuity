(() => {
  "use strict";

  const APP_ID = "__chatgpt_thread_continuity_app";
  const APP_VERSION = "0.2.1";
  const PREFIX = "[thread-continuity]";

  const PROMPTS = {
    audit: `Perform a context-integrity audit before we continue. Do not draft new complaint language, do not search the web, and do not ask me to restate prior facts. Based only on what you presently retain from this project and conversation, provide:\n\n1. The governing complaint-drafting instructions.\n2. The current complaint structure and the sections already drafted or revised.\n3. The 20 most important established facts.\n4. A concise chronology of the most important dates and events.\n5. The principal actors and entities and each one's role.\n6. The factual and legal conclusions we have already settled.\n7. The issues that remain unresolved or require more evidence.\n8. The important drafting decisions already made.\n9. The precise task we were about to undertake next.\n\nFor each section, identify anything you are uncertain about, cannot presently recover, or believe may conflict with an earlier fact or decision. Do not fill gaps by guessing. At the end, identify any material facts, instructions, chronology, or drafting decisions that may no longer be reliably available, and recommend either CONTINUE or PREPARE CONTINUATION PACKET.`,

    rolling: `Update the rolling continuation packet through the present message. This is not yet a request to start a new conversation. Preserve enough information that a new GPT-5.6 Sol conversation could continue the project without relying on this thread.\n\nInclude:\n\n1. Governing drafting instructions.\n2. Current complaint draft or exact location of the authoritative draft.\n3. Condensed master chronology.\n4. Actor and entity index.\n5. Established facts and conclusions.\n6. Facts expressly marked uncertain or disputed.\n7. Source, exhibit, and document references.\n8. Drafting decisions already made, including rejected approaches.\n9. Open factual and legal questions.\n10. Sections completed, sections pending, and the precise next task.\n11. Any warnings against conflating similar people, entities, transactions, dates, or allegations.\n\nDo not invent missing material. Clearly distinguish source-supported facts, working conclusions, unresolved questions, and drafting instructions. Make this cumulative by preserving all still-current material from the previous continuation packet and incorporating everything material learned since then.`,

    final: `Conduct a final transition audit. Compare the present project state with the most recent continuation packet. Identify every material fact, source reference, drafting decision, unresolved issue, or instruction developed since that packet. Then produce a complete replacement continuation packet—not merely an addendum—and finish with the exact opening prompt for the next conversation.`
  };

  const previous = document.getElementById(APP_ID);
  if (previous) {
    if (Array.isArray(previous.__threadObjectUrls)) {
      for (const url of previous.__threadObjectUrls) {
        try { URL.revokeObjectURL(url); } catch {}
      }
    }
    previous.remove();
  }

  const host = document.createElement("div");
  host.id = APP_ID;
  host.style.position = "fixed";
  host.style.top = "14px";
  host.style.right = "14px";
  host.style.zIndex = "2147483647";
  host.style.width = "min(480px, calc(100vw - 28px))";
  host.style.maxHeight = "calc(100vh - 28px)";
  host.style.display = "block";

  const shadow = host.attachShadow({ mode: "open" });
  document.documentElement.appendChild(host);

  // Create the static interface through the DOM rather than parsing HTML strings.
  // This also prevents untrusted conversation data from becoming executable markup.
  const stylesheet = document.createElement("style");
  stylesheet.textContent = `
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      .panel {
        --bg: #ffffff;
        --surface: #f7f7f8;
        --text: #202123;
        --muted: #5f6368;
        --border: #d8dadd;
        --accent: #0b7a5c;
        --accent-strong: #096348;
        --warning-bg: #fff8e6;
        --warning-border: #d6a100;
        --danger-bg: #fff0f0;
        --danger-border: #c0392b;
        width: 100%;
        max-height: calc(100vh - 28px);
        overflow: auto;
        background: var(--bg);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 10px 34px rgba(0, 0, 0, 0.28);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        line-height: 1.45;
      }
      @media (prefers-color-scheme: dark) {
        .panel {
          --bg: #202123;
          --surface: #2b2c2f;
          --text: #f2f2f2;
          --muted: #b8bcc2;
          --border: #46484d;
          --accent: #21b38a;
          --accent-strong: #2bc99b;
          --warning-bg: #3c321c;
          --warning-border: #d6a100;
          --danger-bg: #402627;
          --danger-border: #e0675d;
        }
      }
      .header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px 12px;
        background: var(--bg);
        border-bottom: 1px solid var(--border);
      }
      .title { margin: 0; font-size: 17px; font-weight: 700; }
      .subtitle { margin-top: 2px; color: var(--muted); font-size: 12px; }
      .close {
        flex: 0 0 auto;
        width: 30px;
        height: 30px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
        color: var(--text);
        font-size: 19px;
        line-height: 1;
        cursor: pointer;
      }
      .body { padding: 14px 16px 16px; }
      .status {
        padding: 12px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 9px;
      }
      .status strong { display: block; margin-bottom: 3px; }
      .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        margin-right: 7px;
        border: 2px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        vertical-align: -2px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .error { background: var(--danger-bg); border-color: var(--danger-border); }
      .metrics {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 12px;
      }
      .metric {
        min-width: 0;
        padding: 10px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 9px;
      }
      .metric-label { color: var(--muted); font-size: 12px; }
      .metric-value { margin-top: 2px; font-size: 18px; font-weight: 700; overflow-wrap: anywhere; }
      .guidance {
        margin-top: 12px;
        padding: 11px 12px;
        background: var(--warning-bg);
        border: 1px solid var(--warning-border);
        border-radius: 9px;
      }
      .guidance strong { display: block; margin-bottom: 3px; }
      .section { margin-top: 15px; }
      .section h3 { margin: 0 0 8px; font-size: 14px; }
      .button-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      button, a.download {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
        padding: 8px 10px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
        color: var(--text);
        text-decoration: none;
        text-align: center;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      button:hover, a.download:hover { border-color: var(--accent); }
      .primary { background: var(--accent) !important; color: #ffffff !important; border-color: var(--accent) !important; }
      .primary:hover { background: var(--accent-strong) !important; }
      .full { grid-column: 1 / -1; }
      .small { color: var(--muted); font-size: 12px; }
      details {
        margin-top: 12px;
        border: 1px solid var(--border);
        border-radius: 9px;
        background: var(--surface);
      }
      summary { padding: 9px 11px; cursor: pointer; font-weight: 600; }
      .details-content { padding: 0 11px 11px; }
      pre {
        max-height: 120px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        margin: 7px 0 0;
        padding: 8px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--bg);
        color: var(--text);
        font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      .manifest-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .manifest-table th, .manifest-table td {
        padding: 6px 5px;
        border-bottom: 1px solid var(--border);
        text-align: left;
        vertical-align: top;
        overflow-wrap: anywhere;
      }
      .toast {
        position: sticky;
        bottom: 8px;
        margin: 12px auto 0;
        width: fit-content;
        max-width: 100%;
        padding: 7px 10px;
        border-radius: 999px;
        background: var(--text);
        color: var(--bg);
        font-size: 12px;
        opacity: 0;
        transform: translateY(4px);
        pointer-events: none;
        transition: opacity 0.15s ease, transform 0.15s ease;
      }
      .toast.show { opacity: 1; transform: translateY(0); }
      .caveat { margin-top: 14px; color: var(--muted); font-size: 12px; }
      @media (max-width: 420px) {
        .metrics, .button-grid { grid-template-columns: 1fr; }
        .full { grid-column: auto; }
      }
`;
  shadow.appendChild(stylesheet);

  function el(tag, className = "", content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = String(content);
    return node;
  }

  function add(parent, ...children) {
    parent.append(...children);
    return parent;
  }

  function sectionWithTitle(title) {
    const section = el("div", "section");
    add(section, el("h3", "", title));
    return section;
  }

  function detailsWithContent(title, content) {
    const details = el("details");
    add(details, el("summary", "", title), add(el("div", "details-content"), ...content));
    return details;
  }

  const panel = el("section", "panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "ChatGPT Thread Continuity");

  const header = el("div", "header");
  const heading = add(
    el("div"),
    el("h2", "title", "ChatGPT Thread Continuity"),
    el("div", "subtitle", `Version ${APP_VERSION} · local browser-side analysis`)
  );
  const dismiss = el("button", "close", "×");
  dismiss.type = "button";
  dismiss.setAttribute("aria-label", "Close");
  add(header, heading, dismiss);

  const body = el("div", "body");
  const loading = el("div", "status");
  loading.id = "status";
  const spinner = el("span", "spinner");
  const loadingTitle = el("strong", "", "Retrieving complete conversation…");
  loadingTitle.style.display = "inline";
  const loadingHelp = el("div", "small", "Reading the currently selected branch from ChatGPT's conversation data.");
  loadingHelp.style.marginTop = "5px";
  add(loading, spinner, loadingTitle, loadingHelp);

  const resultsContainer = el("div");
  resultsContainer.id = "results";
  const toastContainer = el("div", "toast");
  toastContainer.id = "toast";
  toastContainer.setAttribute("aria-live", "polite");
  add(body, loading, resultsContainer, toastContainer);
  add(panel, header, body);
  shadow.appendChild(panel);

  const closeButton = shadow.querySelector(".close");
  const statusBox = shadow.getElementById("status");
  const results = shadow.getElementById("results");
  const toast = shadow.getElementById("toast");
  const objectUrls = [];
  host.__threadObjectUrls = objectUrls;

  function closePanel() {
    for (const url of objectUrls) {
      URL.revokeObjectURL(url);
    }
    host.remove();
  }

  closeButton.addEventListener("click", closePanel);

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
  }


  function formatNumber(value) {
    return new Intl.NumberFormat().format(value);
  }

  function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) {
      return "";
    }
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let size = bytes;
    let index = -1;
    do {
      size /= 1024;
      index += 1;
    } while (size >= 1024 && index < units.length - 1);
    return `${size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[index]}`;
  }

  function countWords(text) {
    const matches = String(text || "").trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  function cleanText(text) {
    return String(text || "").replace(/\u0000/g, "").trim();
  }

  function decodeJwtPayload(token) {
    const segments = token.split(".");
    if (segments.length < 2) {
      throw new Error("The session access token was not a valid JWT.");
    }
    let base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  }

  function linearizeCurrentBranch(conversation) {
    const nodes = [];
    const visited = new Set();
    let nodeId = conversation.current_node;

    while (nodeId && conversation.mapping[nodeId] && !visited.has(nodeId)) {
      visited.add(nodeId);
      const node = conversation.mapping[nodeId];
      nodes.push({ nodeId, node });
      nodeId = node.parent;
    }

    nodes.reverse();
    return nodes;
  }

  function extractText(message) {
    const content = message.content || {};

    if (Array.isArray(content.parts)) {
      return content.parts
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && typeof part.text === "string") return part.text;
          return "";
        })
        .filter(Boolean)
        .join("\n");
    }

    if (typeof content.text === "string") return content.text;
    if (typeof content.content === "string") return content.content;
    return "";
  }

  function isVisibleConversationMessage(message) {
    if (!message || message.metadata?.is_visually_hidden_from_conversation) return false;
    const role = message.author?.role;
    if (role === "user") return true;
    if (role !== "assistant") return false;
    if (message.recipient && message.recipient !== "all") return false;
    if (message.channel === "analysis") return false;
    if (message.metadata?.reasoning_status === "is_reasoning") return false;
    if (message.metadata?.is_thinking_preamble_message) return false;
    const contentType = message.content?.content_type;
    if (contentType === "reasoning_recap" || contentType === "thoughts") return false;
    return true;
  }

  function firstString(object, keys) {
    for (const key of keys) {
      if (typeof object?.[key] === "string" && object[key].trim()) return object[key].trim();
    }
    return "";
  }

  function firstNumber(object, keys) {
    for (const key of keys) {
      const value = Number(object?.[key]);
      if (Number.isFinite(value) && value >= 0) return value;
    }
    return null;
  }

  function looksLikeFilename(value) {
    return typeof value === "string" && /(?:^|[^/\\])[^/\\]+\.[A-Za-z0-9]{1,10}$/.test(value.trim());
  }

  function classifyAttachment(mime, filename) {
    const value = `${mime || ""} ${filename || ""}`.toLowerCase();
    if (/image\//.test(value) || /\.(?:png|jpe?g|gif|webp|bmp|svg|tiff?)\b/.test(value)) return "Image";
    if (/pdf|word|officedocument|opendocument|text\/|csv|spreadsheet|excel|presentation|powerpoint/.test(value)) return "Document";
    return "File";
  }

  function extractAttachments(message, turnNumber) {
    const found = [];
    const seenObjects = new WeakSet();

    function addCandidate(object, forced = false) {
      if (!object || typeof object !== "object") return;

      const filename = firstString(object, ["name", "filename", "file_name", "display_name", "original_name"]);
      const mime = firstString(object, ["mime_type", "mimeType", "file_type"]);
      const contentType = firstString(object, ["content_type", "type"]);
      const id = firstString(object, ["file_id", "asset_pointer", "asset_id", "id", "upload_id"]);
      const size = firstNumber(object, ["size_bytes", "file_size", "bytes", "size"]);
      const fileSignal = forced || Boolean(filename) || /(?:file|image)_asset_pointer/i.test(contentType) || /^(?:file-service|sediment):\/\//i.test(id);

      if (!fileSignal) return;
      if (!filename && !mime && !id) return;

      found.push({
        turn: turnNumber,
        name: filename || "(name unavailable)",
        mime: mime || (contentType.includes("/") ? contentType : ""),
        size,
        id,
        kind: classifyAttachment(mime || contentType, filename)
      });
    }

    function walk(value, depth = 0, forced = false) {
      if (!value || typeof value !== "object" || depth > 6) return;
      if (seenObjects.has(value)) return;
      seenObjects.add(value);

      if (Array.isArray(value)) {
        for (const item of value) walk(item, depth + 1, forced);
        return;
      }

      addCandidate(value, forced);

      for (const [key, child] of Object.entries(value)) {
        if (!child || typeof child !== "object") continue;
        const childForced = forced || /^(?:attachments?|files?|uploads?)$/i.test(key);
        walk(child, depth + 1, childForced);
      }
    }

    if (Array.isArray(message.metadata?.attachments)) walk(message.metadata.attachments, 0, true);
    if (Array.isArray(message.metadata?.files)) walk(message.metadata.files, 0, true);
    if (Array.isArray(message.content?.parts)) walk(message.content.parts, 0, false);

    return found;
  }

  function deduplicateAttachments(items) {
    const map = new Map();
    for (const item of items) {
      const key = item.id || `${item.turn}|${item.name}|${item.mime}|${item.size ?? ""}`;
      const existing = map.get(key);
      if (!existing || (existing.name === "(name unavailable)" && item.name !== existing.name)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.turn - b.turn || a.name.localeCompare(b.name));
  }

  function csvEscape(value) {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function safeFilename(value) {
    return String(value || "ChatGPT thread")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) || "ChatGPT thread";
  }

  function getGuidance(wordCount, attachmentCount, uploadTurns) {
    let level;
    let title;
    let text;

    if (wordCount < 50000) {
      level = 0;
      title = "Comfortable visible-transcript range";
      text = "Continue working normally, while updating the rolling packet at natural drafting milestones.";
    } else if (wordCount < 80000) {
      level = 1;
      title = "Maintain the rolling continuation packet";
      text = "The visible transcript is substantial. Keep the cumulative packet current before starting another major drafting phase.";
    } else if (wordCount < 110000) {
      level = 2;
      title = "Plan a transition at the next natural boundary";
      text = "Consider moving to a clean thread after the current section or document batch, while recall is still strong.";
    } else {
      level = 3;
      title = "A clean-thread transition is advisable";
      text = "The visible transcript alone is very large. Prepare a complete replacement continuation packet before further major drafting.";
    }

    const documentHeavy = attachmentCount >= 10 || uploadTurns >= 6;
    if (documentHeavy) {
      text += " This is also a document-heavy thread, so retrieved file passages may consume additional unmeasured context; consider acting one stage earlier.";
    }

    return { level, title, text, documentHeavy };
  }

  // This snapshot is deliberately NOT an exact context-token or usage reading.
  // It is built only from the stored visible conversation branch retrieved above.
  function buildInitialPacketPrompt(data) {
    const attachmentCount = data.attachments.length;
    const contextSnapshot = [
      "THREAD CONTINUITY SNAPSHOT (from the browser extension)",
      `Conversation title: ${data.title}`,
      `Analysis time: ${data.extractedAt}`,
      `Visible messages: ${formatNumber(data.messages.length)}`,
      `Visible transcript words: ${formatNumber(data.totalWords)}`,
      `Estimated visible transcript tokens: ~${formatNumber(data.estimatedTokens)} (roughly words / 0.75)`,
      `User words: ${formatNumber(data.userWords)}`,
      `Assistant words: ${formatNumber(data.assistantWords)}`,
      `Uploaded files detected in thread metadata: ${formatNumber(attachmentCount)}`,
      `Message turns with detected uploads: ${formatNumber(data.uploadTurns)}`,
      `Conservative workflow guidance: ${data.guidance.title}`,
      `Guidance detail: ${data.guidance.text}`,
      "Important: This is only an estimate of VISIBLE conversation text, NOT a measure of live model context. It excludes hidden instructions, source-document text retrieved for processing, tool results not represented in the visible transcript, model-side compression, and reserved output. The active model's window and percentage used cannot be inferred reliably. File metadata may be incomplete."
    ].join("\n");

    const request = `Please create the FIRST ROLLING CONTINUATION PACKET for the work in THIS conversation. This is continuity preparation, not a request to end this thread; we will keep working here until an appropriate handoff point. Use the thread and project material you can actually access, without assuming that the full saved conversation or every uploaded file remains in your active context. Do not browse externally unless the work already requires source verification.\n\nYour objective: produce a standalone, actionable packet that a NEW ChatGPT conversation could use to resume work with minimal re-explanation and without silently losing important instructions, decisions, evidence, or project state. Make the packet domain-neutral in structure: use only the sections relevant to this project (for example software development, legal drafting, taxes, travel, research, or document analysis).\n\nInclude, where applicable:\n1. Project title, purpose, current objectives, scope, and what success looks like.\n2. The user's controlling preferences and constraints, especially instructions that must not change.\n3. Current state and work completed; authoritative drafts, deliverables, versions, and where they reside.\n4. Decisions already made, their reasons, alternatives rejected, and unresolved choices.\n5. A chronology or milestone history with relevant dates and exact facts, where the sequence matters.\n6. Important people, organizations, repositories, tools, documents, filenames, source citations, and their roles.\n7. Technical state when applicable: environment, OS, versions, paths, branches, commits, configuration, commands, known bugs, tests performed and results, and uncommitted work.\n8. Analytical/legal/financial state when applicable: source-supported facts, calculations, assumptions, methodologies, issues, disputed facts, evidence or exhibit mappings, and open questions.\n9. Active risks, caveats, outstanding blockers, dependencies, and things not to repeat or accidentally overwrite.\n10. Prioritized next actions, including the EXACT point at which we stopped.\n11. A ready-to-copy opening prompt for the successor conversation, identifying which local files or source artifacts must be supplied again.\n12. A concise checklist for updating this packet at future milestones, with a version number (start at v1), date, and change log.\n\nAccuracy and handoff rules:\n- Separate established/source-supported information from interpretations, inferences, open questions, and unsupported or inaccessible details.\n- Preserve exact names, versions, amounts, dates, commands and decisions when reliably available; do not invent missing information.\n- Do NOT claim you read files or conversation portions that are not available to you. List inaccessible or possibly missing materials explicitly.\n- Do not insert passwords, API keys, access tokens, privileged secrets, or unnecessary personally identifying information.\n- Keep substantive detail while avoiding irrelevant chit-chat and unnecessary raw document duplication.\n- If a continuation packet already exists, identify the authoritative version and update/reconcile it rather than creating a competing first baseline.\n- In future turns, propose a cumulative packet update at meaningful project milestones, not after every message. Updates happen only within our active conversation; never claim to update files in the background. Keep versioned copies, record what changed, and do not retire the current thread prematurely.\n- The extension statistics below are a ROUGH VISIBLE-TRANSCRIPT ESTIMATE ONLY. Do not treat them as an exact context meter, remaining-token count, or proof that older information is still available.\n\nDeliver a well-organized Markdown packet that I can save locally. If file creation is available, also provide a downloadable .md file; a ZIP with the packet and successor-thread opening prompt is welcome if supported. Otherwise provide copyable Markdown in the response. Conclude by listing any gaps I should verify against local records before treating the packet as authoritative.\n\n${contextSnapshot}`;

    return request;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-10000px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const succeeded = document.execCommand("copy");
      textarea.remove();
      return succeeded;
    }
  }

  function createDownload(name, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    objectUrls.push(url);
    return { name, url };
  }

  function buildPlainText(data) {
    const lines = [
      `Conversation: ${data.title}`,
      `Conversation ID: ${data.conversationId}`,
      `Extracted: ${data.extractedAt}`,
      `Visible messages: ${data.messages.length}`,
      `Visible words: ${data.totalWords}`,
      `Estimated visible tokens: ${data.estimatedTokens}`,
      `User words: ${data.userWords}`,
      `ChatGPT words: ${data.assistantWords}`,
      `Uploaded files found: ${data.attachments.length}`,
      "",
      "IMPORTANT LIMITATION",
      "This estimates the stored visible user/assistant transcript only. It cannot measure hidden instructions, retrieved file passages, internal summaries, tool context, reserved output capacity, or exact remaining model context.",
      "",
      "=".repeat(72),
      "",
      "UPLOADED-FILE MANIFEST",
      ""
    ];

    if (data.attachments.length === 0) {
      lines.push("No uploaded-file metadata was found in the selected conversation branch.");
    } else {
      for (const item of data.attachments) {
        lines.push(`Turn ${item.turn} | ${item.kind} | ${item.name}${item.mime ? ` | ${item.mime}` : ""}${item.size != null ? ` | ${formatBytes(item.size)}` : ""}`);
      }
    }

    lines.push("", "=".repeat(72), "", "TRANSCRIPT", "");

    for (const message of data.messages) {
      const heading = message.role === "user" ? "USER" : message.channel === "commentary" ? "CHATGPT — COMMENTARY" : "CHATGPT";
      lines.push(`[Turn ${message.turn}] ${heading}`);
      if (message.timestamp) lines.push(message.timestamp);
      lines.push("", message.text, "", "=".repeat(72), "");
    }

    return lines.join("\n");
  }

  function markdownCell(value) {
    return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  }

  function buildMarkdown(data) {
    const lines = [
      `# ${data.title}`,
      "",
      `- **Conversation ID:** \`${data.conversationId}\``,
      `- **Extracted:** ${data.extractedAt}`,
      `- **Visible messages:** ${formatNumber(data.messages.length)}`,
      `- **Visible words:** ${formatNumber(data.totalWords)}`,
      `- **Estimated visible tokens:** ${formatNumber(data.estimatedTokens)}`,
      `- **User words:** ${formatNumber(data.userWords)}`,
      `- **ChatGPT words:** ${formatNumber(data.assistantWords)}`,
      `- **Uploaded files found:** ${formatNumber(data.attachments.length)}`,
      "",
      "> **Limitation:** This estimates the stored visible user/assistant transcript only. It cannot measure hidden instructions, retrieved file passages, internal summaries, tool context, reserved output capacity, or exact remaining model context.",
      "",
      "## Uploaded-file manifest",
      ""
    ];

    if (data.attachments.length === 0) {
      lines.push("No uploaded-file metadata was found in the selected conversation branch.");
    } else {
      lines.push("| Turn | Kind | Name | MIME type | Size |", "|---:|---|---|---|---:|");
      for (const item of data.attachments) {
        lines.push(`| ${item.turn} | ${markdownCell(item.kind)} | ${markdownCell(item.name)} | ${markdownCell(item.mime)} | ${markdownCell(item.size != null ? formatBytes(item.size) : "")} |`);
      }
    }

    lines.push("", "## Transcript", "");

    for (const message of data.messages) {
      const heading = message.role === "user" ? "User" : message.channel === "commentary" ? "ChatGPT — Commentary" : "ChatGPT";
      lines.push(`### Turn ${message.turn} — ${heading}`, "");
      if (message.timestamp) lines.push(`_${message.timestamp}_`, "");
      lines.push(message.text, "");
    }

    return lines.join("\n");
  }

  function buildManifestCsv(data) {
    const rows = [["turn", "kind", "name", "mime_type", "size_bytes", "formatted_size", "identifier"]];
    for (const item of data.attachments) {
      rows.push([item.turn, item.kind, item.name, item.mime, item.size ?? "", item.size != null ? formatBytes(item.size) : "", item.id]);
    }
    return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  }

  async function run() {
    try {
      const idMatch = location.pathname.match(/\/c\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?#]|$)/i);
      if (!idMatch) {
        throw new Error("Open a saved ChatGPT conversation whose URL contains /c/<conversation-id>, then click the extension button again.");
      }

      const conversationId = idMatch[1];
      const sessionResponse = await fetch(`${location.origin}/api/auth/session`, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });

      if (!sessionResponse.ok) {
        throw new Error(`Could not read the signed-in ChatGPT session (HTTP ${sessionResponse.status}).`);
      }

      const session = await sessionResponse.json();
      const accessToken = session.accessToken;
      if (!accessToken || typeof accessToken !== "string") {
        throw new Error("The ChatGPT session response did not contain an access token.");
      }

      const claims = decodeJwtPayload(accessToken);
      const openAiAuth = claims["https://api.openai.com/auth"] || {};
      const accountId = openAiAuth.chatgpt_account_id || null;
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`
      };
      if (accountId) headers["chatgpt-account-id"] = accountId;

      const conversationResponse = await fetch(`${location.origin}/backend-api/conversation/${conversationId}`, {
        credentials: "include",
        cache: "no-store",
        headers
      });

      if (!conversationResponse.ok) {
        let detail = "";
        try {
          detail = (await conversationResponse.text()).slice(0, 240);
        } catch {
          detail = "";
        }
        throw new Error(`Conversation request failed (HTTP ${conversationResponse.status})${detail ? `: ${detail}` : ""}`);
      }

      const conversation = await conversationResponse.json();
      if (!conversation?.mapping || !conversation?.current_node) {
        throw new Error("ChatGPT returned conversation data without a complete current branch.");
      }

      const branch = linearizeCurrentBranch(conversation);
      const messages = [];
      const attachments = [];
      let visibleTurn = 0;

      for (const { nodeId, node } of branch) {
        const message = node.message;
        if (!message || !isVisibleConversationMessage(message)) continue;
        const text = cleanText(extractText(message));
        if (!text) continue;

        visibleTurn += 1;
        const role = message.author?.role;
        const timestampValue = Number(message.create_time);
        const timestamp = Number.isFinite(timestampValue) && timestampValue > 0
          ? new Date(timestampValue * 1000).toLocaleString()
          : "";

        messages.push({
          turn: visibleTurn,
          nodeId,
          messageId: message.id || "",
          role,
          channel: message.channel || "",
          timestamp,
          text,
          words: countWords(text)
        });

        if (role === "user") {
          attachments.push(...extractAttachments(message, visibleTurn));
        }
      }

      if (messages.length === 0) {
        throw new Error("No visible user or assistant messages were found in the selected conversation branch.");
      }

      const uniqueAttachments = deduplicateAttachments(attachments);
      const userWords = messages.filter((item) => item.role === "user").reduce((sum, item) => sum + item.words, 0);
      const assistantWords = messages.filter((item) => item.role === "assistant").reduce((sum, item) => sum + item.words, 0);
      const totalWords = userWords + assistantWords;
      const estimatedTokens = Math.round(totalWords / 0.75);
      const uploadTurns = new Set(uniqueAttachments.map((item) => item.turn)).size;
      const title = conversation.title || document.title || "ChatGPT conversation";
      const guidance = getGuidance(totalWords, uniqueAttachments.length, uploadTurns);
      const extractedAt = new Date().toLocaleString();

      const data = {
        title,
        conversationId,
        extractedAt,
        messages,
        attachments: uniqueAttachments,
        userWords,
        assistantWords,
        totalWords,
        estimatedTokens,
        uploadTurns,
        guidance
      };

      const date = new Date().toISOString().slice(0, 10);
      const baseName = `${safeFilename(title)}-${date}`;
      const textDownload = createDownload(`${baseName}-complete.txt`, buildPlainText(data), "text/plain;charset=utf-8");
      const markdownDownload = createDownload(`${baseName}-complete.md`, buildMarkdown(data), "text/markdown;charset=utf-8");
      const csvDownload = createDownload(`${baseName}-file-manifest.csv`, buildManifestCsv(data), "text/csv;charset=utf-8");

      statusBox.replaceChildren(
        el("strong", "", "Complete current branch retrieved"),
        el("div", "small", "The first and last saved excerpts are available below for verification.")
      );

      const metricGrid = el("div", "metrics");
      for (const [label, value] of [
        ["Visible messages", formatNumber(messages.length)],
        ["Visible words", formatNumber(totalWords)],
        ["Estimated visible tokens", `~${formatNumber(estimatedTokens)}`],
        ["Uploaded files found", formatNumber(uniqueAttachments.length)]
      ]) {
        add(metricGrid, add(
          el("div", "metric"),
          el("div", "metric-label", label),
          el("div", "metric-value", value)
        ));
      }

      const guidanceBox = add(
        el("div", "guidance"),
        el("strong", "", guidance.title),
        el("div", "", guidance.text)
      );

      const downloadSection = sectionWithTitle("Download local records");
      const downloadGrid = el("div", "button-grid");
      for (const [download, className, label] of [
        [textDownload, "download primary", "Download TXT"],
        [markdownDownload, "download", "Download Markdown"],
        [csvDownload, "download full", "Download file manifest CSV"]
      ]) {
        const link = el("a", className, label);
        link.href = download.url;
        link.download = download.name;
        downloadGrid.appendChild(link);
      }
      downloadSection.appendChild(downloadGrid);

      const promptSection = sectionWithTitle("Copy continuity prompts");
      const promptGrid = el("div", "button-grid");
      for (const [key, className, label] of [
        ["initial", "primary full", "Create first continuation packet + thread stats"],
        ["audit", "", "Context-integrity audit"],
        ["rolling", "", "Update rolling packet"],
        ["final", "full", "Final transition audit"]
      ]) {
        const button = el("button", className, label);
        button.type = "button";
        button.setAttribute("data-prompt", key);
        promptGrid.appendChild(button);
      }
      promptSection.appendChild(promptGrid);

      const breakdown = detailsWithContent("Word-count breakdown", [
        add(el("div"), document.createTextNode("User words: "), el("strong", "", formatNumber(userWords))),
        add(el("div"), document.createTextNode("ChatGPT words: "), el("strong", "", formatNumber(assistantWords))),
        add(el("div"), document.createTextNode("Upload turns found: "), el("strong", "", formatNumber(uploadTurns)))
      ]);

      const endLabel = el("div", "small", "Last saved message ends:");
      endLabel.style.marginTop = "9px";
      const verify = detailsWithContent("Verify beginning and end", [
        el("div", "small", "First saved message begins:"),
        el("pre", "", messages[0].text.slice(0, 500)),
        endLabel,
        el("pre", "", messages[messages.length - 1].text.slice(-900))
      ]);

      const manifestContent = [];
      if (uniqueAttachments.length === 0) {
        manifestContent.push(el("div", "small", "No uploaded-file metadata was found. This does not prove that no files were used; ChatGPT's internal format can change."));
      } else {
        const table = el("table", "manifest-table");
        const thead = el("thead");
        const headingRow = el("tr");
        for (const heading of ["Turn", "Kind", "Name", "Size"]) {
          headingRow.appendChild(el("th", "", heading));
        }
        thead.appendChild(headingRow);
        const tbody = el("tbody");
        for (const item of uniqueAttachments.slice(0, 25)) {
          const row = el("tr");
          for (const cell of [item.turn, item.kind, item.name, item.size != null ? formatBytes(item.size) : ""]) {
            row.appendChild(el("td", "", cell));
          }
          tbody.appendChild(row);
        }
        add(table, thead, tbody);
        manifestContent.push(table);
        if (uniqueAttachments.length > 25) {
          const more = el("div", "small", `Showing the first 25 of ${formatNumber(uniqueAttachments.length)} entries. The downloads contain the complete manifest.`);
          more.style.marginTop = "8px";
          manifestContent.push(more);
        }
      }
      const manifestDetails = detailsWithContent(`Uploaded-file manifest (${formatNumber(uniqueAttachments.length)})`, manifestContent);
      const caveat = el("div", "caveat");
      add(
        caveat,
        el("strong", "", "Not an exact context meter. "),
        document.createTextNode("This counts the stored visible user/assistant transcript. It cannot see hidden instructions, retrieved document passages, internal summaries, tool context, or the exact tokens supplied to the model for its next answer. The thresholds are conservative workflow guidelines, not OpenAI-published limits.")
      );

      results.replaceChildren(
        metricGrid,
        guidanceBox,
        downloadSection,
        promptSection,
        breakdown,
        verify,
        manifestDetails,
        caveat
      );

      for (const button of results.querySelectorAll("button[data-prompt]")) {
        button.addEventListener("click", async () => {
          const key = button.getAttribute("data-prompt");
          const text = key === "initial" ? buildInitialPacketPrompt(data) : PROMPTS[key];
          const succeeded = await copyText(text);
          showToast(succeeded ? (key === "initial" ? "First-packet prompt and thread stats copied" : "Prompt copied") : "Copy failed — use the downloaded transcript instead");
        });
      }

      for (const link of results.querySelectorAll("a.download")) {
        link.addEventListener("click", () => showToast("Download started"));
      }

      console.log(`${PREFIX} COMPLETE`, {
        version: APP_VERSION,
        conversationId,
        messages: messages.length,
        visibleWords: totalWords,
        estimatedVisibleTokens: estimatedTokens,
        attachments: uniqueAttachments.length,
        firstMessageStart: messages[0].text.slice(0, 250),
        lastMessageEnd: messages[messages.length - 1].text.slice(-500)
      });
    } catch (error) {
      console.error(`${PREFIX} FAILED`, error);
      statusBox.classList.add("error");
      const failureDetail = el("div", "small", error?.message || String(error));
      failureDetail.style.marginTop = "5px";
      statusBox.replaceChildren(
        el("strong", "", "Extension could not analyze this thread"),
        failureDetail
      );
      results.replaceChildren(
        el("div", "caveat", "This extension uses an undocumented internal ChatGPT conversation endpoint. If ChatGPT changes that endpoint, the extension will need an update.")
      );
    }
  }

  run();
})();
