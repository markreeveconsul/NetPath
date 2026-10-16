# NetPath 1.8 — Network sandbox

Updated in this installation only:
`C:\Users\Admin\Documents\NetPath\NetPath-Windows-1.7\NetPath`

## Open this copy

Double-click **Start NetPath Sandbox.cmd** in this folder. It opens the Network
sandbox and identifies this installation before reusing a running server. It
uses the first available port from 4180–4189 rather than opening an unrelated
copy on port 4173. Leave the folder name as it is; the application is now 1.8.
Node.js 24+ is required. No package installation or online account is needed.

## Build, connect, configure, test

1. Choose a PC, server, switch, or router from the palette. Click the canvas to
   place it, or use Add at center. Drag to move it, or edit X/Y in its inspector.
2. Select a device. Under an interface, click Connect. Select another device and
   click Connect on its free compatible interface. Alternatively use the From,
   To, and Cable selectors. Copper connects Ethernet ports; fiber connects SFP.
3. Set host IPv4 addresses, prefix lengths, and gateways. Assign router interface
   addresses and add static routes as needed. Configure switch access VLANs.
   Apply configuration saves changes. Power and interface-enable controls
   affect link status and forwarding.
4. Choose a source, enter a destination IPv4 address, and Send ping. A successful
   result requires both request delivery and a valid return path. Step through
   the events to inspect neighbor resolution, switching, routing, and reply flow.
5. Disconnect cables, remove devices, or change settings to investigate faults.
   Undo restores up to 20 topology edits during the current page session.

Example network stages a configured PC–switch–router–server network. Apply
replacement explicitly to load it; this changes only the sandbox and supports
Undo. Import also stages the replacement before applying it.

## Saving

Successful edits save to the existing local database through its revision-aware
API. The sandbox is included in full Settings backups. Export topology saves
only the topology as a JSON file, without study progress or certificates. Use
separate exports to keep multiple networks. Inspect any save-error toast;
failed saves do not replace the saved topology.

## Supported model

Up to 30 devices and 60 cables; modern copper auto-MDI-X, fiber ports, link
state, access VLAN isolation, static IPv4 (/1–/30), host gateways, connected
routes and directly reachable static next hops (/0–/30), longest-prefix route
selection, ARP neighbor reachability, and echo request/reply reachability.

This is a functional but bounded educational simulator, not a complete Packet
Tracer or IOS implementation. It does not simulate trunks, STP convergence,
dynamic MAC aging, DHCP, DNS, NAT, ACLs, OSPF, IPv6, wireless, or physical traffic
timing. Routing uses a 16-decision hop budget; equal-prefix choices use their
configuration order. Switch traversal terminates on loops without modeling
their real broadcast-storm effects. Guided missions remain separately available.

## Validation

The new tests cover physical disconnection, power and interface shutdown, VLAN
separation, occupied ports, incompatible media, invalid addressing, duplicate
neighbors, static routing and longest prefix, missing return routes, removal
cleanup, database persistence across restart, full backup export/restore, and
API rejection of invalid topology. Existing learning/exam tests also pass.

The browser automation connection could not reach local test servers. Visual,
pointer-drag, click-to-wire, and keyboard interaction verification remains
outstanding; engine and API test results do not replace those checks.

Online hosting, Supabase, and live Packet Tracer access remain deferred.
