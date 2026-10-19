// Mock data for the ProofVault demo. All organisations, patients and identifiers are fictional.

export const REVIEWERS = [
  { id: 'r1', name: 'Dr. Amelia Chen', role: 'Senior Records Manager, IM Governance', keyId: 'pv-key-7F3A-91C2' },
  { id: 'r2', name: 'Marcus Webb', role: 'Information Governance Officer (CRM, RIMPA)', keyId: 'pv-key-2B8D-44E0' },
  { id: 'r3', name: 'Priya Natarajan', role: 'Clinical Records Lead, HIM', keyId: 'pv-key-C019-5AA7' },
];

export const CHECKLIST = [
  {
    key: 'authenticity',
    label: 'Authenticity & accuracy verified',
    desc: 'Every factual claim traced to an authoritative source record; unverifiable claims corrected or removed (ISO 15489-1 — reliability).',
  },
  {
    key: 'bias',
    label: 'Bias & emotive language mitigated',
    desc: 'Group-based assumptions, loaded wording and deflective framing removed or neutralised (Policy for the responsible use of AI in government).',
  },
  {
    key: 'metadata',
    label: 'Metadata & provenance complete',
    desc: 'C2PA manifest, model version, prompt lineage and human edits captured (AS ISO 23081 recordkeeping metadata).',
  },
  {
    key: 'value',
    label: 'Long-term archival value appraised',
    desc: 'Retention class and disposal authority assigned; record suitable for long-term preservation (NAA Information Management Standard).',
  },
];

const misinfo = 'misinfo';
const bias = 'bias';

