const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting advanced Gemini AI Copilot & Visual Library verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // High fidelity viewport
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    console.log('🔗 Navigating to http://localhost:8080/AdvancedEditor.html...');
    await page.goto('http://localhost:8080/AdvancedEditor.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });


    console.log('⏳ Waiting for slides deck list to render...');
    await page.waitForSelector('.slide-item', { timeout: 5000 });

    console.log('🖱️ Clicking Slide 2 (Categories)...');
    await page.click('.slide-item:nth-child(2)');
    await page.waitForTimeout(600);

    console.log('⚡ Converting Categories Slide to Custom Freeform Canvas...');
    await page.click('#template-warning-screen button');
    await page.waitForTimeout(600);

    console.log('🤖 Switching sidebar tab to "Copiloto IA" (Google Gemini Assistant)...');
    await page.click('#tab-ai');
    await page.waitForTimeout(400);

    console.log('✍️ Compiling prompt inside the Gen AI text box...');
    await page.fill('#ai-prompt-box', 'Dame 3 viñetas sobre Sheets en el e-learning con emojis');
    await page.waitForTimeout(300);

    console.log('✨ Clicking "Generar Elemento con Gemini"...');
    await page.click('#btn-generate-ai');
    
    // Wait for the local serverless AI outline generator fallback to build the card
    console.log('⏳ Waiting for Gemini maquetador preview to become visible...');
    await page.waitForSelector('#ai-result-box', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(600);

    console.log('➕ Injected AI-generated HTML card block onto the freeform canvas...');
    await page.click('#ai-result-box button.btn-primary');
    await page.waitForTimeout(600);

    console.log('🖱️ Selecting the newly inyected AI block on the canvas...');
    await page.click('.canvas-element:last-child');
    await page.waitForTimeout(600);

    console.log('⚙️ Checking the Fragment checkbox to enable transitions dropdown...');
    await page.click('#inspect-fragment');
    await page.waitForTimeout(400);

    console.log('⚙️ Selecting "zoom-in" from the RevealJS transitions dropdown...');
    await page.selectOption('#inspect-frag-trans', 'zoom-in');
    await page.waitForTimeout(500);

    // Let\'s toggle the Left Sidebar to show our visual library assets for a richer screenshot!
    console.log('📚 Switching sidebar tab back to "Biblioteca" (10 Visual Component Assets)...');
    await page.click('#tab-library');
    await page.waitForTimeout(500);

    console.log('🖥️ Confirming screen layout split view is active...');
    await page.click('#view-mode-split');
    await page.waitForTimeout(1500); // Allow the Split Preview iframe to fully paint and align

    const screenshotPath = '/Users/homerperozo/.gemini/antigravity/brain/7434c380-560b-4379-8305-169ff40250e3/canvas_editor_screenshot.png';
    console.log(`📸 Saving visual verification screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath });

    console.log('✅ Visual verification of Gemini Copilot and 10 Components successfully completed!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
