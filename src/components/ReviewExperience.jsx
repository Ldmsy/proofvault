import { useState } from 'react';
import { REVIEWERS } from '../data.js';
import { workingText, RESOLVED, segStatus } from '../lib.js';
import './ReviewExperience.css';
import ReviewJourney from './ReviewJourney.jsx';

export default function ReviewExperience({doc,onUpdateRevision,onToggleCheck,onApprove,sealing,reviewerId,setReviewerId,onDetailed,error}) {
 const [index,setIndex]=useState(()=>Math.min(doc.segments.filter(s=>RESOLVED.includes(segStatus(doc,s.id))).length,doc.segments.length));
 const [edit,setEdit]=useState(null),[result,setResult]=useState(null),[checking,setChecking]=useState(false),[verifyError,setVerifyError]=useState('');
 const seg=doc.segments[index]; const done=!!doc.seal; const final=index>=doc.segments.length;
 const checks=[['authenticity','I checked the claims against the displayed sources.'],['bias','I reviewed the wording for unsupported reassurance.'],['metadata','I understand this is a fictional draft, with no validated C2PA credentials.'],['value','I am preserving a review draft; release approval and retention appraisal remain separate.']];
 async function verify(tamper){setChecking(true);setVerifyError('');try{const text=doc.seal.sealedText;const res=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(tamper?{tamper:{archiveId:doc.seal.archiveId,text:(text[0]==='X'?'Y':'X')+text.slice(1)}}:{})});const data=await res.json();if(!res.ok)throw Error(data.error||'Verification failed');setResult({...data,simulation:tamper});}catch(e){setVerifyError(e.message)}finally{setChecking(false)}}
 return <main className="review-ad">
 <div className="ra-note">FICTIONAL BANKING DEMO · No message is sent · Not affiliated with Commonwealth Bank</div>
 <header><a href="/bank.html" className="ra-brand"><i/>Aurelia</a><span>Powered by ProofVault</span><button onClick={onDetailed}>Detailed workspace ↗</button></header>
 <div className="ra-layout"><section className="ra-story">
 <div className="ra-kicker">FOLLOW THE FILE · ONE STEP AT A TIME</div>
 <h1>{done?<>A decision.<br/>A record.<br/><em>A trace.</em></>:final?<>Ready to<br/><em>keep this version?</em></>:<>A small claim.<br/><em>A real consequence.</em></>}</h1>
 <p className="ra-lead">{done?'Your reviewed version is signed. Now see what happens when one character changes.':final?'You have handled both findings. Preserve this internal draft before its separate release review.':`You are reviewing a bank’s customer update. ${index===0?'Before saying nobody is affected, check the investigation record.':'Before quoting an endorsement, make sure the source supports it.'}`}</p>
 <div className="ra-track">{['Evidence','Review','Confirm','Seal'].map((s,i)=><span key={s} className={i<=(done?3:final?2:1)?'active':''}>{String(i+1).padStart(2,'0')} {s}</span>)}</div>
 <div className="ra-card" aria-live="polite">
 {!done&&!final&&<><div className="ra-kicker">FINDING {index+1} OF {doc.segments.length}</div><h2>{index===0?'“No records affected.” Really?':'Who actually said that?'}</h2><blockquote>{seg.text}</blockquote>
 <details><summary>See the source behind this finding</summary><p>{seg.flag.evidence}</p><p>Sample register only. Missing evidence does not prove a statement is false.</p></details>
 <label className="ra-edit-label" htmlFor="review-wording">Suggested revision · edit before accepting</label><textarea id="review-wording" value={edit??doc.customRevisions?.[seg.id]??seg.revised} onChange={e=>setEdit(e.target.value)} rows={4}/>
 <button className="ra-main" disabled={!(edit??doc.customRevisions?.[seg.id]??seg.revised).trim()} onClick={()=>{onUpdateRevision(seg.id,(edit??doc.customRevisions?.[seg.id]??seg.revised).trim());setIndex(index+1);setEdit(null)}}>Accept wording & continue →</button><p className="ra-small">Pre-authored suggestion. You make the decision.</p></>}
 {!done&&final&&<><div className="ra-kicker">REVIEW COMPLETE · RELEASE APPROVAL PENDING</div><h2>One final check.</h2>{checks.map(([key,label])=><label className="ra-check" key={key}><input type="checkbox" checked={!!doc.checklist[key]} onChange={()=>onToggleCheck(key)}/>{label}</label>)}<label className="ra-edit-label" htmlFor="ra-reviewer">Demo reviewer</label><select id="ra-reviewer" value={reviewerId} onChange={e=>setReviewerId(e.target.value)}>{REVIEWERS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select><button className="ra-main" disabled={sealing||!checks.every(([k])=>doc.checklist[k])} onClick={onApprove}>{sealing?'Signing this version…':'Sign & preserve review draft →'}</button><button className="ra-back" onClick={()=>{setIndex(0);setEdit(null)}}>Review the wording again</button></>}
 {done&&<><div className="ra-kicker">SIGNED REVIEW DRAFT</div><h2>{result?.simulation&&!result.ok?'The change was detected.':'This version has a signature.'}</h2><p>{result?(result.ok?'Stored chain verified intact.':`Verification detected a break at entry #${result.brokenAt}.`):'Try changing a character in a temporary copy.'}</p><button className="ra-main" disabled={checking} onClick={()=>verify(!result?.simulation)}>{checking?'Checking…':result?.simulation?'Verify the original →':'Try a one-character edit →'}</button><p className="ra-small">Simulation only. Your stored record is unchanged.</p><details><summary>View signature details</summary><p className="ra-mono">{doc.seal.archiveId}<br/>SHA-256 {doc.seal.hash}<br/>Ed25519 {doc.seal.signature}</p></details></>}
 {(error||verifyError)&&<p role="alert" className="ra-error">{error||verifyError}</p>}
 </div></section>
 <ReviewJourney stage={done?4:sealing?3:final?2:index} broken={!!result?.simulation&&!result?.ok} docId={doc.id}/></div>
 <footer>Real source checks and signatures. Fictional records. Progress stays in this browser tab; this is not a multi-user approval service.</footer></main>
}
