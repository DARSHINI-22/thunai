// THUNAI scheme dataset. Five central and Tamil Nadu scholarship records. Verification status is per record; see verificationStatus.
// Application status is unknown for all records. Deadlines and required documents are null
// where the source does not state them. Profile option values match profile.html.
var THUNAI_SCHEMES = [
  {
    id: 'tn-bc-mbc-dnc-post-matric',
    name: 'Tamil Nadu BC/MBC/DNC Post-Matric Scholarship',
    isDemo: false,
    description: 'Post-matric scholarship for students from BC, MBC or DNC communities in Tamil Nadu on listed courses (ITI, Polytechnic Diploma, Postgraduate, Professional and PhD courses).',
    department: 'Tamil Nadu Backward Classes, Most Backward Classes and Minorities Welfare Department',
    officialUrl: 'https://www.bcw.tn.gov.in/sub_page/8',
    applicationPortalUrl: null,
    lastVerified: '2026-11-22',
    verificationStatus: 'partially-verified',
    verificationNotes: 'Partially verified on 2026-11-22 against bcw.tn.gov.in: the page lists a Post-matric scholarship scheme for college students and one for school students. Course list, income limit, category and domicile rules, documents, deadline and benefits are not confirmed by this page.',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: [
      'Collect the scholarship application from your educational institution.',
      'Submit the completed application with the relevant documents to the institution.'
    ],
    rules: [
      { id: 'tn-bc-category', field: 'category', operator: 'in', value: ['BC', 'MBC', 'DNC'], required: true, label: 'Belongs to BC, MBC or DNC community (category not collected in profile)' },
      { id: 'tn-bc-domicile', field: 'tnDomicile', operator: 'equals', value: 'yes', required: true, unknownValues: ['notSure'], label: 'Native of Tamil Nadu (not collected in profile)' },
      { id: 'tn-bc-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh'], required: true, label: 'Annual family income does not exceed ₹2,50,000' },
      { id: 'tn-bc-course', field: 'eligibleCourseListed', operator: 'equals', value: 'yes', required: true, unknownValues: ['notSure'], label: 'Course is one of the listed courses: ITI, Polytechnic Diploma, Postgraduate, Professional or PhD (course type not collected in profile)' }
    ],
    notes: 'Documents not individually specified in the source. Deadline not published in the source. Listed courses are described as include, so course eligibility is not auto-matched. Do not map educationLevel values to courses.'
  },
  {
    id: 'tn-bc-mbc-dnc-central-institutions',
    name: 'Tamil Nadu Scholarship for BC/MBC/DNC Students in Central Government Institutions',
    isDemo: false,
    description: 'Scholarship for BC, MBC or DNC students from Tamil Nadu pursuing UG or PG at an IIT, IIM, IIIT, NIT or Central University.',
    department: 'Tamil Nadu Backward Classes Welfare Department',
    officialUrl: 'https://coimbatore.nic.in/educational-scholarship-for-bc-mbc-dnc-students-in-central-educational-institutions-2026-27/',
    applicationPortalUrl: null,
    lastVerified: '2026-11-22',
    verificationStatus: 'partially-verified',
    verificationNotes: 'Partially verified on 2026-11-22 against a Tamil Nadu government (Coimbatore district) notice, published 18/09/2026, for the 2026-27 scheme titled Educational Scholarship for BC, MBC/DNC Students in Central Educational Institutions. It states fresh and renewal applications are invited for 2026-27 with no closing date. Eligibility rules, institution list, income limit and documents are not confirmed by this notice. The scheme name in this record differs from the notice title (Central Government Institutions vs Central Educational Institutions); the name is unchanged pending review.',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: [
      'Submit the application through your educational institution.',
      'The institution forwards completed applications, with the Principal concurrence, to the Directorate of Backward Classes Welfare.'
    ],
    rules: [
      { id: 'tnc-category', field: 'category', operator: 'in', value: ['BC', 'MBC', 'DNC'], required: true, label: 'Belongs to BC, MBC or DNC (category not collected in profile)' },
      { id: 'tnc-domicile', field: 'tnDomicile', operator: 'equals', value: 'yes', required: true, unknownValues: ['notSure'], label: 'Native of Tamil Nadu (not collected in profile)' },
      { id: 'tnc-education', field: 'educationLevel', operator: 'in', value: ['Undergraduate', 'Postgraduate'], required: true, unknownValues: ['Other'], label: 'Pursuing UG or PG' },
      { id: 'tnc-institution', field: 'institution', operator: 'in', value: ['IIT', 'IIM', 'IIIT', 'NIT', 'Central University'], required: true, unknownValues: ['Other'], label: 'Studying at an IIT, IIM, IIIT, NIT or Central University (institution not collected in profile)' },
      { id: 'tnc-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh'], required: true, label: 'Annual family income does not exceed ₹2,50,000' }
    ],
    notes: 'If applications exceed available places, selection is based on Class XII marks (classXiiMarks not collected). Documents unknown. Deadline not published in the source.',
    selectionNote: 'If applications exceed available places, selection is based on Class XII marks.'
  },
  {
    id: 'pm-usp-central-sector',
    name: 'PM-USP Central Sector Scheme of Scholarship for College and University Students',
    isDemo: false,
    description: 'Central sector scholarship for college and university students who are above the 80th percentile of successful Class XII candidates, pursuing a regular course.',
    department: 'Ministry of Education, Department of Higher Education, Government of India',
    officialUrl: 'https://www.education.gov.in/sites/upload_files/mhrd/files/upload_document/FAQs_PM_USP2526.pdf',
    applicationPortalUrl: 'https://scholarships.gov.in/',
    lastVerified: null,
    verificationStatus: 'unverified',
    verificationNotes: 'Unverified. A CSSS 2026-27 announcement at https://scholarships.gov.in/ViewMoreAnnouncement was provided for review but could not be retrieved (request timed out), so its scope relative to PM-USP is not confirmed. The official FAQ PDF cited above is for 2025-26 and could not be retrieved (404). Eligibility rules, benefits, documents and deadline are not confirmed.',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: null,
    rules: [
      { id: 'pmusp-percentile', field: 'classXiiPercentileRank', operator: 'greaterThan', value: 80, required: true, label: 'Above the 80th percentile rank of successful Class XII candidates in the relevant board and stream (percentile rank, not marks percentage)' },
      { id: 'pmusp-regular', field: 'regularCourse', operator: 'equals', value: 'yes', required: true, unknownValues: ['notSure'], label: 'Regular course, not correspondence or distance (not collected in profile)' },
      { id: 'pmusp-income', field: 'annualFamilyIncome', operator: 'maxNumber', value: 450000, required: true, label: 'Annual family income does not exceed ₹4,50,000 (numeric annual family income is collected in the profile; leave blank if not known)' },
      { id: 'pmusp-other-scholarship', field: 'otherScholarship', operator: 'equals', value: 'no', required: true, unknownValues: ['notSure'], label: 'Not receiving another scholarship or fee reimbursement (not collected in profile)' },
      { id: 'pmusp-diploma', field: 'educationLevel', operator: 'notEquals', value: 'Diploma', required: true, unknownValues: ['Other'], label: 'Not a diploma student (diploma students are not eligible)' },
      { id: 'pmusp-drop', field: 'droppedAfterXii', operator: 'equals', value: 'no', required: true, unknownValues: ['notSure'], label: 'Did not take a drop after Class XII (not collected in profile)' }
    ],
    notes: 'Source is the 2025-26 FAQ; cycle-specific conditions and deadlines may change. Deadline null until a current official cycle notification is confirmed. Documents not inferred. The engine checks 80 or more for the percentile, so the strict above-80th boundary is not exact.'
  },
  {
    id: 'pm-yasasvi-top-class-college',
    name: 'PM-YASASVI Top Class Education in College for OBC, EBC and DNT Students',
    isDemo: false,
    description: 'Top class education scholarship for OBC, EBC or DNT students with family income up to ₹2,50,000, admitted to a full-time prescribed course at a notified institution. Scholarships are limited by institutional slots.',
    department: 'Ministry of Social Justice and Empowerment, Government of India',
    officialUrl: 'https://socialjustice.gov.in/social-audit/public/schemesdoc/PM_Yasasvi_scheme.pdf',
    applicationPortalUrl: 'https://scholarships.gov.in/',
    lastVerified: null,
    verificationStatus: 'unverified',
    verificationNotes: 'Unverified. The page https://socialjustice.gov.in/schemes/101 was provided for review but returned HTTP 503 in this check, so it is not confirmed whether it matches this college scheme rather than the school scheme. The scheme PDF cited above could not be retrieved (request timed out). Eligibility rules, benefits, documents and deadline are not confirmed.',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: null,
    rules: [
      { id: 'yasasvi-category', field: 'category', operator: 'in', value: ['OBC', 'EBC', 'DNT'], required: true, label: 'Belongs to OBC, EBC or DNT (category not collected in profile)' },
      { id: 'yasasvi-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh'], required: true, label: 'Total annual family income does not exceed ₹2,50,000' },
      { id: 'yasasvi-full-time', field: 'fullTimeCourse', operator: 'equals', value: 'yes', required: true, unknownValues: ['notSure'], label: 'Full-time prescribed course (not collected in profile)' },
      { id: 'yasasvi-institution', field: 'institutionListed', operator: 'equals', value: 'yes', required: true, unknownValues: ['notSure'], label: 'Institution notified by the Ministry (institution not collected in profile)' }
    ],
    notes: 'Students must apply annually, including renewals. Official 2026-27 institution allocation listing: https://socialjustice.gov.in/index.php/schemes/110. Documents unknown. Deadline null until a current student application notification is confirmed. Scholarships are limited by institutional slots and selection criteria.',
    selectionNote: 'Scholarships are limited by institutional slots and selection criteria.'
  },
  {
    id: 'national-top-class-st',
    name: 'National Scholarship Scheme (Top Class) for Higher Education of ST Students',
    isDemo: false,
    description: 'Top class scholarship for ST students pursuing a prescribed course at an institution identified by the Ministry, selected on merit based on Class XII marks.',
    department: 'Ministry of Tribal Affairs, Government of India',
    officialUrl: 'https://tribal.nic.in/Scholarship.aspx',
    applicationPortalUrl: 'https://scholarships.gov.in/',
    lastVerified: null,
    verificationStatus: 'unverified',
    verificationNotes: 'Unverified. The PIB press release https://www.pib.gov.in/PressReleasePage.aspx?PRID=2294705&lang=1&reg=6 (posted 05 AUG 2026, Ministry of Tribal Affairs) refers to the Post Matric Scholarship Scheme for ST students and does not confirm this Top Class scheme. Income limit, institution list, course rules, documents and deadline are not confirmed.',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: null,
    rules: [
      { id: 'nst-category', field: 'category', operator: 'equals', value: 'ST', required: true, label: 'Belongs to Scheduled Tribe (category not collected in profile)' },
      { id: 'nst-income', field: 'annualFamilyIncome', operator: 'maxNumber', value: 600000, required: true, label: 'Annual family income from all sources does not exceed ₹6,00,000 (numeric annual family income is collected in the profile; leave blank if not known)' },
      { id: 'nst-course', field: 'coursePrescribed', operator: 'equals', value: 'yes', required: true, unknownValues: ['notSure'], label: 'Prescribed course (not collected in profile)' },
      { id: 'nst-institution', field: 'institutionListed', operator: 'equals', value: 'yes', required: true, unknownValues: ['notSure'], label: 'Institution identified by the Ministry (institution not collected in profile)' },
      { id: 'nst-marks', field: 'classXiiMarks', operator: 'nonEmpty', value: null, required: true, label: 'Class XII marks available for merit selection (not collected in profile)' }
    ],
    notes: 'Covers the duration of the course, subject to applicable conditions. Documents unknown. Deadline null until confirmed by a current official notification.',
    selectionNote: "Selection is on merit based on Class XII marks, subject to the scheme's own process."
  }
];

if (typeof window !== 'undefined') {
  window.THUNAI_SCHEMES = THUNAI_SCHEMES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = THUNAI_SCHEMES;
}