export const INITIAL_DOCS = [
  {
    id: 'doc-4092',
    title: 'Clinical AI Ambient Scribe Note — Patient #4092',
    category: 'Clinical',
    org: 'Northern Metro Health Service · General Practice Clinic, Melbourne VIC',
    risk: 'High',
    status: 'Flagged',
    channel: 'MCP · MedScribe Connector',
    ingestedAt: '2026-10-18T09:42:11+11:00',
    owner: 'Dr. R. Okafor (GP Registrar)',
    retention: 'Health record — retain min. 7 yrs after last service (adult patient)',
    provenanceBase: 41,
    c2pa: {
      generator: 'MedScribe Ambient v3.2',
      model: 'whisper-large-v3 (ASR) + clin-summariser-8b-2026.09',
      created: '2026-10-14T10:58:03+11:00',
      hash: 'sha256:9f2c4e71b0d8a6e35c7f19d24a8b03e6f5d1c92a7e4b8f60d3a215c9e7b46f08',
      manifest: 'urn:c2pa:3b7f1c2e-8d44-4a9b-b1e2-6c0f9a51d7e3',
      signer: 'NMHS Clinical AI Signing CA (X.509)',
      action: 'c2pa.created → c2pa.transcribed → c2pa.summarised',
    },
    segments: [
      {
        id: 's1',
        section: 'Presenting complaint',
        text: 'Patient #4092, 67-year-old female, presented on 14 Oct 2026 reporting intermittent chest tightness over the past three weeks, typically on exertion and relieved by rest.',
      },
      {
        id: 's2',
        section: 'Medications',
        text: 'Patient states she is currently taking metoprolol 500 mg twice daily for hypertension.',
        revised: 'Patient states she is currently taking metoprolol 50 mg twice daily for hypertension (dose confirmed against My Health Record dispensing history, 02 Oct 2026).',
        flag: {
          type: misinfo,
          severity: 'Critical',
          title: 'ASR dictation error — 10× dosage discrepancy',
          principle: 'Records must be accurate and reliable at the point of creation',
          standards: ['ISO 15489-1:2016 §5.2.2 Reliability', 'APP 10 — Quality of personal information', 'NSQHS Standard 4 — Medication Safety'],
          rationale:
            'The audio segment at 02:47 contains "fifty milligrams". The ASR layer transcribed "five hundred". 500 mg BD exceeds the maximum recommended daily dose of metoprolol and would create a dangerous clinical record if archived.',
          evidence: 'Audio t=02:47 (confidence 0.61) · My Health Record PBS dispense: metoprolol tartrate 50 mg, 02 Oct 2026',
          confidence: 97,
        },
      },
      {
        id: 's3',
        section: 'Observations',
        text: 'Blood pressure 148/92 mmHg; heart rate 78 bpm, regular. SpO₂ 97% on room air.',
      },
      {
        id: 's4',
        section: 'Investigations',
        text: 'ECG performed in clinic showed no abnormalities, ruling out any cardiac cause for the chest pain.',
        revised: 'ECG ordered; result pending at time of documentation. A cardiac cause has not been excluded.',
        flag: {
          type: misinfo,
          severity: 'High',
          title: 'Hallucinated investigation result',
          principle: 'Every recorded fact must be traceable to a source record',
          standards: ['ISO 15489-1:2016 §5.2.2 Authenticity', 'NAA IM Standard — information is accurate and reliable'],
          rationale:
            'No ECG trace, device upload or clinician statement exists for this encounter. The summariser inferred a normal result and an unsupported clinical conclusion ("ruling out any cardiac cause").',
          evidence: 'ECG device log: no upload 14 Oct · Transcript search "ECG": 1 hit — "we\'ll organise an ECG" (t=06:31)',
          confidence: 94,
        },
      },
      {
        id: 's5',
        section: 'Assessment',
        text: 'Given her anxious demeanour, symptoms are likely stress-related and may be exaggerated, as is common in women of her age.',
        revised: 'Patient appeared anxious. Differential diagnosis includes stable angina, GORD and musculoskeletal pain; anxiety to be considered only after cardiac work-up is complete.',
        flag: {
          type: bias,
          severity: 'High',
          title: 'Gender & age bias — diagnostic overshadowing',
          principle: 'AI-generated records must not encode discriminatory assumptions',
          standards: ['Policy for the responsible use of AI in government (2024)', 'Sex Discrimination Act 1984 (Cth) — principles', 'RACGP Standards — clinical reasoning'],
          rationale:
            'The phrase "as is common in women of her age" is a group-level generalisation not present in the consultation audio. Attributing chest pain to stress in older women is a documented source of missed cardiac diagnoses.',
          evidence: 'Not present in transcript · Model bias audit: 3.4× higher "stress-related" attribution for female patients (Q3 2026 eval set)',
          confidence: 91,
        },
      },
      {
        id: 's6',
        section: 'Family history',
        text: 'Family history: no known cardiovascular disease.',
        revised: 'Family history: father had a myocardial infarction at age 58 (corrected from transcript t=04:12).',
        flag: {
          type: misinfo,
          severity: 'High',
          title: 'Speaker diarisation error — family history inverted',
          principle: 'Records must be complete and capture the full business context',
          standards: ['ISO 15489-1:2016 §5.2.2 Integrity', 'AS ISO 23081 — contextual metadata'],
          rationale:
            'At t=04:12 the patient states "my dad had a heart attack at 58". The diarisation model assigned this utterance to the clinician\'s question, so the summariser recorded the opposite fact.',
          evidence: 'Transcript t=04:12 speaker=SPK_1 (patient voiceprint match 0.88)',
          confidence: 89,
        },
      },
      {
        id: 's7',
        section: 'Plan',
        text: 'Refer for exercise stress test; FBE, lipids and HbA1c ordered. Review in one week, or present to ED immediately if pain occurs at rest.',
      },
    ],
    citations: [
      { id: 'c1', segId: 's2', claim: 'Metoprolol 500 mg BD', source: 'Ambient audio t=02:47', alt: 'MHR PBS dispense 02 Oct', status: 'conflict', note: 'Audio and dispensing history both state 50 mg. AI value is 10× higher.' },
      { id: 'c2', segId: 's3', claim: 'BP 148/92, HR 78', source: 'Omron device reading 10:42', status: 'verified', note: 'Matched to connected device record DEV-77213.' },
      { id: 'c3', segId: 's4', claim: 'Normal ECG, cardiac ruled out', source: null, status: 'missing', note: 'No ECG trace, upload or clinician statement found in any linked system.' },
      { id: 'c4', segId: 's6', claim: 'No family CVD history', source: 'Transcript t=04:12', status: 'conflict', note: 'Source states father had MI at 58 — AI recorded the opposite.' },
      { id: 'c5', segId: 's7', claim: 'Stress test + bloods ordered', source: 'Pathology order PO-552910', status: 'verified', note: 'Orders exist in the practice management system.' },
    ],
  },
  {
    id: 'doc-pol26',
    title: 'Public Policy Draft: 2026 Community Subsidy Allocation Recommendation',
    category: 'Policy',
    org: 'City of Riverbend Council · Strategy & Policy Unit',
    risk: 'Medium',
    status: 'Pending Review',
    channel: 'API · PolicyAssist Webhook',
    ingestedAt: '2026-10-17T16:05:48+11:00',
    owner: 'K. Tran (Senior Policy Officer)',
    retention: 'Council policy development — retain permanently (State archive transfer)',
    provenanceBase: 58,
    c2pa: {
      generator: 'PolicyAssist LLM v2.1 (sovereign-hosted)',
      model: 'gov-llm-70b-instruct-2026.08 · RAG over TRIM corpus',
      created: '2026-10-17T15:51:20+11:00',
      hash: 'sha256:41ab7d0c3e9f2856b17a4cde093f6b28e5d7a10c4f83b9e2a6d5017c3e8f9b24',
      manifest: 'urn:c2pa:a91e44f0-27c3-4d18-9e5b-f8b2c7d06a13',
      signer: 'Riverbend Council Digital Signing Service',
      action: 'c2pa.created → c2pa.edited (prompt v4)',
    },
    segments: [
      {
        id: 's1',
        section: 'Purpose',
        text: 'This paper recommends the allocation of the $4.2 million Community Energy Relief Subsidy across 12 suburbs for the 2026–27 financial year.',
      },
      {
        id: 's2',
        section: 'Methodology',
        text: 'Allocation weights were derived exclusively from historical uptake in the 2019–2023 programs, prioritising suburbs with demonstrated high application rates.',
        revised: 'Allocation weights combine ABS SEIFA 2021 disadvantage indices with historical uptake, adjusted for known under-application in CALD and First Nations communities.',
        flag: {
          type: bias,
          severity: 'High',
          title: 'Algorithmic historical-data bias',
          principle: 'Decisions must not entrench inequities embedded in legacy datasets',
          standards: ['Policy for the responsible use of AI in government (2024)', "Australia's AI Ethics Principles — Fairness", 'Racial Discrimination Act 1975 (Cth) — principles'],
          rationale:
            'Historical uptake is a proxy for digital access and English proficiency. Suburbs with high CALD and First Nations populations under-applied in 2019–2023 and would be systematically deprioritised by this method.',
          evidence: 'Dataset DS-0447: application rate in top-3 SEIFA-disadvantaged suburbs = 11% vs 34% council average',
          confidence: 88,
        },
      },
      {
        id: 's3',
        section: 'Evidence base',
        text: 'An estimated 87% of eligible low-income households already received relief under previous schemes, indicating minimal unmet need in the northern corridor.',
        revised: 'Uptake data for the northern corridor is incomplete; unmet need will be assessed through the 2026 Community Needs Survey (results due Dec 2026).',
        flag: {
          type: misinfo,
          severity: 'High',
          title: 'Unverified statistic presented as fact',
          principle: 'Evidence used in decision records must be attributable',
          standards: ['ISO 15489-1:2016 §5.2.2 Reliability', 'NAA IM Standard — information is accurate and reliable'],
          rationale:
            'No dataset in the retrieval corpus contains an 87% figure. The model appears to have synthesised it from unrelated state-level reporting. The conclusion "minimal unmet need" is unsupported.',
          evidence: 'RAG trace: top-5 retrieved passages contain no matching figure · nearest: 48% (state, 2022)',
          confidence: 93,
        },
      },
      {
        id: 's4',
        section: 'Eligibility',
        text: 'Suburbs with high proportions of renters and recent migrants have historically shown lower civic responsibility in program compliance and should receive reduced allocations.',
        revised: 'Compliance support (translated materials, in-person assistance at service centres) will be provided in suburbs with high proportions of renters and recently arrived residents.',
        flag: {
          type: bias,
          severity: 'Critical',
          title: 'Discriminatory, emotive group characterisation',
          principle: 'Public records must use neutral, evidence-based language',
          standards: ['Racial Discrimination Act 1975 (Cth) — principles', 'Victorian Charter of Human Rights — equality', 'APS Values — impartial'],
          rationale:
            '"Lower civic responsibility" is a loaded moral judgement applied to renters and migrants as groups. It is unsupported by compliance data and would expose Council to discrimination complaints if published.',
          evidence: 'Compliance audit 2023: no statistically significant difference by tenure or migration status (p=0.41)',
          confidence: 96,
        },
      },
      {
        id: 's5',
        section: 'Delivery',
        text: "Applications will open on 1 February 2027 via the Council's online portal and in-person at all four customer service centres.",
      },
      {
        id: 's6',
        section: 'Expected outcomes',
        text: 'According to the Productivity Commission 2025 Energy Hardship Report, council subsidies reduce household energy debt by 64% within six months.',
        revised: '[Citation removed — referenced report not found in the Productivity Commission publications register. Evidence base to be confirmed by the Policy Research Unit before Council briefing.]',
        flag: {
          type: misinfo,
          severity: 'Critical',
          title: 'Fabricated external citation (disinformation risk)',
          principle: 'Citations must resolve to an existing, authoritative source',
          standards: ['ISO 15489-1:2016 §5.2.2 Authenticity', 'NAA IM Standard — information is accurate and reliable'],
          rationale:
            'No "2025 Energy Hardship Report" exists in the Productivity Commission register or Council library holdings. A fabricated authority in a public policy record could mislead councillors and the public.',
          evidence: 'Lookup: pc.gov.au publications register — 0 matches · Trove — 0 matches · TRIM — 0 matches',
          confidence: 98,
        },
      },
      {
        id: 's7',
        section: 'Governance',
        text: 'Final allocations are subject to Council resolution and a 28-day public consultation period under the Community Engagement Policy.',
      },
    ],
    citations: [
      { id: 'c1', segId: 's1', claim: '$4.2M subsidy pool', source: 'Budget 2026–27 line 7.3.1', status: 'verified', note: 'TRIM D26/18842 — adopted budget, matches exactly.' },
      { id: 'c2', segId: 's2', claim: 'Weights from 2019–23 uptake', source: 'Dataset DS-0447', status: 'partial', note: 'Source exists but is known to under-represent CALD and First Nations households.' },
      { id: 'c3', segId: 's3', claim: '87% already received relief', source: null, status: 'missing', note: 'No dataset or report in the retrieval corpus contains this figure.' },
      { id: 'c4', segId: 's6', claim: 'PC 2025 report: −64% debt', source: null, status: 'missing', note: 'Cited report does not exist — likely fabricated by the model.' },
      { id: 'c5', segId: 's7', claim: '28-day consultation', source: 'Community Engagement Policy 2021', status: 'verified', note: 'TRIM D21/04410, clause 6.2.' },
    ],
  },
  {
    id: 'doc-pr1016',
    title: 'Corporate Crisis PR Statement — AI Auto-Generated Draft',
    category: 'Corporate',
    org: 'Aurelia Financial Group Ltd · Corporate Affairs',
    risk: 'High',
    status: 'Flagged',
    channel: 'MCP · M365 Copilot Connector',
    ingestedAt: '2026-10-18T22:17:36+11:00',
    owner: 'J. Morrison (Head of Communications)',
    retention: 'Significant incident record — retain 10 yrs (regulatory)',
    provenanceBase: 36,
    c2pa: {
      generator: 'CommsDraft Agent (Copilot extension)',
      model: 'enterprise-llm-2026.07 · temperature 0.9',
      created: '2026-10-18T22:09:02+11:00',
      hash: 'sha256:c7e05b9d2f14a83e6b0d97c1f5a28e4d3b69f01a7c2e85d4b3f60a9e1d7c52b8',
      manifest: 'urn:c2pa:5d02e7b9-61fa-4c3e-8a07-2b9d4e1f8c66',
      signer: 'Aurelia Enterprise PKI — Content Credentials',
      action: 'c2pa.created (no human edit recorded)',
    },
    segments: [
      {
        id: 's1',
        section: 'Opening',
        text: 'Aurelia Financial Group is aware of a cyber security incident affecting a third-party file-transfer platform used by our customer communications team, identified on 16 October 2026.',
      },
      {
        id: 's2',
        section: 'Impact',
        text: 'We can confirm that absolutely no customer data was accessed or compromised in any way.',
        revised: 'Our investigation, supported by external forensic specialists, is ongoing. Early findings indicate that some customer contact information may have been accessed.',
        flag: {
          type: misinfo,
          severity: 'Critical',
          title: 'Statement contradicts the incident record',
          principle: "Public statements must be consistent with the organisation's own records",
          standards: ['Australian Consumer Law s18 — misleading or deceptive conduct', 'Privacy Act 1988 — Notifiable Data Breaches', 'ISO 15489-1 §5.2.2 Reliability'],
          rationale:
            'The DFIR interim report (v0.3) records possible exfiltration of ~12,400 customer contact records. An absolute denial is factually wrong and creates regulatory and litigation exposure.',
          evidence: 'DFIR Interim Report v0.3 (18 Oct 2026) §2.1 — "exfiltration cannot be ruled out; ~12.4k records in scope"',
          confidence: 99,
        },
      },
      {
        id: 's3',
        section: 'Attribution',
        text: 'This attack was carried out by sophisticated foreign criminal hackers, and Aurelia is the innocent victim of a malicious act that no organisation could have prevented.',
        revised: 'The source of the incident has not yet been determined, and we will not speculate while investigations continue.',
        flag: {
          type: bias,
          severity: 'High',
          title: 'Emotive deflection & unverified attribution',
          principle: 'Records must avoid persuasive framing that distorts facts',
          standards: ['Australian Consumer Law s18', 'ASX Listing Rule 3.1 — continuous disclosure (accuracy)', 'Corporate Communications Policy §4'],
          rationale:
            '"Foreign criminal hackers" is not established by any forensic evidence, and "no organisation could have prevented" is self-serving emotive framing. Both create misleading impressions for customers and markets.',
          evidence: 'DFIR v0.3 §3 — threat actor: "undetermined" · Initial access: unpatched vendor appliance (CVE pending)',
          confidence: 92,
        },
      },
      {
        id: 's4',
        section: 'External validation',
        text: 'The Australian Cyber Security Centre has praised Aurelia\'s swift response as "industry-leading".',
        revised: 'We have notified the Australian Cyber Security Centre and are cooperating fully with its guidance.',
        flag: {
          type: misinfo,
          severity: 'Critical',
          title: 'Fabricated quote from a government agency',
          principle: 'Quotations must resolve to a verifiable source record',
          standards: ['Australian Consumer Law s18', 'Criminal Code Act 1995 (Cth) — false representation of Commonwealth', 'ISO 15489-1 §5.2.2 Authenticity'],
          rationale:
            'No ACSC correspondence, media release or meeting record contains this quote. Falsely attributing praise to a Commonwealth agency is a disinformation risk with serious legal consequences.',
          evidence: 'Records search (email, TRIM, media monitoring) for "industry-leading" + ACSC — 0 matches',
          confidence: 99,
        },
      },
      {
        id: 's5',
        section: 'Regulatory',
        text: 'We have notified the Office of the Australian Information Commissioner (OAIC) in line with the Notifiable Data Breaches scheme.',
      },
      {
        id: 's6',
        section: 'Customer guidance',
        text: 'Customers have absolutely nothing to worry about and there is no need to take any action.',
        revised: 'As a precaution, we recommend customers stay alert to unexpected emails, texts or calls claiming to be from Aurelia, and never share passwords or one-time codes.',
        flag: {
          type: bias,
          severity: 'High',
          title: 'Falsely reassuring, emotive language',
          principle: 'Guidance records must enable informed action by affected parties',
          standards: ['OAIC NDB guidance — recommendations to individuals', 'Australian Consumer Law s18'],
          rationale:
            'Telling customers to take no action conflicts with OAIC guidance for breaches involving contact data, which typically warrants phishing-awareness advice.',
          evidence: 'OAIC NDB form NDB-26-11873 lists "recommended steps for individuals" as required',
          confidence: 90,
        },
      },
      {
        id: 's7',
        section: 'Contact',
        text: 'Customers with questions can contact our dedicated support line on 1800 000 000 (8am–8pm AEDT, 7 days).',
      },
    ],
    citations: [
      { id: 'c1', segId: 's1', claim: 'Incident identified 16 Oct', source: 'SOC ticket INC-2026-10-0381', status: 'verified', note: 'Ticket opened 16 Oct 2026 03:14 AEDT.' },
      { id: 'c2', segId: 's2', claim: 'No data accessed', source: 'DFIR Interim Report v0.3', status: 'conflict', note: 'Report states ~12.4k records may have been exfiltrated.' },
      { id: 'c3', segId: 's3', claim: 'Foreign criminal hackers', source: null, status: 'missing', note: 'Threat actor recorded as "undetermined" in all forensic material.' },
      { id: 'c4', segId: 's4', claim: 'ACSC "industry-leading"', source: null, status: 'missing', note: 'No ACSC record, release or correspondence contains this quote.' },
      { id: 'c5', segId: 's5', claim: 'OAIC notified', source: 'OAIC receipt NDB-26-11873', status: 'verified', note: 'Lodged 17 Oct 2026 11:02 AEDT.' },
    ],
  },
];

