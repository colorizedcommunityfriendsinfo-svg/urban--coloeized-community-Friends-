// Run after both builds: NODE_PATH=<Playwright installation>/node_modules node tests/browser.cjs
const { chromium } = require('playwright');
const { mkdir } = require('node:fs/promises');
const assert = require('node:assert/strict');
const path = require('node:path');

(async()=>{
  const { createApp }=await import('../shared/server.mjs');
  const browser=await chromium.launch({headless:true});
  const failures=[];
  await mkdir(path.join(__dirname,'../artifacts'),{recursive:true});
  try {
    for(const service of ['web','mobile']) {
      const server=await createApp({directory:path.join(__dirname,`../${service}/dist`),service});
      await new Promise(r=>server.listen(0,'127.0.0.1',r));
      const context=await browser.newContext({viewport:service==='web'?{width:1440,height:1050}:{width:390,height:844},acceptDownloads:true,reducedMotion:'reduce'});
      const page=await context.newPage();
      page.on('pageerror',e=>failures.push(e.message));
      const url=`http://127.0.0.1:${server.address().port}`;
      try {
        await page.goto(url);await page.waitForSelector('h1');
        await page.screenshot({path:path.join(__dirname,`../artifacts/${service}-home.png`),fullPage:true});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        await page.getByRole('link',{name:'Find your next small thing'}).click();
        await page.getByRole('searchbox',{name:'Search activities'}).fill('kindness');
        await page.waitForFunction(()=>document.querySelectorAll('.activity-card').length===1);
        await page.getByRole('button',{name:'Save Leave a little kindness',exact:true}).click();
        await page.getByRole('button',{name:'Try this activity'}).click();
        assert.equal(await page.locator('dialog').isVisible(),true);
        await page.getByRole('button',{name:'Add to my plan'}).click();
        await page.goto(url+'/#planner');
        await page.waitForSelector('.task-row');assert.equal(await page.locator('.task-row').count(),1);
        await page.getByRole('textbox',{name:'A small thing you want to do'}).fill('<img src=x onerror=alert(1)>');
        await page.getByRole('button',{name:'Add',exact:true}).click();
        assert.equal(await page.locator('.task-row').count(),2);assert.equal(await page.locator('.task-row img').count(),0);
        await page.getByRole('checkbox',{name:'Leave a little kindness'}).check();
        await page.reload();await page.waitForSelector('.task-row');assert.equal(await page.getByRole('checkbox',{name:'Leave a little kindness'}).isChecked(),true);
        assert.equal(await page.locator('.saved-section .activity-card').count(),1);
        const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export my plan'}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'ccf-my-plan.json');
        await page.getByRole('button',{name:'Delete <img src=x onerror=alert(1)>',exact:true}).click();assert.equal(await page.locator('.task-row').count(),1);
        await page.screenshot({path:path.join(__dirname,`../artifacts/${service}-planner.png`),fullPage:true});
        await page.goto(url+'/#academy');await page.getByText('Can I download the workbook now?',{exact:true}).click();assert.equal(await page.getByText('No. The student edition',{exact:false}).isVisible(),true);
        assert.equal(await page.getByRole('link',{name:/download/i}).count(),0);
        const deny=await page.request.post(url+'/api/workbook',{data:{memberId:'other',fileId:'anything'}});assert.equal(deny.status(),403);
        // Confirm the installed public shell works offline and never cached the denial route.
        await page.evaluate(()=>navigator.serviceWorker.ready);
        await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
        assert.equal(await page.evaluate(async()=>{for(const key of await caches.keys()){const c=await caches.open(key);if((await c.keys()).some(r=>new URL(r.url).pathname.startsWith('/api/')))return true;}return false;}),false);
        await context.setOffline(true);await page.reload();await page.waitForSelector('h1');
        await page.goto(url+'/#planner');await page.waitForSelector('.task-row');
        await page.getByRole('textbox',{name:'A small thing you want to do'}).fill('An offline intention');await page.getByRole('button',{name:'Add',exact:true}).click();assert.equal(await page.locator('.task-row').count(),2);
        await context.setOffline(false);
        console.log(`${service}: search, favorites, modal, planner, persistence, safe text, export, deletion, Academy denial, offline and layout passed`);
      } finally {await context.close();await new Promise(r=>server.close(r));}
    }
    assert.deepEqual(failures,[],'No browser JavaScript errors');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
