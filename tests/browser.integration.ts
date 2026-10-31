import {chromium,type Browser} from 'playwright';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
const dir=mkdtempSync(path.join(tmpdir(),'civic-browser-'));
const net=createServer();await new Promise<void>(r=>net.listen(0,'127.0.0.1',r));const port=(net.address() as any).port;await new Promise<void>(r=>net.close(()=>r()));
const origin=`http://127.0.0.1:${port}`;
let child:ChildProcess,logs='';let count=0;
const check=(s:string)=>{count++;console.log('PASS '+s);};
let browser:Browser|undefined;
try{
 child=spawn(process.execPath,['--import','tsx','scripts/start.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DATA_DIR:dir,AI_PROVIDER:'rules',REVIEWER_TOKEN:'synthetic-review-token'},stdio:['ignore','pipe','pipe']});
 child.stdout?.on('data',x=>logs+=String(x));child.stderr?.on('data',x=>logs+=String(x));
 for(let n=0;n<100;n++){try{if((await fetch(origin+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 // Alternate executable is used only by constrained test environments; normal local runs use Playwright's installed Chromium.
 browser=await chromium.launch({headless:true,...(process.env.CIVIC_BROWSER_EXECUTABLE?{executablePath:process.env.CIVIC_BROWSER_EXECUTABLE}:{}),args:process.env.CIVIC_BROWSER_ARGS?JSON.parse(process.env.CIVIC_BROWSER_ARGS):[]});
 const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 // Fonts are optional; exercise the app without external font services.
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
 await page.goto(origin);await page.getByText('No reports yet. Submit your first civic problem to begin.').waitFor();check('production application loads with empty persisted state');
 await page.getByRole('button',{name:'Report',exact:true}).click();await page.getByRole('heading',{name:'Report a civic problem'}).waitFor();
 assert.equal(await page.locator('input[name="severity"],input[name="priority"]').count(),0);check('citizen form contains no severity or priority selector');
 await page.getByLabel('Incident location',{exact:true}).fill('Lake Road junction Chennai');await page.getByLabel('Describe the problem').fill('Open manhole with live wires on the pavement');await page.getByLabel('Impact on people').fill('20 residents use this pavement');
 await page.getByLabel('Photo evidence').setInputFiles('public/assets/aistudio/Image_1_07ccf57d.jpeg');
 await page.getByRole('button',{name:'Submit report',exact:true}).click();await page.getByText(/Saved successfully as CS-/).waitFor();check('browser upload and submission saved with visible confirmation');
 assert.match(await page.locator('article').innerText(),/critical/i);assert.match(await page.locator('article').innerText(),/Text rules/);check('actual automatic hazard priority and honest fallback displayed');
 await page.getByRole('button',{name:'Map',exact:true}).click();await page.getByText('Google Maps is unavailable until',{exact:false}).waitFor();await page.getByRole('button',{name:/CS-00001/}).click();check('map gracefully handles absent key and exposes manual-address report details');
 await page.getByRole('button',{name:'Risk',exact:true}).click();await page.getByLabel('Search incidents').fill('no-such-location');await page.getByText('No incidents match these filters.').waitFor();await page.getByLabel('Search incidents').fill('Lake Road');await page.locator('article').waitFor();check('risk search filters real incidents');
 await page.getByRole('button',{name:'Reviewer actions',exact:true}).click();await page.getByLabel('Reviewer token').fill('synthetic-review-token');await page.getByLabel('Correct category').selectOption('streetlight_failure');await page.getByLabel('Severity (reviewer only)').fill('2');await page.getByLabel('Immediate hazard',{exact:true}).uncheck();await page.getByLabel('Lifecycle status').selectOption('resolved');await page.getByLabel('Reason for review').fill('Synthetic browser reviewer correction');
 await page.getByRole('button',{name:'Save review',exact:true}).click();await page.getByText('Human reviewed',{exact:true}).waitFor();await page.getByRole('button',{name:'Assessment & history',exact:true}).click();await page.getByText('Original assessment:',{exact:false}).waitFor();assert.match(await page.locator('article').innerText(),/open manhole drain cover/i);assert.match(await page.locator('article').innerText(),/resolved/);check('review form corrects record and lifecycle while original assessment stays visible');
 await page.getByRole('button',{name:'I see this too (0)',exact:true}).click();await page.waitForTimeout(250);assert.equal(await page.getByRole('button',{name:'I see this too (0)',exact:true}).count(),1);check('reporter cannot inflate own confirmation count');
 await page.reload();await page.locator('h1').waitFor();await page.getByRole('button',{name:'Risk',exact:true}).click();await page.getByRole('button',{name:'Assessment & history',exact:true}).click();await page.getByText('Original assessment:',{exact:false}).waitFor();check('saved review survives frontend reload');
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Report',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);check('mobile reporting layout fits viewport');
 await page.getByRole('button',{name:'Overview',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);check('mobile dashboard fits viewport');

 await page.getByRole('button',{name:'Report',exact:true}).click();
 await page.getByLabel('Incident location',{exact:true}).fill('Lake Road junction Chennai');await page.getByLabel('Describe the problem').fill('Garbage bins overflowing on the street');
 await page.route('**/api/triage',r=>r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Synthetic save failure'})}));
 await page.getByRole('button',{name:'Submit report',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByText(/Saved successfully as/).count(),0);check('failed backend save never shows successful submission');
 await page.unroute('**/api/triage');
 if(process.env.CIVIC_QA_DIR){mkdirSync(process.env.CIVIC_QA_DIR,{recursive:true});await page.getByRole('button',{name:'Overview',exact:true}).click();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(process.env.CIVIC_QA_DIR,'mobile.png'),fullPage:true});await page.setViewportSize({width:1280,height:900});await page.getByRole('button',{name:'Risk',exact:true}).click();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(process.env.CIVIC_QA_DIR,'desktop.png'),fullPage:true});}
 assert.deepEqual(errors,[]);check('no uncaught browser JavaScript errors during tested flow');
 await context.close();console.log(`\n${count} browser checks passed.`);
}finally{
 await browser?.close();
 if(child!&&child!.exitCode===null)await new Promise<void>(r=>{const timer=setTimeout(()=>{child.kill('SIGKILL');r();},5000);child.once('exit',()=>{clearTimeout(timer);r();});child.kill('SIGTERM');});
 rmSync(dir,{recursive:true,force:true});
}
