import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse('http://localhost:3010', options);

  // Generate report
  const reportHtml = runnerResult.report;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, '..', 'temp', `lighthouse-${timestamp}.html`);
  
  fs.writeFileSync(reportPath, reportHtml);
  
  console.log('\n✅ Lighthouse Report Generated!');
  console.log(`📊 Report saved to: ${reportPath}`);
  console.log('\n📈 Performance Scores:');
  console.log(`   FCP: ${runnerResult.lhr.audits['first-contentful-paint'].displayValue}`);
  console.log(`   LCP: ${runnerResult.lhr.audits['largest-contentful-paint'].displayValue}`);
  console.log(`   Speed Index: ${runnerResult.lhr.audits['speed-index'].displayValue}`);
  console.log(`   Performance Score: ${runnerResult.lhr.categories.performance.score * 100}/100`);

  await chrome.kill();
}

runLighthouse().catch(console.error);
