export const ENVIRONMENTS = Object.freeze({
  author: "https://ubcms-author.buffalo.edu",
  qa: "https://ubcms-qa.buffalo.edu",
  qa2: "https://ubcms-qa2.buffalo.edu",
  dev: "https://ubcms-dev.acsu.buffalo.edu"
});

export const ADVANCED_TARGETS = Object.freeze([
  { id: "prod-author-direct", group: "Production", label: "Author (direct)", role: "author", origin: "https://cmsauth1.acsu.buffalo.edu:8443" },
  { id: "prod-publisher-1", group: "Production", label: "Publisher 1", role: "publisher", origin: "https://cmspub1.acsu.buffalo.edu:8443" },
  { id: "prod-publisher-2", group: "Production", label: "Publisher 2", role: "publisher", origin: "https://cmspub2.acsu.buffalo.edu:8443" },
  { id: "prod-publisher-3", group: "Production", label: "Publisher 3", role: "publisher", origin: "https://cmspub3.acsu.buffalo.edu:8443" },
  { id: "prod-publisher-balanced", group: "Production", label: "Publisher (load balanced)", role: "publisher", origin: "http://ubcms-pub.acsu.buffalo.edu:4503", balanced: true },
  { id: "prod-dispatcher-1", group: "Production", label: "Dispatcher 1", role: "dispatcher", origin: "http://cmsdisp1.acsu.buffalo.edu" },
  { id: "prod-dispatcher-2", group: "Production", label: "Dispatcher 2", role: "dispatcher", origin: "http://cmsdisp2.acsu.buffalo.edu" },
  { id: "prod-dispatcher-balanced", group: "Production", label: "Dispatcher (load balanced)", role: "dispatcher", origin: "http://ubcms-disp.acsu.buffalo.edu", balanced: true },
  { id: "qa-author-direct", group: "QA", label: "Author (direct)", role: "author", origin: "https://cmsauthqa1.acsu.buffalo.edu:8443" },
  { id: "qa-publisher", group: "QA", label: "Publisher", role: "publisher", origin: "https://cmspubqa1.acsu.buffalo.edu:8443" },
  { id: "qa-dispatcher-direct", group: "QA", label: "Dispatcher (direct)", role: "dispatcher", origin: "http://cmsdispqa1.acsu.buffalo.edu" },
  { id: "qa-dispatcher", group: "QA", label: "Dispatcher (Shibboleth testing)", role: "dispatcher", origin: "https://ubcms-disp-qa.acsu.buffalo.edu" },
  { id: "qa2-author-direct", group: "QA2", label: "Author (direct)", role: "author", origin: "https://cmsauthqa2.acsu.buffalo.edu:8443" },
  { id: "qa2-publisher", group: "QA2", label: "Publisher", role: "publisher", origin: "https://cmspubqa2.acsu.buffalo.edu:8443" },
  { id: "qa2-dispatcher-direct", group: "QA2", label: "Dispatcher (direct)", role: "dispatcher", origin: "http://cmsdispqa2.acsu.buffalo.edu" },
  { id: "qa2-dispatcher", group: "QA2", label: "Dispatcher", role: "dispatcher", origin: "https://ubcms-disp-qa2.acsu.buffalo.edu" },
  { id: "training-author", group: "Training", label: "Author", role: "author", origin: "https://ubcms-training.buffalo.edu" },
  { id: "training-author-direct", group: "Training", label: "Author (direct)", role: "author", origin: "https://cmsauth-trn.acsu.buffalo.edu:8443" },
  { id: "training-author-pub-alias", group: "Training", label: "Author (publisher hostname, author port)", role: "author", origin: "https://cmspub-trn.acsu.buffalo.edu:8443" },
  { id: "training-publisher", group: "Training", label: "Publisher", role: "publisher", origin: "https://cmspub-trn.acsu.buffalo.edu:9443" },
  { id: "training-dispatcher", group: "Training", label: "Dispatcher", role: "dispatcher", origin: "https://cmsdisp-trn.acsu.buffalo.edu" },
  { id: "dev-author-direct", group: "Dev", label: "Author (direct)", role: "author", origin: "https://cmsauth-dev.acsu.buffalo.edu:8443" },
  { id: "dev-publisher", group: "Dev", label: "Publisher", role: "publisher", origin: "https://cmspub-dev.acsu.buffalo.edu:9443" },
  { id: "dev-dispatcher", group: "Dev", label: "Dispatcher", role: "dispatcher", origin: "http://cmsdisp-dev.acsu.buffalo.edu" },
  { id: "syracuse-author", group: "Syracuse", label: "Author", role: "author", origin: "https://ubcms-emergency.buffalo.edu" },
  { id: "syracuse-author-direct", group: "Syracuse", label: "Author (direct)", role: "author", origin: "https://cmsauth-syr.acsu.buffalo.edu:8443" },
  { id: "syracuse-publisher", group: "Syracuse", label: "Publisher", role: "publisher", origin: "https://cmspub-syr.acsu.buffalo.edu:9443" },
  { id: "syracuse-dispatcher", group: "Syracuse", label: "Dispatcher", role: "dispatcher", origin: "https://cmsdisp-syr.acsu.buffalo.edu" }
]);

