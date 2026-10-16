// Original companion exercises. Execution in Packet Tracer remains unverified.
const s=(title,action,expected,hint)=>({title,action,expected,hint});
export const routingSecurityLabs=[
{id:'ipv6-routing',title:'Route IPv6 between two LANs',level:'Intermediate',minutes:50,lesson:'static',devices:['PC-A / S1','R1 / R2','S2 / PC-B'],subtitle:'Build a routed IPv6 path, remove its return route, and diagnose the evidence.',addresses:[['PC-A','Fa0','2001:db8:10::10','/64','2001:db8:10::1'],['R1','Gi0/0','2001:db8:10::1','/64','—'],['R1','Gi0/1','2001:db8:12::1','/64','—'],['R2','Gi0/1','2001:db8:12::2','/64','—'],['R2','Gi0/0','2001:db8:20::1','/64','—'],['PC-B','Fa0','2001:db8:20::20','/64','2001:db8:20::1']],steps:[
s('Build a fresh routed workspace','Use two 1941 routers, two 2960 switches, and two PCs. Follow the numbered diagram. Save as NetPath-IPv6-starter.pkt before configuration.','Five links connect the two LANs through the routers.','Routers start with administratively disabled interfaces. This is expected until you enable them.'),
s('Configure the interfaces','Enter only the R1 configuration block on R1 and the R2 block on R2. Enable IPv6 forwarding on both routers. On each PC, use Desktop → IP Configuration to enter the IPv6 address, /64 prefix, and IPv6 gateway in the table.','show ipv6 interface brief shows the intended global addresses and up/up links; each PC can ping its local gateway.','The two router interfaces on the transit link share 2001:db8:12::/64. Every LAN has a different prefix.'),
s('Verify the static paths','After applying both route commands, run show ipv6 route on each router. Identify the connected LAN/transit entries and the static route to the opposite LAN.','R1 has a static path to 2001:db8:20::/64 via 2001:db8:12::2; R2 has the reverse path via 2001:db8:12::1.','Use the full next-hop address in commands. The transit next hop must be reachable through a connected interface.'),
s('Prove end-to-end traffic','On PC-A, ping 2001:db8:20::20. On PC-B, ping 2001:db8:10::10. Record both tests in the lab evidence log. Retry after Neighbor Discovery settles if the first request times out.','Both directions receive echo replies.','A local gateway ping alone cannot prove forwarding across R1 and R2.'),
s('Remove only the return route','Save a working copy. On R2 enter configure terminal, then no ipv6 route 2001:db8:10::/64 2001:db8:12::1, then end. Repeat the original PC-A-to-PC-B ping and inspect both routing tables.','The end-to-end exchange fails while local gateway and transit-link tests can still work. R2 no longer has the intended return path.','Do not alter PC-A or cables when route-table evidence already identifies a missing reverse path. A failed ping does not by itself show which direction failed.'),
s('Recover and preserve the baseline','Restore ipv6 route 2001:db8:10::/64 2001:db8:12::1 on R2. Repeat both end-to-end tests, save both router configurations, and save NetPath-IPv6-reference.pkt.','Both tests recover and your saved evidence includes before, fault, and recovery observations.','Do not label the lab verified until you actually observe its results in your simulator.')],commands:`! R1 — paste this block only on R1
enable
configure terminal
hostname R1
ipv6 unicast-routing
interface gigabitEthernet0/0
 ipv6 address 2001:db8:10::1/64
 no shutdown
exit
interface gigabitEthernet0/1
 ipv6 address 2001:db8:12::1/64
 no shutdown
exit
ipv6 route 2001:db8:20::/64 2001:db8:12::2
end
show ipv6 interface brief
show ipv6 route
copy running-config startup-config

! R2 — paste this block only on R2
enable
configure terminal
hostname R2
ipv6 unicast-routing
interface gigabitEthernet0/0
 ipv6 address 2001:db8:20::1/64
 no shutdown
exit
interface gigabitEthernet0/1
 ipv6 address 2001:db8:12::2/64
 no shutdown
exit
ipv6 route 2001:db8:10::/64 2001:db8:12::1
end
show ipv6 interface brief
show ipv6 route
copy running-config startup-config`,challenge:'In a separate copy replace R1’s remote /64 route with a /128 route for PC-B only. Add another PC in the remote LAN and predict why the new host has no matching route on R1. Restore the /64 baseline.'},
{id:'port-security',title:'Control which MAC address may use a port',level:'Intermediate',minutes:40,lesson:'l2-security',devices:['PC-A · secured port','S1 · 2960','PC-B · test peer'],subtitle:'Learn one endpoint, trigger a violation, and recover deliberately.',addresses:[['PC-A','Fa0','192.168.80.10','255.255.255.0','None'],['PC-B','Fa0','192.168.80.20','255.255.255.0','None']],steps:[
s('Establish a working baseline','In a fresh workspace connect PC-A to S1 Fa0/1 and PC-B to S1 Fa0/2. Set the static PC addresses. Ping PC-B from PC-A before applying security.','The same-subnet ping succeeds.','No router or default gateway is required. Save a baseline copy before making changes.'),
s('Secure the access port','Apply the S1 reference configuration. Fa0/1 is a static access port with one sticky secure MAC allowed and shutdown on violation. Generate another ping from PC-A.','show port-security interface fastEthernet0/1 indicates security is enabled and the secure-address table contains PC-A’s MAC.','Sticky learning needs traffic. Do not save or trigger the fault until the intended MAC has been learned.'),
s('Inspect and save what was learned','Use show port-security address and show running-config. Record PC-A’s secure MAC and its interface. Save the switch configuration and workspace as a working reference.','The learned sticky address appears in configuration and the allowed PC can still communicate.','A sticky MAC becomes persistent across device restart only when the configuration containing it is saved.'),
s('Trigger a controlled violation','Work in a copy. Disconnect PC-A from Fa0/1 and PC-B from Fa0/2. Connect PC-B to the secured Fa0/1, then run ping 192.168.80.10 from PC-B to generate traffic.','The new source MAC violates Fa0/1 policy. Inspect show port-security interface fastEthernet0/1 for secure-shutdown/violation status.','PC-A is disconnected, so the failed ping alone proves nothing about security. The port-security state and counters are the relevant evidence.'),
s('Restore the intended endpoint','Disconnect PC-B from Fa0/1. Reconnect PC-A to Fa0/1 and PC-B to Fa0/2. On S1 enter configure terminal, interface fastEthernet0/1, shutdown, no shutdown, end.','The port can recover with the approved source restored; PC-A can ping PC-B again.','Restoring the port while the unexpected endpoint remains connected can immediately trigger another violation.'),
s('Record the policy evidence','Record the baseline and recovered PC-A-to-PC-B tests, plus the violation output and reason for the controlled failure. Save the recovered configuration and workspace.','Your notes separate approved connectivity from the observed security violation.','This feature constrains source MAC use; it does not establish a person’s identity or replace broader access controls.')],commands:`! S1 — start after verifying the unfiltered LAN
enable
configure terminal
hostname S1
interface fastEthernet0/1
 switchport mode access
 switchport access vlan 1
 switchport port-security
 switchport port-security maximum 1
 switchport port-security mac-address sticky
 switchport port-security violation shutdown
end
! Generate traffic from PC-A before inspecting or saving
show port-security interface fastEthernet0/1
show port-security address
show running-config
! Save only after confirming PC-A was learned
copy running-config startup-config`,challenge:'In a disposable copy compare restrict with shutdown. Keep the intended secure MAC, use the unexpected endpoint to generate traffic, and compare port state, violation counter, and forwarding behavior. Restore the saved baseline.'}
];