// Template used when a new record is "ingested" from the upload modal.
export const INGEST_TEMPLATE = {
  title: 'Customer Service Chatbot — Conversation Summary #CS-77120',
  category: 'Service',
  org: 'Services Australia-style Contact Centre (demo tenant)',
  risk: 'Low',
  status: 'Pending Review',
  owner: 'Contact Centre QA Team',
  retention: 'Customer interaction record — retain 2 yrs after last action',
  provenanceBase: 72,
  c2pa: {
    generator: 'AssistBot Summariser v1.8',
    model: 'small-llm-8b-2026.06',
    created: '2026-10-19T08:31:44+11:00',
    hash: 'sha256:2e8b5f13c0a7d94e61b38f2c07d5a9e4b1f6c38d20a7e95b4c13f8d6e0a27b91',
    manifest: 'urn:c2pa:e3f80b21-9a5c-47d2-b6e1-0c4d8a72f915',
    signer: 'Contact Centre Content Credentials',
    action: 'c2pa.created → c2pa.summarised',
  },
  segments: [
    { id: 's1', section: 'Enquiry', text: 'Customer contacted the chatbot on 19 Oct 2026 regarding a delayed rental assistance payment.' },
    {
      id: 's2',
      section: 'Outcome',
      text: 'The bot confirmed the payment will definitely arrive within 24 hours.',
      revised: 'The bot advised that the payment is being processed; standard processing time is up to 3 business days.',
      flag: {
        type: misinfo,
        severity: 'Medium',
        title: 'Over-confident commitment not supported by system data',
        principle: 'Records of advice given must reflect authoritative business rules',
        standards: ['ISO 15489-1 §5.2.2 Reliability'],
        rationale: 'Payment system shows status "in assessment" with a 3-business-day SLA. The summary records a guarantee that was never authorised.',
        evidence: 'Payments API status: IN_ASSESSMENT · SLA: 3 business days',
        confidence: 84,
      },
    },
    { id: 's3', section: 'Next steps', text: 'Customer was offered a callback from a human officer, which they accepted.' },
  ],
  citations: [
    { id: 'c1', segId: 's1', claim: 'Contact on 19 Oct', source: 'Chat log CL-77120', status: 'verified', note: 'Session timestamp matches.' },
    { id: 'c2', segId: 's2', claim: 'Paid within 24 hours', source: 'Payments API', status: 'conflict', note: 'System SLA is 3 business days.' },
    { id: 'c3', segId: 's3', claim: 'Callback accepted', source: 'CRM task T-99812', status: 'verified', note: 'Callback task created.' },
  ],
};

