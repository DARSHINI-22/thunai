# THUNAI CHANGELOG

## Milestone 14 - Student dashboard verification

### Added
- dashboard.html: student dashboard with profile summary, scholarship overview, matched scholarships, saved scholarships, application tracker, quick actions, and empty and error states. Nav link "Dashboard" on all pages.
- js/dashboard-model.js and js/dashboard.js: model and rendering (textContent only).
- tests/dashboard.test.js (54 tests, model plus static checks; not a browser test).

### Changed
- js/dashboard.js: removed the extra "Scholarships checked" line from the matched-scholarships section.

### Verified (Node, this session)
- node --check exit 0: js/dashboard-model.js, js/dashboard.js, tests/dashboard.test.js and the comparison modules.
- Suites, exit 0 with no FAIL lines: dashboard 54, comparison-ui 33, comparison 51, application-tracker 51, saved-scholarships 34, document-checklist 32, application-guidance 26, scheme-details 19, eligibility 11, results 8, profile-model 17, verification 10.

### Known Issues
- Browser testing of the dashboard NOT performed. Rendering in a real browser, layout at 320-1024 px, keyboard use and console are unverified.


## Milestone 13 - UI verification preparation (partial)

### Added
- tests/comparison-ui.test.js: 33 tests of js/comparison-ui.js using a small in-file fake DOM (no dependencies). Covers results and details toggles, rendering of selected schemes, removing one scheme, clear-all, the three-scheme limit message, empty state, missing-information display ("Not yet confirmed"), safe text display, and script order and element ids on comparison.html, results.html and scheme-details.html.

### Known Issues
- tests/comparison-ui.test.js: 33 passed, 0 failed after the storage fix. Earlier run, before the fix: 32 passed, 1 failed (test 19).
- The fake DOM is not a browser. Layout, CSS, real click and keyboard behaviour, horizontal scrolling and real localStorage are NOT tested.
- Browser testing NOT run.


## Milestone 13 - Comparison storage failure fix

### Fixed
- Failed comparison saves now report "Could not save your comparison in this browser." instead of "Added to comparison.".
- Root cause: js/comparison-selection-model.js saveSelection ignored the result of store.setItem. The storage wrapper in js/comparison-ui.js returns false on a failed write rather than throwing, so saveSelection returned {ok:true}. Fix: saveSelection now returns { ok: wrote !== false }.

### Verified
- tests/comparison-ui.test.js: 33 passed, 0 failed (exit 0).
- Other suites and node --check: see HANDOFF.md, Milestone 13 storage fix.


## Milestone 13 - Scholarship comparison (partial)

### Added
- comparison.html: side-by-side comparison of up to 3 scholarships (criteria as rows), Remove per column, Clear comparison, empty state.
- js/comparison-selection-model.js: selection of up to 3 scheme IDs under key thunai.comparison; duplicates and invalid IDs rejected; corrupt-storage safe.
- js/comparison-model.js: builds comparison rows from existing scheme records; missing values show "Not yet confirmed".
- js/comparison-ui.js: "Add to comparison" toggles on results cards and scheme details, and the comparison page renderer.
- "Compare" nav link on index.html, profile.html, results.html, saved.html, tracker.html, scheme-details.html and comparison.html.
- tests/comparison.test.js (51 passed, 0 failed).

### Known Issues
- Browser testing NOT run. The DOM module js/comparison-ui.js has no automated tests. Lint not run.


## Milestone 12 - Application tracker

