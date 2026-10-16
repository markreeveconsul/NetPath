# NetPath 1.7 — Guided office missions

Navigation now groups the existing features into Learn, Field lab, Exams, and
My workspace. The current section expands automatically; every existing route
remains available.

All three office missions include a short concept, three progressively more
specific hints, a repair debrief, and a transfer question with feedback. Hint
usage and the latest reflection answer are saved locally and included in JSON
backups. Existing saves remain compatible. Reconfiguring a device clears its
verification and reflection so the repair must be checked again.

The packet inspector offers Play, Pause, Next hop, and Restart trace. Both
isometric and diagram views show the inspected part of the request path, along
with source/destination IPv4 addresses and a description of the current step.
Playback pauses when a configuration or command input receives focus.

This is a conceptual ICMP request walkthrough. It does not animate ARP or reply
packets and is not a complete protocol simulator. A learning reflection does
not award a certificate or prove independent mastery. Device placement and
interactive cabling remain future work. Online deployment is still deferred.

## Validation

34 automated tests passed, including legacy saves, invalid coaching metadata,
packet destination preservation, failure points, database recovery, and exam
grading. A separate QA database also passed coaching save/reload/export and
completed-mission rendering checks. Browser verification of the new controls
was blocked by local connection timeouts in the browser test tool; the new
visual layout and playback interactions still need an end-to-end browser check.

## Open and update

Use Start NetPath.cmd and choose Field lab. Refresh an existing browser tab to
load the new frontend. Restart the local Node server to load the new server-side
coaching validation. Do not delete the data directory. Export a backup before
moving to another installation. The release ZIP contains no personal data.
