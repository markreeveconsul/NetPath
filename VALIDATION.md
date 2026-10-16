# NetPath 1.2 practitioner update — September 26, 2026

Added simplified reading for all 33 lessons; three practitioner tracks with three difficulty levels, optional timers, persisted attempts, score/domain/practical passing gates, and downloadable certificates. Exam archives are included in backups. See PRACTITIONER-EXAMS.md for requirements and limitations.

Validation: all 24 automated tests pass. Isolated browser checks verified simplified mode persistence, response saving across reload, on-page submission, failed-result gating, and a passing QA certificate download. No learner records were used for tests. Restart the server after updating.

## Earlier release record

# September 26 offline release verification

18 automated tests pass using isolated temporary databases. Added exact domain-proportion checks, route boundary/host/default/ECMP cases, configuration-context and ACL-order negative tests, bounded workbench history validation, and API persistence of workbench results across restart. Browser checks confirmed grading, saved history after reload, and a balanced 60-question session. Native Packet Tracer lab behavior is still unverified.

# Verification record

Validated September 22, 2026 on the current Windows computer with Node.js 24.18.1.

## Automated checks

Six test groups pass:

1. IPv4 subnet boundaries, including changing octets, /1, and /30; invalid inputs rejected.
2. Spaced-review scheduling for failed and successful recall.
3. Supported command modes and actual VLAN state in the teaching sandbox.
4. Lesson/module references and all 16 lab lesson links.
5. All 81 unique question IDs, valid answer choices, 53 objective references, and glossary links.
6. Persistence across process restart; 30-question draft and confidence recovery; valid export/restore; invalid restore rejection; missing-token and stale-revision rejection; pre-restore recovery snapshots.

Run again with `node --test tests.mjs`.

## Browser checks

Verified in an isolated local test database:

- Overview and lesson navigation.
- Note entry, completion, and assessment history.
- Review reveal and rescheduling.
- Correct subnet grading and worked boundaries for 192.168.8.77/26.
- Complete 10-question assessment grading, explanations, and lesson links.
- A selected answer and timer survive reload.
- Expanded 30-question session starts with 45 minutes and saves all 30 IDs.
- Objective confidence selection survives reload.
- Glossary search for VLAN returns related terms.
- Study plan calculates weekly blocks from the configured time budget.
- Lab checkmarks save to the local database.
- Installed Cisco help image loads, and integration status shows the distinction between installation, port reachability, and live connection.
- Light and dark layouts inspected; narrow glossary and lab pages had page width equal to viewport width, with wide data tables contained inside their scroll areas.
- No browser error logs observed during these checks.

WebMCP read-progress and open-lesson tools were invoked successfully in a supported browser. The lesson tool does not mark a lesson complete. An invalid lesson ID was rejected through the browser tool bridge, and saved progress remained unchanged.

## September 25 VLSM update

September 25 VLSM update: all 12 automated test groups pass. Coverage includes largest-first allocation, exact exhaustion, the top of IPv4 address space, large /1 arithmetic, unused CIDR blocks, duplicate names, invalid host counts, alignment, capacity rejection, API rejection, and persistence across server restart. Browser checks confirm correct example allocation, plan recovery after reload, retention of the prior saved plan after invalid input, and no browser console errors.

## Not verified

After sign-in, a separate unnamed Packet Tracer workspace was observed using native window controls; CISCO.pkt was also open. Concurrent user input prevented stable extension-menu inspection. A bounded read-only Java probe to the default local IPC port did not reach an IPC-ready session. No live topology data was obtained, and no native lab was created or graded. Companion guide commands need simulator execution and observation before being marked validated.

## September 22 topology update

All seven automated test groups pass. Topology checks cover all 16 lab IDs, valid endpoints, unique physical port assignments, connected graphs, and the distinct STP/LACP/ACL structures. Browser checks rendered all 16 guides without console errors. Device selection correctly filtered the LACP PC-A and ACL R1 wiring lists. Light and dark diagrams were visually inspected. At a narrow effective viewport of 307 pixels, the diagram remained inside its own horizontal scroll area without page overflow. Downloaded-guide generation now includes the same wiring data; no learner progress schema or database migration was needed.

The launcher executable path was verified. Launching repeatedly was avoided because multiple Packet Tracer instances were already running. Cloud access, AI tutoring, complete exam-subobjective coverage, and v2.0 alignment are not implemented by these checks.


