# Simulation architecture update — 2026-10-09

Implemented in this NetPath installation only. Existing version 1 topology files remain compatible; no migration is necessary.

## Boundaries

- `public/sandbox-topology.js`: schema validation, topology editing helpers and link state. Maximum 50 devices / 100 links.
- `public/sandbox-diagnostics.js`: non-blocking configuration findings. Duplicate addresses are warnings because isolated networks may reuse addresses.
- `public/sandbox-simulation.js`: pure synchronous `simulate(topology, action, previousState, options)` returning `{result, trace, nextState}`. No browser imports, random numbers or wall clock. The injected `options.now` is monotonic simulated seconds.
- `public/sandbox-explanations.js`: reason-code presentation, independent of forwarding decisions.
- `public/sandbox-engine.js`: compatibility exports and legacy `ping` adapter.
- `public/network-sandbox.js`: trace playback, explicit clock controls and table presentation.

The action currently supports ping with sourceId, destination and optional TTL (1–255, default 64). Trace events include hop, device, layer, decision, reasonCode, phase, packet addresses, TTL and structured details. Return-path failure remains distinct from request failure.

## Modeled behavior

ARP broadcasts, replies and 120-second neighbor entries; per-VLAN source MAC learning, known unicast forwarding, unknown unicast flooding and 300-second MAC entries. These lifetimes are teaching-model constants, not vendor defaults. MAC addresses are deterministic synthetic addresses. Switches preserve packet TTL; forwarding routers decrement it and drop packets at expiry. Locally delivered and locally originated packets do not consume a forwarding hop.

Runtime tables are ephemeral and reset on topology edits (including layout changes) or page reload. Saved topology and learning progress are unchanged. Advance time manually to study expiry. The UI consumes returned traces; its animation timer never changes the engine outcome.

## Validation

Run `npm test`. New tests cover deterministic results, frozen inputs, JSON round trips, cold/warm ARP, MAC flooding/learning, expiry, TTL, route source selection, return-path failure, topology invalidation and rendered controls. Existing persistence, backup and exam checks remain included.

A connected 50-device switched topology (48 switches and 2 endpoints) was benchmarked over 100 measured cold-cache pings after 10 warmups. Observed Node p95 was approximately 6 ms during the full suite. The provisional budget is p95 under 16 ms for one action on representative topologies; browser profiling and more varied topologies are still required before treating this as a browser performance guarantee. No Worker is introduced yet.

## Deliberate limits

This remains an educational IPv4 model: no IOS emulation, VLAN trunks, STP, dynamic routing, DHCP, NAT, ACLs, IPv6, retransmission timing or traceroute. TTL expiry is explained but does not generate a simulated ICMP Time Exceeded return packet. Ethernet loops are bounded computationally, not converged by STP. ARP conflict detection is simplified. Full physical packet timing and packet loss are not modeled. Future traceroute and protocol additions should use this same core.

Online deployment and Supabase integration are separate work and are not enabled by this update.
