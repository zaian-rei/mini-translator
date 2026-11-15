const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!;
const win = $("#window");
const input = $("#input") as HTMLTextAreaElement;
const answer = $("#answer");
const appStatus = $("#status");
const sourceLanguage = $("#from") as HTMLSelectElement;
const targetLanguage = $("#to") as HTMLSelectElement;
const defaultServerUrl = "http://localhost:5000";
const savedServerUrl = localStorage.getItem("libretranslate-server") || defaultServerUrl;
const serverUrlInput = document.querySelector<HTMLInputElement>("#serverUrl");
const apiKeyInput = document.querySelector<HTMLInputElement>("#apiKey");
if (serverUrlInput) serverUrlInput.value = savedServerUrl;

function getServerUrl() {
  return (serverUrlInput?.value.trim() || savedServerUrl).replace(/[/]+$/, "") || defaultServerUrl;
}

type ServerLanguage = { code: string; name: string; targets?: string[] };
let serverLanguages: ServerLanguage[] = [];

function fillLanguageSelects(languages: ServerLanguage[]) {
  const previousSource = sourceLanguage.value;
  const previousTarget = targetLanguage.value;
  sourceLanguage.replaceChildren(new Option("Auto-detect", "autodetect"));
  targetLanguage.replaceChildren();
  for (const language of languages) {
    sourceLanguage.add(new Option(language.name, language.code));
    targetLanguage.add(new Option(language.name, language.code));
  }
  sourceLanguage.value = [...sourceLanguage.options].some((option) => option.value === previousSource) ? previousSource : "autodetect";
  targetLanguage.value = [...targetLanguage.options].some((option) => option.value === previousTarget)
    ? previousTarget
    : ([...targetLanguage.options].some((option) => option.value === "en") ? "en" : targetLanguage.options[0]?.value);
  updateTargetLanguages();
}

function updateTargetLanguages() {
  const source = sourceLanguage.value;
  const supportedTargets = serverLanguages.find((language) => language.code === source)?.targets;
  for (const option of [...targetLanguage.options]) {
    option.disabled = source !== "autodetect" && !!supportedTargets && !supportedTargets.includes(option.value);
  }
  if (targetLanguage.selectedOptions[0]?.disabled) {
    const firstAvailable = [...targetLanguage.options].find((option) => !option.disabled);
    if (firstAvailable) targetLanguage.value = firstAvailable.value;
  }
}

async function loadLanguages(showStatus = false) {
  const server = getServerUrl();
  try {
    const response = await fetch(`${server}/languages`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error();
    const payload = await response.json();
    if (!Array.isArray(payload) || !payload.length || payload.some((item) => !item.code || !item.name)) throw new Error();
    serverLanguages = payload;
    fillLanguageSelects(serverLanguages);
    if (showStatus) appStatus.textContent = `Loaded ${serverLanguages.length} languages from LibreTranslate.`;
  } catch {
    if (showStatus) appStatus.textContent = "Could not load languages. Start the LibreTranslate server and try again.";
  }
}

sourceLanguage.addEventListener("change", updateTargetLanguages);

function showAnswer(text: string, empty = false) {
  answer.textContent = text;
  answer.classList.toggle("empty", empty);
}

document.querySelectorAll<HTMLButtonElement>(".theme-button").forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.theme === "mono" ? "mono" : "dark";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mini-translator-theme", theme);
    document.querySelectorAll<HTMLButtonElement>(".theme-button").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
  });
});
if (localStorage.getItem("mini-translator-theme") === "mono") {
  document.querySelector<HTMLButtonElement>('[data-theme="mono"]')?.click();
}

input.addEventListener("input", () => {
  $("#count").textContent = `${input.value.length} / 1000`;
});

