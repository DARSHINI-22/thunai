# THUNAI TASKS

- [x] Foundation check: existing tests pass (14/14 across two files), HTML references resolve.
- [x] Milestone 6B: profile fields, numeric income, migration, rule alignment, selection notes, tests (11/11, 8/8, 11/11).
- [x] Milestone 6C: correct pmusp-income/nst-income labels.
- [x] Milestone 6C: add optional PM-USP Class XII percentile-rank input (0-100, numeric, migration-safe).
- [x] Milestone 6C: tests for percentile field and profile migration (11/11, 8/8, 17/17).
- [~] Milestone 6C: official source reachability check (partial: 3 reachable, 3 unreachable, CSSS notice not confirmed).
- [x] Milestone 6C-2: verification metadata corrected per record; tests 10/10 verification, 11/11, 8/8, 17/17.
- [x] Correct lastVerified / verificationStatus on scheme records (6C-2: 'source-checked' removed; per-record status set).
- [ ] Update scheme records with verified data (blocked: sources unreachable).
- [ ] Official source verification of five scheme records (partially done: records 1 and 2 partially verified; 3, 4, 5 unverified).
- [ ] Confirm NST Top Class official source.
- [ ] Confirm PM-YASASVI school vs college page.
- [ ] Next milestone: to be assigned by the product owner.
- [x] Milestone 7: automated regression suites run (eligibility 11/11, results 8/8, profile-model 17/17, verification 10/10).
- [~] Milestone 7: browser end-to-end verification (partial: Chrome available, DOM dump only; user journey, edge cases, responsive and console checks NOT completed).
- [ ] Milestone 7: confirm silent deletion of invalid stored profile (js/profile.js ~203-212).
- [ ] Milestone 7: confirm 'Annual family income' summary label (profile.html ~286-287).
- [x] Milestone 8: View details button on each result card.
- [x] Milestone 8: scheme-details.html details page with Back to results and safe official source link.
- [x] Milestone 8: tests/scheme-details.test.js (19/19).
- [ ] Milestone 8: browser verification of the details page (not run).
- [ ] Milestone 8: split js/scheme-details.js below ~200 lines.
- [~] Milestone 7: browser end-to-end verification remains incomplete (see HANDOFF.md).
- [x] Milestone 8A: split scheme details into model and rendering files; regression suites pass.
- [ ] Milestone 8A: browser verification of details page and journey (Phases 2-4 NOT run).
- [ ] Milestone 8A: confirm or refute the two unconfirmed source observations listed in HANDOFF.md.
- [~] Milestone 7: browser end-to-end verification remains incomplete.

- [x] Milestone 9: document checklist card on scheme-details.html, shown only for verified scheme data (otherwise "Document requirements not yet confirmed.").
- [x] Milestone 9: per-scheme checklist persistence in localStorage, restore on reopen, reset option.
- [x] Milestone 9: tests/document-checklist.test.js (32/32 passed).
- [ ] Milestone 9: browser verification of the checklist (desktop, 320/375/768/1024, keyboard, console) - NOT run.
- [ ] Milestone 9: verified document requirements for any scheme (none confirmed; blocked on official sources).

- [x] Milestone 10: application guidance card on scheme-details.html (where to apply, method, steps, portal link, notes, verification, availability), not-confirmed message when data is absent.
- [x] Milestone 10: tests/application-guidance.test.js (26/26 passed).
- [ ] Milestone 10: browser verification of the guidance card (desktop, 320/375/768/1024, keyboard, console) - NOT run.
- [ ] Milestone 10: confirm application guidance for any scheme from official sources (none confirmed).





- [x] Milestone 11: saved scholarships model with localStorage key thunai.savedScholarships (IDs only, dedup, corrupt-data safe, invalid/deleted IDs ignored).
- [x] Milestone 11: Save/Saved toggle on results cards and scheme details page; saved.html with names, descriptions, details links, remove, empty state; Saved nav link.
- [x] Milestone 11: tests/saved-scholarships.test.js (34/34 passed).
- [ ] Milestone 11: browser verification of save toggles, saved page, reload persistence, responsive and keyboard behaviour - NOT run.
- [ ] Milestone 11: automated tests for js/saved-scholarships.js DOM module - not written.

- [x] Milestone 12: application tracker model (statuses not-started/in-progress/submitted; key thunai.applicationTracker holds IDs and statuses only; dedup, corrupt-data safe, invalid/deleted IDs ignored).
- [x] Milestone 12: Track application control on scheme details; tracker.html with status select, saved line, View details, Remove, empty state, self-reported note; Tracker nav link.
- [x] Milestone 12: tests/application-tracker.test.js (51/51 passed).
- [ ] Milestone 12: browser verification of add, status change, remove, reload persistence, responsive and keyboard behaviour - NOT run.
- [ ] Milestone 12: automated tests for js/application-tracker.js DOM module - not written.

