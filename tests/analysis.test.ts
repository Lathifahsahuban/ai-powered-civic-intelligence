import test from 'node:test';
import assert from 'node:assert/strict';
import {distanceMeters,detectRecurrence,recompute,prioritize,rebuildMatches} from '../backend/analysis.ts';
import {ruleAssessment,validateModel} from '../backend/triage.ts';
import {validateInput} from '../backend/validation.ts';
import type {StoredIncident as Incident,ReportInput} from '../src/types.ts';
const input:ReportInput={description:'Heavy waterlogging blocks Lake Road junction',location:'Lake Road junction Chennai',citizen_name:'Synthetic',ward:'42',reporter_id:'reporter-one',lat:13,lng:80};
function incident(id=1,changes:Partial<Incident>={}):Incident {
 const now=new Date().toISOString();
 return {id,ref_code:`TEST-${id}`,created:now,recorded_at:now,occurred_at:now,citizen_name:input.citizen_name,photo:'',description:input.description,location:input.location,ward:'42',duration:'',impact:'',result:ruleAssessment(input),assessment_status:'complete',review_needed:true,reviewed:false,consensus_count:0,confirmation_ids:[],reporter_id:'reporter-one',status:'reported',stage:1,lat:13,lng:80,user_submitted:true,reviews:[],recurrence:{kind:'new',event_id:id,recurrence_count:0,previous_ids:[],evidence:[],match_method:'none'},priority:{level:'medium',score:0,reasons:[]},...changes};
}
test('haversine works including equator and identical points',()=>{assert.equal(distanceMeters({lat:0,lng:0},{lat:0,lng:0}),0);assert.ok(Math.abs(distanceMeters({lat:0,lng:0},{lat:0,lng:1})-111195)<10);});
test('all ten topics classified with clear fallback provenance',()=>{
 for(const [text,category] of [['Flooding covers the road','waterlogging_flooding'],['Blocked drain overflowing with sewage','blocked_drain_sewage'],['Garbage bins overflowing','garbage_waste'],['Deep pothole on road','pothole_road_damage'],['Streetlight has stopped working','streetlight_failure'],['Water pipe burst and leaking','water_supply_leakage'],['Fallen tree blocks road','fallen_tree_branch'],['Traffic signal stopped working','traffic_signal_pedestrian_safety'],['Open manhole on pavement','open_manhole_drain_cover'],['Public toilet is dirty','public_toilet_sanitation']]){
 const r=ruleAssessment({...input,description:text});assert.equal(r.issue_type,category,text);assert.equal(r.source,'rules');assert.equal(r.photo_matches_description,'cannot_tell');assert.match(r.visual_findings,/not analyzed/);assert.ok(r.confidence<0.75);
 }});
test('hazards take precedence over missing info while recurrence cannot make nuisance critical',()=>{
 const hazard=incident(1,{result:ruleAssessment({...input,description:'Open manhole with live wires'})});assert.equal(prioritize(hazard).level,'critical');
 const nuisance=incident(1,{result:ruleAssessment({...input,description:'Small garbage pile'}),recurrence:{kind:'new',event_id:1,recurrence_count:100,previous_ids:[],evidence:[],match_method:'none'}});assert.notEqual(prioritize(nuisance).level,'critical');
 assert.equal(ruleAssessment({...input,description:'Streetlight out, no exposed wires'}).immediate_hazard,false);
});
test('same browser repetition is duplicate; another browser confirms one event',()=>{
 const first=incident(),second=incident(2),third=incident(3,{reporter_id:'another-reporter'});
 second.recurrence=detectRecurrence(second,[first]);third.recurrence=detectRecurrence(third,[first,second]);const items=[first,second,third];recompute(items);
 assert.equal(second.recurrence.kind,'duplicate');assert.equal(third.recurrence.kind,'confirmation');assert.equal(first.consensus_count,1);assert.ok(items.every(i=>i.recurrence.recurrence_count===0));
});
test('later event counts once even with multiple reports; matching is explainable',()=>{
 const first=incident(),later=incident(2,{occurred_at:new Date(Date.now()+3*86400000).toISOString()});later.recurrence=detectRecurrence(later,[first]);
 const again=incident(3,{occurred_at:later.occurred_at});again.recurrence=detectRecurrence(again,[first,later]);
 const items=[first,later,again];recompute(items);assert.equal(later.recurrence.kind,'potential_recurrence');assert.equal(again.recurrence.kind,'duplicate');assert.ok(items.every(i=>i.recurrence.recurrence_count===1));assert.match(later.recurrence.evidence.join(' '),/100 m/);
});
test('event anchor prevents sliding time-window chains',()=>{
 const first=incident(),b=incident(2,{occurred_at:new Date(Date.now()+20*3600000).toISOString()}),c=incident(3,{occurred_at:new Date(Date.now()+40*3600000).toISOString()});b.recurrence=detectRecurrence(b,[first]);c.recurrence=detectRecurrence(c,[first,b]);assert.equal(c.recurrence.kind,'potential_recurrence');
});
test('nearby different categories and far away coordinates do not merge',()=>{
 const a=incident(),b=incident(2,{result:ruleAssessment({...input,description:'Streetlight not working'})}),c=incident(3,{lat:14});assert.equal(detectRecurrence(b,[a]).kind,'new');assert.equal(detectRecurrence(c,[a]).kind,'new');
});
test('text address matching is cautious and explicitly approximate',()=>{
 const a=incident(1,{lat:undefined,lng:undefined}),b=incident(2,{lat:undefined,lng:undefined});assert.equal(detectRecurrence(b,[a]).match_method,'location_text');
 a.location=b.location='Chennai Ward 42';assert.equal(detectRecurrence(b,[a]).kind,'new');
});
test('review corrections preserve model result and rebuild category grouping',()=>{
 const a=incident(),b=incident(2);b.recurrence=detectRecurrence(b,[a]);b.fixed_issue='streetlight_failure';b.fixed_severity=1;b.reviewed=true;b.reviews=[{at:new Date().toISOString(),issue_type:'streetlight_failure',severity:1,immediate_hazard:false,status:'reported',note:'Synthetic correction'}];rebuildMatches([a,b]);assert.equal(b.recurrence.kind,'new');assert.equal(b.result.issue_type,'waterlogging_flooding');assert.equal(b.priority.level,'low');
});
test('citizen cannot select priority or severity; input limits enforced',()=>{
 assert.throws(()=>validateInput({...input,priority:'critical'}));assert.throws(()=>validateInput({...input,severity:5}));assert.throws(()=>validateInput({...input,lat:100}));assert.throws(()=>validateInput({...input,description:'short'}));assert.throws(()=>validateInput({...input,photoBase64:'data:image/png;base64,YWJj'}));assert.throws(()=>validateInput({...input,occurred_at:'tomorrow'}));assert.equal(validateInput({...input,lat:0,lng:0}).lat,0);
});
test('provider schema rejects invalid results and never fabricates photo agreement',()=>{
 assert.throws(()=>validateModel({severity:8},input));const valid={...ruleAssessment(input),confidence:0.8,photo_matches_description:'yes'};const r=validateModel(valid,input);assert.equal(r.photo_matches_description,'cannot_tell');assert.equal(r.source,'gemini');assert.equal(r.needs_human_review,true);
});
