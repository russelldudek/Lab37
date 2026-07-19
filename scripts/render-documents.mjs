import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.DOCUMENT_BASE_URL || 'http://127.0.0.1:4173';
const documents = [
  {
    route: 'resume.html',
    output: 'docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Resume.pdf',
  },
  {
    route: 'cover-letter.html',
    output: 'docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Cover-Letter.pdf',
  },
  {
    route: 'interview-brief.html',
    output: 'docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Interview-Brief.pdf',
  },
  {
    route: '90-day-plan.html',
    output: 'docs/Russell-Dudek-Lab37-Robotics-Product-Manager-90-Day-Plan.pdf',
  },
];

await mkdir('docs', { recursive: true });
await mkdir('review-rendered/site', { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const document of documents) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    await page.goto(`${baseUrl}/${document.route}`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    await page.pdf({
      path: document.output,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    await page.close();
  }

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    await page.emulateMedia({ media: 'screen', colorScheme: 'dark' });
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    await page.screenshot({
      path: `review-rendered/site/index-${viewport.name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.close();
  }
} finally {
  await browser.close();
}
