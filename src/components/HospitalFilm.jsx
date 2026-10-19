import { useEffect, useState } from 'react';
import './HospitalFilm.css';
const scenes=[
 ['AI draft','Check before this becomes a trusted record.','Metoprolol 500 mg','DRAFT'],
 ['Check the evidence','The sample dispense record says 50 mg. A clinician must reconcile the difference.','Metoprolol 500 mg','CONFLICT FOUND'],
 ['Human confirmation','Illustrated clinician review: record the discrepancy and the need for confirmation.','Medication entry reconciled for this illustrated review.','REVIEWED'],
 ['Sign the version','Bind the reviewed text to a verifiable signature. A signature does not prove clinical correctness.','Medication entry reconciled for this illustrated review.','SIGNED VERSION'],
 ['One character changed','A copy is edited after signing. Its content hash no longer matches.','Medication entry reconciled for this illustrated review!','VERIFICATION FAILED'],
];
export default function HospitalFilm(){
 const [playing,setPlaying]=useState(false),[elapsed,setElapsed]=useState(0),[opened,setOpened]=useState(false);
 useEffect(()=>{if(!playing)return;const start=performance.now();let frame;function tick(now){const t=Math.min(10000,now-start);setElapsed(t);if(t<10000)frame=requestAnimationFrame(tick);else setPlaying(false)}frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[playing]);
 const step=Math.min(4,Math.floor(elapsed/2000));const scene=scenes[step];
 function play(){setElapsed(0);setOpened(true);setPlaying(true)}
 return <section className="hf"><div className="hf-intro"><div><small>THE WORKFLOW IN 10 SECONDS</small><h2>One hospital note. From draft to signed record.</h2><p>See what we check—and what the signature protects.</p></div><button onClick={play} disabled={playing}>{playing?'Playing…':opened?'Replay · 10 sec':'▶ Watch · 10 sec'}</button></div>{opened&&<div className="hf-player" aria-label="Illustrative ten-second hospital document workflow">
 <div className="hf-progress"><i style={{width:`${elapsed/100}%`}}/></div><div className="hf-stepbar">{['Draft','Check','Confirm','Sign','Verify'].map((s,i)=><span key={s} className={i===step?'active':i<step?'complete':''}>{i+1} · {s}</span>)}</div>
 <div className="hf-stage"><article className={`hf-document hf-state-${step}`}><div className="hf-letterhead">✚ NORTHSIDE HOSPITAL <span>SIMULATED RECORD</span></div><h3>Consultation note</h3><small>DEMO-4092 · Fictional patient</small><div className="hf-line"/><div className="hf-line short"/><div className="hf-sentence" key={step}>{scene[2]}</div>{step===1&&<div className="hf-evidence">SOURCE RECORD → 50 mg<br/><small>Different value. Clinical confirmation required.</small></div>}{step>=3&&<div className="hf-signature">◈ Signed review version <small>Illustrative seal</small></div>}<div className={`hf-stamp ${step===4?'failed':''}`} key={'stamp'+step}>{step===4?'✕ ':step>=2?'✓ ':''}{scene[3]}</div></article>
 <div className="hf-caption" key={'caption'+step}><small>0{step+1} / 05</small><h3>{scene[0]}</h3><p>{scene[1]}</p>{step===4&&<div className="hf-comparison"><span>Signed text ends with <b>.</b></span><span>Edited copy ends with <b>!</b></span><strong>Different content → integrity check fails</strong></div>}</div></div>
 <div className="hf-controls"><span>Illustrative animation · no clinical approval or API signing is performed during playback.</span><button onClick={()=>{setPlaying(false);setOpened(false)}}>Close</button></div></div>}</section>
}
