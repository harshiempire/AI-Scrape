// src/tools/renderHtml.ts
import { chromium } from 'playwright';
export async function fetchRenderedHtml(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const html = await page.content();
    await browser.close();
    return html;
}
