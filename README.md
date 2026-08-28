# AquaCheck — Feed Document Inspection

Assistance tool for aqua feed document checking and validation.

## What changed in this refactor

- **Download .md removed.** The "Download .md" button and its supporting code
  (`DocumentModel.downloadMarkdown`) have been removed — the editor is purely for
  input/editing now, not export.
- **Checklist grouped by document type.** Checklist rules now belong to a document
  type (e.g. "Health Certificate", "Packing List", "Invoice") in addition to their
  existing rule category. The Checklist Settings tab shows a tab per document type,
  and you can add or remove document types from there. The Document step gets a
  "Document type" selector that determines which document type's rules a compliance
  check runs against.
- **PDF → Markdown conversion removed.** The app no longer accepts PDFs, renders page
  thumbnails, or calls the image-to-markdown Claude API path. Markdown is now supplied
  directly by pasting/typing it into the editor (file upload has been removed too — the
  editor is the only input path).
- **Access key gate.** Before the app is usable, it shows a lock screen asking for an
  access key. This isn't a login system — no accounts or usernames — just a single
  shared passphrase, set server-side as the Worker's `APP_KEY` secret, that the Worker
  checks on every request via an `X-App-Key` header. See
  `/cloudflare-worker/README.md` for how to set it.
- **Split into MVC.** The former single `aquacheck.html` file has been broken into
  models, views, and controllers (see structure below), loaded as native ES modules.

## Structure

```
index.html                        Shell: markup + font/style links, boots js/main.js
css/
  styles.css                      All app styling (PDF thumbnail styles removed)
js/
  main.js                         Entry point — instantiates and starts AppController
  model/
    DocumentModel.js               State for the document under review (markdown, step, results)
    ChecklistModel.js               Checklist rules, categories, defaults, persistence (window.storage)
    AuthModel.js                    Access-key state + localStorage persistence
  view/
    icons.js                       Shared inline SVG icon set
    StepperView.js                 2-step workflow indicator (Document → Results)
    DocumentView.js                 Paste/edit markdown step
    ResultsView.js                  Stamp-style pass/fail/warning/unclear results
    ChecklistView.js                Checklist Settings tab (categorized, toggleable, editable)
    GateView.js                     Access-key lock screen shown before the app is usable
  controller/
    AppController.js                Top-level: gate boot sequence, tab switching, wires sub-controllers
    DocumentController.js           Handles the markdown editor, running the compliance check
    ChecklistController.js          Handles rule toggle/edit/delete/add + persistence
    GateController.js               Handles access-key input + verification against the Worker
  api/
    claudeApi.js                    API calls (checklist compliance check, access-key verification)
  util/
    helpers.js                      Shared helpers (HTML escaping)
```

## Running it

This app uses native ES modules (`<script type="module">`), so it must be served over
HTTP — opening `index.html` directly via `file://` will fail due to browser CORS
restrictions on module imports. From the project root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static file server (GitHub Pages, `npx serve`, nginx, etc.) works the same way.

## Note on the API/storage calls

`js/api/claudeApi.js` calls `https://api.anthropic.com/v1/messages` without supplying
an API key, and `js/model/ChecklistModel.js` persists rules via `window.storage`. Both
of these only work when the app is running inside a Claude.ai Artifact sandbox, which
provides them automatically. To deploy this outside of Claude.ai (e.g. GitHub Pages,
your own server), you'll need to:

- Replace the `fetch` call in `claudeApi.js` with a call to your own backend that holds
  a real Anthropic API key (never ship a key to the browser).
- Replace `window.storage` in `ChecklistModel.js` with `localStorage`, a real database,
  or another persistence layer of your choice.

## Default checklist

Ten rules across four categories — Completeness, Regulatory Requirements, Data
Consistency, and Formalities — filed under the "Health Certificate" document type,
covering things like consignor/consignee details, heat treatment parameters,
Salmonella/Enterobacteriaceae limits, ruminant-derived ingredient declarations, batch
number consistency, and signature/stamp formalities. Two more document types —
"Packing List" and "Invoice" — start out empty. Add, edit, or remove document types
and rules from the **Checklist Settings** tab; the Document step's "Document type"
selector picks which set of rules a check runs against.
