const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const context={window:{},Intl,Date};
vm.runInNewContext(read('domain.js'),context);
const D=context.window.NexoDomain;
test('new accounts are independent and completely empty',()=>{
  const a=D.freshState(),b=D.freshState();
  for(const key of ['patients','appointments','movements','prescriptions'])assert.equal(a[key].length,0);
  a.patients.push({name:'Only A'});assert.equal(b.patients.length,0);assert.equal(b.user,null);
});
test('agenda uses the doctors timezone and excludes cancelled appointments',()=>{
  const rows=[
    {id:'previous',starts_at:'2026-10-08T02:30:00Z',status:'Confirmada'},
    {id:'next',starts_at:'2026-10-08T13:00:00Z',status:'Pendiente'},
    {id:'cancelled',starts_at:'2026-10-07T16:00:00Z',status:'Cancelada'}
  ];
  assert.equal(D.daily(rows,'2026-10-07','America/Caracas').map(x=>x.id).join(','),'previous');
  assert.equal(D.daily(rows,'2026-10-08','America/Caracas').map(x=>x.id).join(','),'next');
});
test('calendar advances across year and month boundaries',()=>{
  assert.equal(D.nextDate('2026-12-31',1),'2027-01-01');
  assert.equal(D.nextDate('2028-02-28',1),'2028-02-29');
});
test('financial totals use real records and cents, never sample balances',()=>{
  assert.equal(D.totals([],'2026-10').balance,0);
  const rows=[{date:'2026-10-01',kind:'income',amount:'0.10'},{date:'2026-10-02',kind:'income',amount:'0.20'},{date:'2026-10-03',kind:'expense',amount:'0.05'},{date:'2026-11-01',kind:'income',amount:'900'}];
  const sum=D.totals(rows,'2026-10');
  assert.equal(sum.balance,25);assert.equal(sum.incomeCount,2);assert.equal(sum.expenseCount,1);
});
test('user text is escaped in HTML and WhatsApp references the actual appointment',()=>{
  assert.equal(D.escape('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
  const text=D.reminder({starts_at:'2026-10-09T14:00:00Z'},{name:'Paciente Prueba'},{fullName:'Profesional Prueba',timezone:'America/Caracas'});
  assert.ok(text.includes('9 de octubre'));assert.ok(!text.includes('mañana'));assert.ok(text.includes('Profesional Prueba'));
});
test('backend enforces current user on writes and propagates failed persistence',async()=>{
  let written;
  const chain={select(){return this;},eq(){return this;},single:async()=>({data:written}),insert(value){written=value;return this;},update(value){written=value;return this;}};
  const client={auth:{getUser:async()=>({data:{user:{id:'account-B'}}})},from:()=>chain};
  const scope={window:{NEXOCARE_CONFIG:{url:'https://example.invalid',publishableKey:'test'},supabase:{createClient:()=>client}}};
  vm.runInNewContext(read('backend.js'),scope);
  const api=scope.window.NexoBackend;
  await api.save('patients',{name:'Test',doctor_id:'account-A'});
  assert.equal(written.doctor_id,'account-B');
  await assert.rejects(api.save('patients',{name:'Test'},'account-A'),/sesión cambió/);
  chain.single=async()=>({error:new Error('offline')});
  await assert.rejects(api.save('patients',{name:'Test'}),/offline/);
  client.auth.getUser=async()=>({data:{user:null},error:new Error('expired')});
  await assert.rejects(api.save('patients',{name:'Test'}),/sesión terminó/);
});
test('all source files parse',()=>{
  ['domain.js','backend.js','app.js','config.js'].forEach(name=>new vm.Script(read(name),{filename:name}));
});
