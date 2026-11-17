import assert from "node:assert/strict";
import test from "node:test";
import { ADVANCED_TARGETS, buildUrl, ENVIRONMENTS, parseSource } from "./url-utils.js";

test("switches the demo page between QA and QA2 without changing its content path", () => {
  for (const environment of ["qa", "qa2"]) {
    assert.equal(
      buildUrl("/content/demo-next-gen.html", environment, "editor"),
      `${ENVIRONMENTS[environment]}/editor.html/content/demo-next-gen.html`
    );
  }
});

test("maps the live example to content/www exactly once", () => {
  const expected = "https://ubcms-qa.buffalo.edu/editor.html/content/www/asiainstitute/news-events/latest_news.html";
  assert.equal(
    buildUrl("https://www.buffalo.edu/asiainstitute/news-events/latest_news.html", "qa", "editor"),
    expected
  );
  assert.equal(buildUrl(expected, "qa", "editor"), expected);
});

test("preserves path, query and fragment across every environment pair", () => {
  for (const origin of Object.values(ENVIRONMENTS)) {
    for (const [environment, target] of Object.entries(ENVIRONMENTS)) {
      assert.equal(
        buildUrl(`${origin}/editor.html/content/demo.html?wcmmode=disabled&x=%2F#section`, environment, "editor"),
        `${target}/editor.html/content/demo.html?wcmmode=disabled&x=%2F#section`
      );
    }
  }
});

test("converts every page view without accumulating prefixes or suffixes", () => {
  const paths = {
    page: "/content/demo-next-gen.html",
    editor: "/editor.html/content/demo-next-gen.html",
    sites: "/sites.html/content/demo-next-gen"
  };
  for (const input of Object.values(paths)) {
    for (const [view, expected] of Object.entries(paths)) {
      assert.equal(buildUrl(`https://ubcms-qa2.buffalo.edu${input}`, "qa", view), `${ENVIRONMENTS.qa}${expected}`);
    }
  }
  assert.equal(buildUrl("/content/demo-next-gen/", "qa", "editor"), `${ENVIRONMENTS.qa}${paths.editor}`);
});

test("uses the site's DAM root for pages and preserves existing DAM locations", () => {
  assert.equal(
    buildUrl("/content/demo.html", "author", "assets"),
    `${ENVIRONMENTS.author}/assets.html/content/dam/demo`
  );
  assert.equal(
    buildUrl("https://ubcms-qa.buffalo.edu/assets.html/content/dam/example?x=1#folder", "qa2", "assets"),
    `${ENVIRONMENTS.qa2}/assets.html/content/dam/example?x=1#folder`
  );
  assert.equal(
    buildUrl("/content/dam/example/photo.jpg", "dev", "assets"),
    `${ENVIRONMENTS.dev}/assets.html/content/dam/example/photo.jpg`
  );
});

test("maps nested page views to the first content segment, not the full page path", () => {
  for (const input of [
    "/content/demo.html",
    "/content/demo/news/story.html",
    "/editor.html/content/demo/news/story.html",
    "/sites.html/content/demo/news/story",
    "/content/demo/"
  ]) {
    assert.equal(
      buildUrl(input, "qa2", "assets"),
      "https://ubcms-qa2.buffalo.edu/assets.html/content/dam/demo"
    );
  }
  assert.equal(
    buildUrl("/content/demo%20site/news/story.html?q=1#section", "qa2", "assets"),
    `${ENVIRONMENTS.qa2}/assets.html/content/dam/demo%20site?q=1#section`
  );
  for (const input of ["/content", "/content/"]) {
    assert.equal(buildUrl(input, "qa2", "assets"), `${ENVIRONMENTS.qa2}/assets.html/content/dam`);
  }
});

test("uses www as the DAM site root for live URLs and already-mapped pages", () => {
  for (const input of [
    "https://www.buffalo.edu/asiainstitute/news-events/latest_news.html",
    "/editor.html/content/www/asiainstitute/news-events/latest_news.html"
  ]) {
    assert.equal(buildUrl(input, "qa2", "assets"), `${ENVIRONMENTS.qa2}/assets.html/content/dam/www`);
  }
});

