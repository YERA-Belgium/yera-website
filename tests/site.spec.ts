import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const site=JSON.parse(readFileSync('src/data/site.json','utf8')); 
test('article search, collection filters and complete detail pages',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/articles/');await expect(page.getByRole('status')).toHaveText('134 articles');
 await page.getByRole('combobox',{name:'Collection'}).selectOption('English collection');await expect(page.getByRole('status')).toHaveText('8 articles');
 await page.getByRole('searchbox').fill('Kobe');await expect(page.getByRole('status')).toHaveText('1 articles');
 await page.getByRole('heading',{name:'28 April 2025 Iberian Blackout',exact:true}).getByRole('link').click();
 await expect(page.locator('.original-content')).toContainText('The restoration process');await expect(page.locator('.sources')).toContainText('ENTSO-E');
 await page.goto('/articles/');await page.getByRole('searchbox').fill('no matching result xyz');await expect(page.getByRole('heading',{name:'No matching articles.'})).toBeVisible();await page.getByRole('button',{name:'Clear filters'}).click();await expect(page.getByRole('status')).toHaveText('134 articles');expect(errors).toEqual([]);
});
test('legacy query links resolve to matching records',async({page})=>{
 await page.goto('/article?id=5138');await expect(page).toHaveURL(/article-english\/28-april-2025-iberian-blackout\/$/);
 await page.goto('/event?id=5195');await expect(page).toHaveURL(/event\/energy-geopolitics-policy-leuven-april-1\/$/);await expect(page.locator('.original-content')).toContainText('Rafaël Fernandez');
});
test('mobile layout, original logo, board photos and language switching',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 for(const route of ['/','/articles/','/about/','/events/','/event/energy-geopolitics-policy-leuven-april-1/','/board/','/alumni/','/authors/','/contact/','/article-english/28-april-2025-iberian-blackout/']){
  await page.goto(route);await expect(page.locator('.page-intro h1, .editorial-intro h1').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
 }
 await page.goto('/');const logo=page.locator('header img');await expect(logo).toHaveAttribute('src',/logo\.aebede0\.png/);expect(await logo.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
 await page.locator('#board a').click();await page.locator('#board img').first().scrollIntoViewIfNeeded();await expect.poll(()=>page.locator('#board img').first().evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
 await page.locator('summary').click();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Nederlands'}).click();await expect(page.locator('html')).toHaveAttribute('lang','nl');await expect(page.locator('main')).toContainText('betrouwbare, onbevooroordeelde');
});
test('full text remains readable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(`${test.info().project.use.baseURL}/article/vehicle-to-grid/`);await expect(page.locator('.original-content')).toContainText('Wat is Vehicle-to-Grid');await context.close();
});
test('all live board records and directories appear',async({page})=>{
 await page.goto('/about/');for(const id of site.boards.find((b:any)=>b.current)!.memberIds){await expect(page.getByRole('heading',{name:site.members.find((m:any)=>m.id===id)!.name,exact:true})).toBeVisible();}
 await page.goto('/authors/');await expect(page.locator('.member-card')).toHaveCount(11);await page.goto('/alumni/');await expect(page.locator('.member-card')).toHaveCount(28);
});
test('all migrated publication pages fit a mobile viewport',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:375,height:812});
 for(const record of [...site.articles,...site.events]){await page.goto('/'+record.path,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),record.path).toBe(true);}
});

test('topic links preserve filters and article contents reach original sections',async({page})=>{
 await page.goto('/');
 await page.locator('.topic-index a').first().click();
 await expect(page).toHaveURL(/topic=grids/);
 await expect(page.getByRole('button',{name:'Electricity & grids',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByRole('status')).toHaveText('14 articles');
 await page.reload();
 await expect(page.getByRole('status')).toHaveText('14 articles');
 await page.getByRole('button',{name:'All topics',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('134 articles');
 await expect(page).not.toHaveURL(/topic=/);
 await page.goto('/article-english/28-april-2025-iberian-blackout/');
 const contents=page.getByRole('navigation',{name:'In this article'});
 const anchor=contents.getByRole('link').first();
 const target=await anchor.getAttribute('href');
 await anchor.click();
 await expect(page.locator(target!)).toBeInViewport();
 await contents.getByRole('link',{name:'Sources',exact:true}).click();
 await expect(page.locator('#references')).toBeInViewport();
 expect(await page.locator('.source-text a[href^="http"]').count()).toBeGreaterThan(0);
});
