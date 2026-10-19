import assert from 'node:assert/strict';
import { readBankHandoff, HANDOFF_KEY } from '../src/handoff.js';
const entries=new Map();const storage={getItem:k=>entries.get(k)||null};
assert.equal(readBankHandoff(storage),null);
entries.set(HANDOFF_KEY,JSON.stringify({version:1,id:'bank-review-test',createdAt:'2026-10-19T00:00:00Z',paragraphs:['original one','original two'],report:{claims:[{verdict:'not_found',evidence:'Missing source'}]}}));
const doc=readBankHandoff(storage);assert.equal(doc.id,'bank-review-test');assert.deepEqual(doc.segments.map(s=>s.text),['original one','original two']);assert.equal(doc.seal,null);assert.deepEqual(doc.checklist,{});
entries.set(`${HANDOFF_KEY}.state`,JSON.stringify({...doc,segStatus:{s1:'fixed'}}));assert.equal(readBankHandoff(storage).segStatus.s1,'fixed');
entries.set(HANDOFF_KEY,'malformed');assert.equal(readBankHandoff(storage),null);
console.log('PASS: handoff preserves original text, starts unapproved, restores same-file progress, rejects malformed data');

entries.set(HANDOFF_KEY,JSON.stringify({version:1,scenario:'hospital',id:'hospital-review-test',createdAt:'2026-10-19T00:00:00Z',paragraphs:['Patient is taking metoprolol 500 mg.','ECG showed normal results.'],report:{claims:[]}}));
const hospital=readBankHandoff(storage);assert.equal(hospital.handoff.scenario,'hospital');assert.equal(hospital.category,'Clinical');assert(hospital.segments[0].revised.includes('clinician must verify'));assert(hospital.segments[1].revised.includes('verification is pending'));console.log('PASS: hospital handoff preserves clinical uncertainty');