export const MCP_CONNECTORS = [
  { id: 'medscribe', name: 'MedScribe Ambient (MCP)', desc: 'Clinical ambient scribe notes · HL7 FHIR DocumentReference' },
  { id: 'm365', name: 'Microsoft 365 Copilot (MCP)', desc: 'Drafts from Word, Outlook & Teams with Content Credentials' },
  { id: 'assistbot', name: 'AssistBot Contact Centre (MCP)', desc: 'Chatbot conversation summaries' },
  { id: 'trim', name: 'Content Manager / TRIM (MCP)', desc: 'EDRMS records with AI-generated attachments' },
];

export const BASE_METRICS = {
  pendingElsewhere: 44,
  intercepted: 1284,
  archivedCompliant: 1876,
  archivedTotal: 2031,
};

/* ───────────────────────── Story-Driven 4-Act Narrative Arc ───────────────────────── */

export const STORY_ACTS = [
  {
    act: 'Act I',
    title: 'The Yellow Surface (Everyday User)',
    persona: 'Maya Lin · Community Resident & Voter',
    mode: 'personal',
    poolCaseId: 'pool-subsidy',
    narrative:
      'Maya reads a polished local news article with a photo and PDF chart claiming her northern suburb "doesn\'t need energy or transit subsidies". On the surface, it looks calm and slightly yellow (mildly skewed) — why would she doubt it?',
  },
  {
    act: 'Act II',
    title: 'Opus 5.5 Dives to the Red Pool Floor',
    persona: 'Claude Opus 5.5 · Multimodal Provenance Engine',
    mode: 'personal',
    poolCaseId: 'pool-subsidy',
    focusNodeId: 'r1',
    narrative:
      'Maya drops the mixed media post into ProofVault\'s Personal Pool. Claude Opus 5.5 X-rays the image, chart, and text — revealing that the yellow surface is being poisoned by 3 deep-red root toxins sitting at the bottom of the information pool.',
  },
  {
    act: 'Act III',
    title: 'Tracing Upstream to the Archive Gate',
    persona: 'Marcus Webb · Information Governance Officer (RIMPA)',
    mode: 'enterprise',
    docId: 'doc-pol26',
    segId: 's4',
    tab: 'audit',
    narrative:
      'Where did those red toxins come from? From an unverified AI policy draft (doc-pol26) about to enter the Council\'s TRIM archive! At the Enterprise IM Gate, Marcus intercepts the fabricated Productivity Commission citation and demographic bias.',
  },
  {
    act: 'Act IV',
    title: 'Purifying & Sealing Collective Memory',
    persona: 'Dr. Amelia Chen · Senior Records Manager',
    mode: 'enterprise',
    docId: 'doc-4092',
    tab: 'signoff',
    narrative:
      'From council policies to clinical scribes (Patient #4092), Information Managers enforce ISO 15489 & C2PA standards before sealing records to WORM storage — stopping red toxins at the gate so the public water pool stays crystal clear.',
  },
];

