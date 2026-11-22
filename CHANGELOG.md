# THUNAI CHANGELOG

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
