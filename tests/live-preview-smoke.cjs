const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const preview='https://nexocare-f9q90dxzx-valdiviezog707-5375.vercel.app/';
  const email='nexocare-ci-'+Date.now()+'@example.com';
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try {
    const response=await page.goto(preview,{waitUntil:'networkidle'});
    assert.ok(response && response.ok(),'Preview did not load');
    const {expect}=require('@playwright/test');
    await expect(page.locator('#loginForm')).toBeVisible();
    const session=await page.evaluate(async()=>window.NexoBackend.session());
    assert.equal(session,null);
    await page.locator('#showRegister').click();
    const form=page.locator('#registerForm');
    await form.locator('[name=fullName]').fill('Profesional verificación');
    await form.locator('[name=specialty]').selectOption({label:'Fisioterapia'});
    await form.locator('[name=phone]').fill('584120009999');
    await form.locator('[name=email]').fill(email);
    await form.locator('[name=password]').fill('NexoCare-test-2026!');
    await form.locator('[type=submit]').click();
    await page.waitForTimeout(1500);
    const authOpen=await page.locator('#authDialog').getAttribute('open')!==null;
    let mode;
    if(authOpen) {
      const message=await page.locator('#authMessage').textContent();
      assert.match(message,/Revisa tu correo para confirmar/i);
      mode='email-confirmation-required';
    } else {
      mode='session-created';
      await expect(page.locator('.metrics b').nth(0)).toHaveText('0');
      await expect(page.locator('#appointmentList')).toContainText('No tienes citas');
      await page.reload({waitUntil:'networkidle'});
      await expect(page.locator('#authDialog')).not.toBeVisible();
    }
    assert.deepEqual(errors,[]);
    fs.mkdirSync('test-results',{recursive:true});
    fs.writeFileSync('test-results/live-preview-result.json',JSON.stringify({status:'PASS',preview,email,mode,errors},null,2));
    await page.screenshot({path:'test-results/live-preview-mobile.png',fullPage:true});
    console.log(JSON.stringify({status:'PASS',email,mode}));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
