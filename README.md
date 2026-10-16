# NetPath

Current release: **1.8.0**. See [RELEASE-1.8.md](RELEASE-1.8.md) for the hands-on network sandbox and its supported model. See [RELEASE-1.7.md](RELEASE-1.7.md) for guided missions, packet inspection, grouped navigation, and validation status. Older release notes below describe their original scope.

A personal, local networking classroom with dark/light themes, original lessons, practice tools, and Packet Tracer companion guides.

## Open the application

Double-click **Start NetPath.cmd** in this folder. The launcher starts a local background server and opens **http://127.0.0.1:4173** in your default browser. If NetPath is already running, it opens the existing instance.

Requires Node.js 24 or newer. Node.js 24.18.1 was found on this computer. No npm installation is required. To run manually from this folder: `node server.mjs`.

This application runs only on this computer. It is not a public website, cloud service, or multi-device synchronization service. It continues to function without Internet access, apart from external reference links. Packet Tracer may have its own sign-in requirements.

## September 26 offline update

Network workbench adds 16 synthetic troubleshooting cases, six route-decision exercises, and six bounded submitted-configuration checks. Results persist in the local database and backups. The 60-question balanced mode follows v2.0 domain proportions; it does not establish full subtopic coverage or predict a passing score. Six supplemental lessons expand v2.0 instruction. One topology-only native starter is included under public/native-labs.

Online AI and cloud sync are deferred at the user’s request. No API keys are required. Live Packet Tracer integration is also deferred.

## Included

- A saved VLSM planner in Practice Studio: enter a parent prefix and department host counts, calculate aligned subnets, review unused CIDR blocks, and download the addressing plan. Valid calculated plans are stored in SQLite and included in backups; edited inputs are saved only when you choose Calculate & save plan.

- 37 lessons across eight modules, each with worked instruction, troubleshooting guidance, and an independent exercise with revealable reasoning.
- 181 original questions; 10-, 30-, and 60-question timed sessions, module focus, and missed-topic practice. Unfinished sessions retain their question order, answers, and deadline after reload.
- A saved lab test log with expected/observed outcomes, command-output notes, and export. These are self-reported observations, not live simulator grading.
- 18 Packet Tracer companion labs, with topology diagrams, addressing tables, commands, checkpoints, troubleshooting hints, and downloadable text guides.
- An illustrated ARP/ICMP walkthrough, IPv4 subnetting trainer, and a limited IOS-style VLAN command sandbox.
- Spaced review cards for completed lessons, a searchable glossary, and a study plan based on weekly study hours.
- A tracker for 53 top-level CCNA v1.1 objectives, with separate lesson progress and self-assessed confidence.
- Local SQLite persistence, automatic recovery snapshots, JSON export/import, and stale-write protection between browser windows.
- Dark/light mode, responsive layouts, keyboard-accessible controls, and two optional WebMCP learning tools when supported by the browser.

## Packet Tracer status

Detected: **Cisco Packet Tracer 9.0.1.0858**, under `C:/Program Files/Cisco Packet Tracer 9.0.1`.

The application can request that the installed executable open, detect the installed extension framework, and check reachability of its documented default local IPC port 39000. A reachable port is **not** a verified application connection.

The Packet Tracer help screenshots are read from the existing local installation. They are Cisco illustrations, not screenshots of the user's current workspace, and may depict an older interface. Cisco binaries, libraries, and screenshots are not copied into this deliverable.

A read-only Java framework probe reached the local listening port but did not complete an IPC-ready session within its timeout. Live topology reading, native `.pkt`/`.pka` creation, simulator-side grading, and live state synchronization are **not implemented or verified**. The guides remain companion instructions. Native lab configurations still need execution and verification in Packet Tracer.

If Packet Tracer is installed elsewhere, update the `ptRoot` constant in `server.mjs`; installation discovery is currently specific to this computer. The launch action opens the executable without loading or modifying a workspace. Avoid opening repeated instances; reuse your current Packet Tracer window.

## Save and recover

Your authoritative progress is in `data/netpath.sqlite`. Theme preference and unsubmitted lab-test drafts are in browser storage. Recorded lab tests are in the database and backups. Notes save after a short typing pause; a failed save remains visible as an error. Browser-close warnings protect unsaved note text where the browser supports them.

Snapshots are created in `data/backups` at server startup, before changes after a ten-minute interval, on request, and before a valid restore. The newest 30 snapshots are retained. Snapshots on the same disk do not protect against disk failure: export a JSON backup and copy it to another drive or your own backup service.

Use **Settings & backups → Export backup** for a portable copy. Restore through the file picker on the same screen; you will be asked before existing progress is replaced. A restore is validated before replacement and creates a recovery snapshot first.

Do not delete the `data` folder to update source files. Before moving the entire folder, stop the server or export a backup. Browser clients use revisions to prevent silently overwriting progress saved by another open window; if a conflict occurs, copy any unsaved note, reload, and reapply it.

## Curriculum scope

This is a usable first release, not the completed full-depth certification program. Lessons are introductions with practical exercises, and the assessment bank is limited and repeatable. The objective tracker maps top-level v1.1 objectives, not every detailed subobjective. Completing it does not establish exam readiness or guarantee a pass.

Cisco announces v1.1 testing through February 2, 2027 and v2.0 from February 3, 2027. The v2.0 curriculum audit remains outstanding. Selecting an exam target in Settings does not change the content version.

Optional AI tutoring, cloud synchronization, reminders, a validated full-length mock exam bank, and deeper beyond-CCNA modules are not included in this release. The core learning app does not need an API key or paid service.

## Validation

Run `node --test tests.mjs` from this folder. Tests exercise subnet boundaries, review scheduling, command modes, content references, server persistence across restart, token rejection, stale writes, invalid restore rejection, and backup recovery. Automated tests use a separate temporary database.

Browser checks were performed separately from the learner database. Test data is stored outside this deliverable under the task's `work` folder; port 4174 is a test instance, while **4173 is the learner application**.

## Architecture

Each lab includes a wiring diagram and a device selector to highlight connected cables and show exact ports. Numbered cables correspond to an accessible wiring list. The guide download includes these connections. On a small screen, scroll the diagram horizontally. Line styles describe link types, not live link status. These original diagrams are stored in `public/topologies.js` and adapt to both themes.

`server.mjs` serves static files and a local JSON API using Node's built-in HTTP and SQLite modules. `public/app.js` contains the interface; `course.js`, `questions.js`, `labs.js`, `extra-labs.js`, and `coverage.js` hold editable original learning material. `logic.js` contains pure subnetting, review, and command-sandbox logic. No build pipeline or third-party runtime package is required.

The server binds to loopback and requires a per-run request token for changes. It rejects unexpected Host values and does not expose general file access or arbitrary shell execution. This is a single-user local app, not a substitute for authenticated hosted architecture.



#   N e t P a t h  
 