document.querySelector<HTMLButtonElement>("#saveServer")?.addEventListener("click", () => {
  if (!serverUrlInput) return;
  const value = serverUrlInput.value.trim().replace(/\/+$/, "");
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    localStorage.setItem("libretranslate-server", value);
    serverUrlInput.value = value;
    appStatus.textContent = "LibreTranslate server saved. Loading its languages…";
    void loadLanguages(true);
  } catch {
    appStatus.textContent = "Enter a valid server address beginning with http:// or https://.";
  }
});

$("#clear").addEventListener("click", () => {
  input.value = "";
  input.dispatchEvent(new Event("input"));
  showAnswer("Your translation will appear here.", true);
  appStatus.textContent = "";
  input.focus();
});

$("#swap").addEventListener("click", () => {
  if (sourceLanguage.value === "autodetect") {
    appStatus.textContent = "Choose a source language before swapping.";
    return;
  }
  const oldSource = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = oldSource;
  updateTargetLanguages();
  appStatus.textContent = "Languages swapped.";
});

void loadLanguages();

async function translate(text: string): Promise<{ text: string; detected?: string }> {
  if (sourceLanguage.value === targetLanguage.value) return { text };
  const server = getServerUrl();
  const request: Record<string, string> = {
    q: text,
    source: sourceLanguage.value === "autodetect" ? "auto" : sourceLanguage.value,
    target: targetLanguage.value,
    format: "text",
  };
  const apiKey = apiKeyInput?.value.trim() || "";
  if (apiKey) request.api_key = apiKey;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);
  let response: Response;
  try {
    response = await fetch(`${server}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("LibreTranslate timed out. Check that the server is running, then try again.");
    }
    throw new Error(`Could not connect to LibreTranslate at ${server}. Start the local server or enter another server address.`);
  } finally {
    window.clearTimeout(timeoutId);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `LibreTranslate returned ${response.status}. Check its character limit and API key.`);
  }
  if (typeof payload.translatedText !== "string") {
    throw new Error("LibreTranslate returned no translation. Check that this server supports the selected languages.");
  }
  return { text: payload.translatedText, detected: payload.detectedLanguage?.language };
}

async function respond() {
  const text = input.value.trim();
  if (!text) {
    appStatus.textContent = "Type something to translate.";
    win.classList.add("shake");
    window.setTimeout(() => win.classList.remove("shake"), 280);
    input.focus();
    return;
  }

  const button = $("#go") as HTMLButtonElement;
  button.disabled = true;
  button.textContent = "Translating…";
  appStatus.textContent = "Contacting LibreTranslate…";
  try {
    const result = await translate(text);
    showAnswer(result.text);
    appStatus.textContent = result.detected ? `Translation complete · detected ${result.detected}.` : "Translation complete.";
  } catch (error) {
    showAnswer("Your translation will appear here.", true);
    appStatus.textContent = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  } finally {
    button.disabled = false;
    button.textContent = "Translate";
  }
}

$("#go").addEventListener("click", respond);
input.addEventListener("keydown", (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void respond();
});

$("#copy").addEventListener("click", async () => {
  const text = answer.innerText.trim();
  if (!text || answer.classList.contains("empty")) {
    appStatus.textContent = "Nothing to copy yet.";
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    appStatus.textContent = "Copied to clipboard.";
  } catch {
    appStatus.textContent = "Select and copy the translation.";
  }
});

// Enable dragging when previewed in a browser.
let dragging = false;
let dragX = 0;
let dragY = 0;
$("#drag").addEventListener("pointerdown", (event: PointerEvent) => {
  if ((event.target as HTMLElement).closest("button")) return;
  dragging = true;
  dragX = event.clientX - win.offsetLeft;
  dragY = event.clientY - win.offsetTop;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
});
$("#drag").addEventListener("pointermove", (event: PointerEvent) => {
  if (!dragging) return;
  win.style.position = "fixed";
  win.style.left = `${Math.max(0, event.clientX - dragX)}px`;
  win.style.top = `${Math.max(0, event.clientY - dragY)}px`;
});
$("#drag").addEventListener("pointerup", () => (dragging = false));
