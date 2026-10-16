// Original study map, checked 2026-09-25. Labels summarize top-level scope;
// gaps are NetPath's own implementation assessment, not Cisco endorsements.
export const v2Source='https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf';
export const v2Domains=[['1','Infrastructure',25],['2','Network access',25],['3','Routing',20],['4','Services and security',20],['5','Operations and AI',10]];
const rows=[
['1.1','Physical faults','hardware',[], 'Needs measured-output fault cases; the current lesson explains symptoms.'],
['1.2','Virtualization','hardware',[], 'Needs independent comparison exercises beyond the worked introduction.'],
['1.3','IPv4 troubleshooting','subnetting',['first-lan'],'Subnet tools cover calculation; mixed addressing faults need more practice.'],
['1.4','IPv6 troubleshooting','ipv6',['ipv6-lan','ipv6-routing'],'Needs deeper address-construction and prefix-fault exercises.'],
['1.5','Wireless fundamentals','wireless',['wireless-lab'],'Needs interference scenarios and richer radio diagrams.'],
['1.6','Client connectivity','troubleshooting',['wireless-lab'],'Needs platform-specific client-output cases.'],
['1.7','DHCP troubleshooting','dhcp-dns',['dhcp-lab','dhcp-relay'],'Needs IOS client scenarios and multiple interacting faults.'],
['2.1','Infrastructure links','vlan',['trunk-lab','lacp-lab','capstone-lab'],'Existing guides do not cover every Layer 3 switching variation.'],
['2.2','Edge ports','vlan',['trunk-lab'],'Needs endpoint-specific designs beyond PCs.'],
['2.3','Discovery and documentation','etherchannel',[],'Needs a cabling-document mismatch investigation.'],
['2.4','Connectivity investigation','troubleshooting',['static-lab','ipv6-routing'],'Needs packet-capture and command-output case sets.'],
['2.5','Rapid spanning tree','stp',['stp-triangle'],'Needs additional protection-feature exercises.'],
['3.1','Route selection','route-choice',['static-lab'],'Needs an interactive route-table interpretation trainer.'],
['3.2','Static route faults','static',['static-lab','ipv6-routing'],'Needs tested backup/default/host-route scenarios.'],
['3.3','OSPF','ospfv3',['ospf-lab'],'OSPFv3 instruction is available; a validated native OSPFv3 lab is still needed.'],
['3.4','Gateway redundancy','redundancy',[],'Needs operational-output exercises and failover observation.'],
['4.1','Management authentication','aaa-management',['ssh-lab'],'Centralized AAA instruction is available; server-backed simulator tests remain.'],
['4.2','Secure file operations','secure-transfer',[],'Needs a supported secure-transfer lab.'],
['4.3','Address translation','nat',['nat-static'],'Current guide covers a static mapping; broader translation cases are missing.'],
['4.4','DNS diagnosis','dns-records',[],'Record-specific instruction and a stale-record incident are available; broader practical cases remain.'],
['4.5','VPNs','access-security',[],'Needs a dedicated worked VPN lesson and packet-flow examples.'],
['4.6','IPv4 filtering','acl',['acl-lab'],'Needs additional ACL formats and placement scenarios.'],
['4.7','Switch defenses','switch-guards',['port-security'],'Current new guide covers one defense; other switch protections remain untested.'],
['5.1','Agentic AI','configuration-ai',[],'Needs a dedicated agent-action evaluation exercise.'],
['5.2','Prompt design','configuration-ai',[],'Needs comparison tasks for network-specific prompts.'],
['5.3','Management models','controllers',[],'Needs richer operational tradeoff scenarios.'],
['5.4','SNMP','operations',[],'Needs an independent telemetry interpretation exercise.'],
['5.5','Ansible execution','ansible-operations',[],'A bounded example playbook is available; execution against a supported lab device remains unverified.'],
['5.6','Syslog interpretation','operations',[],'Needs a timestamped incident-log exercise.']
];
export const v2Objectives=rows.map(([id,title,lesson,labs,gap])=>({id,title,lesson,labs,gap,domain:id.split('.')[0]}));
export function v2CoverageMarkup(lessons,labs,completed=[]){
 return `<div class="callout small"><strong>Planning for a later exam</strong><p>This preliminary v2.0 map links existing material to ${v2Objectives.length} top-level objectives. Every row still has a development gap. A guide link is not proof of complete coverage or simulator validation. Recheck the official requirements before booking.</p><a href="${v2Source}" target="_blank" rel="noreferrer">Cisco v2.0 blueprint ↗</a></div>`+v2Domains.map(([id,name,weight])=>`<section class="card section"><div class="row between"><h2>${name}</h2><span class="badge">${weight}%</span></div>${v2Objectives.filter(o=>o.domain===id).map(o=>`<details class="coverage-detail"><summary><strong>${o.id} · ${o.title}</strong> <span class="badge">Partial coverage</span></summary><p><a href="#lesson/${o.lesson}">${lessons.find(l=>l.id===o.lesson).title}</a> · ${completed.includes(o.lesson)?'Lesson studied':'Not studied'}</p><p class="small">${o.gap}</p><p class="small">${o.labs.length?o.labs.map(id=>`<a href="#lab/${id}">${labs.find(l=>l.id===id).title}</a>`).join(' · '):'No dedicated companion lab yet.'}</p></details>`).join('')}</section>`).join('');
}