/* ───────────────────────── Personal Multimodal Contamination Pool Cases (Opus 5.5) ───────────────────────── */

export const PERSONAL_POOL_CASES = [
  {
    id: 'pool-subsidy',
    title: 'Viral Mixed-Media Article: "Why Northern Corridor Suburbs Don\'t Need the $4.2M Subsidy"',
    subtitle: 'News Photo + Embedded PDF Chart + Editorial Article · Analyzed by Claude Opus 5.5',
    persona: 'Citizen / Councillor Reader View',
    modalities: ['Image (JPEG · No C2PA)', 'Document Chart (PDF Excerpt)', 'Article Text (Web)'],
    surfaceTintScore: 68,
    linkedDocId: 'doc-pol26',
    linkedDocLabel: 'Public Policy Draft: 2026 Community Subsidy Allocation (doc-pol26)',
    storyContext:
      'Shared 4,200+ times in community groups ahead of the Riverbend Council budget vote. On the surface, it reads like a polite, data-backed fiscal argument — only slightly tinted yellow. Underneath, Opus 5.5 detects three severe red roots.',
    artifact: {
      headline: 'Fiscal Reality Check: With 87% Relief Coverage & Empty Services, Northern Suburbs Are Already Well Served',
      sourceTag: 'Riverbend Civic Watch · 18 Oct 2026 · 3 min read + 2 attachments',
      sceneType: 'bus-shelter',
      imageCaption: 'Fig 1. "Midday weekday demand" at North-West Hub (viral photo attached to article)',
      visionBoxes: [
        {
          id: 'vb1',
          x: '12%',
          y: '16%',
          w: '36%',
          h: '28%',
          tone: 'red',
          tag: 'Opus 5.5 Vision · C2PA Stripped + AI Inpainting',
          finding: 'Station clock & "04:55 AM Sunday Trackwork" notice blurred and overwritten by generative image sharpening.',
        },
        {
          id: 'vb2',
          x: '62%',
          y: '24%',
          w: '32%',
          h: '52%',
          tone: 'orange',
          tag: 'Opus 5.5 Vision · Selective Framing Bias',
          finding: 'Cropped 16:9 frame cuts off the temporary replacement bus queue (38 commuters visible in original CCTV frame).',
        },
      ],
      docExcerpt: {
        title: 'Attached PDF Chart: "Productivity Commission 2025 Energy & Transit Hardship Index"',
        stat: 'Claimed: "87% of Northern households already covered · −64% debt"',
        warning: 'Opus 5.5 Document OCR + Registry Lookup: Cited 2025 PC Report does not exist in pc.gov.au or Trove.',
      },
      articleQuotes: [
        {
          id: 'q1',
          text: '"Independent figures show nearly nine in ten low-income households in the northern corridor have already received adequate municipal relief."',
          tint: 'Soft Yellow Surface — sounds authoritative and measured, masking the fabricated 87% statistic underneath.',
        },
        {
          id: 'q2',
          text: '"Redirecting funds toward high-uptake homeowners simply reflects longstanding patterns of civic participation and program compliance."',
          tint: 'Soft Yellow Surface — polite bureaucratic phrasing that conceals discriminatory exclusion of renters, CALD and First Nations families.',
        },
      ],
    },
    pool: {
      surface: {
        id: 'surf-1',
        layer: 'surface',
        label: 'Surface Takeaway · Tinted Yellow (微微泛黄)',
        title: '"Northern suburbs have low genuine demand; shifting funds is fiscally sensible"',
        summary:
          'What the individual reader perceives: a calm, seemingly objective fiscal commentary supported by a photo and chart. The bias is diluted enough to pass casual reading without raising alarm.',
        purifiedTitle: '"Northern suburbs face high unmet need (SEIFA top-3 disadvantage); prior low uptake reflects language & portal barriers"',
        purifiedSummary:
          'After Opus 5.5 + IM Know-How isolates the 3 red roots: the reader sees the verified ABS SEIFA disadvantage data, the uncropped commuter demand, and the removal of the fabricated Productivity Commission chart.',
        tintLevel: '68% Surface Tinting (Subtle Persuasive Skew)',
      },
      middle: [
        {
          id: 'mid-1',
          layer: 'middle',
          label: 'Multimodal Synthesis',
          title: 'Visual + Statistical Cross-Reinforcement',
          modality: 'Image + PDF Chart',
          desc: 'Pairing an "empty hub" photo with the hallucinated "87% covered" bar chart creates a false visual-numerical consensus that tricks human intuition.',
        },
        {
          id: 'mid-2',
          layer: 'middle',
          label: 'Euphemistic Laundering',
          title: 'AI Style-Polishing of Biased Draft',
          modality: 'LLM Rewrite',
          desc: 'Raw discriminatory wording ("lower civic responsibility in renters & migrants") was softened by a summariser into "patterns of civic participation", turning blatant red bias into subtle yellow tint.',
        },
      ],
      roots: [
        {
          id: 'r1',
          layer: 'root',
          type: 'Disinformation Source',
          modality: 'Image (AI-Altered)',
          title: 'Deceptively Cropped & AI-Sharpened 04:55 AM Photo',
          confidence: 98,
          c2pa: 'Missing C2PA Manifest · Generative sharpening detected on signage',
          detail:
            'Opus 5.5 pixel-level forensics found generative denoising over the maintenance sign and metadata stripping (ASD Multimedia Integrity guideline breach).',
          imTip: 'IM Know-How: Require C2PA 2.1 Content Credentials on all public infrastructure media; cross-check timestamp against asset logs.',
        },
        {
          id: 'r2',
          layer: 'root',
          type: 'Misinformation Source',
          modality: 'Document / Citation',
          title: 'Hallucinated "PC 2025 Report" & 87% Statistic',
          confidence: 96,
          c2pa: 'Originated in unverified AI draft (doc-pol26 §s3 & §s6)',
          detail:
            'Traced directly to an unreviewed PolicyAssist LLM output that fabricated a Productivity Commission citation and conflated state-level numbers.',
          imTip: 'IM Know-How: Enforce ISO 15489-1 §5.2.2 Reliability — every statistical claim must resolve to a registered dataset URI.',
        },
        {
          id: 'r3',
          layer: 'root',
          type: 'Bias Source',
          modality: 'Legacy Dataset + Framing',
          title: 'Historical Uptake Bias (DS-0447) + Anti-Renter Framing',
          confidence: 94,
          c2pa: 'Dataset DS-0447 known to under-sample CALD & First Nations by 3.1×',
          detail:
            'The underlying 2019–2023 application dataset only offered English web forms, encoding structural inequity into the AI training context.',
          imTip: 'IM Know-How: Appraise context metadata (AS ISO 23081) to flag known sampling bias before feeding legacy records into RAG.',
        },
      ],
      edges: [
        { from: 'r1', to: 'mid-1' },
        { from: 'r2', to: 'mid-1' },
        { from: 'r2', to: 'mid-2' },
        { from: 'r3', to: 'mid-2' },
        { from: 'mid-1', to: 'surf-1' },
        { from: 'mid-2', to: 'surf-1' },
      ],
    },
  },
  {
    id: 'pool-clinical',
    title: 'Patient Take-Home Multimodal Pack: "Stress-Related Chest Tightness & 500mg Regimen"',
    subtitle: 'Discharge Infographic + Voice-Note Transcript + Medication Card · Claude Opus 5.5',
    persona: 'Patient #4092 & Family Carer View',
    modalities: ['Infographic Card (PNG)', 'Ambient Audio Snippet', 'Patient Summary PDF'],
    surfaceTintScore: 74,
    linkedDocId: 'doc-4092',
    linkedDocLabel: 'Clinical AI Ambient Scribe Note — Patient #4092 (doc-4092)',
    storyContext:
      'After her GP visit, 67-year-old Patient #4092 receives an AI-generated patient-friendly summary card in her health app. It looks warm, reassuring, and slightly yellow — hiding a lethal 10× dosage error and a missed cardiac workup.',
    artifact: {
      headline: 'Your Visit Summary: Managing Stress-Related Chest Tightness & Daily Wellness',
      sourceTag: 'MyHealth Companion App · Auto-generated from Consultation #4092',
      sceneType: 'clinical-card',
      imageCaption: 'Fig 1. AI-generated visual medication & wellness card sent to patient smartphone',
      visionBoxes: [
        {
          id: 'vb1',
          x: '8%',
          y: '18%',
          w: '44%',
          h: '32%',
          tone: 'red',
          tag: 'Opus 5.5 OCR · 10× Lethal Dose on Visual Card',
          finding: 'Infographic pill icon renders "Metoprolol 500 mg — Morning & Night" (1,000 mg/day vs 50 mg PBS dispense record).',
        },
        {
          id: 'vb2',
          x: '55%',
          y: '46%',
          w: '39%',
          h: '36%',
          tone: 'orange',
          tag: 'Opus 5.5 Vision+Text · Diagnostic Overshadowing',
          finding: 'Calming lavender "Women\'s Stress & Breathing" graphic visually reinforces the biased dismissal of exertional chest pain.',
        },
      ],
      docExcerpt: {
        title: 'Attached Audio-to-Text Snippet & ECG Status Badge',
        stat: 'Badge: "✔ Heart Check Normal · Family Risk: None"',
        warning: 'Opus 5.5 Cross-Modal Check: Audio t=06:31 says "we\'ll organise an ECG" (not yet performed); audio t=04:12 states father had MI at 58.',
      },
      articleQuotes: [
        {
          id: 'q1',
          text: '"Good news — your in-clinic heart check showed no abnormalities, so you can feel confident that your chest tightness is stress-related."',
          tint: 'Soft Yellow Surface — warm, empathetic bedside tone that masks a hallucinated ECG result.',
        },
        {
          id: 'q2',
          text: '"Experiencing physical tension during life transitions is very common for women in their late sixties; continue your 500 mg metoprolol twice daily."',
          tint: 'Soft Yellow Surface — caring wellness phrasing that blends gender/age bias with a 10× ASR transcription error.',
        },
      ],
    },
    pool: {
      surface: {
        id: 'surf-1',
        layer: 'surface',
        label: 'Surface Takeaway · Tinted Yellow (微微泛黄)',
        title: '"Reassuring wellness advice: my heart is fine, it\'s just age-related stress"',
        summary:
          'To the patient and her daughter, the summary feels supportive and clear. The gentle yellow reassurance discourages her from seeking urgent care if angina worsens.',
        purifiedTitle: '"Action Required: Confirm 50 mg Metoprolol dose; complete pending ECG before ruling out cardiac cause"',
        purifiedSummary:
          'Once Opus 5.5 + Clinical IM Gate remediates the underlying scribe record: the 10× dose error is blocked, the father\'s MI history is restored, and the premature "stress" label is removed.',
        tintLevel: '74% Surface Tinting (False Reassurance & Clinical Risk)',
      },
      middle: [
        {
          id: 'mid-1',
          layer: 'middle',
          label: 'Patient-Friendly Simplification',
          title: 'Empathy Wrapper Around Hallucinated Facts',
          modality: 'Consumer Health LLM',
          desc: 'The patient-portal LLM wrapped raw scribe errors in comforting language ("Good news!") and calming visual icons, making critical errors harder for a layperson to spot.',
        },
        {
          id: 'mid-2',
          layer: 'middle',
          label: 'Template Bias Amplification',
          title: 'Auto-Selected "Older Female Anxiety" Visual Theme',
          modality: 'Multimodal Layout Engine',
          desc: 'Triggered by the biased assessment phrase in the clinical note, the layout engine auto-attached stress-breathing graphics instead of chest-pain red-flag warnings.',
        },
      ],
      roots: [
        {
          id: 'r1',
          layer: 'root',
          type: 'Misinformation Source',
          modality: 'Audio ASR Error',
          title: 'ASR Dictation Error: "Fifty" → "500 mg" + Inverted Family History',
          confidence: 97,
          c2pa: 'Whisper ASR confidence 0.61 at t=02:47 · Speaker diarisation flip at t=04:12',
          detail:
            'Directly reflects the ABC News clinical AI scribe risk highlighted in the RIMPA Hack Pack: unverified speech-to-text creating life-threatening medication and history errors.',
          imTip: 'IM Know-How: Cross-validate AI clinical entities against structured EHR/PBS dispensing registers before generating patient artefacts.',
        },
        {
          id: 'r2',
          layer: 'root',
          type: 'Disinformation / Hallucination',
          modality: 'Missing Device Record',
          title: 'Fabricated "Normal ECG" Conclusion Without Device Trace',
          confidence: 94,
          c2pa: 'Zero ECG device uploads in NMHS PACS for encounter #4092',
          detail:
            'The clinical summariser hallucinated a completed normal ECG from the doctor\'s future-tense statement ("we\'ll organise an ECG").',
          imTip: 'IM Know-How: Enforce ISO 15489 Authenticity — diagnostic conclusions cannot be archived without a linked instrument record ID.',
        },
        {
          id: 'r3',
          layer: 'root',
          type: 'Bias Source',
          modality: 'Model Prior Skew',
          title: 'Gender & Age Diagnostic Overshadowing ("Common in women her age")',
          confidence: 91,
          c2pa: '3.4× female stress-attribution skew in Q3 2026 model audit',
          detail:
            'Injected by the model\'s pre-training priors despite never being spoken by the GP, systematically downplaying female cardiovascular symptoms.',
          imTip: 'IM Know-How: Strip ungrounded demographic generalisations under Responsible AI in Government guidelines.',
        },
      ],
      edges: [
        { from: 'r1', to: 'mid-1' },
        { from: 'r2', to: 'mid-1' },
        { from: 'r3', to: 'mid-2' },
        { from: 'r2', to: 'mid-2' },
        { from: 'mid-1', to: 'surf-1' },
        { from: 'mid-2', to: 'surf-1' },
      ],
    },
  },
  {
    id: 'pool-archive1956',
    title: 'Heritage Feature: "1956 Riverbend Flood Relief — AI HD Photo Restoration & Retrospective"',
    subtitle: 'AI-Sharpened Archival Photograph + Museum Blog + Catalogue Note · Claude Opus 5.5',
    persona: 'Historian, Journalist & Public Researcher View',
    modalities: ['Archival Photo (AI-Upscaled)', 'Catalogue Metadata', 'Magazine Feature'],
    surfaceTintScore: 63,
    linkedDocId: 'doc-pol26',
    linkedDocLabel: 'Aligned to NAA Digital Preservation Policy & Archive Image Enhancement Guidelines',
    storyContext:
      'Directly inspired by the RIMPA Hack Pack references on "Image enhancement in archives and reinterpretation" and "Problematic Image sharpening". A viral heritage article uses an AI-sharpened 1956 photo to claim migrant communities did not participate in post-flood relief.',
    artifact: {
      headline: 'Looking Back Clearly: New HD Restoration Reveals Who Built the 1956 Riverbend Levee',
      sourceTag: 'Regional Heritage Digest · Oct 2026 · Illustrated with "AI-Restored" State Archive Scan',
      sceneType: 'archive-photo',
      imageCaption: 'Fig 1. 1956 Volunteer Sandbag Brigade — Generative Super-Resolution v4 vs Original Glass-Plate Scan',
      visionBoxes: [
        {
          id: 'vb1',
          x: '14%',
          y: '22%',
          w: '38%',
          h: '46%',
          tone: 'red',
          tag: 'Opus 5.5 Vision · Generative Face Hallucination',
          finding: 'Diffusion upscaler replaced motion-blurred faces of Southern European & Chinese volunteers with synthetic Anglo-Celtic facial features.',
        },
        {
          id: 'vb2',
          x: '58%',
          y: '18%',
          w: '34%',
          h: '32%',
          tone: 'orange',
          tag: 'Opus 5.5 OCR · Altered Bilingual Banner',
          finding: 'Faded Italian/English relief banner in background was "sharpened" into gibberish English-only lettering.',
        },
      ],
      docExcerpt: {
        title: 'Attached Catalogue Excerpt: Series VPRS-8812 · Item #1956-04',
        stat: 'Caption claim: "Homogeneous local volunteer turnout documented in 1956"',
        warning: 'Opus 5.5 Archival Cross-Check: Original glass-plate negative (sha256:88a1...) + Box 14 multilingual sign-in book contradict the AI-restored image.',
      },
      articleQuotes: [
        {
          id: 'q1',
          text: '"Thanks to modern AI sharpening, we can finally see the faces of the 1956 relief brigade in crystal clarity — showing a remarkably uniform traditional town turnout."',
          tint: 'Soft Yellow Surface — celebrates technological nostalgia while treating hallucinated pixels as historical evidence.',
        },
        {
          id: 'q2',
          text: '"The visual record suggests newer migrant groups only became active in civic volunteering decades later."',
          tint: 'Soft Yellow Surface — a sweeping historical revisionist claim resting entirely on an AI-distorted photograph.',
        },
      ],
    },
    pool: {
      surface: {
        id: 'surf-1',
        layer: 'surface',
        label: 'Surface Takeaway · Tinted Yellow (微微泛黄)',
        title: '"1956 flood relief was carried out exclusively by long-settled Anglo residents"',
        summary:
          'Readers see a crisp, convincing "HD historical photo" and accept the subtle narrative that migrant communities had low historical civic participation.',
        purifiedTitle: '"Original 1956 archive & Box 14 register confirm diverse multi-ethnic flood relief brigade"',
        purifiedSummary:
          'With NAA Digital Preservation & C2PA standards enforced: the un-watermarked AI upscale is flagged as a synthetic derivative, and the original glass-plate scan + multilingual volunteer register are linked.',
        tintLevel: '63% Surface Tinting (Historical Reinterpretation via AI Sharpening)',
      },
      middle: [
        {
          id: 'mid-1',
          layer: 'middle',
          label: 'Synthetic Visual Authority',
          title: '"Crystal Clear" Illusion of Generative Upscaling',
          modality: 'AI Image Enhancer',
          desc: 'Human brains equate sharpness with truth. When an AI sharpener hallucinates facial details without a C2PA disclosure badge, viewers treat synthetic pixels as primary archival proof.',
        },
        {
          id: 'mid-2',
          layer: 'middle',
          label: 'Secondary Citation Loop',
          title: 'Editorial & Policy Reuse of Distorted Heritage',
          modality: 'Article + Policy RAG',
          desc: 'Once published online, the distorted heritage article is scraped into local LLM corpora — feeding modern policy bias ("historical low civic responsibility").',
        },
      ],
      roots: [
        {
          id: 'r1',
          layer: 'root',
          type: 'Disinformation / Archival Distortion',
          modality: 'Image Sharpening Bias',
          title: 'Biased Generative Upscaler Overwriting Archival Scan',
          confidence: 97,
          c2pa: 'Original master (VPRS-8812) modified without c2pa.edited manifest',
          detail:
            'Generative enhancer trained predominantly on Western studio portraits hallucinated homogeneous features over low-resolution archival faces.',
          imTip: 'IM Know-How: Per NAA Digital Preservation Policy, never overwrite master archival scans; require C2PA derivative manifests for any AI enhancement.',
        },
        {
          id: 'r2',
          layer: 'root',
          type: 'Misinformation Source',
          modality: 'Omitted Context Record',
          title: 'Detached from Box 14 Multilingual Volunteer Register',
          confidence: 95,
          c2pa: 'Broken archival bond (AS ISO 23081)',
          detail:
            'The photograph was digitized in isolation without linking its companion paper register (which recorded 140+ Italian, Greek, and Chinese volunteers).',
          imTip: 'IM Know-How: Maintain the archival bond (AS ISO 23081) linking visual items to their contextual paper registers.',
        },
      ],
      edges: [
        { from: 'r1', to: 'mid-1' },
        { from: 'r1', to: 'mid-2' },
        { from: 'r2', to: 'mid-2' },
        { from: 'mid-1', to: 'surf-1' },
        { from: 'mid-2', to: 'surf-1' },
      ],
    },
  },
];
