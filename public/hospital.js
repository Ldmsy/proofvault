const $=id=>document.getElementById(id);
const paragraphs=['Patient is taking metoprolol 500 mg.','ECG showed normal results.'];
const draft=paragraphs.join(' ');
const layers=[['Draft','AI-generated consultation note'],['Evidence','Compare with registered sources'],['Human review','Resolve claims; keep uncertainty'],['Digital seal','Sign the exact reviewed version'],['Record chain','Check for changes after signing']];
let step=0,report=null,seal=null,busy=false,verified=null,changed=false;
$('machine').innerHTML=layers.map((l,i)=>`<div class="plate ${i===0?'active':''}" style="--i:${i}"><span class="num">0${i+1} / PROOFVAULT</span><strong>${l[0]}</strong><small>${l[1]}</small></div>`).join('');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function post(route,data){const r=await fetch('/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error||`Request failed (${r.status})`);return j;}
const labels=['01 / The draft','02 / Follow the evidence','03 / Make the call','04 / Preserve the reviewed version','05 / Test the record'];
function render(){
 $('stageLabel').textContent=labels[step];document.querySelectorAll('.step').forEach((e,i)=>e.classList.toggle('on',i<=step));
 document.querySelectorAll('.plate').forEach((e,i)=>{e.classList.toggle('active',i===step);e.classList.toggle('bad',i===4&&changed)});
 $('machine').classList.toggle('expanded',step>0);$('expand').textContent=step>0?'Collapse the layers':'Explore the five layers';
 $('back').hidden=step!==4;$('next').disabled=busy;
 const names=['A confident draft. An open question.','Show the evidence, not a confidence score.','The decision stays with a person.','A record of exactly what was reviewed.','A small edit leaves a visible trace.'];
 const notes=['You are reviewing a synthetic hospital note. No clinical system is connected.','Live rules compare the draft with the fictional register. Read the sources before making a decision.','Remove unsupported reassurance. Preserve uncertainty. Route the draft to its accountable owner.','Real Ed25519 signing, using a server-managed demo key. This does not authenticate a human identity.','A tamper simulation changes a copy only. The stored ledger remains untouched.'];
 $('sceneTitle').textContent=names[step];$('sceneText').textContent=notes[step];
 if(step===0){$('panel').innerHTML=`<div class="meta">CASE DEMO-4092 · Consultation note · AI draft</div><h2>Two claims. One patient record.</h2><div class="quote">Patient is taking <strong>metoprolol 500 mg</strong>.</div><p>ECG showed normal results.</p><span class="pill red">Awaiting evidence review</span>`;$('next').textContent='① Check this document →';$('helper').textContent='First check the evidence. Then send this same file to the shared review queue.';}
 if(step===1){document.querySelector('.document-scene').classList.add('checked');$('med-evidence').hidden=false;$('ecg-evidence').hidden=false;$('document-status').textContent='2 issues to review';$('document-instruction').textContent='② The issues are marked on your document. Review them before locking this version.';const findings=report.claims.filter(c=>c.verdict!=='match');$('panel').innerHTML=`<span class="pill red">${findings.length} source-check findings</span><h2 style="margin-top:12px">The records tell a different story.</h2><div class="source"><b>MHR-PBS · Synthetic dispense record</b>The sample dispense record lists <strong>50 mg</strong>. This is a record discrepancy, not a dosing recommendation.</div><div class="source"><b>ECG device log · Synthetic source</b>No ECG result is linked in the sample device log. A normal result cannot be established from these records.</div><details><summary>Inspect live API findings</summary><div class="findings">${findings.map(c=>`<div class="finding"><strong>${escape(c.verdict)} · ${escape(c.claim||c.subject||c.value||'Source check')}</strong>${escape(c.evidence)}</div>`).join('')}</div></details>`;$('next').textContent='② Review & fix this document →';$('helper').textContent='A missing linked result does not prove a test never happened. A clinician must reconcile the record.';}

}
$('next').onclick=async()=>{if(busy)return;busy=true;$('next').disabled=true;$('error').textContent='';const old=$('next').textContent;$('next').textContent='Working…';try{
 if(step===0){document.querySelector('.document-scene').classList.add('scanning');report=await post('check-sources',{text:draft,useModel:false});if(!report.claims||!report.grounding)throw Error('The source-check response was incomplete. Please retry.');step=1;}
 else if(step===1){
 const packet={version:1,scenario:'hospital',id:'hospital-review-'+crypto.randomUUID(),createdAt:new Date().toISOString(),paragraphs,report};
 sessionStorage.setItem('proofvault.bank-review.v1',JSON.stringify(packet));
 location.href='/?review=hospital';return;
 }
 document.querySelector('.document-scene').classList.remove('scanning');busy=false;render();
 }catch(e){document.querySelector('.document-scene').classList.remove('scanning');busy=false;$('next').disabled=false;$('next').textContent=old;$('error').textContent=e.message+' No clinical record has been changed.';}};
$('back').onclick=()=>{step=0;report=null;seal=null;verified=null;changed=false;$('error').textContent='';render()};
$('expand').onclick=()=>{const expanded=$('machine').classList.toggle('expanded');$('expand').textContent=expanded?'Collapse the layers':'Explore the five layers'};
render();

try { if (JSON.parse(sessionStorage.getItem('proofvault.bank-review.v1'))?.id) { $('back').hidden=false; $('back').textContent='Resume submitted review →'; $('back').onclick=()=>location.href='/?review=hospital'; } } catch {}
