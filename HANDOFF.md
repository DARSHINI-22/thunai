# THUNAI - PROJECT HANDOFF

## Project Status
Milestone 6C-2 implemented: verification metadata corrected per scheme record. Two records are partially verified against official pages; three are unverified. No scheme is fully verified. Eligibility rules, thresholds, deadlines, documents and application status are unchanged.

## Completed
- GitHub repository created.
- Repository cloned into Codebenders.
- Git remote verified.
- Main branch connected to origin/main.
- Project documentation files created.
- Application files in place: index.html, profile.html, results.html, css/styles.css, js/main.js, js/profile-model.js, js/profile.js, js/schemes.js, js/eligibility.js, js/results.js.
- Foundation check: tests/eligibility.test.js (7/7) and tests/results.test.js (7/7) pass on Node v22.16.0; all HTML script/stylesheet references resolve.
- Milestone 6B implemented: tests/eligibility.test.js (11/11), tests/results.test.js (8/8), tests/profile-model.test.js (11/11).
  - New optional profile fields: category, tnDomicile, institution, institutionListed, annualFamilyIncome (numeric INR).
  - Profile split: js/profile-model.js (validation, migration, stored-profile build) and js/profile.js (DOM wiring only).
  - Migration: saved profiles load unchanged; invalid optional values are dropped, not the whole profile.
  - Engine: greaterThan operator and per-rule unknownValues (unknown produces More Information Required).
  - Schemes: education level "Other" is unknown for schemes 2 and 3; selectionNote added to schemes 2, 4 and 5.
  - Results: "Final scholarship selection" section, with "Meeting these criteria does not guarantee an award."
  - Domicile is never inferred from district.
- Milestone 6C implemented:
  - Labels: pmusp-income and nst-income now state that numeric annual family income is collected.
  - New optional profile input classXiiPercentileRank (PM-USP percentile rank, 0-100, up to 2 decimals, not marks). Rule pmusp-percentile reads classXiiPercentileRank with greaterThan 80. Invalid stored value is dropped on load; profile kept.
  - Tests: tests/eligibility.test.js 11/11 (three test profile keys renamed to classXiiPercentileRank), tests/results.test.js 8/8, tests/profile-model.test.js 17/17, all exit 0.
- Milestone 6C-2 implemented: official source metadata correction.
  - Schema: verificationStatus is now 'verified' | 'partially-verified' | 'unverified'; verificationNotes (string) added; lastVerified is '2026-11-22' only where an official source was fetched and reviewed, otherwise null. The old 'source-checked' / '2026-11-21' values were removed (no check supported them).
  - Records 1 and 2: partially-verified, lastVerified 2026-11-22, officialUrl updated (see Known Issues).
  - Records 3, 4 and 5: unverified, lastVerified null.
  - Results page notice updated: no scheme is fully verified.
  - Tests: node --check passes (exit 0) for js/schemes.js, js/results.js, js/eligibility.js, js/profile-model.js, js/profile.js. tests/eligibility.test.js 11/11; tests/results.test.js 8/8; tests/profile-model.test.js 17/17; tests/verification.test.js 10/10 (new file). All exit 0.

## Milestone 7 (partial) - End-to-end browser verification
- Automated tests run on Node v22.16.0, all exit 0: tests/eligibility.test.js 11/11, tests/results.test.js 8/8, tests/profile-model.test.js 17/17, tests/verification.test.js 10/10.
- Browser available: Google Chrome at C:\Program Files\Google\Chrome\Application\chrome.exe (headless, DevTools on port 9222 was started and reachable). Microsoft Edge also present; Firefox not found.
- Browser journey NOT completed. No in-page interaction (profile entry, save, reload persistence, results rendering, clear, edge cases, responsive widths, console capture) has been verified in a browser. Only a headless --dump-dom of index.html succeeded, which is not interaction evidence.
- Static source observations, UNCONFIRMED in browser:
  - js/profile.js ~lines 203-212: a stored profile that fails validate() is removed silently from localStorage.
  - js/profile.js ~lines 129-131: displayText returns 'No' for an empty first-generation value.
  - profile.html ~lines 286-287: label 'Annual family income' sits on the income range element, while the exact figure is shown at ~298-299.
  - js/results.js line count is ~278, not 276.
