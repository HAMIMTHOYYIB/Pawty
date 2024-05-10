// const puppeteer = require('puppeteer');

// const defaultOptions = {
//     format: 'A4',
//     printBackground: true
// };

// const htmlToPdf = async (html, options = defaultOptions) => {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: 'domcontentloaded' });

//     const pdfBuffer = await page.pdf(options);

//     await browser.close();
//     return pdfBuffer;
// };

// module.exports = htmlToPdf;

const puppeteer = require('puppeteer');

const defaultOptions = {
    format: 'A4',
    printBackground: true,
    executablePath: '/usr/bin/chromium-browser', // Path to the installed Chromium
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for running Puppeteer in AWS EC2
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
