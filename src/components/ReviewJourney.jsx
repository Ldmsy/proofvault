import './ReviewJourney.css';
const stages = [
 ['Check the number','Compare the draft with the investigation record.'],
 ['Trace the quote','Follow the attributed words back to a source.'],
 ['Human decision','Confirm the wording and the review context.'],
 ['Sign this version','The server signs the exact reviewed text.'],
 ['Test the record','Change a copy. Check the signature. Keep the original.'],
];
function Scene({stage,broken}) {
 if(stage===0) return <g><rect x="-90" y="-49" width="76" height="98" rx="8"/><rect x="14" y="-49" width="76" height="98" rx="8"/><text x="-52" y="-25">DRAFT</text><text x="52" y="-25">SOURCE</text><text className="j-value" x="-52" y="13">0k</text><text className="j-value" x="52" y="13">12.4k</text><path className="j-scan" d="M-94 30H94"/><text x="0" y="78">COMPARE THE COUNT</text></g>;
 if(stage===1) return <g><rect x="-85" y="-50" width="170" height="102" rx="8"/><text className="j-value" x="0" y="-12">“industry-leading”</text><path d="M-62 12H62M-62 25H33"/><circle className="j-search" cx="36" cy="29" r="22"/><path className="j-search" d="M53 45L70 62"/><text x="0" y="82">LOOK FOR THE ORIGINAL</text></g>;
 if(stage===2) return <g><rect x="-65" y="-60" width="130" height="124" rx="9"/>{[-30,0,30].map((y,i)=><g key={y}><rect x="-44" y={y-9} width="18" height="18" rx="3"/><path className={`j-check j-delay-${i}`} d={`M-41 ${y}l5 5 9-11`}/><path d={`M-12 ${y}H43`}/></g>)}<text x="0" y="87">A PERSON MAKES THE CALL</text></g>;
 if(stage===3) return <g><rect x="-57" y="-25" width="114" height="85" rx="12"/><path d="M-31-25v-18a31 31 0 0162 0v18"/><circle cx="0" cy="10" r="8"/><path d="M0 18V34"/><circle className="j-sign" cx="0" cy="8" r="91"/><text x="0" y="88">SHA-256 + Ed25519</text></g>;
 return <g>{[-65,0,65].map(x=><g key={x}><circle cx={x} cy="0" r="24"/><path d={`M${x-8} 0l6 6 12-14`}/></g>)}<path className={broken?'j-broken':'j-flow'} d="M-41 0H-24M24 0H41"/><text x="0" y="65">{broken?'CHANGE DETECTED':'LINKED TO THE ORIGINAL'}</text></g>;
}
export default function ReviewJourney({stage,broken,docId}) {
 return <aside className="journey"><div className="journey-top">PROVENANCE MAP <span>{stage+1} / 5</span></div><div className="journey-window" aria-label={`Current stage: ${stages[stage][0]}`}><svg viewBox="0 0 480 480" role="img" aria-label={stages[stage][1]}><defs><linearGradient id="journey-line" x2="0" y2="1"><stop stopColor="#d9d3f0"/><stop offset="1" stopColor="#8a7cdc"/></linearGradient></defs><g className="journey-camera" style={{transform:`translateY(${-stage*380}px)`}}><path className="journey-spine" d="M240 240V1760"/>{stages.map(([title],i)=><g key={title} transform={`translate(240 ${240+i*380})`} className={`journey-node ${i===stage?'current':''} ${i<stage?'complete':''} ${broken&&i===4?'broken':''}`}><circle className="node-halo" r="156"/><circle className="node-disc" r="140"/><g className="node-scene"><Scene stage={i} broken={broken}/></g><text className="node-number" x="0" y="-111">0{i+1}</text></g>)}</g></svg></div><div className="journey-caption" key={stage}><h2>{stages[stage][0]}</h2><p>{stages[stage][1]}</p><div className="journey-dots" aria-label="Workflow progress">{stages.map(([s],i)=><span key={s} className={i<=stage?'passed':''} title={s}/>)}</div><small>Complete the step on the left to follow this file to its next stop.</small><code>{docId}</code></div></aside>
}
