import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, evaluateEnding, activeEvent, managerState } from '../lib/office/engine.ts';
import { events, emails, tasks, meetings, achievements, endings } from '../lib/office/content.ts';
const act = (s, kind, id, index) => reducer(s, {type:'DO',kind,id,index});
const fresh = () => { const s=initialState(1999); s.mode='playing'; s.nextEventAt=999; return s; };

test('complete content pool and valid linked follow-ups', () => {
  assert.ok(events.length>=30); assert.ok(emails.length>=15); assert.equal(meetings.length,6); assert.ok(tasks.length>=8); assert.ok(achievements.length>=8); assert.ok(Object.keys(endings).length>=7);
  assert.ok(events.filter(e=>e.category==='Phone').length>=5);
  assert.ok(events.filter(e=>['IT','Printer','Computer problem'].includes(e.category)).length>=5);
  assert.equal(new Set(events.map(e=>e.id)).size,events.length);
  for(const e of events) { assert.ok(e.choices.length>=2); for(const c of e.choices) if(c.followup) assert.ok(events.some(f=>f.id===c.followup)); }
});
test('opening, free app navigation, clock and blocked background actions', () => {
  let s=reducer(initialState(),{type:'BOOT_DONE'}); assert.equal(s.mode,'welcome');
  s=reducer(s,{type:'START',seed:1}); assert.equal(activeEvent(s).id,'welcome'); assert.deepEqual([s.energy,s.patience,s.jobSecurity],[75,70,65]);
  assert.deepEqual(act(s,'coffee'),s); s=act(s,'choose',undefined,0); assert.equal(s.time,3);
  s=reducer(s,{type:'OPEN',app:'Mail'}); assert.equal(s.time,3); assert.equal(s.focusedApp,'Mail');
  s=reducer(s,{type:'MINIMIZE',app:'Mail'}); assert.ok(s.openApps[0].minimized); s=reducer(s,{type:'OPEN',app:'Mail'}); assert.equal(s.openApps.length,1);
  assert.equal(act(s,'clock').time,3);
});
test('coffee diminishing returns, plant diminishing returns, one-use supplies and lunch', () => {
  let s=fresh(); s.energy=20; s=act(s,'coffee'); assert.equal(s.energy,38); assert.equal(s.time,6);
  s.coffeeCount=4; const p=s.patience; s=act(s,'coffee'); assert.equal(s.energy,42); assert.equal(s.patience,p-12);
  s.plantUses=5; const q=s.patience; s=act(s,'plant'); assert.equal(s.patience,q+1);
  s.drawerFound=['snack']; s=act(s,'item','snack'); assert.deepEqual(act(s,'item','snack'),s);
  assert.deepEqual(act(s,'lunch'),s); s.time=180; s=act(s,'lunch'); assert.ok(s.lunchEaten); assert.deepEqual(act(s,'lunch'),s);
});
test('email deletes do not erase deadlines; restore, reply and purge work', () => {
  let s=fresh(); s=act(s,'read','m01'); assert.equal(s.time,3); assert.equal(act(s,'read','m01').time,3);
  s=act(s,'delete','m01'); assert.equal(s.deletedEmails,1); s=act(s,'restore','m01'); s=act(s,'delete','m01'); assert.equal(s.deletedEmails,1);
  s.time=175; const security=s.jobSecurity; s=act(s,'lamp'); assert.ok(s.mail.m01.overdue); assert.ok(s.jobSecurity<=security-4);
  s.activeEvent=null; s=act(s,'empty'); assert.ok(s.mail.m01.purged); assert.deepEqual(act(s,'restore','m01'),s);
  let r=fresh(); r=act(r,'reply','m01'); const original=r; assert.deepEqual(act(r,'reply','m01'),original); r.time=175; r=act(r,'lamp'); assert.equal(r.mail.m01.overdue,false);
});
test('crossing a deadline charges once and late replies resolve followups', () => {
  let s=fresh(); s.time=185; s=act(s,'work'); assert.equal(s.mail.m05.overdue,true); assert.ok(s.activeEvent);
  s.activeEvent=null; s=act(s,'reply','m05'); assert.equal(s.followups.some(f=>f.target==='m05'),false); assert.equal(s.mail.m05.answered,true);
  const before=s.jobSecurity; s.activeEvent=null; s=act(s,'lamp'); assert.equal(s.jobSecurity,before);
});
test('task completion, scheduled meetings and missed meetings are not repeatable', () => {
  let s=fresh(); s=act(s,'task','t1'); assert.equal(s.tasksCompleted,1); assert.deepEqual(act(s,'task','t1'),s);
  s.time=30; s=act(s,'meeting','c1'); assert.equal(s.activeEvent.target,'c1'); s=act(s,'choose',undefined,0); assert.equal(s.meetingsAttended,1); assert.equal(s.meetingStatus.c1,'attended'); assert.equal(s.time,52);
  const original=s; assert.deepEqual(act(s,'meeting','c1'),original);
  s.time=145; s=act(s,'lamp'); assert.equal(s.meetingStatus.c2,'missed');
});
test('postponed update schedules a later problem; successful alt-tab changes apps', () => {
  let s=fresh(); s.activeEvent={id:'update'}; const i=activeEvent(s).choices.findIndex(c=>c.followup); assert.ok(i>=0); s=act(s,'choose',undefined,i); assert.equal(s.followups[0].id,'crash');
  s=fresh(); s.openApps=[{id:'Solitaire',minimized:false,x:0,y:0}]; s.activeEvent={id:'footsteps'}; s=act(s,'choose',undefined,0); assert.equal(s.focusedApp,'Tasks'); assert.equal(s.openApps.find(a=>a.id==='Solitaire').minimized,true); assert.equal(s.successfulAltTabs,1);
});
test('printer repair, Solitaire rule validation and manager escalation', () => {
  let s=fresh(); s.printerBroken=true; s=act(s,'printer'); assert.equal(s.activeEvent.id,'jam'); s=act(s,'choose',undefined,0); assert.equal(s.printerBroken,false); assert.ok(s.achievements.includes('printer'));
  s=fresh(); s.stack=5; s.card=10; s=act(s,'stack'); assert.equal(s.stack,5); assert.equal(s.card,10); s.card=6; s=act(s,'stack'); assert.equal(s.stack,6); assert.equal(s.card,null);
  s=fresh(); s.suspicion=94; s.clockChecks=3; s=act(s,'clock'); assert.equal(s.activeEvent.id,'caught'); assert.equal(managerState(s.suspicion),'CAUGHT');
});
test('all eight endings and deterministic failure priority', () => {
  const s=fresh(); assert.equal(evaluateEnding(s),null);
  assert.equal(evaluateEnding({...s,energy:0,patience:0,jobSecurity:0}),'FIRED');
  assert.equal(evaluateEnding({...s,energy:0,patience:0}),'BURNOUT'); assert.equal(evaluateEnding({...s,patience:0}),'RAGE');
  const end={...s,time:480}; assert.equal(evaluateEnding({...end,workActions:8,jobSecurity:95}),'EMPLOYEE'); assert.equal(evaluateEnding({...end,energy:5,workActions:3}),'QUIET');
  assert.equal(evaluateEnding({...end,workActions:6,meetingStatus:Object.fromEntries(meetings.map(m=>[m.id,'attended']))}),'WARRIOR');
  assert.equal(evaluateEnding({...end,workActions:1}),'LEGEND'); assert.equal(evaluateEnding({...end,workActions:5}),'SURVIVOR');
});

