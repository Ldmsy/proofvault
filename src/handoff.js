import { INITIAL_DOCS } from './data.js';
import { prepareDoc } from './lib.js';
export const HANDOFF_KEY = 'proofvault.bank-review.v1';
export function readBankHandoff(storage) {
  try {
    const packet = JSON.parse(storage.getItem(HANDOFF_KEY));
    if (!packet || packet.version !== 1 || typeof packet.id !== 'string' || !['bank-review-','hospital-review-'].some(prefix=>packet.id.startsWith(prefix)) || !Array.isArray(packet.paragraphs) || packet.paragraphs.length !== 2 || packet.paragraphs.some(p => typeof p !== 'string' || p.length > 4000) || !Array.isArray(packet.report?.claims)) return null;
    const hospital = packet.scenario === 'hospital';
    const base = INITIAL_DOCS.find(d => d.id === (hospital ? 'doc-4092' : 'doc-pr1016'));
    const evidence = packet.report.claims.filter(c => c.verdict !== 'match').map(c => c.evidence).join(' ');
    const segments = packet.paragraphs.map((text, i) => ({id:`s${i+1}`,section:hospital?(i?'Unlinked ECG result':'Medication discrepancy'):(i?'Attributed endorsement':'Investigation scope'),text,
      revised:hospital?(i?'ECG result is not available in the linked sample log. Clinician verification is pending.':'Medication entry requires reconciliation: the draft states 500 mg; the linked sample dispense record states 50 mg. A clinician must verify the current medication before finalising the note.') : i?'The attributed endorsement has been removed pending source verification.':'Exfiltration cannot be ruled out; approximately 12.4k customer records are in scope. The investigation is ongoing.',
      flag:{type:'misinfo',severity:'High',title:hospital?(i?'Verify the linked test result':'Reconcile the medication entry'):(i?'Check the attributed endorsement':'Reconcile the investigation count'),principle:'Claims must be supported by source records',standards:[],rationale:'Human review is required before this draft can be archived. No publication is authorised.',evidence,confidence:0}}));
    const doc = prepareDoc({...base,id:packet.id,title:hospital?'Hospital consultation note — review draft':'Aurelia customer update — review draft',channel:hospital?'Hospital experience → clinical review':'Banking experience → IM review',ingestedAt:packet.createdAt,owner:hospital?'Clinical records reviewer · clinician approval pending':'Communications Lead · release approval pending',retention:'To be appraised by the records manager',segments,citations:[],c2pa:{...base.c2pa,manifest:'None — fictional scenario',model:'Deterministic source check; pre-authored suggested revisions',unsigned:true},handoff:{scenario: hospital?'hospital':'bank',originalParagraphs:packet.paragraphs,report:packet.report,status:'release-approval-pending'}});
    doc.audit=[{at:packet.createdAt,actor:hospital?'Hospital scenario':'Banking scenario',text:'Submitted original draft and source-check report for human review. Fictional data; no customer message sent.'}];
    // Only restore state written for this same tab and document. This is demo continuity, not authentication.
    const saved=JSON.parse(storage.getItem(`${HANDOFF_KEY}.state`));
    if(saved?.id===doc.id && saved.handoff && Array.isArray(saved.segments)) return saved;
    return doc;
  } catch {return null;}
}

export function hospitalStarter() {
 const packet={version:1,scenario:'hospital',id:'hospital-review-starter',createdAt:new Date().toISOString(),paragraphs:['Patient is taking metoprolol 500 mg.','ECG showed normal results.'],report:{claims:[]}};
 return readBankHandoff({getItem:key=>key===HANDOFF_KEY?JSON.stringify(packet):null});
}
