// Authoritative Records Register (demo).
// The information-management knowledge ProofVault checks AI output against:
// which records exist, what they actually say, whether they are still current,
// which agencies existed when, and the verified facts held in source systems.
// Organisation-internal records, IDs and facts are fictional demo data that line up with src/data.js.
// Agency establishment years are real.

export const DOCUMENTS = [
  {
    id: 'D26/18842',
    title: 'Adopted Budget 2026–27',
    issuer: 'Council',
    date: '2026-06-24',
    status: 'current',
    text: 'Line 7.3.1: Community Energy Relief Subsidy — $4.2 million for the 2026–27 financial year.',
  },
  {
    id: 'DS-0447',
    title: 'Energy Relief Program Uptake Dataset 2019–2023',
    issuer: 'Council',
    date: '2024-02-10',
    status: 'current',
    caveat: 'Known under-representation of CALD and First Nations households (application rate 11% in the three most disadvantaged suburbs vs 34% council average).',
    text: 'Application and approval counts by suburb for the 2019–2023 energy relief programs.',
  },
  {
    id: 'D21/04410',
    title: 'Community Engagement Policy 2021',
    issuer: 'Council',
    date: '2021-08-16',
    status: 'current',
    text: 'Clause 6.2: Allocations of community funding are subject to a 28-day public consultation period.',
  },
  {
    id: 'D19/02231',
    title: 'Community Engagement Policy 2019',
    issuer: 'Council',
    date: '2019-03-04',
    status: 'superseded',
    supersededBy: 'D21/04410',
    text: 'Clause 5.1: Allocations of community funding are subject to a 14-day public consultation period.',
  },
  {
    id: 'STATE-EH-2022',
    title: 'State Energy Hardship Survey 2022',
    issuer: 'State Government',
    date: '2022-11-30',
    status: 'current',
    text: 'An estimated 48% of eligible low-income households received energy relief in 2021–22.',
  },
  {
    id: 'PC-2024-ERM',
    title: 'Energy Retail Markets Inquiry Report',
    issuer: 'Productivity Commission',
    date: '2024-09-12',
    status: 'current',
    text: 'Concessions reduce, but do not eliminate, energy debt among low-income households.',
  },
  {
    id: 'DFIR-AUR-0.3',
    title: 'DFIR Interim Report v0.3',
    issuer: 'Aurelia Financial Group',
    date: '2026-10-18',
    status: 'current',
    text: '§2.1 Exfiltration cannot be ruled out; approximately 12.4k customer records are in scope. §3 Threat actor: undetermined.',
  },
  {
    id: 'TRN-4092',
    title: 'Consultation transcript, 14 Oct 2026',
    issuer: 'Clinic',
    date: '2026-10-14',
    status: 'current',
    text: 'Patient presented on 14 Oct 2026 reporting intermittent chest tightness on exertion over three weeks. We will refer for an exercise stress test and review in one week.',
  },
  {
    id: 'INC-AUR-16',
    title: 'Aurelia incident log',
    issuer: 'Aurelia Financial Group',
    date: '2026-10-16',
    status: 'current',
    text: 'Aurelia Financial Group identified a cyber security incident affecting a third-party file-transfer platform on 16 October 2026.',
  },
  {
    id: 'ACSC-MR-REG',
    title: 'ACSC media statements register (Oct 2026)',
    issuer: 'Australian Cyber Security Centre',
    date: '2026-10-19',
    status: 'current',
    text: 'The ACSC is aware of an incident affecting a third-party file-transfer platform and is providing technical advice to affected organisations.',
  },
  {
    id: 'SER-W1952/14',
    title: 'Engineering Department meeting minutes',
    issuer: 'Engineering Department',
    date: '1952-03-04',
    status: 'current',
    text: 'The engineer reported a crack on the eastern side of the main dam and recommended lowering the water level immediately. It was decided to send an officer to re-inspect next week.',
  },
];

// Agencies with the year they came into existence (and ceased, if relevant).
export const AGENCIES = [
  { name: 'Australian Cyber Security Centre', aliases: ['ACSC'], established: 2014 },
  { name: 'Office of the Australian Information Commissioner', aliases: ['OAIC'], established: 2010 },
  { name: 'Productivity Commission', aliases: [], established: 1998 },
  { name: 'Digital Transformation Agency', aliases: ['DTA'], established: 2016 },
  { name: 'National Archives of Australia', aliases: ['NAA'], established: 1998 },
  { name: 'Therapeutic Goods Administration', aliases: ['TGA'], established: 1990 },
];

// Verified facts held in source systems (dispensing records, device logs, budgets).
// A claim that mentions the entity with a different number is a mismatch.
export const FACTS = [
  { entity: 'metoprolol', aliases: ['metoprolol tartrate'], value: 50, unit: 'mg', sourceId: 'MHR-PBS', source: 'My Health Record PBS dispense, 02 Oct 2026' },
  { entity: 'Community Energy Relief Subsidy', aliases: ['energy relief subsidy', 'subsidy'], value: 4.2, unit: 'million', sourceId: 'D26/18842', source: 'Adopted Budget 2026–27, line 7.3.1' },
  { entity: 'public consultation', aliases: ['consultation period'], value: 28, unit: 'day', sourceId: 'D21/04410', source: 'Community Engagement Policy 2021, clause 6.2' },
  { entity: 'customer records', aliases: ['records in scope'], value: 12.4, unit: 'k', sourceId: 'DFIR-AUR-0.3', source: 'DFIR Interim Report v0.3 §2.1' },
];

// Investigations and results that must exist in a linked system before a note may state them.
export const RESULT_SYSTEMS = [
  { test: 'ECG', aliases: ['ecg', 'electrocardiogram'], records: [], system: 'ECG device log (no upload on 14 Oct 2026)' },
  { test: 'blood pressure', aliases: ['blood pressure', 'bp'], records: ['DEV-77213'], system: 'Omron device reading 10:42' },
];

export const getDocument = (id) => DOCUMENTS.find((d) => d.id.toLowerCase() === String(id).toLowerCase());
