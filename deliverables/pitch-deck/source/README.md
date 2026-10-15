# Rebuild the editable deck

The deck uses `@oai/artifact-tool` (Presentation skill) with native PowerPoint text, shapes, connectors and tables. It has exactly ten slides. Sarabun was verified available in the bundled authoring runtime. Install/enable Sarabun on the editing machine to retain intended typography; fonts are not embedded by this exporter.

1. Use the Codex bundled Node executable and modules returned by `load_workspace_dependencies`.
2. Set `RUNTIME_NODE_MODULES` and optional `ARTIFACT_TOOL_MODULE` to that runtime. Defaults in build-deck.mjs target this workstation.
3. Run `node build-deck.mjs` from any directory. The script resolves assets beside itself, writes PNGs under ../slides, validates a private draft and copies the validated bytes to the required final PPTX path.
4. Each revision uses a timestamped private validated filename, as the finalizer does not overwrite a previously validated file. The final required output receives the validated bytes unchanged.
5. Run bundled Python `export-pdf.py` after reviewing the PNGs. The PDF is an image-based reading copy from 1920×1080 renders; the PPTX remains editable. Direct Artifact PDF export failed on the runtime's missing `#standard-fonts/Helvetica`; the isolated headless LibreOffice conversion omitted Thai text and was rejected. No substitute authoring dependency was installed.
6. Source claims, full URLs and detailed speaker notes live in speaker-content.json. The separate timed script is ../pitch-script-th.md. Financial price is a single online UPS reference, not a verified project BOM.

Authoring receipt is private `.codex-build/pitch10/final-deck.validation.json`. It verifies package, declared geometry, font names, slide count, native tables and first-party re-import, not execution in PowerPoint. PowerPoint/Google Slides native application editing was not tested.


## Prototype synchronization, 15 October 2026

Slide 4 reads the exact same `energy-platform-app/src/lib/prototype-topology.json` as the circuit graph and component inspector. Slide 6, the script and notes distinguish the received P0 wiring from incomplete P1 declarations and the old pooled simulation. Full provenance, known arrows and missing details are in `energy-platform-app/docs/prototype-flowchart.md`, included in slide 10 notes and the public appendix. The source stops at `EC["EC`; no P1 or inter-node connection was invented.
