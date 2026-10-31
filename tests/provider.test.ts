import test from 'node:test';
import assert from 'node:assert/strict';
import {assess,ruleAssessment} from '../backend/triage.ts';
const input={citizen_name:'Synthetic',description:'Open manhole on the busy road',location:'Lake Road junction Chennai'};
test('mocked Gemini success, malformed output, and network outage use one pipeline',async()=>{
 const originalFetch=globalThis.fetch,oldProvider=process.env.AI_PROVIDER,oldKey=process.env.GEMINI_API_KEY;
 process.env.AI_PROVIDER='gemini';process.env.GEMINI_API_KEY='synthetic-test-key-not-real';
 try{
  const payload={...ruleAssessment(input),confidence:0.8,summary:'Synthetic model response for contract test'};
  globalThis.fetch=async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(payload)}],role:'model'},finishReason:'STOP'}]}),{status:200,headers:{'Content-Type':'application/json'}});
  const model=await assess(input);assert.equal(model.source,'gemini');assert.equal(model.summary,payload.summary);
  globalThis.fetch=async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:'{"severity":99}'}],role:'model'}}]}),{status:200,headers:{'Content-Type':'application/json'}});
  const malformed=await assess(input);assert.equal(malformed.source,'rules');assert.match(malformed.fallback_reason!,/invalid data/);
  globalThis.fetch=async()=>{throw Error('Synthetic provider outage');};
  const unavailable=await assess(input);assert.equal(unavailable.source,'rules');assert.equal(unavailable.immediate_hazard,true);assert.match(unavailable.fallback_reason!,/request failed/);
 }finally{globalThis.fetch=originalFetch;if(oldProvider===undefined)delete process.env.AI_PROVIDER;else process.env.AI_PROVIDER=oldProvider;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
