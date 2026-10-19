// ProofVault Mis/Disinformation Pattern Database (demo): a 4-layer taxonomy
// Domain → Sub-domain → Topic → Known pattern. All case counts and examples are fictional demo data.
// Plain data (no JSX) so the server-side matcher can import it too.

const N = (id, label, kw, children) => ({ id, label, kw, children });
const P = (id, label, kw, risk, cases, pattern, example, control) => ({ id, label, kw, risk, cases, pattern, example, control });

export const LAYER_NAMES = ['Domain', 'Sub-domain', 'Topic', 'Known pattern (database)'];

export const RISK_META = {
  misinfo: { label: 'Misinformation', color: '#ef4444' },
  disinfo: { label: 'Disinformation', color: '#e11d48' },
  bias: { label: 'Bias', color: '#f97316' },
};

export const TAXONOMY = [
  N('health', 'Health & Medicine', ['health', 'medical', 'clinical', 'patient', 'doctor', 'hospital', 'gp', 'treatment', 'symptom', 'diagnosis'], [
    N('health.internal', 'Internal Medicine', ['internal medicine', 'medication', 'chronic', 'dose', 'mg'], [
      N('health.internal.cardio', 'Cardiology', ['heart', 'cardiac', 'chest', 'blood pressure', 'hypertension', 'ecg', 'metoprolol', 'angina', 'myocardial'], [
        P('p.cardio.asr', 'ASR dosage transcription error', ['metoprolol', '500 mg', 'twice daily', 'dose', 'mg', 'taking', 'transcri', 'dictation'], 'misinfo', 214,
          'Speech-to-text turns a spoken dose into a 10× value ("fifty" → "five hundred"), producing a dangerous medication record.',
          '"Metoprolol 500 mg BD" recorded where audio says 50 mg.',
          'Reconcile every AI-transcribed dose against the dispensing record (e.g. My Health Record PBS history) before sign-off.'),
        P('p.cardio.gender', 'Gender-biased chest-pain attribution', ['anxious', 'stress', 'exaggerated', 'women', 'woman', 'female', 'her age', 'demeanour'], 'bias', 167,
          'Cardiac symptoms in women are attributed to anxiety or stress, delaying work-up (diagnostic overshadowing).',
          '"Symptoms are likely stress-related, as is common in women of her age."',
          'Strip group generalisations from AI notes; require differential diagnosis before psychological attribution.'),
        P('p.cardio.ecg', 'Hallucinated investigation result', ['ecg', 'normal', 'ruling out', 'no abnormalities', 'result'], 'misinfo', 98,
          'The summariser invents a normal test result and an unsupported conclusion.',
          '"ECG showed no abnormalities, ruling out any cardiac cause."',
          'Every result must link to a device upload or lab record; unlinked results are blocked from the archive.'),
      ]),
      N('health.internal.endo', 'Endocrinology', ['diabetes', 'insulin', 'hba1c', 'thyroid', 'glucose', 'sugar'], [
        P('p.endo.cure', 'Supplement "cure" claims', ['cure', 'reverse', 'supplement', 'natural', 'diabetes'], 'disinfo', 341,
          'Commercial content claims a supplement reverses diabetes, often with fake clinician endorsements.',
          '"This herb reverses type 2 diabetes in 30 days, doctors stunned."',
          'Check endorsements against AHPRA registers; flag therapeutic claims lacking TGA listing.'),
        P('p.endo.targets', 'Fabricated clinical targets', ['target', 'guideline', 'hba1c', 'level'], 'misinfo', 57,
          'AI summaries cite treatment targets that do not appear in any current guideline.',
          '"Guidelines now recommend HbA1c below 4%."',
          'Cite the guideline version and section for every clinical target.'),
      ]),
    ]),
    N('health.surgery', 'Surgery', ['surgery', 'surgical', 'operation', 'procedure', 'theatre'], [
      N('health.surgery.ortho', 'Orthopaedics', ['knee', 'hip', 'joint', 'bone', 'fracture', 'implant'], [
        P('p.ortho.recovery', 'Inflated recovery statistics', ['recovery', 'days', 'weeks', 'success rate', '%'], 'misinfo', 76,
          'Marketing copy overstates recovery speed or success rates without a cited cohort.',
          '"98% of patients walk pain-free within a week."',
          'Require the source cohort, sample size and follow-up period for every outcome figure.'),
        P('p.ortho.images', 'AI-generated outcome imagery', ['before and after', 'x-ray', 'image', 'photo'], 'disinfo', 39,
          'Synthetic before/after images are presented as real patient outcomes.',
          'Generated X-ray showing a "perfect" implant alignment.',
          'Require C2PA credentials or PACS provenance for clinical images in publications.'),
      ]),
      N('health.surgery.general', 'General Surgery', ['appendix', 'gallbladder', 'hernia', 'abdominal'], [
        P('p.gensurg.history', 'Hallucinated procedure history', ['previous surgery', 'history of', 'underwent', 'operation'], 'misinfo', 64,
          'AI notes add procedures the patient never had, contaminating the longitudinal record.',
          '"History of appendectomy (2019)" with no operative record.',
          'Cross-check surgical history against operative records before archiving.'),
        P('p.gensurg.complications', 'Unverified complication rates', ['complication', 'risk', 'rate', 'safe'], 'misinfo', 41,
          'Patient-facing material cites complication rates with no source.',
          '"Complication risk is under 0.01%."',
          'Link every quoted rate to the registry or audit report it comes from.'),
      ]),
    ]),
    N('health.public', 'Public Health', ['public health', 'population', 'community', 'outbreak', 'vaccine', 'vaccination'], [
      N('health.public.vacc', 'Vaccination', ['vaccine', 'vaccination', 'immunisation', 'jab', 'booster', 'side effect'], [
        P('p.vacc.injury', 'Vaccine-injury disinformation', ['vaccine', 'injury', 'deaths', 'cover-up', 'hidden'], 'disinfo', 1208,
          'Coordinated posts claim hidden mass vaccine injuries, citing raw adverse-event reports as proof.',
          '"Thousands of hidden deaths the government won\'t report."',
          'Distinguish unverified adverse-event reports from confirmed causality; cite TGA safety reports.'),
        P('p.vacc.context', 'Out-of-context safety data', ['adverse event', 'report', 'data shows', 'side effect'], 'misinfo', 233,
          'Genuine data shown without the denominator or baseline rate.',
          'Bar chart of adverse-event reports with no doses-administered context.',
          'Require denominators and baseline rates alongside any safety statistic.'),
      ]),
      N('health.public.epi', 'Epidemiology', ['cases', 'infection', 'spread', 'outbreak', 'curve'], [
        P('p.epi.cropped', 'Cropped case-curve charts', ['chart', 'curve', 'cases', 'cropped', 'trend'], 'misinfo', 188,
          'Charts are cropped to a short window to imply a trend that reverses on the full series.',
          'A 2-week case chart implying an outbreak is "over".',
          'Archive the full series and the extraction date alongside any published chart.'),
        P('p.epi.stats', 'Misread outbreak statistics', ['per cent', '%', 'rate', 'statistics', 'study'], 'misinfo', 152,
          'Relative and absolute risk are confused, inflating or minimising effects.',
          '"Risk doubled" where it rose from 0.001% to 0.002%.',
          'State absolute numbers alongside relative change.'),
      ]),
    ]),
  ]),

  N('gov', 'Government & Public Policy', ['government', 'council', 'policy', 'public', 'minister', 'department', 'parliament', 'funding'], [
    N('gov.social', 'Social Policy & Welfare', ['welfare', 'subsidy', 'relief', 'household', 'low-income', 'eligible', 'allocation', 'grant'], [
      N('gov.social.subsidy', 'Subsidies & Grants', ['subsidy', 'grant', 'relief', 'allocation', 'scheme', 'program', 'funds', 'energy'], [
        P('p.subsidy.stat', 'Unsourced uptake statistics', ['87%', 'already received', 'eligible', 'households', 'estimated', 'minimal unmet need'], 'misinfo', 92,
          'A precise-looking uptake figure with no dataset behind it is used to argue that need is already met.',
          '"An estimated 87% of eligible households already received relief."',
          'Every statistic in a decision record must cite its dataset ID and extraction date.'),
        P('p.subsidy.historic', 'Historical-uptake allocation bias', ['historical', 'uptake', 'application rates', 'prioritising', 'weights', '2019'], 'bias', 61,
          'Allocations weighted by past uptake systematically under-serve communities with low digital access.',
          '"Weights derived exclusively from 2019–2023 application rates."',
          'Combine uptake with disadvantage indices (e.g. ABS SEIFA) and test outcomes by community group.'),
        P('p.subsidy.fakeref', 'Fabricated authority citation', ['according to', 'report', 'productivity commission', 'commission', 'study found'], 'disinfo', 47,
          'A non-existent official report is cited to lend authority to a policy claim.',
          '"According to the Productivity Commission 2025 Energy Hardship Report…"',
          'Resolve every citation against the publisher\'s register before the record is filed.'),
      ]),
      N('gov.social.housing', 'Housing & Migration', ['housing', 'rent', 'renters', 'tenants', 'migrants', 'migrant', 'newly arrived'], [
        P('p.housing.stereotype', 'Group stereotyping of renters / migrants', ['renters', 'migrants', 'civic responsibility', 'compliance', 'reduced allocations'], 'bias', 133,
          'Moral judgements are attached to renters or migrants as groups, unsupported by compliance data.',
          '"Recent migrants have historically shown lower civic responsibility."',
          'Remove group characterisations; replace with support measures and evidence-based eligibility.'),
        P('p.housing.figures', 'Fabricated rental-crisis figures', ['vacancy', 'rental', 'crisis', 'homeless', 'figures'], 'misinfo', 58,
          'Rental vacancy or homelessness numbers are invented or mis-dated.',
          '"Vacancy rate hit 0.0% across the state."',
          'Cite the official housing data release and its reference period.'),
      ]),
    ]),
    N('gov.elections', 'Elections & Democracy', ['election', 'vote', 'voting', 'ballot', 'candidate', 'referendum', 'polling'], [
      N('gov.elections.process', 'Voting Process', ['polling place', 'ballot', 'enrol', 'vote twice', 'voting'], [
        P('p.vote.process', 'Polling-process misinformation', ['polling', 'closed', 'vote online', 'deadline', 'ballot'], 'disinfo', 412,
          'False instructions about when, where or how to vote.',
          '"You can now vote by text message this year."',
          'Link to the electoral commission\'s official notice; escalate coordinated posts.'),
        P('p.vote.deepfake', 'Deepfake candidate audio', ['audio', 'recording', 'deepfake', 'leaked', 'voice'], 'disinfo', 87,
          'Synthetic audio attributes statements to candidates.',
          '"Leaked recording" of a candidate admitting fraud.',
          'Require C2PA or chain-of-custody evidence before archiving media as a record of statements.'),
      ]),
      N('gov.elections.claims', 'Official Statements', ['minister', 'official', 'statement', 'quote', 'said'], [
        P('p.official.quote', 'Fabricated quotes from officials', ['quoted', 'said', 'praised', 'stated', 'according to'], 'disinfo', 276,
          'Quotes are attributed to officials or agencies with no source record.',
          '"The Minister praised the program as world-leading."',
          'Match every quote to a transcript, release or correspondence record.'),
        P('p.official.doctored', 'Doctored policy documents', ['leaked document', 'memo', 'draft', 'screenshot'], 'disinfo', 64,
          'Screenshots of "leaked" policy documents are altered.',
          'Edited cabinet memo screenshot circulated on social media.',
          'Compare against the EDRMS master version and its hash.'),
      ]),
    ]),
    N('gov.infra', 'Public Infrastructure', ['transport', 'bus', 'train', 'road', 'infrastructure', 'utility', 'water'], [
      N('gov.infra.transport', 'Public Transport', ['bus', 'bus stop', 'train', 'commuter', 'transit', 'ridership', 'route'], [
        P('p.transport.cropped', 'Cropped "empty service" imagery', ['empty', 'bus stop', 'photo', 'midday', 'nobody', 'proof'], 'disinfo', 73,
          'Photos taken at off-peak times or cropped to remove queues are used as proof that a service is unused.',
          'Midday photo of an empty bus stop presented as typical demand.',
          'Check capture time, C2PA credentials and patronage data before treating a photo as evidence.'),
        P('p.transport.ridership', 'Ridership figures out of context', ['ridership', 'patronage', 'passengers', 'low demand', 'demand'], 'misinfo', 44,
          'Ridership compared across mismatched periods (e.g. holidays vs term).',
          '"Patronage fell 40%" comparing January to May.',
          'Require like-for-like periods and the data source for patronage claims.'),
      ]),
      N('gov.infra.utilities', 'Utilities', ['water', 'power', 'outage', 'electricity', 'supply'], [
        P('p.util.blame', 'Outage blame misattribution', ['outage', 'blackout', 'caused by', 'renewables', 'failure'], 'misinfo', 95,
          'Outages are attributed to a cause before the incident review is complete.',
          '"The blackout was caused by wind farms."',
          'Reference the operator\'s incident report; mark early attributions as unverified.'),
        P('p.util.water', 'Water-safety scare claims', ['water', 'contaminated', 'unsafe', 'toxic', 'tap'], 'disinfo', 52,
          'False claims that the water supply is unsafe.',
          '"Tap water now contains dangerous chemicals, don\'t drink it."',
          'Cite the utility\'s current water-quality report and health advice.'),
      ]),
    ]),
  ]),

  N('corp', 'Corporate & Finance', ['company', 'corporate', 'customers', 'shareholders', 'business', 'firm', 'statement', 'brand'], [
    N('corp.crisis', 'Crisis Communications', ['incident', 'breach', 'crisis', 'cyber', 'attack', 'response', 'statement'], [
      N('corp.crisis.breach', 'Data Breaches', ['data', 'breach', 'cyber', 'hackers', 'customer data', 'compromised', 'accessed'], [
        P('p.breach.denial', 'Absolute "no data accessed" denial', ['absolutely no', 'no customer data', 'not accessed', 'not compromised', 'nothing to worry'], 'misinfo', 119,
          'Early statements deny any data access while the forensic investigation is still open.',
          '"We can confirm that absolutely no customer data was accessed."',
          'Align public wording with the latest forensic report; avoid absolutes until it is final.'),
        P('p.breach.endorse', 'Fabricated regulator endorsement', ['praised', 'industry-leading', 'acsc', 'cyber security centre', 'regulator', 'commended'], 'disinfo', 38,
          'Statements claim praise from a regulator or agency that never gave it.',
          '"The ACSC has praised our swift response as industry-leading."',
          'Every third-party quote needs a correspondence or release record before publication.'),
        P('p.breach.attrib', 'Unverified attacker attribution', ['foreign', 'sophisticated', 'criminal hackers', 'state-sponsored', 'could not have prevented'], 'bias', 71,
          'Deflective framing blames a sophisticated foreign actor before attribution is established.',
          '"Carried out by sophisticated foreign hackers no one could have stopped."',
          'Use the forensic report\'s attribution status verbatim; avoid emotive deflection.'),
      ]),
      N('corp.crisis.product', 'Product & Safety Incidents', ['recall', 'product', 'safety', 'defect', 'injury'], [
        P('p.product.minimise', 'Minimised recall language', ['precautionary', 'minor', 'isolated', 'recall', 'no risk'], 'bias', 49,
          'Safety recalls are framed as trivial to protect the brand.',
          '"A minor precautionary update affecting isolated units."',
          'Use the regulator\'s recall classification and hazard description.'),
        P('p.product.victim', 'Customer-blaming statements', ['misuse', 'customers failed', 'user error', 'improper use'], 'bias', 27,
          'Incidents are blamed on customers without evidence.',
          '"Injuries resulted from improper use by customers."',
          'Require incident investigation findings before assigning cause.'),
      ]),
    ]),
    N('corp.finance', 'Financial Reporting', ['revenue', 'profit', 'earnings', 'investors', 'asx', 'shares', 'esg'], [
      N('corp.finance.earnings', 'Earnings & Disclosure', ['revenue', 'profit', 'earnings', 'growth', 'guidance'], [
        P('p.earn.halluc', 'Hallucinated financial figures', ['revenue', 'million', 'billion', 'grew', 'profit'], 'misinfo', 66,
          'AI-drafted releases contain figures that do not match the audited accounts.',
          '"Revenue grew 34% to $1.2 billion" (audited: 21%).',
          'Tie every figure to the audited statement line before release.'),
        P('p.earn.framing', 'Selective metric framing', ['adjusted', 'underlying', 'record', 'best ever'], 'bias', 43,
          'Favourable non-standard metrics are highlighted while statutory results are buried.',
          '"Record underlying earnings" in a year of statutory loss.',
          'Present statutory and adjusted figures together.'),
      ]),
      N('corp.finance.esg', 'ESG Claims', ['sustainable', 'carbon', 'net zero', 'green', 'esg', 'emissions'], [
        P('p.esg.greenwash', 'Greenwashing claims', ['carbon neutral', 'net zero', '100% green', 'eco-friendly', 'sustainable'], 'disinfo', 158,
          'Environmental claims overstate or lack verification.',
          '"Our products are 100% carbon neutral."',
          'Require the certification body, scope and offsets register behind each claim.'),
        P('p.esg.cert', 'Fabricated certifications', ['certified', 'accredited', 'certification', 'award'], 'disinfo', 34,
          'Claims of certifications or awards that cannot be found in the issuer\'s register.',
          '"Certified by the Global Green Standards Council."',
          'Verify certifications in the issuer\'s public register.'),
      ]),
    ]),
  ]),

  N('edu', 'Education', ['school', 'student', 'students', 'teacher', 'university', 'education', 'curriculum', 'learning'], [
    N('edu.curriculum', 'Curriculum & Teaching', ['curriculum', 'lesson', 'teaching', 'textbook', 'syllabus'], [
      N('edu.curriculum.history', 'History Teaching', ['history', 'colonial', 'war', 'indigenous', 'first nations'], [
        P('p.edu.history', 'AI-invented historical events', ['in 18', 'in 19', 'historians', 'treaty', 'battle'], 'misinfo', 81,
          'AI teaching materials include dates, events or quotes that never happened.',
          '"The 1872 Treaty of Riverbend granted land rights."',
          'Require primary-source references for every historical claim in course material.'),
        P('p.edu.erasure', 'Perspective erasure in summaries', ['settled', 'discovered', 'empty land', 'peaceful'], 'bias', 63,
          'Summaries omit First Nations perspectives or present contested history as settled.',
          '"Explorers discovered the empty land."',
          'Review materials against AIATSIS guidance and include primary community sources.'),
      ]),
      N('edu.curriculum.science', 'Science Teaching', ['science', 'biology', 'physics', 'experiment'], [
        P('p.edu.sciencemyth', 'Persisting science myths', ['10% of the brain', 'learning styles', 'myth'], 'misinfo', 54,
          'Generated lessons repeat debunked claims.',
          '"Students learn best in their preferred learning style."',
          'Cross-check against current evidence reviews before publication.'),
      ]),
    ]),
    N('edu.assessment', 'Assessment & Integrity', ['exam', 'assessment', 'grades', 'plagiarism', 'cheating', 'ai detector'], [
      N('edu.assessment.integrity', 'Academic Integrity', ['plagiarism', 'ai detector', 'cheating', 'misconduct'], [
        P('p.edu.detector', 'Over-trusted AI-detector verdicts', ['ai detector', 'detected', 'written by ai', '% ai'], 'bias', 112,
          'Detector scores are treated as proof of misconduct and disproportionately flag non-native writers.',
          '"The detector found the essay 96% AI-written."',
          'Never use detector output alone; record process evidence and allow appeal.'),
        P('p.edu.fakecite', 'Fabricated references in submissions', ['references', 'doi', 'journal', 'citation'], 'misinfo', 205,
          'AI-assisted work includes references that do not exist.',
          'Journal article with a non-resolving DOI.',
          'Resolve DOIs and catalogue entries for every reference.'),
      ]),
    ]),
  ]),

  N('sci', 'Science & Technology', ['technology', 'ai', 'artificial intelligence', 'research', 'scientists', 'study', 'tech', 'software'], [
    N('sci.ai', 'AI & Computing', ['ai', 'model', 'chatbot', 'algorithm', 'machine learning', 'llm'], [
      N('sci.ai.capability', 'AI Capability Claims', ['sentient', 'agi', 'replaces', 'accuracy', 'benchmark'], [
        P('p.ai.hype', 'Overstated AI accuracy', ['100% accurate', 'never wrong', 'replaces', 'accuracy'], 'misinfo', 140,
          'Vendors or posts claim near-perfect AI accuracy without evaluation data.',
          '"Our AI scribe is 100% accurate."',
          'Ask for the evaluation set, error rates and the population tested.'),
        P('p.ai.chatbotpromise', 'Chatbot over-commitment', ['will definitely', 'guaranteed', 'within 24 hours', 'chatbot'], 'misinfo', 96,
          'Bots promise outcomes not supported by business rules.',
          '"Your payment will definitely arrive within 24 hours."',
          'Constrain bot answers to authoritative business-rule data.'),
      ]),
      N('sci.ai.synthetic', 'Synthetic Media', ['deepfake', 'generated', 'synthetic', 'ai image', 'upscaled', 'inpainting'], [
        P('p.synth.image', 'Unlabelled AI-generated images', ['ai-generated', 'generated image', 'photo', 'realistic'], 'disinfo', 389,
          'AI images circulate as real photographs without labels or credentials.',
          'Photorealistic "news photo" with no camera metadata.',
          'Check C2PA Content Credentials and reverse-image history.'),
      ]),
    ]),
    N('sci.research', 'Research & Studies', ['study', 'research', 'scientists', 'journal', 'paper'], [
      N('sci.research.claims', 'Study Claims', ['study shows', 'scientists say', 'research proves', 'peer-reviewed'], [
        P('p.sci.preprint', 'Preprint presented as settled science', ['preprint', 'new study', 'proves', 'breakthrough'], 'misinfo', 117,
          'Unreviewed preprints are reported as proven findings.',
          '"New study proves coffee prevents dementia."',
          'Record peer-review status and sample size with any cited study.'),
        P('p.sci.fakestudy', 'Non-existent studies', ['harvard study', 'study found', 'researchers found'], 'disinfo', 88,
          'Claims cite studies that cannot be located.',
          '"A Harvard study found 9 in 10…" with no paper.',
          'Locate the DOI or institutional release before trusting the claim.'),
      ]),
    ]),
  ]),

  N('culture', 'Culture & Heritage', ['history', 'heritage', 'archive', 'museum', 'culture', 'historical', 'community', 'photo'], [
    N('culture.heritage', 'Heritage & Archives', ['archive', 'archival', 'heritage', 'historical', 'museum', 'collection'], [
      N('culture.heritage.photo', 'Historical Photographs', ['photo', 'photograph', '1956', 'flood', 'restored', 'upscaled', 'colourised'], [
        P('p.heritage.upscale', 'AI restoration that erases context', ['restored', 'upscaled', 'ai-restored', 'enhanced', 'only', 'sign'], 'disinfo', 52,
          'Generative upscaling alters signage, faces or captions in historical photos, rewriting who was present.',
          'AI-restored 1956 flood photo where a bilingual relief sign now reads "Riverbend residents only".',
          'Compare against the master scan and its archival control record before reuse.'),
        P('p.heritage.caption', 'Mis-captioned archival images', ['caption', 'shows', 'pictured', 'circa'], 'misinfo', 69,
          'Real archival images reused with wrong dates, places or people.',
          '1974 photo captioned as 1956.',
          'Check the item\'s catalogue metadata (date, place, creator).'),
      ]),
      N('culture.heritage.records', 'Archival Records', ['records', 'register', 'register book', 'archive', 'catalogue'], [
        P('p.heritage.fakecite', 'Fabricated archival citations', ['series', 'item', 'box', 'archives reference'], 'disinfo', 31,
          'Non-existent series or item numbers are cited to support a historical claim.',
          '"See NAA series Z9999, item 14."',
          'Resolve every citation in the archive\'s catalogue.'),
      ]),
    ]),
    N('culture.media', 'Media & Language', ['news', 'media', 'article', 'language', 'translation', 'community groups'], [
      N('culture.media.translation', 'Translation & Language', ['translation', 'translated', 'language', 'chinese', 'italian', 'arabic'], [
        P('p.media.mistrans', 'Machine-translation distortion', ['translated', 'translation', 'said in'], 'misinfo', 77,
          'Machine translation changes the meaning of community statements.',
          'A community leader\'s cautious statement translated as a demand.',
          'Keep the source-language original with the record; have key quotes checked by a translator.'),
      ]),
      N('culture.media.viral', 'Viral Articles & Posts', ['viral', 'shared', 'post', 'facebook', 'community groups', 'article'], [
        P('p.media.lookalike', 'Look-alike local news sites', ['local news', 'reported', 'article', 'shared'], 'disinfo', 146,
          'Sites mimic local newspapers to launder opinion as news.',
          '"Riverbend Daily" with no masthead history.',
          'Check publisher identity and domain history.'),
      ]),
    ]),
  ]),

  N('env', 'Environment & Energy', ['climate', 'environment', 'energy', 'emissions', 'weather', 'renewable', 'bushfire'], [
    N('env.climate', 'Climate', ['climate', 'temperature', 'warming', 'weather', 'bushfire', 'flood'], [
      N('env.climate.data', 'Climate Data', ['temperature', 'record', 'data', 'warming', 'cooling'], [
        P('p.env.cherry', 'Cherry-picked climate data', ['cold winter', 'cooling', 'hoax', 'record'], 'disinfo', 263,
          'Short or local data windows are used to dispute long-term trends.',
          '"Coldest July in 20 years proves warming is a hoax."',
          'Cite the full BoM record and long-term trend.'),
      ]),
      N('env.climate.disaster', 'Disasters', ['bushfire', 'flood', 'arson', 'cyclone'], [
        P('p.env.arson', 'Disaster-cause disinformation', ['arson', 'caused', 'deliberately lit', 'bushfire'], 'disinfo', 132,
          'Disasters are attributed to a single cause (e.g. mass arson) against official findings.',
          '"Arsonists started most of the fires."',
          'Reference official inquiry findings.'),
      ]),
    ]),
    N('env.energy', 'Energy', ['energy', 'electricity', 'power bills', 'renewables', 'solar', 'wind', 'nuclear'], [
      N('env.energy.prices', 'Energy Prices', ['bills', 'price', 'cost', 'tariff'], [
        P('p.energy.bills', 'Misattributed bill increases', ['bills', 'because of', 'renewables', 'price rise'], 'misinfo', 104,
          'Price rises are attributed to one factor, ignoring the regulator\'s breakdown.',
          '"Your bills doubled because of solar farms."',
          'Use the regulator\'s cost-stack breakdown.'),
      ]),
    ]),
  ]),
];