- No reproducible bugs confirmed; no code fixes made in this milestone.
- Next step: complete the browser run (Phase 1-4) in a fresh session; stop the leftover headless Chrome process if still running.


## Milestone 13 - Comparison storage failure fix
- Status: fixed and verified by automated tests in Node. Browser verification still NOT performed.
- Change: js/comparison-selection-model.js, function saveSelection: `var wrote = store.setItem(...); return { ok: wrote !== false };` (one line changed; no other file changed in this step).
- Behaviour: a failed save reports "Could not save your comparison in this browser." and the toggle does not switch state. A successful save is unchanged.
- Fresh results (this step, repo root, Windows): node --check exit 0 for js/comparison-selection-model.js, js/comparison-ui.js, js/comparison-model.js, tests/comparison-ui.test.js, tests/comparison.test.js. tests/comparison-ui.test.js 33 passed, 0 failed (exit 0). tests/comparison.test.js 51/51. tests/application-tracker.test.js 51/51. tests/saved-scholarships.test.js 34/34. tests/document-checklist.test.js 32/32. tests/application-guidance.test.js 26/26. tests/scheme-details.test.js 19/19. tests/eligibility.test.js "All eligibility tests passed.". tests/results.test.js exit 0, no summary line. tests/profile-model.test.js "All profile-model tests passed.". tests/verification.test.js "All verification tests passed.".
- Still open: browser verification (selection from results and details, rendering, remove, clear-all, 320-1024 px layout, scrolling, keyboard, console); HTML lint (no linter available). Not committed or pushed.


## Milestone 13 - UI verification preparation (partial)
- Status: still PARTIAL. Browser verification NOT performed.
- Added tests/comparison-ui.test.js (33 cases). It uses a minimal fake DOM defined inside the test file (no dependencies). This checks the module's logic and wiring only; it is not a browser test.
- Fresh results from this step:
  - node --check: exit 0 for tests/comparison-ui.test.js and for js/comparison-ui.js, comparison-model.js, comparison-selection-model.js and all other JS modules listed in the test log.
  - node tests/comparison-ui.test.js: exit 0, "33 passed, 0 failed" after the storage fix (an earlier run before the fix: exit 1, "32 passed, 1 failed").
  - Failing test 19 ("Storage that throws") was fixed in the Milestone 13 storage fix above; it now passes.
  - Root cause (confirmed and fixed): js/comparison-selection-model.js saveSelection ignored the result of store.setItem. The storage wrapper in js/comparison-ui.js returns false on a failed write instead of throwing, so saveSelection reported {ok:true}. Fixed by returning { ok: wrote !== false }.
  - Two earlier test expectations (cases 21 and 22) were wrong about the DOM structure (the not-confirmed span sits inside the td). They were corrected in the test file and now pass.
- Other suites (run in this step, fresh): tests/comparison.test.js 51 passed, 0 failed; tests/application-tracker.test.js 51 passed, 0 failed; tests/saved-scholarships.test.js 34 passed, 0 failed; tests/document-checklist.test.js 32 passed, 0 failed; tests/application-guidance.test.js 26 passed, 0 failed; tests/scheme-details.test.js 19 passed, 0 failed; tests/eligibility.test.js "All eligibility tests passed."; tests/profile-model.test.js "All profile-model tests passed."; tests/verification.test.js "All verification tests passed."; tests/results.test.js exit 0, no summary line printed.
- Still open: fix for test 19; browser verification of selection from results and details, rendering, remove, clear-all, 320-1024 px layout, scrolling, keyboard and console; HTML lint (no HTML linter available here). Not committed or pushed.



