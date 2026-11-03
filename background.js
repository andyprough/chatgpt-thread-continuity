"use strict";

const CHATGPT_URL = /^https:\/\/(?:chatgpt\.com|chat\.openai\.com)\//i;

async function flashBadge(tabId, text, color) {
  await browser.browserAction.setBadgeBackgroundColor({ tabId, color });
  await browser.browserAction.setBadgeText({ tabId, text });
  setTimeout(() => {
    browser.browserAction.setBadgeText({ tabId, text: "" }).catch(() => {});
  }, 2500);
}

browser.browserAction.onClicked.addListener(async (tab) => {
  if (!tab || typeof tab.id !== "number") {
    return;
  }

  if (!CHATGPT_URL.test(tab.url || "")) {
    await flashBadge(tab.id, "!", "#b42318");
    return;
  }

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [0] },
      files: ["content/exporter-main.js"],
      world: "MAIN"
    });
    await flashBadge(tab.id, "OK", "#18794e");
  } catch (error) {
    console.error("ChatGPT Thread Continuity failed to inject:", error);
    await flashBadge(tab.id, "ERR", "#b42318");
  }
});
