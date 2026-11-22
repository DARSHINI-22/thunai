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
