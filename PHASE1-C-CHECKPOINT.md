# Phase 1(c) checkpoint — 2026-10-10

## Delivered
- Catalog-driven bottom dock with Network, End devices and Cables. Empty categories and unsupported serial/console cables are hidden.
- Drag a tile to place a device; or select a tile and click the canvas. Focus a tile and press Enter to place at the last pointer position (center before pointer use).
- Cable tool, anchored port menu, cursor-following draft, valid/invalid target treatments, occupied-port peer names and explicit incompatibility explanations.
- Drag from a visible port dot onto a device to choose its destination port, or onto a port dot directly.
- Keyboard cabling: focus a device, C, arrows and Enter; Tab to the next device, Enter to open its menu, arrows and Enter to finish. Escape cancels. Disabled menu entries remain focusable for reading their reasons.
- Beginner and Exam modes; wrong copper cable in Exam mode is physically retained but link-down, affecting simulation reachability. Explanation appears in completion status/toast, link title and Advanced cable list.
- Undo/Redo; the original form and cable list moved into Advanced. The alternative form does not default to a self-connection.
- Pointer movement updates only node position, port anchors and connected SVG lines; it does not rerender the whole application while dragging.

## Compatibility and scope
Topology remains version 1. Optional `realism` is `beginner` (default) or `exam`. Optional cableType is straight/crossover/fiber and must match media. Existing untyped copper links deliberately retain automatic MDI-X in both modes; the UI labels them as legacy automatic cables. New links always record type.

`linkStatus(net, link)` returns `{up, reason}`; existing `linkUp` delegates to it. The simulator's public contract is unchanged. Copper rules use catalog MDI roles, not device names; a PC and router both use MDI and need crossover in Exam mode.

This checkpoint retains the old canvas node appearance. The supplied icons are used in the dock through one symbol sprite. The full fixed-viewport layout, canvas icons and visual style are step (d). No Phase 2–4 features or new runtime dependencies were introduced.

## Files touched
public/sandbox-editor.js, public/sandbox-cables.js, public/network-sandbox.js, public/network-sandbox.css, public/sandbox-topology.js, catalog-tests.mjs, cable-tests.mjs, sandbox-api-tests.mjs, phase1-c-browser-tests.mjs, package.json. Pre-change files are in .development/phase1-c-before. Original golden fixtures were preserved; comparison now verifies unchanged device rendering instead of the deliberately changed surrounding toolbar.

## Validation
- 99 Node tests passed, including engine regression, compatibility, MDI matrix, schema validation, saved topology/cable types/realism across restart, backup and restore.
- In-app browser, isolated in-memory QA: dragged PC, switch, router and server from dock; connected PC–switch by picker and switch–router using keyboard only. Confirmed a two-link DOM result.
- Found and fixed pointer capture swallowing click selection; verified selecting Office router opens its inspector.
- Tested router port drag to server picker; completed a third cable and verified successful cross-router ping in Beginner mode. Exam mode failed on the deliberately wrong straight-through MDI–MDI cable and displayed the crossover explanation.
- Verified used-port peer details, wrong-media labels, same-port/self-device reasons, and Escape closing the menu. No browser console errors observed in these checks.
- Tablet-width dock was inspected. Full responsive fixed-height redesign is deferred to step (d).
- Performance limitation: a 50-device background browser drag sample recorded 8 frame intervals at about 1 FPS (p95 1016.7 ms), consistent with background timer throttling. This is NOT a foreground smoothness measurement. A foreground drag profile remains required; do not claim 60 FPS.
- Shell Playwright runner was prepared but could not launch Edge in this restricted execution environment. Manual browser checks above were performed with the in-app browser instead. No lint/typecheck configuration exists in this vanilla JavaScript project; changed modules passed Node syntax checks.

## Review manually
Restart NetPath from this installation, refresh Network sandbox, then drag PC/Switch/Router from the dock. Choose Cable, click a device and a free port, then choose another device and port. Try C/arrow/Enter/Tab without the mouse. Test wrong cable selection in Exam mode, cancellation and Undo/Redo. Imported old cables keep automatic behavior as documented above.

Preview: .development/phase1-c-qa/port-picker-preview.png
