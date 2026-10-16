# NetPath 1.6 — October 5, 2026

The field lab now opens into an isometric school office. Select the PC, switch,
router, server, or printer in the scene or with the numbered device buttons.
Packet traces use the existing network model, including distinct gateway,
VLAN, and access-policy failure points. Toggle the floor cables or switch to
the original diagram for a schematic view.

The classroom has updated dark and light palettes, quieter surfaces, tighter
navigation, and revised lesson typography. Navigation and the theme control
remain available while using the field lab.

This is a fixed-camera 2.5D scene, not a free-roaming 3D environment. It models
one bounded network with three repair jobs. It does not control Packet Tracer.
Online features and live Packet Tracer integration remain deferred.

## Open or update

Run `Start NetPath.cmd`, then choose **Field lab**. Requires Node.js 24+.
Existing installations in this workspace can refresh the browser to see the
new interface. No database migration is required.

For a separate extracted copy, export your backup from the old installation,
close it using its normal stop instructions, and restore that backup in the
new copy through Settings & backups. The distribution ZIP excludes personal
progress and backups. Never replace or delete your existing data folder.

## Verification

All 32 automated tests passed. Browser checks on a separate QA database covered
all three fault/repair/close flows, closed-job persistence after reload,
device selection, diagram/isometric switching, dark/light mode, and learning
path navigation. A narrow viewport check found no document horizontal overflow.

The curriculum and assessment content is unchanged in this release.
