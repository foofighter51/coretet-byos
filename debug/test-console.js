// Simple script to test what console logs show in the browser
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Listen to console logs
    page.on('console', msg => {
      if (msg.text().includes('CoreTet') || msg.text().includes('V2') || msg.text().includes('Feature')) {
        console.log('BROWSER LOG:', msg.text());
      }
    });
    
    // Listen to errors
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173');
    
    // Wait a bit for the app to initialize
    await page.waitForTimeout(3000);
    
    // Try to get the window features object
    const features = await page.evaluate(() => {
      return window.__CORETET_FEATURES__;
    });
    
    console.log('Features object:', features);
    
    await browser.close();
  } catch (error) {
    console.log('Could not run browser test:', error.message);
    console.log('Try manually checking the browser console at http://localhost:5173');
  }
})();