- [x] Milestone 13: comparison selection model (max 3, duplicates rejected, invalid and deleted IDs dropped, corrupt-storage safe); tests/comparison.test.js 51/51 passed.
- [x] Milestone 13: comparison rows from existing scheme records with "Not yet confirmed" for missing data; comparison.html; Compare nav link on index, profile, saved, tracker, results, details and comparison pages.
- [x] Milestone 13: Add to comparison toggles on results and scheme details; remove and clear-all on comparison.html (code reviewed; syntax OK).
- [ ] Milestone 13: browser verification of selection, rendering, remove, clear-all, responsive scrolling and keyboard - NOT run.
- [ ] Milestone 13: automated tests for js/comparison-ui.js DOM module - not written.
- [ ] Milestone 13: HTML lint for comparison.html and modified pages - not run.


- [x] Milestone 13 UI prep: tests/comparison-ui.test.js added (33 cases on a fake DOM, not a browser). 33 pass after the storage fix (see below); earlier run 32 pass, 1 fail, before the fix.
- [x] Milestone 13: fix test 19 - a failed comparison save now reports "Could not save your comparison in this browser." (js/comparison-selection-model.js saveSelection now returns ok:false when the store reports a failed write). tests/comparison-ui.test.js 33/33 passed after the fix.
- [ ] Milestone 13: browser verification of selection from results and details, rendering, remove, clear-all, 320-1024 px layout, scrolling, keyboard and console - NOT run.
- [ ] Milestone 13: HTML lint for comparison.html and the modified pages - not run (no linter available).

- [x] Milestone 14: dashboard model and DOM implemented (dashboard.html, js/dashboard-model.js, js/dashboard.js); Dashboard nav link present on the seven other pages and on dashboard.html.
- [x] Milestone 14: tests/dashboard.test.js 54/54 passed (model and static checks), exit 0, run in this session.
- [x] Milestone 14: all existing suites run in this session, each exit 0 with no FAIL lines; node --check passes on dashboard-model.js, dashboard.js and tests/dashboard.test.js.
- [x] Milestone 14: removed the extra "Scholarships checked" line from js/dashboard.js (confirmed by search: no match).

- [ ] Milestone 14: browser verification of the dashboard (rendering, layout at 320-1024 px, keyboard, console) - NOT run.
- [ ] Milestone 14: HTML lint of dashboard.html and the modified nav pages - not run (no linter available).


## Final QA audit
- Branch: audit/final-qa (created from main; no commits).
- Node tests run this session, all exit 0: application-guidance, application-tracker, comparison-ui, comparison, dashboard, document-checklist, eligibility, profile-model, results, saved-scholarships, scheme-details, verification (12 files). About 346 PASS lines counted per the tester; seven files were truncated, so their counts came from summary lines.
- Syntax: node --check passed for all 21 files in js/.
- HTML references: all scripts and stylesheets referenced by index.html, profile.html and results.html exist.
- Not confirmed: the try around js/dashboard.js line 88; invalid stored profile handling (js/profile.js ~203-212, Milestone 7 above); empty-state rendering for corrupt "{bad" storage.
- No confirmed critical bug. No code changed in this audit.
- NOT RUN in a browser: full journey, console capture, overflow at 320/375/768/1024 px, mobile menu toggle. Milestone 12 (tracker) and Milestone 14 (dashboard) browser checks remain open.
- Official scheme verification: five source-checked records, not independently verified. No scheme is verified or open; applicationStatus unknown.
- Open items above are left unticked: Milestone 7 invalid stored profile, Milestone 8A two unconfirmed source observations.


## Profile improvement and scholarship details fix
- [x] Scholarship details fix: js/scheme-details.js fillVerification and fillOverview signatures changed to (view, box) to match the section loop.
- [x] Profile improvement: seven optional profile fields added (regularCourse, otherScholarship, droppedAfterXii, fullTimeCourse, coursePrescribed, eligibleCourseListed, classXiiMarks), mapped to existing rules; notSure treated as unknown in js/schemes.js.
- [ ] Browser verification of the profile fields (render, input behaviour, save, reload, marks vs percentile, notSure in results, editing updates results, console) - NOT RUN.
- [ ] Browser check of the five scholarship detail links after the fix - NOT RUN in this round.
- [ ] Stop the server on port 8080 (PID 17920), started for the browser attempt and not stopped.


