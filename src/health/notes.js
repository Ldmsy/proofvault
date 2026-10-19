// Northside Hospital worklist: AI-drafted clinical notes awaiting verification by Health Information Services.
// Patients, clinicians and records are fictional.

export const ME = {
  id: 'r3',
  name: 'Amy Fox',
  initials: 'AF',
  role: 'Health Information Manager',
  org: 'Northside Hospital',
  unit: 'Health Information Services',
};

export const CLINICIANS = {
  okafor: { name: 'Doctor', role: 'GP Registrar, Outpatients' },
  lindqvist: { name: 'Dr Erik Lindqvist', role: 'Consultant, General Medicine' },
  haddad: { name: 'Dr Samir Haddad', role: 'Emergency Physician' },
  wong: { name: 'Dr Mei Wong', role: 'Orthopaedic Registrar' },
  murphy: { name: 'Dr Aoife Murphy', role: 'Consultant, Cardiology' },
  uploaded: { name: 'Document author', role: 'Named in the imported file' },
};

const H = 3600_000;
const ago = (hours) => new Date(Date.now() - hours * H).toISOString();
const due = (hours) => new Date(Date.now() + hours * H).toISOString();

// flag.type: 'misinfo' (facts do not match the source) | 'bias'
// evidence.transcript: lines from the ambient recording; evidence.records: linked hospital records with a verdict.
// pattern: taxonomy leaf id (Provenance Map); query: clarification sent to the author and the simulated reply.
export const NOTES = [
  {
    id: 'note-4092',
    patient: { name: 'Ann Lee', mrn: 'NH-004092', dob: '1959-03-11', sex: 'F', ward: 'Outpatients · Cardiology clinic', allergies: [] },
    type: 'Consultation note',
    author: 'okafor',
    scribe: { recordedAt: ago(5.2), minutes: 7 },
    receivedAt: ago(4.9),
    dueAt: due(3),
    segments: [
      { id: 's1', section: 'Presenting complaint', text: 'Ms Lee, 67, reports intermittent chest tightness over the past three weeks, typically on exertion and relieved by rest.' },
      {
        id: 's2',
        section: 'Medications',
        text: 'Currently taking metoprolol 500 mg twice daily for hypertension.',
        revised: 'Currently taking metoprolol 50 mg twice daily for hypertension.',
        flag: { type: 'misinfo', severity: 'Critical', title: 'Dose is 10× the recorded amount', explain: 'The patient said "fifty milligrams". The AI scribe wrote 500 mg — above the maximum daily dose. If filed, this could be copied into future prescriptions.' },
        evidence: {
          transcript: [{ t: '02:47', who: 'Patient', text: 'I take the metoprolol, fifty milligrams, morning and night.' }],
          records: [{ label: 'Dispensing record · 2 Oct 2026', value: 'Metoprolol tartrate 50 mg BD', verdict: 'mismatch' }],
        },
        pattern: 'p.cardio.asr',
        query: { question: 'The note records metoprolol 500 mg BD; the recording and dispensing record both say 50 mg. Please confirm the current dose.', reply: 'Confirmed — 50 mg twice daily. Thanks for catching that.' },
      },
      { id: 's3', section: 'Observations', text: 'BP 148/92 mmHg, HR 78 regular, SpO₂ 97% on room air.' },
      {
        id: 's4',
        section: 'Investigations',
        text: 'ECG performed in clinic showed no abnormalities, ruling out a cardiac cause.',
        revised: 'ECG ordered; result pending at time of documentation. A cardiac cause has not been excluded.',
        flag: { type: 'misinfo', severity: 'High', title: 'ECG result with no ECG on file', explain: 'No ECG was uploaded for this visit. In the recording, the doctor only says an ECG will be organised — the "normal" result and conclusion were invented.' },
        evidence: {
          transcript: [{ t: '06:31', who: 'Doctor', text: "We'll organise an ECG and some bloods before your next visit." }],
          records: [{ label: 'ECG system · 14 Oct 2026', value: 'No tracing uploaded', verdict: 'missing' }],
        },
        pattern: 'p.cardio.ecg',
        query: { question: 'The note says the ECG was normal, but no tracing is on file and the recording says it is still to be organised. Was an ECG done?', reply: 'Not done yet — it is booked for next week. Please record it as pending.' },
      },
      {
        id: 's5',
        section: 'Assessment',
        text: 'Given her anxious manner, symptoms are likely stress-related, as is common in women of her age.',
        revised: 'Patient appeared anxious. Differential includes stable angina, reflux and musculoskeletal pain; cardiac work-up to be completed first.',
        flag: { type: 'bias', severity: 'High', title: 'Assumption based on age and gender', explain: 'The doctor never said this. Putting chest pain down to stress "in women of her age" is a known cause of missed heart disease in women.' },
        evidence: {
          transcript: [{ t: '08:12', who: 'Doctor', text: 'Let’s rule out the heart first, then we can look at other causes.' }],
          records: [],
        },
        pattern: 'p.cardio.gender',
      },
      {
        id: 's6',
        section: 'Family history',
        text: 'No known family history of cardiovascular disease.',
        revised: 'Father had a myocardial infarction at age 58.',
        flag: { type: 'misinfo', severity: 'High', title: 'Family history recorded backwards', explain: 'The patient said her father had a heart attack at 58. The scribe attributed her answer to the wrong speaker and recorded the opposite.' },
        evidence: {
          transcript: [{ t: '04:12', who: 'Patient', text: 'My dad had a heart attack when he was fifty-eight.' }],
          records: [],
        },
        pattern: 'p.cardio.asr',
      },
      { id: 's7', section: 'Plan', text: 'Exercise stress test, FBE, lipids and HbA1c. Review in one week, or present to ED if pain occurs at rest.' },
    ],
  },
  {
    id: 'note-1187',
    patient: { name: 'Thomas Nguyen', mrn: 'NH-001187', dob: '1948-07-02', sex: 'M', ward: 'Ward 4B · Bed 12', allergies: ['Penicillin — anaphylaxis'] },
    type: 'Discharge summary',
    author: 'lindqvist',
    scribe: { recordedAt: ago(9), minutes: 11 },
    receivedAt: ago(8.5),
    dueAt: due(-1.5),
    segments: [
      { id: 's1', section: 'Admission', text: 'Admitted 15 Oct 2026 with community-acquired pneumonia, right lower lobe.' },
      {
        id: 's2',
        section: 'Allergies',
        text: 'No known drug allergies.',
        revised: 'Allergy: penicillin — anaphylaxis (documented 2019).',
        flag: { type: 'misinfo', severity: 'Critical', title: 'Penicillin allergy left out', explain: 'The hospital record lists a penicillin anaphylaxis. A discharge summary saying "no known allergies" could lead the GP to prescribe amoxicillin.' },
        evidence: {
          transcript: [{ t: '01:05', who: 'Dr Lindqvist', text: 'And remember he is anaphylactic to penicillin, so we kept him on doxycycline.' }],
          records: [{ label: 'Allergy register', value: 'Penicillin — anaphylaxis (2019)', verdict: 'mismatch' }],
        },
        query: { question: 'The summary says "no known drug allergies", but the allergy register lists penicillin anaphylaxis. Please confirm.', reply: 'Correct, penicillin anaphylaxis — please add it. Important for the GP.' },
      },
      { id: 's3', section: 'Treatment', text: 'Treated with IV then oral doxycycline. Oxygen weaned on day 3.' },
      { id: 's4', section: 'Discharge plan', text: 'Complete 7 days of doxycycline. GP review in one week with repeat chest X-ray in six weeks.' },
    ],
  },
  {
    id: 'note-2210',
    patient: { name: 'Leanne Carter', mrn: 'NH-002210', dob: '1991-11-20', sex: 'F', ward: 'Emergency · Cubicle 7', allergies: [] },
    type: 'ED triage note',
    author: 'haddad',
    scribe: { recordedAt: ago(2.1), minutes: 5 },
    receivedAt: ago(2),
    dueAt: due(6),
    segments: [
      { id: 's1', section: 'Presentation', text: 'Presents with severe left flank pain radiating to the groin, onset 4 hours ago, with vomiting.' },
      {
        id: 's2',
        section: 'Impression',
        text: 'Appears dishevelled and is requesting strong pain relief; likely drug-seeking behaviour.',
        revised: 'Patient in significant distress, pain 9/10. Presentation consistent with renal colic; analgesia given and CT KUB requested.',
        flag: { type: 'bias', severity: 'High', title: 'Judgement based on appearance', explain: 'Labelling a patient "drug-seeking" from how they look is a recognised source of under-treated pain. Nothing in the recording supports it — the doctor suspected a kidney stone.' },
        evidence: {
          transcript: [{ t: '03:20', who: 'Dr Haddad', text: 'Sounds like a kidney stone — let’s get her some pain relief and a CT.' }],
          records: [{ label: 'Medication chart · ED', value: 'IV morphine 5 mg given 10:14', verdict: 'match' }],
        },
      },
      { id: 's3', section: 'Plan', text: 'IV analgesia and antiemetic. CT KUB. Urinalysis and renal function.' },
    ],
  },
  {
    id: 'note-3345',
    patient: { name: 'George Papadopoulos', mrn: 'NH-003345', dob: '1955-01-30', sex: 'M', ward: 'Ward 6A · Bed 3', allergies: [] },
    type: 'Ward round note',
    author: 'lindqvist',
    scribe: { recordedAt: ago(6), minutes: 4 },
    receivedAt: ago(5.5),
    dueAt: due(1),
    segments: [
      { id: 's1', section: 'Progress', text: 'Day 2 post admission for heart failure exacerbation. Breathing improved overnight.' },
      {
        id: 's2',
        section: 'Results',
        text: 'Potassium 2.1 mmol/L this morning.',
        revised: 'Potassium 4.1 mmol/L this morning.',
        flag: { type: 'misinfo', severity: 'Critical', title: 'Lab value does not match the lab system', explain: 'Pathology reports potassium 4.1. A recorded value of 2.1 would trigger urgent replacement that the patient does not need.' },
        evidence: {
          transcript: [{ t: '00:48', who: 'Dr Lindqvist', text: 'Potassium is four point one, so fine to continue the frusemide.' }],
          records: [{ label: 'Pathology · 19 Oct 06:10', value: 'K⁺ 4.1 mmol/L', verdict: 'mismatch' }],
        },
        pattern: 'p.cardio.ecg',
        query: { question: 'The note records potassium 2.1; pathology reports 4.1. Which is correct?', reply: '4.1 — the lab value is right.' },
      },
      { id: 's3', section: 'Plan', text: 'Continue frusemide 40 mg daily. Daily weights and fluid balance.' },
    ],
  },
  {
    id: 'note-5021',
    patient: { name: 'Aisha Rahman', mrn: 'NH-005021', dob: '1972-05-14', sex: 'F', ward: 'Orthopaedic clinic', allergies: [] },
    type: 'Referral letter',
    author: 'wong',
    scribe: { recordedAt: ago(26), minutes: 6 },
    receivedAt: ago(25),
    dueAt: due(20),
    segments: [
      { id: 's1', section: 'Reason for referral', text: 'Referred for physiotherapy following arthroscopy of the left knee on 2 October 2026.' },
      { id: 's2', section: 'Findings', text: 'Medial meniscus tear trimmed. No ligament damage.' },
      {
        id: 's3',
        section: 'Instructions',
        text: 'Begin weight-bearing exercises on the right knee as tolerated.',
        revised: 'Begin weight-bearing exercises on the left knee as tolerated.',
        flag: { type: 'misinfo', severity: 'Medium', title: 'Wrong side', explain: 'The surgery was on the left knee. The instructions say right — the physiotherapist could treat the wrong leg.' },
        evidence: {
          transcript: [{ t: '02:02', who: 'Dr Wong', text: 'Left knee is healing nicely — start loading it as tolerated.' }],
          records: [{ label: 'Operation report · 2 Oct 2026', value: 'Arthroscopy, LEFT knee', verdict: 'mismatch' }],
        },
      },
    ],
  },
  {
    id: 'note-6400',
    patient: { name: 'David Park', mrn: 'NH-006400', dob: '1983-09-08', sex: 'M', ward: 'Outpatients · Endocrine clinic', allergies: ['Sulfonamides — rash'] },
    type: 'Consultation note',
    author: 'murphy',
    scribe: { recordedAt: ago(1.2), minutes: 9 },
    receivedAt: ago(1),
    dueAt: due(10),
    segments: [
      { id: 's1', section: 'Reason for visit', text: 'Routine review of type 2 diabetes.' },
      { id: 's2', section: 'Results', text: 'HbA1c 7.2%, down from 7.9% three months ago.' },
      { id: 's3', section: 'Plan', text: 'Continue metformin 1 g twice daily. Repeat HbA1c in three months. Dietitian referral offered.' },
    ],
  },
];