test('hands-on activities commit once, quality matters, and cancellation is free', () => {
  let s=fresh();s=reducer(s,{type:'INSPECT',kind:'coffee'});assert.equal(s.interaction.kind,'coffee');assert.equal(s.time,0);
  s=reducer(s,{type:'CLOSE_INTERACTION'});assert.equal(s.time,0);assert.equal(s.interaction,null);
  const good=act(fresh(),'brew',undefined,80);const spill=act(fresh(),'brew',undefined,100);const weak=act(fresh(),'brew',undefined,30);
  assert.ok(good.energy>spill.energy&&spill.energy>weak.energy);assert.equal(spill.coffeeSpilled,true);assert.ok(spill.patience<good.patience);
  const plant=act(fresh(),'tend',undefined,1);assert.equal(plant.plantHealth,75);assert.equal(plant.plantUses,1);
  s=fresh();s.printerBroken=true;s=act(s,'repairPrinter');assert.equal(s.printerBroken,false);assert.equal(s.printerFixes,1);assert.deepEqual(act(s,'repairPrinter'),s);
  s=act(fresh(),'backup');assert.equal(s.backupMade,true);assert.deepEqual(act(s,'backup'),s);
  const precise=act(fresh(),'task','t1',0);const corrected=act(fresh(),'task','t1',2);assert.equal(corrected.time,precise.time+4);assert.equal(corrected.patience,precise.patience-2);
  s=fresh();s=act(s,'drawer','5');assert.equal(s.drawerFound[0],s.drawerOrder[5]);assert.deepEqual(act(s,'drawer','5'),s);
  const helpful=act(fresh(),'reply','m01',0);const boundary=act(fresh(),'reply','m01',1);const vague=act(fresh(),'reply','m01',2);
  assert.ok(helpful.jobSecurity>boundary.jobSecurity&&boundary.jobSecurity>vague.jobSecurity);assert.ok(boundary.patience>helpful.patience);
});
test('shift clamps time and resources, ending freezes actions, restart cancels safely', () => {
  let s=fresh(); s.time=475; s.energy=95; s=act(s,'coffee'); assert.equal(s.time,480); assert.equal(s.energy,100); assert.equal(s.mode,'ended'); assert.deepEqual(act(s,'work'),s);
  s=reducer(s,{type:'RESTART'}); assert.equal(s.modal,'restart'); s=reducer(s,{type:'DISMISS_MODAL'}); assert.equal(s.time,480); s=reducer(s,{type:'RESTART_CONFIRM',seed:2}); assert.equal(s.mode,'welcome'); assert.equal(s.time,0);
});