/* ───────────── Tree helpers ───────────── */

const INDEX = new Map();
const PARENT = new Map();
(function index(nodes, parent) {
  for (const n of nodes) {
    INDEX.set(n.id, n);
    PARENT.set(n.id, parent);
    if (n.children) index(n.children, n.id);
  }
})(TAXONOMY, null);

export const getNode = (id) => INDEX.get(id);
export const childrenOf = (id) => (id ? INDEX.get(id)?.children || [] : TAXONOMY);
export const isChildOf = (childId, parentId) => PARENT.get(childId) === parentId;

function allKeywords(node) {
  return [...node.kw, ...(node.children || []).flatMap(allKeywords)];
}

// Local, deterministic matcher: keyword overlap, own keywords weighted above descendants'.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Short keywords (e.g. "ai", "gp") must match whole words so "said" does not count as "ai".
function hit(text, k) {
  const kw = k.toLowerCase();
  return kw.length <= 4 && /^[a-z0-9]+$/.test(kw) ? new RegExp(`\\b${escape(kw)}\\b`).test(text) : text.includes(kw);
}

export function scoreCandidates(text, candidates) {
  const t = text.toLowerCase();
  const raw = candidates.map((n) => {
    const own = n.kw.filter((k) => hit(t, k)).length;
    const desc = n.children ? allKeywords(n).filter((k) => hit(t, k)).length - own : 0;
    return { id: n.id, raw: own * 2 + desc };
  });
  const total = raw.reduce((s, r) => s + r.raw + 0.4, 0);
  return raw.map((r) => ({ id: r.id, raw: r.raw, pct: Math.round(((r.raw + 0.4) / total) * 100) }));
}

// Walks down the taxonomy, choosing the best-scoring child at each layer; stops when nothing matches.
export function localMatch(text) {
  const levels = [];
  let parent = null;
  for (let depth = 0; depth < LAYER_NAMES.length; depth++) {
    const candidates = childrenOf(parent);
    if (!candidates.length) break;
    const scores = scoreCandidates(text, candidates);
    const best = scores.reduce((a, b) => (b.raw > a.raw ? b : a));
    if (best.raw === 0) break;
    levels.push({ chosenId: best.id, scores, reason: null });
    parent = best.id;
  }
  return levels;
}

// Compact text form of the tree for the model prompt.
export function taxonomyOutline() {
  const lines = [];
  (function walk(nodes, depth) {
    for (const n of nodes) {
      lines.push(`${'  '.repeat(depth)}${n.id} | ${n.label}${n.pattern ? ` | pattern: ${n.pattern}` : ''}`);
      if (n.children) walk(n.children, depth + 1);
    }
  })(TAXONOMY, 0);
  return lines.join('\n');
}
