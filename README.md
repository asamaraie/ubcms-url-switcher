# UBCMS URL Switcher

Small, local-only Chrome and Firefox extension for switching UBCMS environments and AEM views.
No build, dependencies, backend, automatic redirects, tracking, or page scripts.

## Install in Chrome

Requirements: Google Chrome and access to the UBCMS environments you want to use.
Node.js and npm are not needed to install or use the extension.

1. Clone this repository to a folder on your computer, or download and extract
   the repository ZIP.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and browse to the path of the unzipped repository
   folder on your computer, for example `Downloads/ubcms-url-switcher-main/`.
   Select the folder containing [manifest.json](./manifest.json), not the ZIP
   file or the parent Downloads folder. If you cloned the repository instead,
   select your local clone's root folder.
5. Open Chrome's Extensions menu and pin **UBCMS URL Switcher**.
6. Visit a UBCMS page and click the extension.

Keep that folder in place while the extension is installed. All required files,
including the UB favicon icons, are bundled; no separate UBCMS checkout is needed.

### Update or remove

- **Git clone:** pull the latest changes in your local clone, then click the
  extension's **Reload** button on `chrome://extensions` and reopen its popup.
- **ZIP download:** download the updated archive, extract it, and replace the
  files in the folder Chrome already uses. Reload the extension afterward.
- **Remove:** click **Remove** on the extension's card at `chrome://extensions`.

## Install in Firefox

Requires Firefox 140 or newer.

### Permanent installation (recommended)

1. Download the Mozilla-signed
   [UBCMS URL Switcher 1.0.0 package](./releases/ubcms-url-switcher-1.0.0.xpi).
   When viewing the file on GitHub, click **Download raw file**. If you downloaded
   and unzipped the repository, the package is already in its `releases` folder.
2. In Firefox, open `about:addons`.
3. Click the gear icon and choose **Install Add-on From File...**.
4. Select `ubcms-url-switcher-1.0.0.xpi` and approve installation.
5. Pin **UBCMS URL Switcher** from Firefox's Extensions menu.

This installation stays installed after Firefox restarts. No Developer mode,
source checkout, or temporary add-on loading is required.

To update, install a newer Mozilla-signed `.xpi` for this add-on when available.
Pulling source changes does not update the installed signed extension.
Remove it from `about:addons` using its menu's **Remove** option.

### Temporary installation (development only)

Use the same repository files as Chrome; no build or separate manifest is needed.

1. Clone the repository, or download and unzip it into a folder on your computer.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Browse to the unzipped repository folder (for example,
   `Downloads/ubcms-url-switcher-main/`) and select [manifest.json](./manifest.json).
5. Open Firefox's Extensions menu and pin **UBCMS URL Switcher** to the toolbar.

Temporary add-ons are removed when Firefox restarts. Repeat the steps to reload
the extension after restarting. To update files during the same session, click
**Reload** on its card in `about:debugging`. Use **Remove** there to uninstall it.

Do not disable Firefox signature checks. For normal use, install the signed
package above instead of loading the source as a temporary add-on.

### Firefox release maintenance

The signed package in [releases](./releases/) is preserved exactly as downloaded
from Mozilla. Do not edit or repackage it: doing so invalidates its signature.
For a new release, increment the version in [manifest.json](./manifest.json)
and [package.json](./package.json), submit the updated extension to Mozilla,
and add the newly signed package here. Keep the existing Firefox add-on ID.

