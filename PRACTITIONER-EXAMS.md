# NetPath 1.2: lessons and practitioner credentials

Open a lesson and enable **Simplified lesson mode** for a plain-language introduction. Your reading preference is saved; exercises and knowledge checks stay the same. Switch back for full explanations.

Choose **Practitioner exams** in the sidebar. Pick Network Foundations, Network Operations, or Comprehensive Networking, then choose a difficulty and whether to use a timer.

| Difficulty | Questions | Overall minimum | Every tested domain | Time if enabled |
| --- | --- | --- | --- | --- |
| Core | 18 | 80% | 60% | 35 minutes |
| Applied | 24 | 85% | 65% | 45 minutes |
| Challenge | 30 | 90% | 70% | 55 minutes |

Every exam also requires at least **5 of 6 constructed responses** correct. A high overall score alone does not earn a certificate. Question selection and answer order vary; constructed responses generate new subnet, route, and ACL values. The bank is finite and questions can repeat. Difficulty increases the count, scenario emphasis, calculation complexity, and passing thresholds. These are NetPath assessments, not replicas of a Cisco exam.

Select an option or use Save response to persist an answer. Previous/Next and submission also save the current typed response. A resumed exam opens at the most recently saved question. Closing the app does not pause a timed exam: the server enforces its original deadline on reopening. Untimed exams use exactly the same passing requirements. One unfinished exam is allowed at a time.

After submission, review explanations and topic results. Passing earns a downloadable SVG certificate with the learner name, exam track, difficulty, score, date, timing mode, and local credential ID. Open it in a browser and print or save as PDF. Certificates are independent, unproctored personal learning achievements, not Cisco certifications or accredited, externally verified qualifications. Local installation owners can edit their own files and backups; this is not a tamper-proof credential service.

Exam records are saved in the local SQLite database alongside your other progress. Settings & backups exports now include exam records and certificates can be regenerated from them. Restoring a new backup replaces exam records with that snapshot. Older backups without exam records leave existing exam history intact. Keep copies of important exports; uploads are limited to 10 MB.

## Start the updated app

Close the old NetPath server window if it is running, then double-click **Run NetPath (keep open).cmd** in the installed NetPath folder. Keep that window open and browse to http://127.0.0.1:4173/ . Refresh an already-open browser tab. This update requires a server restart, not just a page refresh.

The release zip excludes personal data. When updating an existing installation, export a backup first and replace the program files while keeping the existing `data` directory. Do not replace it with an empty directory. Online features and the live Packet Tracer connection remain deferred.

## Certificate previews
Expand **Preview NetPath certificates** on the Practitioner exams page. Select Core, Applied, or Challenge and Timed or Untimed to view all three track certificates. Open any image for a full-size watermarked sample. Previewing does not start an exam or award a credential.

## Version 1.3
See RELEASE-1.3.md for seven tracks, four new specialist workshops, and direct PNG/PDF export. Earlier references to three tracks describe version 1.2.
