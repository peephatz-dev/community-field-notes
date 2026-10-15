# Design system documentation record

The approved dashboard extends the incumbent light PowerGuard identity. `energy-platform-app/DESIGN.md` was merged into the canonical token-bearing format; `.impeccable/design.json` was regenerated with matching metadata and eight self-contained component previews. PRODUCT.md is preserved. No interface source, runtime behavior or deployment was changed by this documentation pass.

## Source compared

- The prior DESIGN.md: light rounded community identity, exact palette, original mascot, short Thai copy, self-hosted fonts, opt-in audio, event retention and simulation boundaries.
- `src/lib/powerguard/brand.json`: all ten brand values preserved exactly.
- `src/app/layout.tsx` and `src/app/globals.css`: font imports, body stack, base type, shell breakpoints and focus behavior.
- `src/styles/powerguard-tokens.css`, `src/styles/powerguard-app.css` and `src/styles/isometric-dashboard.css`, in import order: final light variables, effective button/card styles, scene overlays, desktop and mobile layout, lower notice placement.
- `src/components/powerguard/IsometricDashboard.tsx` and `src/store/powerguard.ts`: shared simulation, three audience modes, equipment selection, 2D fallback, operator actions and browser-local persistence.
- `deliverables/web-ui/design-brief.md`: approved composition and unchanged evidence boundaries.

## Captures compared

`.impeccable/review/desktop.png` shows the light rail, upper two-column KPI group at 1440px, right inspector, selected equipment markers, mascot, camera controls and lower timeline. `.impeccable/review/mobile.png` shows the separate KPI region above the canvas, responsive command bar and bottom navigation. `.impeccable/review/desktop-outage-fixed.png` shows the outage/backup/suspended-load states and incident sequence. Its notice is still at the right; that file predates the current center-lower CSS placement and is not evidence of the final notice position. The implementation source is the authority for the documented placement.

## Reconciled and excluded drift

The previous sidecar described an obsolete dark teal system and did not match the existing light DESIGN.md or current stylesheet cascade. It was replaced within the authorized documentation update. The token prelude still names Noto Sans Thai, while the actual body and source imports use Manrope Variable / IBM Plex Sans Thai; no font migration was made or documented. Small 8–10px scene metadata was observed but was not promoted into a new essential-text standard. The accidental `.impeccable/questions/roll.json` is outside this documentation record.

All equipment locations remain proposed; values, loads and environmental models remain simulated. Local notes are not delivered to agencies. This record makes no hardware, backend, field-validation, real-time connection or deployment claim.

Final notice evidence: screenshots/desktop-outage.png was refreshed after center-lower placement. Targeted fresh reviewer verdict: ship, mascot regression resolved.