export function getTarget(id) {
  if (Object.hasOwn(ENVIRONMENTS, id)) {
    return { origin: ENVIRONMENTS[id], role: "author" };
  }
  const target = ADVANCED_TARGETS.find((entry) => entry.id === id);
  if (!target) {
    throw new Error("Choose a supported environment or advanced target.");
  }
  return target;
}

const VIEWS = new Set(["page", "editor", "sites", "assets"]);
const PREFIXES = [
  ["/editor.html", "editor"],
  ["/sites.html", "sites"],
  ["/assets.html", "assets"]
];

function isWithin(path, root) {
  return path === root || path.startsWith(`${root}/`);
}

export function parseSource(input) {
  const text = input.trim();
  if (!text) {
    throw new Error("Enter a UBCMS URL, live www.buffalo.edu URL, or /content/ path.");
  }
  const pathOnly = text.startsWith("/") && !text.startsWith("//");
  let url;
  try {
    url = pathOnly ? new URL(text, ENVIRONMENTS.qa) : new URL(text);
  } catch {
    throw new Error("Enter a valid full URL or a path starting with /.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials are not supported.");
  }
  const environment = Object.keys(ENVIRONMENTS).find(
    (key) => !url.port && new URL(ENVIRONMENTS[key]).hostname === url.hostname
  ) ?? ADVANCED_TARGETS.find((target) => target.origin === url.origin)?.id;
  const live = !pathOnly && !url.port && url.hostname === "www.buffalo.edu";
  if (!environment && !live) {
    throw new Error("Unsupported host, scheme or port. Use a configured target or www.buffalo.edu.");
  }

  let contentPath = url.pathname;
  let view = "page";
  if (live) {
    contentPath = `/content/www${contentPath}`;
    view = "editor";
  } else {
    for (const [prefix, mode] of PREFIXES) {
      if (contentPath === prefix || contentPath.startsWith(`${prefix}/`)) {
        contentPath = contentPath.slice(prefix.length);
        view = mode;
        break;
      }
    }
    if (!isWithin(contentPath, "/content")) {
      throw new Error("Unsupported path. Use /content/ or an Editor, Sites, or Assets content URL.");
    }
  }

  const dam = isWithin(contentPath, "/content/dam");
  if (view === "assets" && !dam) {
    throw new Error("Assets URLs must point to /content/dam.");
  }
  if (view === "editor" && dam) {
    throw new Error("Page Editor does not support DAM paths. Use Assets.");
  }
  if (dam && view === "page") {
    view = "assets";
  }

  return {
    environment: pathOnly || live ? "qa" : environment,
    view: pathOnly && !dam ? "editor" : view,
    contentPath,
    dam,
    search: url.search,
    hash: url.hash
  };
}

export function buildUrl(input, environment, view) {
  const target = getTarget(environment);
  if (!VIEWS.has(view)) {
    throw new Error("Choose a supported view.");
  }
  if (target.role !== "author" && view !== "page") {
    throw new Error("Publishers and dispatchers support rendered Page view only.");
  }
  const source = parseSource(input);
  let path = source.contentPath;
  if (source.dam && target.role !== "author") {
    // Published assets use their original resource path, not an author console.
    path = source.contentPath;
  } else if (view === "assets") {
    if (!source.dam) {
      const siteRoot = path.slice("/content/".length).split("/")[0].replace(/\.html$/, "");
      path = `/content/dam${siteRoot ? `/${siteRoot}` : ""}`;
    }
    path = `/assets.html${path}`;
  } else {
    if (source.dam && view !== "sites") {
      throw new Error("A DAM location cannot be mapped to a page. Use Assets or enter a page path.");
    }
    path = path.replace(/\/+$/, "").replace(/\.html$/, "");
    if (view === "sites") {
      path = `/sites.html${path}`;
    } else {
      path = `${view === "editor" ? "/editor.html" : ""}${path}.html`;
    }
  }
  return `${target.origin}${path}${source.search}${source.hash}`;
}