test("detects AEM environment and mode while defaulting live URLs and paths to QA Editor", () => {
  assert.equal(parseSource("https://ubcms-dev.acsu.buffalo.edu/sites.html/content/demo").environment, "dev");
  assert.equal(parseSource("https://ubcms-dev.acsu.buffalo.edu/sites.html/content/demo").view, "sites");
  assert.equal(parseSource("https://ubcms-author.buffalo.edu/content/demo.html").view, "page");
  for (const input of ["/content/demo.html", "https://www.buffalo.edu/demo.html"]) {
    const parsed = parseSource(input);
    assert.equal(parsed.environment, "qa");
    assert.equal(parsed.view, "editor");
  }
  assert.equal(parseSource("/content/dam/example").view, "assets");
});

test("preserves encoded paths, query strings and fragments when mapping live links", () => {
  assert.equal(
    buildUrl(" https://www.buffalo.edu/asia%20institute/news.html?q=a%26b#latest ", "qa2", "sites"),
    `${ENVIRONMENTS.qa2}/sites.html/content/www/asia%20institute/news?q=a%26b#latest`
  );
});

test("rejects malformed, unsupported and misleading URLs instead of guessing", () => {
  const invalid = [
    "", "not a URL", "content/demo.html", "//www.buffalo.edu/example.html",
    "javascript:alert(1)", "file:///content/demo.html", "chrome://extensions",
    "https://example.com/content/demo.html",
    "https://ubcms-qa.buffalo.edu.evil.example/content/demo.html",
    "https://www.buffalo.edu.evil.example/demo.html",
    "https://ubcms-qa.buffalo.edu@evil.example/content/demo.html",
    "https://user:pass@ubcms-qa.buffalo.edu/content/demo.html",
    "https://ubcms-qa.buffalo.edu:4502/content/demo.html",
    "https://ubcms-qa.buffalo.edu/",
    "/editor.html/editor.html/content/demo.html",
    "/content-other/demo.html", "/assets.html/content/demo",
    "/editor.html/content/dam/example"
  ];
  for (const input of invalid) {
    assert.throws(() => buildUrl(input, "qa", "editor"), Error, input);
  }
  assert.throws(() => buildUrl("/content/demo.html", "unknown", "editor"), /environment/);
  assert.throws(() => buildUrl("/content/demo.html", "__proto__", "editor"), /environment/);
  assert.throws(() => buildUrl("/content/demo.html", "qa", "unknown"), /view/);
});

test("does not invent page paths for DAM assets", () => {
  for (const view of ["page", "editor"]) {
    assert.throws(
      () => buildUrl("/assets.html/content/dam/example", "qa", view),
      /cannot be mapped to a page/
    );
  }
});

test("direct, Training and Syracuse authors support editor and Sites URLs with their documented ports", () => {
  for (const [target, origin] of [
    ["prod-author-direct", "https://cmsauth1.acsu.buffalo.edu:8443"],
    ["qa-author-direct", "https://cmsauthqa1.acsu.buffalo.edu:8443"],
    ["qa2-author-direct", "https://cmsauthqa2.acsu.buffalo.edu:8443"],
    ["training-author", "https://ubcms-training.buffalo.edu"],
    ["training-author-direct", "https://cmsauth-trn.acsu.buffalo.edu:8443"],
    ["training-author-pub-alias", "https://cmspub-trn.acsu.buffalo.edu:8443"],
    ["dev-author-direct", "https://cmsauth-dev.acsu.buffalo.edu:8443"],
    ["syracuse-author", "https://ubcms-emergency.buffalo.edu"],
    ["syracuse-author-direct", "https://cmsauth-syr.acsu.buffalo.edu:8443"]
  ]) {
    assert.equal(
      buildUrl("/content/demo/news/story.html", target, "editor"),
      `${origin}/editor.html/content/demo/news/story.html`
    );
    assert.equal(
      buildUrl("/editor.html/content/demo/news/story.html", target, "sites"),
      `${origin}/sites.html/content/demo/news/story`
    );
  }
});