### Added
- tracker.html: Application Tracker page with name, description, status select (Not Started, In Progress, Submitted), saved-scholarship line, View details, Remove, an empty state, and the note "Status is self-reported by you and is not verified by the scholarship provider."
- js/application-tracker-model.js: pure helpers for ID and status validation, duplicate-free add, status change, remove, corrupt-data-safe parsing, and resolution against the scheme list.
- js/application-tracker.js: "Track application" control on scheme details (#tracker-slot) and the tracker page renderer.
- "Tracker" nav link on index.html, profile.html, results.html, saved.html and scheme-details.html.
- tests/application-tracker.test.js (51 passed, 0 failed).

### Changed
- scheme-details.html: two script tags and an empty #tracker-slot container after #saved-toggle-slot.
- Storage: localStorage key thunai.applicationTracker holds a JSON array of { schemeId, status } only. Saved scholarships use a separate key.

### Known Issues
- Browser verification NOT run. The DOM module js/application-tracker.js has no automated tests.



## Milestone 11 - Saved scholarships

### Added
- saved.html: Saved Scholarships page listing saved schemes with name, description, View details link and Remove button; empty state with link to results.
- js/saved-scholarships-model.js: pure helpers (ID validation, duplicate-free set operations, corrupt-data-safe parsing, resolution against the scheme list, summary text).
- js/saved-scholarships.js: Save/Saved toggle on each results card and on the scheme details page, and rendering of the saved page.
- Save toggle inserted after each "View details" link (results.js output, via decorateResults); toggle placed in the #saved-toggle-slot container on scheme-details.html.
- "Saved" link added to the primary navigation of index.html, profile.html, results.html, scheme-details.html and saved.html.
- tests/saved-scholarships.test.js (34 passed, 0 failed).
- Saved-scholarship styles appended to css/styles.css.

### Changed
- results.html and scheme-details.html: two script tags each (model, then DOM) and the nav item; scheme-details.html also gains the #saved-toggle-slot container inside #details-view.
- Storage: one localStorage key, thunai.savedScholarships, holding a JSON array of scheme IDs only (no scheme records are copied).
- No scheme data, eligibility rules or results logic changed.

### Known Issues
- Browser verification NOT run. Save toggles, saved page, persistence across reloads, responsive widths and keyboard use are untested in a browser; they are covered only by the model tests.
- The DOM module (js/saved-scholarships.js) has no automated tests.


## Milestone 10 - Application guidance

### Added
- Application guidance card on scheme-details.html, after "Application procedure" (heading id h-guidance, container guidance-body, card id guidance-card). Rendered by js/application-guidance.js.
- js/application-guidance-model.js: pure guidance view, URL validation and availability label helpers.
- tests/application-guidance.test.js (26 passed, 0 failed).

### Changed
- scheme-details.html: new card and two script tags (js/application-guidance-model.js, js/application-guidance.js) after js/document-checklist.js.
- No scheme record, eligibility rule or results logic changed. Existing records have no applicationGuidance field.

### Known Issues
- No scheme has confirmed application guidance, so every details page shows "Application guidance not yet confirmed." on current data; the populated path is covered only by tests.
- Browser verification NOT run. Responsive widths, keyboard use and console are untested.


## Milestone 9 - Document checklist

### Added
- Document checklist card on scheme-details.html, after "Required documents". Rendered by js/document-checklist.js.
- js/document-checklist-model.js: pure gating, storage and progress helpers.
- tests/document-checklist.test.js (32 passed, 0 failed).
- Checklist styles appended to css/styles.css.

### Changed
- scheme-details.html: new card and two script tags (js/document-checklist-model.js, js/document-checklist.js) after js/scheme-details.js.
- No scheme data, eligibility rules or results logic changed.

### Known Issues
- Browser verification NOT run. Responsive widths (320/375/768/1024), keyboard use and console checks are untested.
- No scheme has verified document requirements. On current data the checklist always shows "Document requirements not yet confirmed."; the ticking path is covered only by tests.


## Milestone 8A - Details page cleanup (partial)

### Changed
- Details model moved to js/scheme-details-model.js with no behaviour change; js/scheme-details.js keeps the rendering.
- scheme-details.html loads the new script (js/scheme-details-model.js) before js/scheme-details.js.
- No scheme data or eligibility logic changed.

### Known Issues
- Browser verification not completed (Phases 2-4 not run); see HANDOFF.md.


## Milestone 8 - Detailed scholarship information

### Added
- scheme-details.html: details page, reached via scheme-details.html?id=<scheme id>.
- js/scheme-details.js: pure helpers plus rendering.
- tests/scheme-details.test.js (19/19).

### Changed
- js/results.js: one "View details" link per result card; nothing else changed.
- css/styles.css: new section appended at the end only.
- No scheme data, eligibility rules or scoring logic were changed.

### Known Issues
- js/scheme-details.js (~318 lines) is above the ~200-line guideline; not yet split.
- Details page not browser-tested.
- Milestone 7 browser verification remains incomplete (Phases 1-4 and responsive checks not run).



## Milestone 7 (partial)

- Browser verification started; user journey not completed. No code changes. Documentation updated with observed test results and unconfirmed source observations.


## Unreleased

### Added
- Optional profile fields: category, tnDomicile, institution, institutionListed, annualFamilyIncome (numeric INR).
- js/profile-model.js: pure validation, migration and stored-profile build.
- greaterThan operator and per-rule unknownValues in the eligibility engine.
- "Final scholarship selection" section and selectionNote on schemes 2, 4 and 5.
- tests/profile-model.test.js.
- Optional PM-USP Class XII percentile-rank input (classXiiPercentileRank, 0-100, up to 2 decimals, numeric; not marks percentage).
- tests/verification.test.js (10/10).

### Changed
- Scheme verification metadata corrected (Milestone 6C-2): verificationStatus is now 'verified' | 'partially-verified' | 'unverified'; verificationNotes (string) added; lastVerified is '2026-11-22' only where an official source was fetched and reviewed, otherwise null. Removed unsupported 'source-checked' / '2026-11-21' values.
- tn-bc-mbc-dnc-post-matric: partially-verified; officialUrl set to https://www.bcw.tn.gov.in/sub_page/8; lastVerified 2026-11-22.
- tn-bc-mbc-dnc-central-institutions: partially-verified; officialUrl set to the Coimbatore NIC notice for 2026-27; lastVerified 2026-11-22. Name unchanged.
- pm-usp-central-sector, pm-yasasvi-top-class-college, national-top-class-st: unverified; lastVerified null.
- Results page notice updated: no scheme is fully verified.
- js/profile.js reduced to DOM wiring; logic moved to js/profile-model.js.
- Saved profiles migrate without deletion; invalid optional values are dropped.
- Education level "Other" treated as unknown for schemes 2 and 3.
- Scheme 2 uses institution; schemes 4 and 5 use institutionListed.
- PM-USP percentile is greaterThan 80 and labelled as percentile rank.
- Scheme 1 labels reference family income only.
- PM-USP and NST income labels corrected to say numeric annual family income is collected.
- PM-USP eligibility rule field renamed from classXiiPercentile to classXiiPercentileRank.

### Verified
- node --check passes (exit 0) for schemes.js, profile-model.js, profile.js, results.js, eligibility.js.
- tests/eligibility.test.js 11/11, tests/results.test.js 8/8, tests/profile-model.test.js 17/17 (exit 0).
- All HTML script/stylesheet references resolve.
- Official source reachability: bcmbcmw.tn.gov.in/welfschemes.htm, scholarships.gov.in and tribal.nic.in/Scholarship.aspx returned HTTP 200 (keyword search only). PM-USP FAQ PDF returned 404; PM-YASASVI PDF timed out; socialjustice.gov.in/index.php/schemes/110 returned 503.
- Scheme data NOT verified against official sources; no record data changed in this milestone.
- Milestone 6C-2: node --check passes (exit 0) for schemes.js, results.js, eligibility.js, profile-model.js, profile.js.
- Milestone 6C-2 tests: tests/verification.test.js 10/10, tests/eligibility.test.js 11/11, tests/results.test.js 8/8, tests/profile-model.test.js 17/17 (exit 0).
- Milestone 6C-2 source fetches: BCW sub_page/8 and Coimbatore NIC notice retrieved; PIB PRID=2294705 retrieved (covers PMS-ST, not Top Class); scholarships.gov.in CSSS announcement timed out; PM-USP FAQ PDF 404; socialjustice.gov.in/schemes/101 503; PM-YASASVI PDF timed out.

### Known Issues
- Scheme records no longer carry 'source-checked' / 2026-11-21 (removed in 6C-2); per-record status is set, and none is fully verified.
- PM-USP and YASASVI official sources unreachable; CSSS notice on scholarships.gov.in (last date 30-11-2026) not confirmed to cover PM-USP.
- PM-USP percentile input: need as a real user input is unconfirmed.
- js/profile.js (282 lines) and js/results.js (276 lines) are above the 200-line target.
- Scheme records not fully verified; per-record status and open sources are listed in HANDOFF.md Known Issues.

## 2026-11-21

### Added
- Initial project repository setup.
- Project documentation structure.

### Verified
- GitHub remote connection.
- Main branch synchronization.

### Pending
- Framework selection.
- Application foundation.
- Initial application implementation.


## Final QA audit

### Checked (Node test runs and static reads; no code changed)
- Branch audit/final-qa created from main; no commits.
- Node tests, all exit 0: application-guidance, application-tracker, comparison-ui, comparison, dashboard, document-checklist, eligibility, profile-model, results, saved-scholarships, scheme-details, verification. About 346 PASS lines counted; seven files truncated, counts taken from summary lines.
- node --check passed for all 21 files in js/.
- Every script and stylesheet referenced by index.html, profile.html and results.html exists.
- Direct localStorage reads in application-tracker.js, comparison-ui.js, document-checklist.js, saved-scholarships.js and profile.js appear inside try/catch on code reading (not executed).

### Not confirmed
- The try around js/dashboard.js line 88.
- Caller handling of an invalid stored profile (js/profile.js ~203-212; Milestone 7 in TASKS.md).
- Empty-state rendering for corrupt "{bad" storage.

### Known Issues
- No confirmed critical bug reproduced. No code changed.
- NOT RUN in a browser: landing, profile save, results, scheme details, documents, guidance, save/remove, tracker, comparison and dashboard journeys; console error capture; overflow at 320/375/768/1024 px; mobile menu toggle. Browser verification remains open for Milestone 12 and Milestone 14.
- Official scheme verification: five source-checked records, not independently verified. applicationStatus unknown; deadlines and required documents null where unpublished. No scheme is verified or open.
- Open: Milestone 7 (invalid stored profile handling) and Milestone 8A (two unconfirmed source observations).


## Profile improvement and scholarship details fix

### Changed
- js/scheme-details.js: fillVerification and fillOverview signatures changed from (box, view) to (view, box). Root cause: the section loop called section.render(view, box), so the first section threw and the page hid its content.
- profile.html, js/profile.js, js/profile-model.js: seven new optional profile fields: regularCourse, otherScholarship, droppedAfterXii, fullTimeCourse, coursePrescribed, eligibleCourseListed (each yes / no / notSure) and classXiiMarks (percentage, 0-100). Class XII marks (percentage) are kept separate from classXiiPercentileRank (percentile rank, used by PM-USP).
- Field-to-rule mapping: regularCourse, otherScholarship, droppedAfterXii -> pm-usp-central-sector; fullTimeCourse -> pm-yasasvi-top-class-college; coursePrescribed and classXiiMarks -> national-top-class-st; eligibleCourseListed -> tn-bc-mbc-dnc-post-matric.
- js/schemes.js: rules tn-bc-domicile, tnc-domicile, tn-bc-course, pmusp-regular, pmusp-other-scholarship, pmusp-drop, yasasvi-full-time and nst-course now have unknownValues ['notSure'], so "Not sure" counts as missing (More Information Required), not as a failed match (Not Eligible). Scheme values, labels, deadlines and URLs unchanged.

### Verified
- Browser check of the five detail pages before the profile change: all 14 sections filled (headless Chrome, earlier run).
- Node: tests/profile-model.test.js exit 0, 21 PASS. tests/eligibility.test.js exit 0, 19 PASS (new cases cover notSure as unknown, Tamil Nadu domicile, PM-USP outcomes, national ST, YASASVI).
- Other 10 test files exit 0; for application-tracker, comparison, dashboard and document-checklist the output was cut and only summary lines were seen.
- node --check passed on js/profile.js, js/profile-model.js, js/schemes.js, js/scheme-details.js, js/eligibility.js and js/results.js.
- Scholarship verification: five records. tn-bc-mbc-dnc-post-matric and tn-bc-mbc-dnc-central-institutions are partially-verified; pm-usp-central-sector, pm-yasasvi-top-class-college and national-top-class-st are unverified. None is confirmed open.

### Not verified
- Browser verification of the profile changes was NOT RUN. The tester stopped before writing a harness. Checks 1-9 (render, input behaviour, save, reload, marks vs percentile, notSure in results, editing updates results, five detail links, console errors) are all NOT RUN.
- Browser check of the five detail links after the scheme-details fix: NOT RUN in this round.
- Environment: a Python static server on port 8080 (PID 17920) was started for the browser attempt and was NOT stopped; it must be stopped manually.
- Deadlines and documents remain null where unpublished.
- Open items left unticked: Milestone 7 (invalid stored profile handling), Milestone 8A (unconfirmed source observations), browser verification (Milestones 12 and 14, plus this profile change).


