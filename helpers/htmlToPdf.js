const puppeteer = require('puppeteer');

const defaultOptions = {
    format: 'A4',
    printBackground: true,
    executablePath: '/usr/bin/chromium-browser', 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};

const htmlToPdf = async (html, options = defaultOptions) => {
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf(options);

    await browser.close();
    return pdfBuffer;
};

module.exports = htmlToPdf;