function play(seed, policy='balanced') {
  let s=reducer(initialState(),{type:'START',seed}); let turns=0;
  while(s.mode==='playing' && turns++<250) {
    if(s.activeEvent) {
      const choices=activeEvent(s).choices;
      const scores=choices.map(c=>{const e=c.effect;return (e.energy||0)*(s.energy<30?4:.7)+(e.patience||0)*(s.patience<25?4:.8)+(e.jobSecurity||0)*(s.jobSecurity<40?4:1)-(e.suspicion||0)*.35+(e.minutes||0)*.2;});
      s=act(s,'choose',undefined,policy==='reckless' ? turns%choices.length : scores.indexOf(Math.max(...scores)));
    } else if(policy==='reckless') s=act(s,['draw','coffee','work','busy','browse','break'][turns%6]);
    else if(!s.lunchEaten&&s.time>=165&&(s.energy<65||s.patience<45)) s=act(s,'lunch');
    else if(s.energy<35&&s.coffeeCount<3) s=act(s,'coffee');
    else if(s.energy<28) s=act(s,'break');
    else if(s.patience<25) s=act(s,'plant');
    else { const mail=emails.find(m=>m.arrival<=s.time&&m.deadline&&!s.mail[m.id].answered&&!s.mail[m.id].deleted); const task=tasks.find(t=>s.taskStatus[t.id]==='pending'); s=mail?act(s,'reply',mail.id):task?act(s,'task',task.id):act(s,'busy'); }
    assert.ok(s.time>=0&&s.time<=480); for(const k of ['energy','patience','jobSecurity','suspicion']) assert.ok(Number.isFinite(s[k])&&s[k]>=0&&s[k]<=100, `${k} outside range`);
  }
  assert.equal(s.mode,'ended',`run ${seed} stalled at ${s.time}`); return {ending:s.ending,time:s.time,turns,events:s.seenEvents.join(',')};
}
test('100 seeded runs finish, balanced play is winnable and replays vary', () => {
  const balanced=Array.from({length:50},(_,i)=>play(i+1)); const reckless=Array.from({length:50},(_,i)=>play(i+51,'reckless'));
  assert.ok(balanced.filter(r=>r.time===480).length>=35, JSON.stringify(balanced));
  assert.ok(new Set(balanced.map(r=>r.events)).size>30); assert.ok(reckless.some(r=>r.time<480));
  console.log('Simulation summary:',{balancedWins:balanced.filter(r=>r.time===480).length,balancedRuns:50,recklessFailures:reckless.filter(r=>r.time<480).length,minTurns:Math.min(...balanced.map(r=>r.turns)),maxTurns:Math.max(...balanced.map(r=>r.turns))});
});