Maintainers can manage the approved 1.0.0 submission on its
[Mozilla developer version page](https://addons.mozilla.org/en-US/developers/addon/5f8574efb99c48a1a236/versions/6723423)
(requires the maintainer's Mozilla account). This is not a public installation
page; users should download the bundled signed package instead.

## Use

- The popup reads the current tab. You can also paste a full URL or `/content/` path.
- Choose **Author**, **QA**, **QA2**, or **Dev**.
- Choose **Page**, **Editor**, **Sites**, or **Assets**.
- Check the destination preview. **Open URL** navigates the current tab by default.
- Select **Open in a new tab** to keep the current tab and open a separate tab.
- **Copy URL** copies exactly the previewed destination.

For comparison, open the popup on QA, select QA2, check **Open in a new tab**,
and click **Open URL**.
The QA tab remains open. On the QA2 tab, reopen the popup to switch again.

Recognized AEM URLs initialize both selectors from the tab or pasted URL.
Live URLs and content paths default to **QA / Editor**. Invalid or restricted
tabs show an explanation; paste a supported URL to continue.
Settings are not saved between popup sessions.

The popup height follows its content, including expanding and closing Advanced.
URL fields grow as text wraps, up to 60px; longer values remain scrollable inside
the fields. Compact spacing keeps typical states within Chrome's 600px popup
height limit. Exceptionally long messages or increased browser zoom can still
require scrolling; content is never clipped or hidden to suppress scrollbars.

## Advanced targets

Expand **Advanced targets** only when you need direct instances, publishers,
dispatchers, Training, or Syracuse. Choose a server grouped by environment.
The basic Author, QA, QA2, and Dev shortcuts remain available outside Advanced.

- A selected advanced target overrides and disables the basic environment control
  while the section is open. The preview always shows the actual destination.
- Closing Advanced restores the basic environment and the previous author view.
  Reopening resumes the selected advanced target. Choose **Use basic environment
  above** to stop overriding without closing the section.
- Publishers and dispatchers force **Page** and disable the view selector.
  `/editor.html`, `/sites.html`, and `/assets.html` are not sent to those servers.
  Authors retain Page, Editor, Sites, and Assets.
- A publisher/dispatcher receives the normalized `/content/...html` path,
  including `/content/www` when present. DAM resources retain their original
  resource path and extension. Queries and fragments are retained.
- If the source is an advanced server URL, its server is preselected inside the
  collapsed section. Expand it to activate that target; until then the visible
  basic environment remains the destination.
- This compares saved author content against content served by the selected
  publisher or dispatcher, which may be cached. Unsaved editor changes are not
  included. The extension does not determine publication or replication status.

Example: from `https://ubcms-qa.buffalo.edu/editor.html/content/demo.html`,
choose **QA2 / Publisher** to open
`https://cmspubqa2.acsu.buffalo.edu:8443/content/demo.html`. Check **Open in a new tab**
before opening to keep both versions.
The original author tab stays available for comparison.

### Included server origins

Targets are based on the UBCMS host inventory. Ports and protocols are
intentional; HTTP targets are explicitly labeled as unencrypted in the popup.

| Group | Role | Origins |
| --- | --- | --- |
| Production | Direct author | `https://cmsauth1.acsu.buffalo.edu:8443` |
| Production | Publishers | `https://cmspub1.acsu.buffalo.edu:8443`, `https://cmspub2.acsu.buffalo.edu:8443`, `https://cmspub3.acsu.buffalo.edu:8443` |
| Production | Load-balanced publisher | `http://ubcms-pub.acsu.buffalo.edu:4503` |
| Production | Dispatchers | `http://cmsdisp1.acsu.buffalo.edu`, `http://cmsdisp2.acsu.buffalo.edu` |
| Production | Load-balanced dispatcher | `http://ubcms-disp.acsu.buffalo.edu` |
| QA | Direct author | `https://cmsauthqa1.acsu.buffalo.edu:8443` |
| QA | Publisher | `https://cmspubqa1.acsu.buffalo.edu:8443` |
| QA | Dispatchers | `http://cmsdispqa1.acsu.buffalo.edu`, `https://ubcms-disp-qa.acsu.buffalo.edu` (Shibboleth testing) |
| QA2 | Direct author | `https://cmsauthqa2.acsu.buffalo.edu:8443` |
| QA2 | Publisher | `https://cmspubqa2.acsu.buffalo.edu:8443` |
| QA2 | Dispatchers | `http://cmsdispqa2.acsu.buffalo.edu`, `https://ubcms-disp-qa2.acsu.buffalo.edu` |
| Training | Authors | `https://ubcms-training.buffalo.edu`, `https://cmsauth-trn.acsu.buffalo.edu:8443`, `https://cmspub-trn.acsu.buffalo.edu:8443` |
| Training | Publisher | `https://cmspub-trn.acsu.buffalo.edu:9443` |
| Training | Dispatcher | `https://cmsdisp-trn.acsu.buffalo.edu` |
| Dev | Direct author | `https://cmsauth-dev.acsu.buffalo.edu:8443` |
| Dev | Publisher | `https://cmspub-dev.acsu.buffalo.edu:9443` |
| Dev | Dispatcher | `http://cmsdisp-dev.acsu.buffalo.edu` |
| Syracuse | Authors | `https://ubcms-emergency.buffalo.edu`, `https://cmsauth-syr.acsu.buffalo.edu:8443` |
| Syracuse | Publisher | `https://cmspub-syr.acsu.buffalo.edu:9443` |
| Syracuse | Dispatcher | `https://cmsdisp-syr.acsu.buffalo.edu` |

The QA2 dispatcher target uses HTTPS. Only the production publisher instances
listed above are included; do not infer a server count from a load-balanced URL.
Internal hosts may require UB VPN or special VPN access. Load-balanced
URLs can reach different servers; select a specific instance for a fixed-server
comparison. No VPN setup, server-console login, or authentication is automated.

## URL rules

| Environment | Host |
| --- | --- |
| Author | `https://ubcms-author.buffalo.edu` |
| QA | `https://ubcms-qa.buffalo.edu` |
| QA2 | `https://ubcms-qa2.buffalo.edu` |
| Dev | `https://ubcms-dev.acsu.buffalo.edu` |

For `/content/demo-next-gen.html`:

| View | Destination path |
| --- | --- |
| Page | `/content/demo-next-gen.html` |
| Editor | `/editor.html/content/demo-next-gen.html` |
| Sites | `/sites.html/content/demo-next-gen` |
| Assets | `/assets.html/content/dam/demo-next-gen` |

Live example:

```text
https://www.buffalo.edu/asiainstitute/news-events/latest_news.html
  ->
https://ubcms-qa.buffalo.edu/editor.html/content/www/asiainstitute/news-events/latest_news.html
```

Only full `www.buffalo.edu` URLs receive the `/content/www` prefix.
Existing `/content/...` paths are never prefixed again. Other public domains
are unsupported; no domain-specific mapping is guessed.

Query strings and fragments are preserved, including when switching views.
This means parameters such as `wcmmode=disabled` remain until you remove them
from the input. Existing view prefixes and trailing `.html` are normalized for
Page, Editor, and Sites.

Assets uses the first segment after `/content` as the site's DAM root:
`/content/demo.html` and `/content/demo/news/story.html` both open
`/assets.html/content/dam/demo`. The trailing `.html` is removed from the site
segment, and nested page segments are not included. Live URLs mapped under
`/content/www/...` open `/assets.html/content/dam/www`. The `/content` root
itself opens `/assets.html/content/dam`.

An existing DAM folder or asset path is retained when changing environments.
The tool does not guess a corresponding page from an asset.
For a DAM source on author targets, use Assets (or Sites); Page and Editor display
an error. Publisher and dispatcher targets serve the raw DAM resource in Page view.

Basic destinations use HTTPS. Advanced destinations use the exact documented
scheme and port. Unsupported schemes, hosts, credentials, unlisted ports, and
unsupported paths display errors and disable navigation.
The extension rewrites URLs only: it does not verify that content exists,
authenticate you, or bypass VPN/network/access requirements.

## Permissions and privacy

`activeTab` grants temporary access to the tab when you invoke the extension.
Firefox's manifest declares that the extension collects no data.
No persistent host permissions, browsing-history permission, content scripts,
or background worker. The extension makes no network requests; opening a
destination navigates your browser normally. Clipboard access happens only when
you click **Copy URL**. If the browser denies copying, select the preview and copy
it manually; the popup shows the error.

## Development checks

For contributors, run these commands from the repository root using Node.js 20+.
No dependency installation is needed.

```sh
npm test
npm run check
```

Unit tests cover URL transformations and popup actions with explicit browser API
test doubles, including Firefox's `browser` API and Chrome's `chrome` API.
These do not replace testing an installed extension in each browser.

### Installed-extension checks

1. Load the folder unpacked in Chrome, or install the signed package in Firefox,
   and confirm the browser reports no extension errors. For testing source
   changes in Firefox, use temporary installation instead.
2. On QA Editor `/editor.html/content/demo-next-gen.html`, select QA2.
   Verify preview, open it without checking **Open in a new tab**, and confirm
   the original tab navigates to QA2.
3. Check **Open in a new tab** and verify navigation creates a separate tab.
4. Paste the live example above and verify the exact `/content/www/` mapping.
5. Toggle Page / Editor / Sites and confirm no repeated prefixes or `.html`.
6. Paste `/content/demo/news/story.html`, select Assets and QA2, and confirm
   `https://ubcms-qa2.buffalo.edu/assets.html/content/dam/demo`. From a DAM
   folder, switch environments and confirm the folder stays unchanged.
7. Copy a destination, paste it into the address bar, and compare with the preview.
8. Open the popup on `chrome://extensions` or Firefox's `about:debugging`;
   verify that pasting a supported path
   still works. Paste an unsupported URL and verify an error with disabled actions.
9. Expand Advanced and select QA2 Publisher. Confirm `:8443/content/...html`
   without an editor prefix and a disabled Page selector. Copy/open it, then close
   Advanced and verify the basic environment and previous author view return.
10. Select Training Publisher and confirm `:9443`; switch to Training Author
    and confirm author views become available. Repeat with Syracuse.
11. Select an HTTP dispatcher or load-balanced target. Confirm the unencrypted
    connection warning and, where applicable, the load-balancing note.
