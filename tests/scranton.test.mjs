import test from 'node:test';
import assert from 'node:assert/strict';
import { newOffice, officeReducer, validSave } from '../lib/scranton/simulation.ts';
import { employees, departments } from '../lib/scranton/roster.ts';
import { findPath, stations, walkable, movementClear, characterClearance } from '../lib/scranton/world.ts';
import { activeEvent } from '../lib/office/engine.ts';
import { officeBounds, constrainOfficeCamera } from '../lib/scranton/camera.ts';
const start=()=>officeReducer(newOffice(42),{type:'START'});
function resolve(s){let guard=0;while(s.activeEvent&&s.mode==='playing'&&guard++<15)s=officeReducer(s,{type:'DO',kind:'choose',index:0});return s;}
test('10 unique employees each have an appearance, dialogue and a real assignment',()=>{
 assert.equal(employees.length,10);assert.equal(new Set(employees.map(e=>e.id)).size,10);
 for(const e of employees){assert.ok(e.greeting&&e.advice&&e.response&&e.task);let s=start();s=officeReducer(s,{type:'PERSON',id:e.id,kind:'assign'});assert.ok(s.people[e.id].job);assert.equal(s.time,5);s=officeReducer(s,{type:'PERSON',id:e.id,kind:'talk',topic:1});assert.equal(s.people[e.id].trust,55);assert.equal(s.people[e.id].talks,1);assert.ok(s.history.at(-1).text.includes(e.advice));}
});
test('all characters and office stations have accessible routes through open doors',()=>{
 for(const target of [...employees.map(e=>e.home),...stations.map(s=>s.position)]){const route=findPath([2,9],target);assert.ok(route.length,`No route to ${target}`);for(const p of route)assert.ok(walkable(...p));for(let i=1;i<route.length;i++)assert.equal(Math.abs(route[i][0]-route[i-1][0])+Math.abs(route[i][1]-route[i-1][1]),1);}
 assert.equal(findPath([2,9],[99,99]).length,0);
});
test('approaching every coworker stops outside their body and seat',()=>{
 const occupied=employees.map(e=>e.home);
 for(const e of employees){
  const from=[9.4,9.3];const route=findPath(from,e.home,occupied);
  assert.ok(route.length,`No safe approach to ${e.name}`);
  let previous=from;
  for(const point of route){assert.ok(movementClear(previous,point,occupied),`Route clips a coworker near ${e.name}`);previous=point;}
  assert.ok(Math.hypot(previous[0]-e.home[0],previous[1]-e.home[1])>=characterClearance);
  assert.ok(Math.hypot(previous[0]-e.home[0],previous[1]-e.home[1])<3,`Stopped too far from ${e.name}`);
 }
});
test('face-to-face conversation routes stop a short, safe distance from every coworker',()=>{
 const occupied=employees.map(e=>e.home);
 for(const e of employees){
  const route=findPath([9.4,9.3],[e.home[0],e.home[1]+1.85],occupied);
  assert.ok(route.length,`No conversation route for ${e.name}`);
  const end=route.at(-1);
  const distance=Math.hypot(end[0]-e.home[0],end[1]-e.home[1]);
  assert.ok(distance>=characterClearance&&distance<=2.8,`${e.name}: conversation gap ${distance}`);
  assert.ok(movementClear(end,end,occupied));
 }
});
test('coworkers arriving at the shared printer keep separate standing spots',()=>{
 const printer=stations.find(s=>s.id==='printer').position;
 const arrived=[];
 for(const e of employees.filter(e=>['Sales','Accounting'].includes(e.department))){
  const occupied=[...employees.filter(other=>other.id!==e.id).map(other=>other.home),...arrived];
  const route=findPath(e.home,printer,occupied);
  assert.ok(route.length,`No safe printer route for ${e.name}`);
  const destination=route.at(-1);
  assert.ok(movementClear(destination,destination,occupied));
  arrived.push(destination);
 }
});
test('movement checks the swept segment rather than only the endpoint',()=>{
 assert.equal(movementClear([2,9],[6,9],[[4,9]]),false);
 assert.equal(movementClear([2,11],[6,11],[[4,9]]),true);
 assert.equal(movementClear([4,10],[4,10],[[4,9]]),false);
});
test('full camera orbits and extreme pans stay within the enclosed office',()=>{
 for(const [x,z] of [[8.4,7.4],[3,7],[14,11],[-40,-40],[40,40]]){
  for(let angle=0;angle<Math.PI*2;angle+=Math.PI/16){
   for(const elevation of [0.25,0.7,1.45]){
    const target={x,y:1.3,z};
    const camera={x:x+26*Math.sin(angle)*Math.sin(elevation),y:1.3+26*Math.cos(elevation),z:z+26*Math.cos(angle)*Math.sin(elevation)};
    constrainOfficeCamera(camera,target);
    assert.ok(camera.x>officeBounds.left&&camera.x<officeBounds.right);
    assert.ok(camera.z>officeBounds.back&&camera.z<officeBounds.front);
    assert.ok(camera.y>0&&camera.y<officeBounds.height);
    assert.ok(target.x>officeBounds.left&&target.x<officeBounds.right);
    assert.ok(target.z>officeBounds.back&&target.z<officeBounds.front);
   }
  }
 }
});
test('help changes progress and relationships; interrupt reverses progress and trust',()=>{
 let s=start();s=officeReducer(s,{type:'PERSON',id:'kevin',kind:'assign'});const progress=s.people.kevin.job.progress;
 s=officeReducer(s,{type:'PERSON',id:'kevin',kind:'help'});assert.ok(s.people.kevin.job.progress>=progress+20);assert.equal(s.people.kevin.trust,58);assert.equal(s.coworkersHelped,1);
 const before=s.people.kevin.job.progress;s=officeReducer(s,{type:'PERSON',id:'kevin',kind:'interrupt'});assert.ok(s.people.kevin.job.progress<before);assert.equal(s.people.kevin.trust,50);assert.equal(s.people.kevin.mood,64);assert.equal(s.people.kevin.interrupted,1);
});
test('parallel tasks deliver exactly once and contribute to all four departments',()=>{
 let s=start();for(const d of departments){const e=employees.find(e=>e.department===d);s=resolve(s);s=officeReducer(s,{type:'PERSON',id:e.id,kind:'assign'});}
 for(let i=0;i<7;i++){s=resolve(s);s=officeReducer(s,{type:'SHIFT',minutes:15});}
 assert.equal(s.completedDepartments.length,departments.length);assert.equal(Object.values(s.people).reduce((n,p)=>n+p.completed,0),departments.length);assert.equal(Object.values(s.people).filter(p=>p.job).length,0);
 s=resolve(s);const count=s.tasksCompleted;s=officeReducer(s,{type:'SHIFT',minutes:15});assert.equal(s.tasksCompleted,count);
});
test('decisions and unfinished station activities pause assignment actions',()=>{
 let s=start();s.activeEvent={id:'welcome'};assert.equal(officeReducer(s,{type:'PERSON',id:'jim',kind:'assign'}),s);assert.equal(officeReducer(s,{type:'SHIFT',minutes:15}),s);
 s=resolve(s);s=officeReducer(s,{type:'INSPECT',kind:'coffee'});assert.equal(officeReducer(s,{type:'PERSON',id:'jim',kind:'talk'}),s);
 const before=s.time;s=officeReducer(s,{type:'DO',kind:'brew',index:80});assert.ok(s.time>before);assert.equal(s.interaction,null);assert.equal(s.coffeeCount,1);
});
test('office events change active work and run once per milestone',()=>{
 let s=start();s.time=74;s.nextEventAt=999;s.meetingStatus=Object.fromEntries(Object.keys(s.meetingStatus).map(id=>[id,'attended']));
 s.people.dwight.job={title:'Inventory',progress:25,duration:300};s=officeReducer(s,{type:'SHIFT',minutes:5});assert.ok(s.officeNews.some(n=>n.text.includes("stationery")));assert.equal(s.people.dwight.mood,60);assert.equal(s.milestones.filter(v=>v===75).length,1);
 s.time=149;s.activeEvent=null;s=officeReducer(s,{type:'SHIFT',minutes:5});assert.ok(s.officeNews.some(n=>n.text.includes('impromptu meeting')));assert.equal(s.milestones.filter(v=>v===150).length,1);
});
test('saved shifts restore safely, preserve work, and restart resets relationships',()=>{
 let s=start();s=officeReducer(s,{type:'PERSON',id:'pam',kind:'assign'});assert.ok(validSave(JSON.parse(JSON.stringify(s))));const restored=officeReducer(newOffice(),{type:'RESTORE',state:JSON.parse(JSON.stringify(s))});assert.equal(restored.people.pam.job.title,s.people.pam.job.title);assert.equal(restored.time,s.time);
 assert.ok(!validSave({version:2,time:NaN}));assert.ok(!validSave({...s,selected:'missing'}));assert.ok(!validSave({...s,mail:null}));
 const fresh=officeReducer(restored,{type:'RESTART_CONFIRM',seed:9});assert.equal(fresh.time,0);assert.equal(fresh.people.pam.job,null);assert.equal(fresh.people.pam.trust,50);
});
test('team deliveries count before evaluating the same action’s ending',()=>{
 let s=start();s.time=470;s.energy=80;s.patience=80;s.jobSecurity=88;s.workActions=8;
 s.meetingStatus=Object.fromEntries(Object.keys(s.meetingStatus).map(id=>[id,'attended']));s.taskStatus=Object.fromEntries(Object.keys(s.taskStatus).map(id=>[id,'done']));Object.values(s.mail).forEach(m=>m.answered=true);
 s.people.pam.job={title:'Final visitor report',duration:30,progress:25};s=officeReducer(s,{type:'SHIFT',minutes:15});assert.equal(s.time,480);assert.equal(s.people.pam.completed,1);assert.equal(s.ending,'EMPLOYEE');assert.equal(s.mode,'ended');
});
test('a full workday is playable and ends with bounded stats and a complete team report',()=>{
 let s=start();for(const d of departments){s=resolve(s);s=officeReducer(s,{type:'PERSON',id:employees.find(e=>e.department===d).id,kind:'assign'});}
 for(let i=0;i<120&&s.mode==='playing';i++){
  if(s.activeEvent){const event=activeEvent(s);const index=event.choices.reduce((best,c,j)=>{const score=x=>(x.effect.energy??0)+(x.effect.patience??0)*1.2+(x.effect.jobSecurity??0)*1.4;return score(c)>score(event.choices[best])?j:best;},0);s=officeReducer(s,{type:'DO',kind:'choose',index});}
  else if(s.time>=165&&!s.lunchEaten)s=officeReducer(s,{type:'DO',kind:'lunch',index:0});
  else if(s.energy<28)s=officeReducer(s,{type:'DO',kind:'brew',index:80});
  else if(s.patience<25){s=officeReducer(s,{type:'PERSON',id:employees[i%employees.length].id,kind:'talk'});}
  else s=officeReducer(s,{type:'SHIFT',minutes:15});
  for(const k of ['energy','patience','jobSecurity','suspicion'])assert.ok(s[k]>=0&&s[k]<=100);
 }
 assert.equal(s.mode,'ended');assert.equal(s.time,480);assert.equal(s.completedDepartments.length,departments.length);assert.ok(s.ending);assert.equal(s.activeEvent,null);
});