## Milestone 14 - Student dashboard (verified in Node; browser pending)
- Status: implemented and verified by automated tests in Node. Browser verification NOT performed.
- Files: dashboard.html (new; Dashboard nav link on index, profile, results, saved, tracker, comparison, scheme-details and dashboard pages); js/dashboard-model.js (new, pure); js/dashboard.js (new, DOM, textContent only); tests/dashboard.test.js (new).
- Data: profile read from localStorage key 'thunai.studentProfile' (the same key the profile and eligibility modules use) and cleaned with profile-model normalizeSaved. Saved and tracker data come from their existing model loaders (loadSaved, loadTracker) and resolvers (resolveSaved, resolveTracker). Eligibility uses eligibility.evaluateAll. No scheme records are copied.
- Privacy: the profile summary shows only name, education level, course, college type, academic year, category, district and institution. Income, percentile, age, first-generation status and domicile are not shown.
- Corrupt storage: an unreadable profile shows a status line and the profile is treated as absent; other stores fall back to empty lists.
- Change this milestone: removed the extra "Scholarships checked" line from the matched-scholarships section (js/dashboard.js).
- Fresh results (this session, repo root, Windows, Node v22.16.0): node --check exit 0 for js/dashboard-model.js, js/dashboard.js, tests/dashboard.test.js. tests/dashboard.test.js exit 0, 54 passed, 0 failed (PASS/FAIL lines counted from the output file). All other suites exit 0 with no FAIL lines (see CHANGELOG.md, Milestone 14 verification).
- Not done: browser testing (rendering, layout, keyboard, console); HTML lint. The dashboard test is static and model-level; it does not render the page in a DOM.
- Not committed or pushed.



## Milestone 13 - Scholarship comparison (partial)
- Status: PARTIAL. Logic and syntax verified by automated tests and node --check. Browser verification NOT performed.
- Storage: localStorage key 'thunai.comparison', JSON array of scheme IDs, maximum 3. Invalid IDs, duplicates, deleted IDs and corrupt JSON are dropped; storage errors fall back to an empty selection.
- Controls: "Add to comparison" / "Remove from comparison" toggle on each results card (decorateResults) and in #compare-slot on scheme-details.html. Max-3 message: "You can compare up to 3 scholarships. Remove one to add another."
- Page comparison.html (ids compare-count, compare-status, compare-empty, compare-wrap, compare-table, compare-clear): 14 criteria rows built from existing records; Remove per column; Clear comparison; empty state.
- Data: read from existing records only. Absent values show "Not yet confirmed". Availability is shown separately from verification status.
- Review of js/comparison-ui.js: no confirmed runtime or syntax defects found. results.js renders once on load with no re-render handlers, so toggles are not erased.
- Nav: Compare link added after Tracker on index.html, profile.html, saved.html and tracker.html.
- Test results (node, Windows, repo root): tests/comparison.test.js 51 passed, 0 failed, exit 0. All other suites exit 0 (see the test log for this milestone).
- Not done: browser verification of selection, rendering, remove, clear, responsive scrolling and keyboard. js/comparison-ui.js has no automated tests. Lint not run; HTML checked by search only. Most rows show "Not yet confirmed" because no scheme records benefits, documents, application method or availability.


