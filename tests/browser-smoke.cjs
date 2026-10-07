/* Browser integration against a deterministic fake server. No real patient data or Supabase accounts. */
const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mock = '('+function(){
  let disk=JSON.parse(localStorage.getItem('TEST_ONLY_SERVER') || '{"users":[],"profiles":[],"patients":[],"appointments":[],"movements":[],"prescriptions":[],"session":null}');
  const save=()=>localStorage.setItem('TEST_ONLY_SERVER',JSON.stringify(disk));
  const listeners=[];
  const auth={
    getSession:async()=>({data:{session:disk.session?{user:disk.session}:null}}),
    getUser:async()=>({data:{user:disk.session}}),
    signUp:async({email,password,options})=>{
      if(disk.users.some(user=>user.email===email))return {error:{message:'User already registered'}};
      const user={id:crypto.randomUUID(),email};
      disk.users.push({...user,password});
      disk.profiles.push({id:user.id,...options.data,palette:'nexocare',logoDataUrl:''});
      disk.session=user;save();return {data:{user,session:{user}}};
    },
    signInWithPassword:async({email,password})=>{
      const found=disk.users.find(user=>user.email===email && user.password===password);
      if(!found)return {error:{message:'Invalid login credentials'}};
      disk.session={id:found.id,email};save();return {data:{user:disk.session}};
    },
    signOut:async()=>{disk.session=null;save();listeners.forEach(fn=>fn('SIGNED_OUT',null));return {error:null};},
    onAuthStateChange:fn=>{listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}};}
  };
  function from(table){
    let filters=[],operation='select',values,single=false,start=0,end=999;
    const query={
      select(){return this;},eq(key,value){filters.push([key,value]);return this;},order(){return this;},range(a,b){start=a;end=b;return this;},
      insert(value){operation='insert';values=value;return this;},update(value){operation='update';values=value;return this;},
      single(){single=true;return this;},
      then(resolve,reject){
        try {
          if(!disk.session)return resolve({error:{message:'expired'}});
          const visible=row=>(table==='profiles'?row.id:row.doctor_id)===disk.session.id;
          let data;
          if(operation==='insert'){
            data={id:crypto.randomUUID(),created_at:new Date().toISOString(),...values};
            if(!visible(data))return resolve({error:{message:'RLS denied'}});
            disk[table].push(data);save();
          }else if(operation==='update'){
            data=disk[table].find(row=>visible(row)&&filters.every(([k,v])=>row[k]===v));
            if(!data)return resolve({error:{message:'missing row'}});
            Object.assign(data,values);save();
          }else {
            const rows=disk[table].filter(row=>visible(row)&&filters.every(([k,v])=>row[k]===v)).slice(start,end+1);
            data=single?rows[0]:rows;
          }
          resolve({data});
        }catch(error){reject(error);}
      }
    };return query;
  }
  window.supabase={createClient:()=>({auth,from})};
}.toString()+')();';
(async()=>{
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  const server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,content)=>{
      if(error){res.writeHead(404).end();return;}
      const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
      res.setHeader('Content-Type',mime[path.extname(file)] || 'text/plain');res.end(content);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch();
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/npm/@supabase/supabase-js@2/**',route=>route.fulfill({contentType:'text/javascript',body:mock}));
  await page.route('**/config.js',route=>route.fulfill({contentType:'text/javascript',body:"window.NEXOCARE_CONFIG={url:'https://test.invalid',publishableKey:'test-only'};"}));
  const {expect}=require('@playwright/test');
  const url='http://127.0.0.1:'+server.address().port;
  async function signup(email,name){
    await page.locator('#showRegister').click();
    const form=page.locator('#registerForm');
    await form.locator('[name=fullName]').fill(name);
    await form.locator('[name=specialty]').selectOption({label:'Fisioterapia'});
    await form.locator('[name=phone]').fill('584120000000');
    await form.locator('[name=email]').fill(email);
    await form.locator('[name=password]').fill('Test-password-123');
    await form.locator('[type=submit]').click();
    await expect(page.locator('#authDialog')).not.toBeVisible();
  }
  async function logout(){
    await page.locator('.avatar').click();await page.locator('#signOut').click();
    await expect(page.locator('#loginForm')).toBeVisible();
  }
  try {
    await page.goto(url);
    await expect(page.locator('#loginForm')).toBeVisible();
    await expect(page.locator('.bottom-nav')).not.toBeVisible();
    await page.screenshot({path:'test-results/login-desktop.png',fullPage:true});
    await signup('a@example.test','Profesional A');
    await expect(page.locator('.metrics b').nth(0)).toHaveText('0');
    await expect(page.locator('#appointmentList')).toContainText('No tienes citas');
    await page.locator('#quickAdd').click();
    await page.locator('#patientForm [name=name]').fill('<img src=x onerror=alert(1)> Paciente');
    await page.locator('#patientForm [name=phone]').fill('584120000001');
    await page.locator('#patientForm [type=submit]').click();
    await expect(page.locator('#patientDialog')).not.toBeVisible();
    await page.locator('[data-view=pacientes]').click();
    assert.equal(await page.locator('#patientList img').count(),0);
    await expect(page.locator('#patientList')).toContainText('<img');
    await page.locator('[data-view=inicio]').click();
    await page.locator('#newAppointment').click();
    await page.locator('#appointmentForm [name=patient]').selectOption({index:1});
    await page.locator('#appointmentForm [name=date]').fill('2026-10-09T09:30');
    await page.locator('#appointmentForm [name=fee]').fill('50');
    await page.locator('#appointmentForm [type=submit]').click();
    await expect(page.locator('#appointmentDialog')).not.toBeVisible();
    await expect(page.locator('#appointmentList .appointment')).toHaveCount(1);
    await page.locator('#agendaDate').fill('2026-10-10');
    await expect(page.locator('#appointmentList .appointment')).toHaveCount(0);
    await page.locator('[data-view=finanzas]').click();
    await page.locator('#newMovement').click();
    await page.locator('#movementForm [name=description]').fill('Consulta de prueba');
    await page.locator('#movementForm [name=amount]').fill('50');
    await page.locator('#movementForm [type=submit]').click();
    await expect(page.locator('#movementDialog')).not.toBeVisible();
    await expect(page.locator('#movementList')).toContainText('Consulta de prueba');
    await page.reload();
    await expect(page.locator('#authDialog')).not.toBeVisible();
    await page.locator('[data-view=pacientes]').click();
    await expect(page.locator('#patientList .patient')).toHaveCount(1);
    await page.locator('[data-view=recetas]').click();
    await page.locator('#newPrescription').click();
    await page.locator('#rxForm [name=patient]').selectOption({index:1});
    await page.locator('#rxForm [data-field=name]').fill('Tratamiento de prueba');
    await page.locator('#rxForm [data-field=schedule]').fill('Según indicación del profesional');
    await page.locator('#rxForm [type=submit]').click();
    await expect(page.locator('#prescriptionPreviewDialog')).toBeVisible();
    await expect(page.locator('#prescriptionPage1')).toHaveAttribute('src',/^data:image\/png/);
    await expect(page.locator('#prescriptionPage2')).toHaveAttribute('src',/^data:image\/png/);
    await page.locator('#prescriptionPreviewDialog .close').click();
    await expect(page.locator('#prescriptionPreviewDialog')).not.toBeVisible();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'test-results/prescriptions-mobile.png',fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await logout();
    await page.locator('#loginForm [name=email]').fill('a@example.test');
    await page.locator('#loginForm [name=password]').fill('wrong-password');
    await page.locator('#loginForm [type=submit]').click();
    await expect(page.locator('#loginForm .form-message')).toContainText('incorrectos');
    await signup('b@example.test','Profesional B');
    await expect(page.locator('.metrics b').nth(0)).toHaveText('0');
    await page.locator('[data-view=pacientes]').click();
    await expect(page.locator('#patientList .patient')).toHaveCount(0);
    await page.locator('[data-view=recetas]').click();
    await expect(page.locator('#prescriptionList .patient')).toHaveCount(0);
    await page.locator('[data-view=finanzas]').click();
    await expect(page.locator('#movementList .patient')).toHaveCount(0);
    await page.screenshot({path:'test-results/new-account-zero-mobile.png',fullPage:true});
    await page.locator('#quickAdd').click();await page.locator('#patientDialog .close').click();
    await expect(page.locator('#patientDialog')).not.toBeVisible();
    assert.deepEqual(errors,[]);
    fs.writeFileSync('test-results/result.json',JSON.stringify({status:'PASS',mode:'Mock Supabase; not real Auth/RLS verification',checks:['login first','empty signup','safe patient text','appointments by date','finance persistence','reload','two-page PNG','close buttons','wrong-password rejection','second-account isolation','390px layout'],errors},null,2));
  }catch(error){
    console.error('Browser errors:',JSON.stringify(errors));
    await page.screenshot({path:'test-results/failure.png',fullPage:true});
    throw error;
  }finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
