// THUNAI scheme dataset. DEMO records only: no real scheme names, URLs or verification dates.
// Income and profile option values match profile.html.
var THUNAI_SCHEMES = [
  {
    id: 'demo-scheme-a',
    name: '[DEMO] Sample Merit Scholarship',
    isDemo: true,
    description: 'DEMO placeholder scholarship for testing the eligibility engine.',
    department: 'DEMO – placeholder department',
    rules: [
      { id: 'a-age-min', field: 'age', operator: 'minNumber', value: 14, required: true, label: 'Age at least 14' },
      { id: 'a-age-max', field: 'age', operator: 'maxNumber', value: 30, required: true, label: 'Age at most 30' },
      { id: 'a-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh', '₹2.5–5 lakh'], required: true, label: 'Family income up to ₹5 lakh a year' },
      { id: 'a-education', field: 'educationLevel', operator: 'in', value: ['Undergraduate', 'Postgraduate'], required: true, label: 'Undergraduate or postgraduate student' },
      { id: 'a-college', field: 'collegeType', operator: 'notIn', value: ['Private'], required: true, label: 'Not in a private college' }
    ],
    requiredDocuments: ['DEMO: verify document list with official source', 'DEMO: placeholder identity proof'],
    applicationSteps: ['DEMO: step 1 – create profile', 'DEMO: step 2 – check eligibility', 'DEMO: step 3 – verify with official source'],
    officialUrl: null,
    lastVerified: null,
    verificationStatus: 'demo-unverified'
  },
  {
    id: 'demo-scheme-b',
    name: '[DEMO] Sample First-Generation Support',
    isDemo: true,
    description: 'DEMO placeholder support scheme for first-generation graduates.',
    department: 'DEMO – placeholder department',
    rules: [
      { id: 'b-first-gen', field: 'firstGeneration', operator: 'equals', value: 'yes', required: true, label: 'First-generation graduate' },
      { id: 'b-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh'], required: true, label: 'Family income up to ₹2.5 lakh a year' },
      { id: 'b-year', field: 'academicYear', operator: 'notIn', value: ['4th Year'], required: true, label: 'Not in 4th year' }
    ],
    requiredDocuments: ['DEMO: verify document list with official source', 'DEMO: placeholder enrolment proof'],
    applicationSteps: ['DEMO: step 1 – create profile', 'DEMO: step 2 – check eligibility', 'DEMO: step 3 – verify with official source'],
    officialUrl: null,
    lastVerified: null,
    verificationStatus: 'demo-unverified'
  },
  {
    id: 'demo-scheme-c',
    name: '[DEMO] Sample Postgraduate Bursary',
    isDemo: true,
    description: 'DEMO placeholder bursary for postgraduate students.',
    department: 'DEMO – placeholder department',
    rules: [
      { id: 'c-course', field: 'course', operator: 'nonEmpty', value: null, required: true, label: 'Course entered' },
      { id: 'c-education', field: 'educationLevel', operator: 'equals', value: 'Postgraduate', required: true, label: 'Postgraduate student' },
      { id: 'c-age', field: 'age', operator: 'maxNumber', value: 40, required: true, label: 'Age at most 40' },
      { id: 'c-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh', '₹1–2.5 lakh', '₹2.5–5 lakh', '₹5–8 lakh'], required: true, label: 'Family income up to ₹8 lakh a year' }
    ],
    requiredDocuments: ['DEMO: verify document list with official source', 'DEMO: placeholder mark sheet'],
    applicationSteps: ['DEMO: step 1 – create profile', 'DEMO: step 2 – check eligibility', 'DEMO: step 3 – verify with official source'],
    officialUrl: null,
    lastVerified: null,
    verificationStatus: 'demo-unverified'
  }
];

if (typeof window !== 'undefined') {
  window.THUNAI_SCHEMES = THUNAI_SCHEMES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = THUNAI_SCHEMES;
}