## Milestone 12 - Application tracker
- Implemented:
  - Storage: localStorage key 'thunai.applicationTracker' holds a JSON array of { schemeId, status } objects. status is 'not-started', 'in-progress' or 'submitted'. No application numbers, Aadhaar, bank details, OTPs or documents are collected.
  - Validation: invalid IDs (not matching /^[a-z0-9-]+$/i), invalid statuses, duplicates (first kept) and entries for deleted schemes are dropped on read. Corrupt JSON and storage exceptions fall back to an empty list.
  - Add: "Track application" button on scheme details (#tracker-slot). Adding a tracked scheme never duplicates it.
  - Status change: labelled select on the tracker page, saved immediately. Remove: button per entry.
  - Tracker page tracker.html (ids tracker-list, tracker-empty, tracker-count, tracker-status, tracker-note) shows name, description, status, saved-scholarship line (read-only), View details and Remove, with the empty state and the note "Status is self-reported by you and is not verified by the scholarship provider."
  - Saved and tracker state are independent: separate keys.
  - Files: js/application-tracker-model.js (new), js/application-tracker.js (new), tracker.html (new), scheme-details.html (two scripts, #tracker-slot, nav item), results.html, saved.html, index.html, profile.html (nav item), css/styles.css (section appended), tests/application-tracker.test.js (new).
- Test results (node, Windows, run from repo root; each exit 0):
  - tests/application-tracker.test.js: 51 passed, 0 failed.
  - tests/saved-scholarships.test.js: 34 passed. tests/document-checklist.test.js: 32 passed. tests/application-guidance.test.js: 26 passed. tests/scheme-details.test.js: 19 passed.
  - tests/eligibility.test.js, tests/profile-model.test.js, tests/verification.test.js: "All ... passed."
  - tests/results.test.js: no summary line printed; exit 0.
  - node --check passed for all 10 JS files in the tracker, saved, guidance, checklist and details modules.
- Not done: browser verification NOT run; js/application-tracker.js has no automated tests; lint not run.



## Milestone 11 - Saved scholarships
- Implemented:
  - Storage: localStorage key 'thunai.savedScholarships' holds a JSON array of scheme IDs only. Records are resolved against window.THUNAI_SCHEMES at read time; unknown or deleted IDs are dropped silently; invalid IDs (not matching /^[a-z0-9-]+$/i) are dropped; duplicates removed; corrupt JSON, non-array values and storage exceptions fall back to an empty list. A failed save shows "Could not save in this browser."
  - Results cards: a Save scholarship / Saved toggle (aria-pressed, aria-label naming the scheme) after each "View details" link.
  - Details page: the same toggle, in the #saved-toggle-slot container above the details.
  - Saved page (saved.html, element ids saved-list, saved-empty, saved-count): shows name, description, View details and Remove for each saved scheme; count line "N saved scholarship(s)"; empty state "You have not saved any scholarships yet." with a link to results.
  - Navigation: a "Saved" link on all five pages.
  - No personal or sensitive data is stored. Eligibility results and scheme data are unchanged.
  - Files: js/saved-scholarships-model.js (new, pure); js/saved-scholarships.js (new, DOM, auto-mounts); saved.html (new); results.html, scheme-details.html, index.html, profile.html (script tags, nav item, slot container on details page); css/styles.css (section appended); tests/saved-scholarships.test.js (new).
- Test results (node, Windows, run from repo root; each exit 0):
  - tests/saved-scholarships.test.js: 34 passed, 0 failed.
  - tests/document-checklist.test.js: 32 passed, 0 failed.
  - tests/application-guidance.test.js: 26 passed, 0 failed.
  - tests/scheme-details.test.js: 19 passed, 0 failed.
  - tests/eligibility.test.js: "All eligibility tests passed."
  - tests/results.test.js: prints no summary line; last line a PASS line; exit 0.
  - tests/profile-model.test.js: "All profile-model tests passed."
  - tests/verification.test.js: "All verification tests passed."
  - node --check passed for all eight JS files touched or added across Milestones 9-11 (saved-scholarships-model.js, saved-scholarships.js, application-guidance-model.js, application-guidance.js, document-checklist-model.js, document-checklist.js, scheme-details-model.js, scheme-details.js).
- Not done / incomplete:
  - Browser verification NOT run (no browser session). Save toggles, saved page, reload persistence, responsive widths, keyboard use and console are unverified.
  - js/saved-scholarships.js (DOM) has no automated tests; only the model is tested.
  - Lint not run (lint tool unavailable for these file types in this environment); HTML was checked by search only.
  - Not committed or pushed.


## Milestone 10 - Application guidance
- Implemented:
  - Card "Application guidance" on scheme-details.html, after "Application procedure". Element ids: guidance-card, guidance-body, h-guidance.
  - Data source: an optional per-scheme object applicationGuidance with fields verified (true/false), sourceUrl, where, method ('online' | 'institution' | 'other'), steps (array), portalUrl, notes (array), availabilityStatus ('open' | 'closed' | other), availabilityCheckedOn (date string). No current record has this field, so all five show the not-confirmed message.
  - Existing record fields applicationSteps and applicationPortalUrl are deliberately NOT used as guidance; they are unconfirmed.
  - Verification vs availability: "Official source verification" is true only when verified === true AND sourceUrl is a safe http(s) URL. "Current application availability" reads "Open for applications, confirmed on <date>" only when availabilityStatus is 'open' AND a checked date exists; otherwise "Current application availability: not confirmed." Verification never implies open applications; a fixed note says so.
  - URLs: only http(s) with a parseable URL are shown. Portal link uses target="_blank" rel="noopener noreferrer". Text is set with textContent only.
  - Files: js/application-guidance-model.js (new, pure); js/application-guidance.js (new, DOM, auto-mounts); scheme-details.html (card and two script tags); tests/application-guidance.test.js (new). css/styles.css unchanged. js/schemes.js and all scheme-details and document-checklist files unchanged.
- Test results (node, Windows, run from repo root; each exit 0):
  - tests/application-guidance.test.js: 26 passed, 0 failed.
  - tests/document-checklist.test.js: 32 passed, 0 failed.
  - tests/scheme-details.test.js: 19 passed, 0 failed.
  - tests/eligibility.test.js: "All eligibility tests passed."
  - tests/results.test.js: prints no summary line; exit 0 (last line a PASS line).
  - tests/profile-model.test.js: "All profile-model tests passed."
  - tests/verification.test.js: "All verification tests passed."
  - node --check passed for js/application-guidance-model.js, js/application-guidance.js, js/document-checklist-model.js, js/document-checklist.js, js/scheme-details-model.js, js/scheme-details.js.
- Not done / incomplete:
  - Browser verification NOT run (no browser session). Responsive widths, keyboard and console unverified.
  - No scheme has confirmed application guidance; the populated rendering path is tested in the model only, not in a browser.
  - Pre-existing (not changed here): js/scheme-details.js reads model.NOT_CONFIRMED at top level, outside the try/catch.
  - Not committed or pushed.



## Milestone 9 - Document checklist
- Implemented:
  - Checklist card on scheme-details.html ("Document checklist", after "Required documents"). Element ids: checklist-card, checklist-body, checklist-progress, checklist-reset.
  - Gating: items are shown only when verificationStatus === 'verified' AND requiredDocuments is a non-empty array. Otherwise "Document requirements not yet confirmed." is shown and no items are shown. On current data all five records are unverified or partially-verified with requiredDocuments null, so the message always shows.
  - Ticking: native checkboxes with labels. Progress line "N of M documents ready" in an aria-live="polite" element.
  - localStorage: one key per scheme, format 'thunai.documentChecklist.<scheme id>' (prefix thunai.documentChecklist., scheme id must match /^[a-z0-9-]+$/i). Value is a JSON array of ticked document labels. Labels no longer in the scheme list are dropped on load. Corrupt JSON or storage errors fall back to an empty checklist; a failed save shows "Progress could not be saved in this browser."
  - Reset: "Reset checklist" button removes only the current scheme's key and unticks all items. A failed reset shows "Progress could not be cleared in this browser."
  - Stores no Aadhaar, bank, OTP or upload data.
  - Files: js/document-checklist-model.js (new, pure); js/document-checklist.js (new, DOM wiring, mounts itself on scheme-details.html); scheme-details.html (card and two script tags); css/styles.css (section appended at the end); tests/document-checklist.test.js (new).
  - js/scheme-details.js and js/scheme-details-model.js were not changed by Milestone 9.
- Test results (node, Windows, run from repo root; each exit code 0):
  - tests/document-checklist.test.js: 32 passed, 0 failed.
  - tests/scheme-details.test.js: 19 passed, 0 failed.
  - tests/eligibility.test.js: "All eligibility tests passed."
  - tests/results.test.js: 7 PASS lines, 0 FAIL (no summary line is printed; earlier notes recorded 8/8, which is not reconciled).
  - tests/profile-model.test.js: "All profile-model tests passed."
  - tests/verification.test.js: "All verification tests passed."
  - Syntax: node --check passed for the new and changed JS files.
- Not done / incomplete:
  - Browser verification of the checklist and details page was NOT run. Responsive widths, keyboard use and console are unverified.
  - No scheme has verified document requirements, so the list path is exercised only by tests.
  - PRD.md and ARCHITECTURE.md are empty (0 lines); they were not used as a source of requirements.
  - Line counts of js/document-checklist.js and js/document-checklist-model.js have not been checked against the ~200-line guideline.
  - Not committed or pushed.


## Milestone 8 - Detailed scholarship information
- New files:
  - scheme-details.html: details page, reached via scheme-details.html?id=<scheme id>.
  - js/scheme-details.js: pure helpers plus rendering.
  - tests/scheme-details.test.js.
- Modified:
  - js/results.js: one "View details" link per result card; nothing else changed.
  - css/styles.css: new section appended at the end only.
- Details page shows: name, description, department, eligible categories, education, institution, income and other conditions (taken from existing rule labels), benefits, required documents, application procedure, deadline, application status (kept separate from eligibility), official source (http/https only, opens in new tab), verification status and notes, last verified, selection notes, and a Back to results link.
- Benefits are not in any scheme record, so they always show "Not yet confirmed". Missing data shows "Not yet confirmed".
- Known limitations:
  - js/scheme-details.js is about 318 lines, above the ~200-line guideline; not yet split.
  - No browser testing of the details page was done. Milestone 7 browser verification remains INCOMPLETE (Phases 1-4 and responsive checks were not run in a browser).
- Test status:
  - tests/scheme-details.test.js: 19/19 passing (full output seen).
  - tests/eligibility.test.js, tests/results.test.js, tests/profile-model.test.js and tests/verification.test.js all exit 0.

## Milestone 8A - Details page cleanup (partial)
- Split done:
  - js/scheme-details.js (rendering half, about 205 lines) now loads the pure model from new file js/scheme-details-model.js (about 154 lines).
  - scheme-details.html loads js/scheme-details-model.js before js/scheme-details.js.
  - Public exports unchanged: getSchemeIdFromSearch, findSchemeById, buildDetailsView.
- Automated results (node, Windows):
  - node --check passes for both js files.
  - tests/eligibility.test.js exit 0 (11 PASS).
  - tests/results.test.js exit 0 (8 PASS).
  - tests/profile-model.test.js exit 0 (17 PASS).
  - tests/verification.test.js exit 0 (10 PASS).
  - tests/scheme-details.test.js exit 0 (19 passed, 0 failed).
- Browser verification NOT COMPLETED. No browser check of Phase 2 (items 1-14), Phase 3 (320/375/768/1024) or Phase 4 (console, assets, navigation) has been observed.
  - Two browser-tester runs ended without executing any check: one stopped after source reading, one hit its wall-clock limit while launching Chrome. A third attempt was refused.
  - Milestone 7 browser verification also remains incomplete.
- Source-reading observations, UNCONFIRMED in a browser:
  - (1) js/scheme-details.js reads model.NOT_CONFIRMED at top level, outside the try/catch, so a failed model load would throw instead of showing the fallback.
  - (2) js/profile.js around lines 209-211 silently removes a stored profile that fails validation.
- Known limitation: a headless Chrome process may still be running from the blocked browser run; check port 9222 before starting another browser.
- Next step: run the Phase 2-4 browser checks in a session with a working browser harness.


## Current Technology
HTML, CSS and vanilla JavaScript. No framework. No dependencies.

## Application Status
Core pages and scripts present. Profile, eligibility and results logic updated through Milestone 6C-2. Scheme metadata corrected in 6C-2; scheme eligibility data unchanged since 6B.

## Known Issues
- Scheme data not fully verified. No record is fully verified. No deadline, benefit, document, procedure, portal or application status was confirmed for any of the five records.
- Verification status per record (review date 2026-11-22):
  - tn-bc-mbc-dnc-post-matric: partially-verified. Official page https://www.bcw.tn.gov.in/sub_page/8 lists a Post-matric scheme for college and school students. Course list, income, category, domicile, documents, deadline and benefits NOT confirmed.
  - tn-bc-mbc-dnc-central-institutions: partially-verified. Official notice https://coimbatore.nic.in/educational-scholarship-for-bc-mbc-dnc-students-in-central-educational-institutions-2026-27/ published 18/09/2026, states fresh and renewal applications are invited for 2026-27, no closing date. Eligibility, institution list, income and documents NOT confirmed. Name differs from the notice title; not changed.
  - pm-usp-central-sector: unverified. CSSS 2026-27 announcement https://scholarships.gov.in/ViewMoreAnnouncement provided but not retrieved (timeout). FAQ PDF (2025-26) returned 404.
  - pm-yasasvi-top-class-college: unverified. https://socialjustice.gov.in/schemes/101 returned 503; school vs college match NOT confirmed. Scheme PDF timed out.
  - national-top-class-st: unverified. PIB PRID=2294705 (posted 05 AUG 2026) covers the Post Matric Scholarship Scheme for ST, not the Top Class scheme.
- Results notice updated; no scheme is presented as fully verified.
- Official URLs were fetched from this machine with PowerShell. BCW and Coimbatore pages retrieved; PIB retrieved; the others failed. The exact time each page was read is not recorded beyond the 2026-11-22 review date.
- PM-USP percentile input: need as a real user input is unconfirmed; it is More Information Required for users who leave it blank.
- js/profile.js (282 lines) and js/results.js (276 lines) are above the ~200-line target.
- No package.json or test runner config; tests run directly with `node tests/<file>` using the built-in assert module.
- Codebenders configuration tracking not yet decided.

## Next Task
1. Verify the records listed above against official sources: records 1 and 2 (eligibility rules, income limits, institution lists, documents); records 3, 4 and 5 (official source first, then eligibility, deadline, benefits, documents, procedure and status).
2. Retry the timeout and 503/404 URLs: scholarships.gov.in/ViewMoreAnnouncement (CSSS), the PM-USP FAQ PDF, socialjustice.gov.in/schemes/101, and the PM-YASASVI scheme PDF.
3. Find the correct official source for the NST Top Class scheme (PIB PRID=2294705 is not it).
4. Decide whether to split js/profile.js and js/results.js further.

## Next Developer
Darshini


## Final QA audit
- Branch: audit/final-qa (created from main; no commits).
- Node tests run this session, all exit 0: tests/application-guidance.test.js, application-tracker.test.js, comparison-ui.test.js, comparison.test.js, dashboard.test.js, document-checklist.test.js, eligibility.test.js, profile-model.test.js, results.test.js, saved-scholarships.test.js, scheme-details.test.js, verification.test.js.
- Test counts: roughly 346 PASS lines were counted per the tester. For seven files the output was truncated, so counts came from summary lines.
- Syntax: node --check passed for all 21 files in js/.
- HTML references: every script and stylesheet referenced by index.html, profile.html and results.html exists.
- Storage: direct localStorage reads in application-tracker.js, comparison-ui.js, document-checklist.js, saved-scholarships.js and profile.js are inside try/catch.
- NOT CONFIRMED:
  - The try around js/dashboard.js line 88.
  - How callers handle an invalid stored profile (js/profile.js about lines 203-212; tracked as Milestone 7 in TASKS.md).
  - Empty-state rendering for corrupt "{bad" storage.
- Bugs: no confirmed critical bug reproduced. No code changed in this audit.
- NOT RUN in a browser: browser journey (landing, profile save, results, scheme details, documents, guidance, save/remove, tracker, comparison, dashboard), console error capture, overflow measurement at 320/375/768/1024 px, mobile menu toggle. Browser verification remains open for Milestone 12 (tracker) and Milestone 14 (dashboard) per TASKS.md.
- Official scheme verification: five source-checked records (status "source-checked", not independently verified). applicationStatus unknown; deadlines and required documents null where unpublished. No scheme is verified or open.
- Known open items: TASKS.md Milestone 7 (invalid stored profile handling) and Milestone 8A (two unconfirmed source observations).

## Profile improvement and scholarship details fix
- Scholarship details fix: js/scheme-details.js. Root cause: fillVerification and fillOverview took (box, view) but the section loop called section.render(view, box), so the first section threw and the page hid its content. Fix: both signatures changed to (view, box).
- Browser check of the five detail pages before the profile change: all 14 sections filled (headless Chrome, earlier run).
- Seven new optional profile fields added: regularCourse, otherScholarship, droppedAfterXii, fullTimeCourse, coursePrescribed, eligibleCourseListed (each yes / no / notSure) and classXiiMarks (percentage, 0-100). Files: profile.html, js/profile.js, js/profile-model.js.
- Class XII marks (percentage) are kept separate from classXiiPercentileRank (percentile rank, used by PM-USP).
- Field-to-rule mapping: regularCourse, otherScholarship, droppedAfterXii -> pm-usp-central-sector; fullTimeCourse -> pm-yasasvi-top-class-college; coursePrescribed and classXiiMarks -> national-top-class-st; eligibleCourseListed -> tn-bc-mbc-dnc-post-matric.
- Unknown-value handling: js/schemes.js rules tn-bc-domicile, tnc-domicile, tn-bc-course, pmusp-regular, pmusp-other-scholarship, pmusp-drop, yasasvi-full-time and nst-course now have unknownValues ['notSure'], so "Not sure" counts as missing (More Information Required), not as a failed match (Not Eligible). Scheme values, labels, deadlines and URLs unchanged.
- Tests (Node, run by tester this round): tests/profile-model.test.js exit 0, 21 PASS. tests/eligibility.test.js exit 0, 19 PASS (new cases cover notSure as unknown, Tamil Nadu domicile, PM-USP outcomes, national ST, YASASVI). Other 10 test files exit 0; for application-tracker, comparison, dashboard and document-checklist the output was cut and only summary lines were seen.
- node --check passed on js/profile.js, js/profile-model.js, js/schemes.js, js/scheme-details.js, js/eligibility.js and js/results.js.
- Browser verification of the profile changes: NOT RUN. The tester stopped before writing a harness. Checks 1-9 (render, input behaviour, save, reload, marks vs percentile, notSure in results, editing updates results, five detail links, console errors) are all NOT RUN.
- Environment note: a Python static server was started on port 8080 for the browser attempt (PID 17920) and was NOT stopped. It must be stopped manually.
- Scholarship verification: five records. tn-bc-mbc-dnc-post-matric and tn-bc-mbc-dnc-central-institutions are partially-verified; pm-usp-central-sector, pm-yasasvi-top-class-college and national-top-class-st are unverified. None is confirmed open. Deadlines and documents remain null where unpublished.
- Open items left unticked: Milestone 7 (invalid stored profile handling), Milestone 8A (unconfirmed source observations), browser verification (Milestones 12 and 14, plus this profile change).

