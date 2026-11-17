import assert from "node:assert/strict";
import test from "node:test";
import { initializePopup } from "./popup.js";

function fixture() {
  const elements = Object.fromEntries(
    ["source", "environment", "advanced", "advanced-target", "target-hint", "view", "preview", "new-tab", "open", "copy", "error", "status"].map((id) => [
      id,
      {
        value: "", textContent: "", checked: false, open: false, disabled: ["open", "copy"].includes(id),
        children: [],
        listeners: {},
        append(child) { this.children.push(child); },
        addEventListener(event, callback) { this.listeners[event] = callback; },
        async emit(event) { await this.listeners[event](); }
      }
    ])
  );
  elements.environment.value = "qa";
  elements.view.value = "editor";
  const calls = [];
  const tabs = {
    async query() {
      return [{ id: 42, url: "https://ubcms-qa.buffalo.edu/editor.html/content/demo-next-gen.html" }];
    },
    async create(options) { calls.push(["create", options]); },
    async update(id, options) { calls.push(["update", id, options]); }
  };
  const clipboard = { async writeText(text) { calls.push(["copy", text]); } };
  const document = {
    getElementById: (id) => elements[id],
    createElement: () => ({ children: [], append(child) { this.children.push(child); } })
  };
  return { elements, document, tabs, clipboard, calls };
}

test("previews current tab, switches to QA2, and updates the original tab by default", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  f.elements.environment.value = "qa2";
  await f.elements.environment.emit("change");
  const expected = "https://ubcms-qa2.buffalo.edu/editor.html/content/demo-next-gen.html";
  assert.equal(f.elements.preview.value, expected);
  assert.equal(f.elements.open.disabled, false);
  await f.elements.open.emit("click");
  assert.deepEqual(f.calls, [["update", 42, { url: expected }]]);
  assert.equal(f.elements.status.textContent, "Current tab updated.");
});

test("Open in a new tab opts into tab creation and copy matches the preview", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  f.elements["new-tab"].checked = true;
  await f.elements.copy.emit("click");
  await f.elements.open.emit("click");
  const url = f.elements.preview.value;
  assert.deepEqual(f.calls, [["copy", url], ["create", { url }]]);
  assert.equal(f.elements.status.textContent, "Opened in a new tab.");
});

test("pasting a live URL translates it and Assets selection opens the www DAM root", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  f.elements.source.value = "https://www.buffalo.edu/asiainstitute/news-events/latest_news.html";
  await f.elements.source.emit("input");
  assert.equal(
    f.elements.preview.value,
    "https://ubcms-qa.buffalo.edu/editor.html/content/www/asiainstitute/news-events/latest_news.html"
  );
  f.elements.view.value = "assets";
  await f.elements.view.emit("change");
  assert.equal(f.elements.preview.value, "https://ubcms-qa.buffalo.edu/assets.html/content/dam/www");
});

test("Assets selection and environment switch preview and open the site's DAM root", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  f.elements.source.value = "/content/demo/news/story.html";
  await f.elements.source.emit("input");
  f.elements.view.value = "assets";
  await f.elements.view.emit("change");
  f.elements.environment.value = "qa2";
  await f.elements.environment.emit("change");
  const expected = "https://ubcms-qa2.buffalo.edu/assets.html/content/dam/demo";
  assert.equal(f.elements.preview.value, expected);
  await f.elements.copy.emit("click");
  await f.elements.open.emit("click");
  assert.deepEqual(f.calls, [["copy", expected], ["update", 42, { url: expected }]]);
});

test("unsupported current tabs show an error but pasted paths remain usable", async () => {
  const f = fixture();
  f.tabs.query = async () => [{ id: 42, url: "chrome://extensions/" }];
  await initializePopup(f.document, f.tabs, f.clipboard);
  assert.match(f.elements.error.textContent, /HTTP and HTTPS/);
  assert.equal(f.elements.open.disabled, true);
  f.elements.source.value = "/content/demo.html";
  await f.elements.source.emit("input");
  assert.equal(f.elements.error.textContent, "");
  assert.equal(f.elements.open.disabled, false);
});

test("missing original tab blocks replacement, not new-tab navigation", async () => {
  const f = fixture();
  f.tabs.query = async () => [];
  await initializePopup(f.document, f.tabs, f.clipboard);
  assert.match(f.elements.error.textContent, /Current tab URL unavailable/);
  f.elements.source.value = "/content/demo.html";
  await f.elements.source.emit("input");
  await f.elements.open.emit("click");
  assert.match(f.elements.error.textContent, /Original tab unavailable\. Select Open in a new tab/);
  assert.deepEqual(f.calls, []);
  f.elements["new-tab"].checked = true;
  await f.elements.open.emit("click");
  assert.equal(f.calls[0][0], "create");
});

test("navigation and clipboard failures are visible and never report success", async () => {
  const f = fixture();
  f.tabs.update = async () => { throw new Error("Tab update denied"); };
  f.clipboard.writeText = async () => { throw new Error("Clipboard denied"); };
  await initializePopup(f.document, f.tabs, f.clipboard);
  await f.elements.open.emit("click");
  assert.match(f.elements.error.textContent, /Tab update denied/);
  assert.equal(f.elements.status.textContent, "");
  await f.elements.copy.emit("click");
  assert.match(f.elements.error.textContent, /Clipboard denied/);
  assert.equal(f.elements.status.textContent, "");
});

