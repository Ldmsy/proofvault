import assert from 'node:assert/strict';
import { checkText } from '../server/sourceCheck.js';
const result=await checkText('Our review found 0k customer records in scope. The Australian Cyber Security Centre has praised Aurelia\'s swift response as "industry-leading".', {useModel:false});
assert(result.claims.some(c=>c.verdict==='number_mismatch'));
assert(result.claims.some(c=>c.verdict==='not_found'));
assert(!JSON.stringify(result).includes('Infinity'));
console.log('PASS: banking fixture finds the numeric conflict and unregistered quote; zero comparison remains readable.');
