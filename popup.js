import { ADVANCED_TARGETS, buildUrl, ENVIRONMENTS, getTarget, parseSource } from "./url-utils.js";

export async function initializePopup(
  document,
  tabs = (globalThis.browser ?? globalThis.chrome)?.tabs,
  clipboard = globalThis.navigator?.clipboard
) {
  const source = document.getElementById("source");
  const environment = document.getElementById("environment");
  const advanced = document.getElementById("advanced");
  const advancedTarget = document.getElementById("advanced-target");
  const targetHint = document.getElementById("target-hint");
  const view = document.getElementById("view");
  const preview = document.getElementById("preview");
  const newTab = document.getElementById("new-tab");
  const openButton = document.getElementById("open");
  const copyButton = document.getElementById("copy");
  const error = document.getElementById("error");
  const status = document.getElementById("status");
  let originalTabId;
  let authorView = view.value;

  function resizeFields() {
    if (document.defaultView?.CSS.supports("field-sizing", "content")) return;
    for (const field of [source, preview]) {
      field.style.height = "auto";
      field.style.height = `${Math.min(60, Math.max(35, field.scrollHeight + 2))}px`;
    }
  }

  const groups = new Map();
  for (const target of ADVANCED_TARGETS) {
    if (!groups.has(target.group)) {
      const group = document.createElement("optgroup");
      group.label = target.group;
      groups.set(target.group, group);
      advancedTarget.append(group);
    }
    const option = document.createElement("option");
    option.value = target.id;
    option.textContent = `${target.label} - ${new URL(target.origin).host}`;
    groups.get(target.group).append(option);
  }

  function updatePreview() {
    status.textContent = "";
    error.textContent = "";
    try {
      const useAdvanced = advanced.open && advancedTarget.value !== "";
      const targetId = useAdvanced ? advancedTarget.value : environment.value;
      const target = getTarget(targetId);
      environment.disabled = useAdvanced;
      if (target.role !== "author") {
        if (!view.disabled) authorView = view.value;
        view.value = "page";
        view.disabled = true;
      } else {
        if (view.disabled) view.value = authorView;
        view.disabled = false;
      }
      const hints = [useAdvanced ? target.origin : "Using the basic environment above."];
      if (target.role !== "author") hints.push("Page only; no author consoles.");
      if (target.origin.startsWith("http:")) hints.push("HTTP is unencrypted.");
      if (target.balanced) hints.push("Load balanced; server may vary.");
      targetHint.textContent = hints.join(" ");
      const url = buildUrl(source.value, targetId, view.value);
      preview.value = url;
      openButton.disabled = false;
      copyButton.disabled = false;
      return url;
    } catch (failure) {
      preview.value = "";
      openButton.disabled = true;
      copyButton.disabled = true;
      error.textContent = failure.message;
      return null;
    } finally {
      resizeFields();
    }
  }

  function detectSource() {
    try {
      const parsed = parseSource(source.value);
      if (Object.hasOwn(ENVIRONMENTS, parsed.environment)) {
        environment.value = parsed.environment;
      } else {
        advancedTarget.value = parsed.environment;
      }
      if (view.disabled) authorView = parsed.view;
      else view.value = parsed.view;
    } catch (failure) {
      // updatePreview renders the parse error while keeping the input editable.
    }
    updatePreview();
  }

  source.addEventListener("input", detectSource);
  environment.addEventListener("change", updatePreview);
  view.addEventListener("change", updatePreview);
  advanced.addEventListener("toggle", updatePreview);
  advancedTarget.addEventListener("change", updatePreview);

  openButton.addEventListener("click", async () => {
    const url = updatePreview();
    if (!url) return;
    try {
      if (!tabs) {
        throw new Error("Tab access unavailable. Install this extension in Chrome or Firefox.");
      }
      if (!newTab.checked) {
        if (!Number.isInteger(originalTabId)) {
          throw new Error("Original tab unavailable. Select Open in a new tab to continue.");
        }
        await tabs.update(originalTabId, { url });
      } else {
        await tabs.create({ url });
      }
      status.textContent = newTab.checked ? "Opened in a new tab." : "Current tab updated.";
    } catch (failure) {
      error.textContent = `Could not open URL: ${failure.message}`;
    }
  });

  copyButton.addEventListener("click", async () => {
    const url = updatePreview();
    if (!url) return;
    try {
      if (!clipboard?.writeText) {
        throw new Error("Clipboard unavailable. Select and copy the destination manually.");
      }
      await clipboard.writeText(url);
      status.textContent = "URL copied.";
    } catch (failure) {
      error.textContent = `Could not copy URL: ${failure.message}`;
    }
  });

  try {
    if (!tabs) {
      throw new Error("Tab access unavailable. Install this extension in Chrome or Firefox.");
    }
    const [tab] = await tabs.query({ active: true, currentWindow: true });
    originalTabId = tab?.id;
    if (source.value.trim()) return;
    if (!tab?.url) {
      throw new Error("Current tab URL unavailable. Paste a supported URL or /content/ path.");
    }
    source.value = tab.url;
    detectSource();
  } catch (failure) {
    if (source.value.trim()) {
      updatePreview();
      status.textContent = failure.message;
    } else {
      status.textContent = "";
      error.textContent = failure.message;
    }
  }
}

if (typeof document !== "undefined") {
  void initializePopup(document);
}
