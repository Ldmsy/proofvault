import assert from 'node:assert/strict';
import { readBankHandoff, HANDOFF_KEY } from '../src/handoff.js';
const entries=new Map();const storage={getItem:k=>entries.get(k)||null};
assert.equal(readBankHandoff(storage),null);
entries.set(HANDOFF_KEY,JSON.stringify({version:1,id:'bank-review-test',createdAt:'2026-10-19T00:00:00Z',paragraphs:['original one','original two'],report:{claims:[{verdict:'not_found',evidence:'Missing source'}]}}));
const doc=readBankHandoff(storage);assert.equal(doc.id,'bank-review-test');assert.deepEqual(doc.segments.map(s=>s.text),['original one','original two']);assert.equal(doc.seal,null);assert.deepEqual(doc.checklist,{});
entries.set(`${HANDOFF_KEY}.state`,JSON.stringify({...doc,segStatus:{s1:'fixed'}}));assert.equal(readBankHandoff(storage).segStatus.s1,'fixed');
entries.set(HANDOFF_KEY,'malformed');assert.equal(readBankHandoff(storage),null);
console.log('PASS: handoff preserves original text, starts unapproved, restores same-file progress, rejects malformed data');
