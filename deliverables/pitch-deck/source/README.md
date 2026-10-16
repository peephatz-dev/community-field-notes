# Rebuild the editable deck

The deck uses `@oai/artifact-tool` (Presentation skill) with native PowerPoint text, shapes, connectors and tables. It has exactly ten slides. Sarabun was verified available in the bundled authoring runtime. Install/enable Sarabun on the editing machine to retain intended typography; fonts are not embedded by this exporter.

1. Use the Codex bundled Node executable and modules returned by `load_workspace_dependencies`.
2. Set `RUNTIME_NODE_MODULES` and optional `ARTIFACT_TOOL_MODULE` to that runtime. Defaults in build-deck.mjs target this workstation.
3. Run `node build-deck.mjs` from any directory. The script resolves assets beside itself, writes PNGs under ../slides, validates a private draft and copies the validated bytes to the required final PPTX path.
4. Each revision uses a timestamped private validated filename, as the finalizer does not overwrite a previously validated file. The final required output receives the validated bytes unchanged.
5. Run bundled Python `export-pdf.py` after reviewing the PNGs. The PDF is an image-based reading copy from 1920×1080 renders; the PPTX remains editable. Direct Artifact PDF export failed on the runtime's missing `#standard-fonts/Helvetica`; the isolated headless LibreOffice conversion omitted Thai text and was rejected. No substitute authoring dependency was installed.
6. Source claims, full URLs and detailed speaker notes live in speaker-content.json. The separate timed script is ../pitch-script-th.md. Financial price is a single online UPS reference, not a verified project BOM.

Authoring receipt is private `.codex-build/pitch10/final-deck.validation.json`. It verifies package, declared geometry, font names, slide count, native tables and first-party re-import, not execution in PowerPoint. PowerPoint/Google Slides native application editing was not tested.


## Prototype synchronization, 16 October 2026

Slides 4 and 6 use the same `energy-platform-app/src/lib/prototype-topology.json` as the circuit graph, component inspector and Architecture page. The complete user flowchart contains P0–P3, per-box power wiring, 5V distribution from RELAY and telemetry arrows from ESP1–ESP3 to ESP0. It is a proposed design, not a test result. The existing browser model remains pooled; see `energy-platform-app/docs/prototype-flowchart.md` for full limits and validation items.