test("publisher and dispatcher links strip author consoles while keeping scheme, port, path and URL suffix", () => {
  for (const [target, origin] of [
    ["prod-publisher-1", "https://cmspub1.acsu.buffalo.edu:8443"],
    ["prod-publisher-balanced", "http://ubcms-pub.acsu.buffalo.edu:4503"],
    ["qa2-publisher", "https://cmspubqa2.acsu.buffalo.edu:8443"],
    ["training-publisher", "https://cmspub-trn.acsu.buffalo.edu:9443"],
    ["dev-publisher", "https://cmspub-dev.acsu.buffalo.edu:9443"],
    ["syracuse-publisher", "https://cmspub-syr.acsu.buffalo.edu:9443"],
    ["prod-dispatcher-1", "http://cmsdisp1.acsu.buffalo.edu"],
    ["qa-dispatcher", "https://ubcms-disp-qa.acsu.buffalo.edu"],
    ["qa2-dispatcher", "https://ubcms-disp-qa2.acsu.buffalo.edu"],
    ["dev-dispatcher", "http://cmsdisp-dev.acsu.buffalo.edu"]
  ]) {
    for (const path of ["/editor.html/content/www/demo.html", "/sites.html/content/www/demo"]) {
      assert.equal(
        buildUrl(`https://ubcms-qa.buffalo.edu${path}?wcmmode=disabled#section`, target, "page"),
        `${origin}/content/www/demo.html?wcmmode=disabled#section`
      );
    }
    for (const view of ["editor", "sites", "assets"]) {
      assert.throws(() => buildUrl("/content/demo.html", target, view), /rendered Page view only/);
    }
  }
});

test("recognizes every documented advanced origin as a source and can return to author", () => {
  for (const target of ADVANCED_TARGETS) {
    const input = `${target.origin}/content/demo/news/story.html?q=1#section`;
    assert.equal(parseSource(input).environment, target.id);
    assert.equal(
      buildUrl(input, "qa", "editor"),
      "https://ubcms-qa.buffalo.edu/editor.html/content/demo/news/story.html?q=1#section"
    );
  }
});

test("uses the port, not the publisher hostname, to distinguish Training author and publisher", () => {
  const author = "https://cmspub-trn.acsu.buffalo.edu:8443/content/demo.html";
  const publisher = "https://cmspub-trn.acsu.buffalo.edu:9443/content/demo.html";
  assert.equal(parseSource(author).environment, "training-author-pub-alias");
  assert.equal(parseSource(publisher).environment, "training-publisher");
  assert.equal(
    buildUrl(author, "training-publisher", "page"),
    "https://cmspub-trn.acsu.buffalo.edu:9443/content/demo.html"
  );
  for (const input of [
    "https://cmspub-trn.acsu.buffalo.edu:4502/content/demo.html",
    "http://cmspub-trn.acsu.buffalo.edu:9443/content/demo.html",
    "https://cmsauthqa1.acsu.buffalo.edu/content/demo.html",
    "https://cmsauthqa1.acsu.buffalo.edu:8443.evil.example/content/demo.html"
  ]) {
    assert.throws(() => buildUrl(input, "qa", "editor"));
  }
});

test("published DAM links retain resource paths instead of adding .html or an Assets console", () => {
  assert.equal(
    buildUrl("/assets.html/content/dam/demo/report.pdf?download=1#page=2", "qa-publisher", "page"),
    "https://cmspubqa1.acsu.buffalo.edu:8443/content/dam/demo/report.pdf?download=1#page=2"
  );
  assert.equal(
    buildUrl("/content/dam/demo/photos", "syracuse-dispatcher", "page"),
    "https://cmsdisp-syr.acsu.buffalo.edu/content/dam/demo/photos"
  );
});