test("invalid edited input clears a stale destination and disables both actions", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  f.elements.source.value = "https://example.com/";
  await f.elements.source.emit("input");
  assert.equal(f.elements.preview.value, "");
  assert.equal(f.elements.open.disabled, true);
  assert.equal(f.elements.copy.disabled, true);
  assert.match(f.elements.error.textContent, /Unsupported host/);
});

test("delayed tab lookup never overwrites user-pasted input", async () => {
  const f = fixture();
  let resolveQuery;
  f.tabs.query = () => new Promise((resolve) => { resolveQuery = resolve; });
  const ready = initializePopup(f.document, f.tabs, f.clipboard);
  f.elements.source.value = "/content/my-page.html";
  await f.elements.source.emit("input");
  resolveQuery([{ id: 42, url: "https://ubcms-author.buffalo.edu/content/other.html" }]);
  await ready;
  assert.equal(f.elements.source.value, "/content/my-page.html");
  assert.equal(f.elements.preview.value, "https://ubcms-qa.buffalo.edu/editor.html/content/my-page.html");
});

test("Advanced stays collapsed by default and publishers force rendered Page for open and copy", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  assert.equal(f.elements.advanced.open, false);
  f.elements.advanced.open = true;
  await f.elements.advanced.emit("toggle");
  f.elements["advanced-target"].value = "qa2-publisher";
  await f.elements["advanced-target"].emit("change");
  const url = "https://cmspubqa2.acsu.buffalo.edu:8443/content/demo-next-gen.html";
  assert.equal(f.elements.preview.value, url);
  assert.equal(f.elements.environment.disabled, true);
  assert.equal(f.elements.view.value, "page");
  assert.equal(f.elements.view.disabled, true);
  assert.match(f.elements["target-hint"].textContent, /no author consoles/);
  await f.elements.copy.emit("click");
  await f.elements.open.emit("click");
  assert.deepEqual(f.calls, [["copy", url], ["update", 42, { url }]]);
});

test("collapsing Advanced restores the basic environment and previous author view without hidden targets", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  f.elements.environment.value = "qa2";
  await f.elements.environment.emit("change");
  f.elements.advanced.open = true;
  f.elements["advanced-target"].value = "prod-dispatcher-balanced";
  await f.elements["advanced-target"].emit("change");
  assert.equal(f.elements.preview.value, "http://ubcms-disp.acsu.buffalo.edu/content/demo-next-gen.html");
  assert.match(f.elements["target-hint"].textContent, /HTTP is unencrypted/);
  assert.match(f.elements["target-hint"].textContent, /Load balanced/);
  f.elements.advanced.open = false;
  // Open must use the visible basic controls even before the asynchronous toggle event.
  await f.elements.open.emit("click");
  assert.equal(f.elements.environment.disabled, false);
  assert.equal(f.elements.view.disabled, false);
  assert.equal(f.elements.view.value, "editor");
  assert.deepEqual(f.calls, [["update", 42, { url: "https://ubcms-qa2.buffalo.edu/editor.html/content/demo-next-gen.html" }]]);
});

test("Training and Syracuse authors keep all author modes when switching from a publisher", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  f.elements.advanced.open = true;
  f.elements["advanced-target"].value = "training-publisher";
  await f.elements["advanced-target"].emit("change");
  f.elements["advanced-target"].value = "training-author";
  await f.elements["advanced-target"].emit("change");
  assert.equal(f.elements.view.disabled, false);
  assert.equal(f.elements.view.value, "editor");
  assert.equal(f.elements.preview.value, "https://ubcms-training.buffalo.edu/editor.html/content/demo-next-gen.html");
  f.elements["advanced-target"].value = "syracuse-author-direct";
  f.elements.view.value = "sites";
  await f.elements.view.emit("change");
  assert.equal(f.elements.preview.value, "https://cmsauth-syr.acsu.buffalo.edu:8443/sites.html/content/demo-next-gen");
});

test("an advanced source preselects its server without activating a hidden advanced target", async () => {
  const f = fixture();
  f.tabs.query = async () => [{ id: 42, url: "https://cmspub-trn.acsu.buffalo.edu:9443/content/demo.html" }];
  await initializePopup(f.document, f.tabs, f.clipboard);
  assert.equal(f.elements.advanced.open, false);
  assert.equal(f.elements["advanced-target"].value, "training-publisher");
  assert.equal(f.elements.preview.value, "https://ubcms-qa.buffalo.edu/content/demo.html");
  f.elements.advanced.open = true;
  await f.elements.advanced.emit("toggle");
  assert.equal(f.elements.preview.value, "https://cmspub-trn.acsu.buffalo.edu:9443/content/demo.html");
});

test("pasting a new author page keeps an explicitly selected publisher and rendered view", async () => {
  const f = fixture();
  await initializePopup(f.document, f.tabs, f.clipboard);
  f.elements.advanced.open = true;
  f.elements["advanced-target"].value = "qa-publisher";
  await f.elements["advanced-target"].emit("change");
  f.elements.source.value = "https://ubcms-author.buffalo.edu/editor.html/content/www/demo/news.html?x=1#section";
  await f.elements.source.emit("input");
  assert.equal(
    f.elements.preview.value,
    "https://cmspubqa1.acsu.buffalo.edu:8443/content/www/demo/news.html?x=1#section"
  );
  assert.equal(f.elements.view.value, "page");
  assert.equal(f.elements.view.disabled, true);
});
