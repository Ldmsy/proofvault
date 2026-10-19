import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handleCheckSources } from '../server/sourceCheck.js';
let reply = '{"claims":["Patient takes metoprolol 500 mg twice daily."]}', received;
const server = createServer(async (req,res) => { let body=''; for await(const c of req)body+=c;received=JSON.parse(body);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({id:'msg_test',type:'message',role:'assistant',model:'test-model',content:[{type:'text',text:reply}],stop_reason:'end_turn',usage:{input_tokens:1,output_tokens:1}})); });
await new Promise(r=>server.listen(0,'127.0.0.1',r));
process.env.ANTHROPIC_API_KEY='test-only';process.env.ANTHROPIC_BASE_URL=`http://127.0.0.1:${server.address().port}`;process.env.CLAUDE_MODEL='test-model';
try {
 const result=await handleCheckSources({text:'A clinical note.',useModel:true});assert.equal(result.body.extraction,'rules+model');assert.equal(received.model,'test-model');assert(!received.output_config);assert(result.body.claims.some(c=>c.verdict==='number_mismatch'&&c.via==='model'));
 reply='{"claims":[123]}';const malformed=await handleCheckSources({text:'A clinical note.',useModel:true});assert.equal(malformed.body.extraction,'rules (model unavailable)');assert.equal(malformed.body.claims.length,0);
 delete process.env.ANTHROPIC_API_KEY;delete process.env.ANTHROPIC_AUTH_TOKEN;
 assert.equal((await handleCheckSources({text:'A clinical note.',useModel:true})).body.extraction,'rules');console.log('PASS: gateway model override, validated extraction, rule verdicts, malformed fallback, no-key fallback');
} finally {server.close();}
