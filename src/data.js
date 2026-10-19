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
  org: 'Contact Centre · Customer Service Division',
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
    title: 'A Claim Reaches the Public',
    persona: 'Maya Lin · Community Resident & Voter',
    mode: 'map',
    lens: 'personal',
    claim: 'Viral photo shows an empty bus stop at midday — proof the northern suburbs do not need the transport subsidy.',
    narrative:
      'Maya sees a viral post: a photo of an empty bus stop "proving" her suburb doesn\'t need its transport subsidy. It looks calm and reasonable — so she drops it into ProofVault\'s Provenance Map.',
  },
  {
    act: 'Act II',
    title: 'Sinking Through the Pattern Database',
    persona: 'Claude Opus 5.5 · Provenance Engine',
    mode: 'map',
    lens: 'government',
    claim: 'An estimated 87% of eligible low-income households already received relief under previous subsidy schemes.',
    narrative:
      'Layer by layer the claim sinks through the database — Government → Social Policy → Subsidies → "Unsourced uptake statistics". Unrelated domains fade; the matched branch lights up with prior cases and the IM control to apply.',
  },
  {
    act: 'Act III',
    title: 'Tracing Upstream to the Archive Gate',
    persona: 'Marcus Webb · Information Governance Officer (RIMPA)',
    mode: 'enterprise',
    docId: 'doc-pol26',
    segId: 's3',
    tab: 'audit',
    narrative:
      'Where did that statistic come from? An unverified AI policy draft (doc-pol26) about to enter the Council\'s archive. At the IM Gate, Marcus intercepts the unsourced 87% figure, the fabricated Productivity Commission citation and the demographic bias.',
  },
  {
    act: 'Act IV',
    title: 'Sealing Clean Collective Memory',
    persona: 'Dr. Amelia Chen · Senior Records Manager',
    mode: 'enterprise',
    docId: 'doc-4092',
    tab: 'signoff',
    narrative:
      'From council policies to clinical scribes (Patient #4092), Information Managers enforce ISO 15489 & C2PA standards before sealing records to the ProofCore seal ledger — stopping known patterns at the gate before they reach the public record.',
  },
];
