// THUNAI scheme dataset. Five source-checked central and Tamil Nadu scholarship records.
// Application status is unknown for all records. Deadlines and required documents are null
// where the source does not state them. Profile option values match profile.html.
var THUNAI_SCHEMES = [
  {
    id: 'tn-bc-mbc-dnc-post-matric',
    name: 'Tamil Nadu BC/MBC/DNC Post-Matric Scholarship',
    isDemo: false,
    description: 'Post-matric scholarship for students from BC, MBC or DNC communities in Tamil Nadu on listed courses (ITI, Polytechnic Diploma, Postgraduate, Professional and PhD courses).',
    department: 'Tamil Nadu Backward Classes, Most Backward Classes and Minorities Welfare Department',
    officialUrl: 'https://bcmbcmw.tn.gov.in/welfschemes.htm',
    applicationPortalUrl: null,
    lastVerified: '2026-11-21',
    verificationStatus: 'source-checked',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: [
      'Collect the scholarship application from your educational institution.',
      'Submit the completed application with the relevant documents to the institution.'
    ],
    rules: [
      { id: 'tn-bc-category', field: 'category', operator: 'in', value: ['BC', 'MBC', 'DNC'], required: true, label: 'Belongs to BC, MBC or DNC community (category not collected in profile)' },
      { id: 'tn-bc-domicile', field: 'tnDomicile', operator: 'equals', value: 'yes', required: true, label: 'Native of Tamil Nadu (not collected in profile)' },
      { id: 'tn-bc-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh'], required: true, label: 'Annual parental income does not exceed ₹2,50,000' },
      { id: 'tn-bc-course', field: 'eligibleCourseListed', operator: 'equals', value: 'yes', required: true, label: 'Course is one of the listed courses: ITI, Polytechnic Diploma, Postgraduate, Professional or PhD (course type not collected in profile)' }
    ],
    notes: 'Documents not individually specified in the source. Deadline not published in the source. Listed courses are described as include, so course eligibility is not auto-matched. Do not map educationLevel values to courses.'
  },
  {
    id: 'tn-bc-mbc-dnc-central-institutions',
    name: 'Tamil Nadu Scholarship for BC/MBC/DNC Students in Central Government Institutions',
    isDemo: false,
    description: 'Scholarship for BC, MBC or DNC students from Tamil Nadu pursuing UG or PG at an IIT, IIM, IIIT, NIT or Central University.',
    department: 'Tamil Nadu Backward Classes Welfare Department',
    officialUrl: 'https://bcmbcmw.tn.gov.in/welfschemes.htm',
    applicationPortalUrl: null,
    lastVerified: '2026-11-21',
    verificationStatus: 'source-checked',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: [
      'Submit the application through your educational institution.',
      'The institution forwards completed applications, with the Principal concurrence, to the Directorate of Backward Classes Welfare.'
    ],
    rules: [
      { id: 'tnc-category', field: 'category', operator: 'in', value: ['BC', 'MBC', 'DNC'], required: true, label: 'Belongs to BC, MBC or DNC (category not collected in profile)' },
      { id: 'tnc-domicile', field: 'tnDomicile', operator: 'equals', value: 'yes', required: true, label: 'Native of Tamil Nadu (not collected in profile)' },
      { id: 'tnc-education', field: 'educationLevel', operator: 'in', value: ['Undergraduate', 'Postgraduate'], required: true, label: 'Pursuing UG or PG' },
      { id: 'tnc-institution', field: 'institutionType', operator: 'in', value: ['IIT', 'IIM', 'IIIT', 'NIT', 'Central University'], required: true, label: 'Studying at an IIT, IIM, IIIT, NIT or Central University (institution not collected in profile)' },
      { id: 'tnc-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh'], required: true, label: 'Annual family income does not exceed ₹2,50,000' }
    ],
    notes: 'If applications exceed available places, selection is based on Class XII marks (classXiiMarks not collected). Documents unknown. Deadline not published in the source.'
  },
  {
    id: 'pm-usp-central-sector',
    name: 'PM-USP Central Sector Scheme of Scholarship for College and University Students',
    isDemo: false,
    description: 'Central sector scholarship for college and university students who are above the 80th percentile of successful Class XII candidates, pursuing a regular course.',
    department: 'Ministry of Education, Department of Higher Education, Government of India',
    officialUrl: 'https://www.education.gov.in/sites/upload_files/mhrd/files/upload_document/FAQs_PM_USP2526.pdf',
    applicationPortalUrl: 'https://scholarships.gov.in/',
    lastVerified: '2026-11-21',
    verificationStatus: 'source-checked',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: null,
    rules: [
      { id: 'pmusp-percentile', field: 'classXiiPercentile', operator: 'minNumber', value: 80, required: true, label: 'Above the 80th percentile of successful Class XII candidates in the relevant board and stream (not collected in profile)' },
      { id: 'pmusp-regular', field: 'regularCourse', operator: 'equals', value: 'yes', required: true, label: 'Regular course, not correspondence or distance (not collected in profile)' },
      { id: 'pmusp-income', field: 'annualFamilyIncome', operator: 'maxNumber', value: 450000, required: true, label: 'Annual family income does not exceed ₹4,50,000 (exact income not collected; income bands cannot confirm this limit)' },
      { id: 'pmusp-other-scholarship', field: 'otherScholarship', operator: 'equals', value: 'no', required: true, label: 'Not receiving another scholarship or fee reimbursement (not collected in profile)' },
      { id: 'pmusp-diploma', field: 'educationLevel', operator: 'notEquals', value: 'Diploma', required: true, label: 'Not a diploma student (diploma students are not eligible)' },
      { id: 'pmusp-drop', field: 'droppedAfterXii', operator: 'equals', value: 'no', required: true, label: 'Did not take a drop after Class XII (not collected in profile)' }
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
    lastVerified: '2026-11-21',
    verificationStatus: 'source-checked',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: null,
    rules: [
      { id: 'yasasvi-category', field: 'category', operator: 'in', value: ['OBC', 'EBC', 'DNT'], required: true, label: 'Belongs to OBC, EBC or DNT (category not collected in profile)' },
      { id: 'yasasvi-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh'], required: true, label: 'Total annual family income does not exceed ₹2,50,000' },
      { id: 'yasasvi-full-time', field: 'fullTimeCourse', operator: 'equals', value: 'yes', required: true, label: 'Full-time prescribed course (not collected in profile)' },
      { id: 'yasasvi-institution', field: 'institutionType', operator: 'equals', value: 'notified', required: true, label: 'Institution notified by the Ministry (institution not collected in profile)' }
    ],
    notes: 'Students must apply annually, including renewals. Official 2026-27 institution allocation listing: https://socialjustice.gov.in/index.php/schemes/110. Documents unknown. Deadline null until a current student application notification is confirmed. Scholarships are limited by institutional slots and selection criteria.'
  },
  {
    id: 'national-top-class-st',
    name: 'National Scholarship Scheme (Top Class) for Higher Education of ST Students',
    isDemo: false,
    description: 'Top class scholarship for ST students pursuing a prescribed course at an institution identified by the Ministry, selected on merit based on Class XII marks.',
    department: 'Ministry of Tribal Affairs, Government of India',
    officialUrl: 'https://tribal.nic.in/Scholarship.aspx',
    applicationPortalUrl: 'https://scholarships.gov.in/',
    lastVerified: '2026-11-21',
    verificationStatus: 'source-checked',
    applicationStatus: 'unknown',
    deadline: null,
    requiredDocuments: null,
    applicationSteps: null,
    rules: [
      { id: 'nst-category', field: 'category', operator: 'equals', value: 'ST', required: true, label: 'Belongs to Scheduled Tribe (category not collected in profile)' },
      { id: 'nst-income', field: 'annualFamilyIncome', operator: 'maxNumber', value: 600000, required: true, label: 'Annual family income from all sources does not exceed ₹6,00,000 (exact income not collected; income bands cannot confirm this limit)' },
      { id: 'nst-course', field: 'coursePrescribed', operator: 'equals', value: 'yes', required: true, label: 'Prescribed course (not collected in profile)' },
      { id: 'nst-institution', field: 'institutionType', operator: 'equals', value: 'identified', required: true, label: 'Institution identified by the Ministry (institution not collected in profile)' },
      { id: 'nst-marks', field: 'classXiiMarks', operator: 'nonEmpty', value: null, required: true, label: 'Class XII marks available for merit selection (not collected in profile)' }
    ],
    notes: 'Covers the duration of the course, subject to applicable conditions. Documents unknown. Deadline null until confirmed by a current official notification.'
  }
];

if (typeof window !== 'undefined') {
  window.THUNAI_SCHEMES = THUNAI_SCHEMES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = THUNAI_SCHEMES;
}
