/**
 * Comet Browser Bridge for Claude Code
 * Connects to an existing Comet browser via CDP (Chrome DevTools Protocol)
 *
 * OPTIMIZED: Uses raw CDP HTTP for reads, puppeteer only for interactions
 *
 * Usage: node comet-bridge.js <command> [args...]
 * Commands:
 *   status           - Check if browser is accessible
 *   navigate <url>   - Navigate to a URL
 *   screenshot       - Take a screenshot (outputs base64)
 *   click <selector> - Click an element
 *   fill <selector> <value> - Fill an input field
 *   eval <script>    - Execute JavaScript and return result
 *   html             - Get page HTML
 *   pages            - List all open pages/tabs
 */

const DEBUG_PORT = 9222;
const CDP_URL = `http://127.0.0.1:${DEBUG_PORT}`;

// Fast path: raw CDP HTTP - no puppeteer overhead
async function cdpFetch(endpoint) {
    const response = await fetch(`${CDP_URL}${endpoint}`);
    return response.json();
}

async function cdpSend(wsUrl, method, params = {}) {
    const WebSocket = require('ws');
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        const id = 1;

        ws.on('open', () => {
            ws.send(JSON.stringify({ id, method, params }));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.id === id) {
                ws.close();
                if (msg.error) reject(new Error(msg.error.message));
                else resolve(msg.result);
            }
        });

        ws.on('error', reject);
        setTimeout(() => { ws.close(); reject(new Error('CDP timeout')); }, 10000);
    });
}

// Slow path: puppeteer - only loaded when needed
let puppeteer = null;
async function getPuppeteer() {
    if (!puppeteer) {
        puppeteer = require('puppeteer-core');
    }
    return puppeteer;
}

async function connectBrowser() {
    const pptr = await getPuppeteer();
    const version = await cdpFetch('/json/version');
    return pptr.connect({
        browserWSEndpoint: version.webSocketDebuggerUrl,
        defaultViewport: null
    });
}

async function getActivePage(browser) {
    const pages = await browser.pages();
    let page = pages.find(p => p.url() !== 'about:blank') || pages[0];
    if (!page) page = await browser.newPage();
    return page;
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log(JSON.stringify({ error: 'No command specified' }));
        process.exit(1);
    }

    try {
        // === FAST PATH: Raw CDP - no puppeteer ===

        if (command === 'status') {
            try {
                const version = await cdpFetch('/json/version');
                console.log(JSON.stringify({
                    connected: true,
                    endpoint: version.webSocketDebuggerUrl,
                    port: DEBUG_PORT
                }));
            } catch {
                console.log(JSON.stringify({ connected: false, port: DEBUG_PORT }));
            }
            return;
        }

        if (command === 'pages') {
            const targets = await cdpFetch('/json');
            const pages = targets
                .filter(t => t.type === 'page' && !t.url.startsWith('chrome-extension://'))
                .map((t, i) => ({
                    index: i,
                    url: t.url,
                    title: t.title,
                    id: t.id
                }));
            console.log(JSON.stringify({ pages }));
            return;
        }

        if (command === 'eval') {
            const script = args.slice(1).join(' ');
            if (!script) throw new Error('Script required');

            const targets = await cdpFetch('/json');
            const page = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://'));
            if (!page) throw new Error('No page found');

            const result = await cdpSend(page.webSocketDebuggerUrl, 'Runtime.evaluate', {
                expression: script,
                returnByValue: true
            });
            console.log(JSON.stringify({ success: true, result: result.result?.value }));
            return;
        }

        if (command === 'html') {
            const targets = await cdpFetch('/json');
            const page = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://'));
            if (!page) throw new Error('No page found');

            const result = await cdpSend(page.webSocketDebuggerUrl, 'Runtime.evaluate', {
                expression: 'document.documentElement.outerHTML',
                returnByValue: true
            });
            const html = result.result?.value || '';
            console.log(JSON.stringify({ success: true, html: html.substring(0, 50000) }));
            return;
        }

        // === SLOW PATH: Puppeteer - loaded on demand ===

        const browser = await connectBrowser();
        let page = await getActivePage(browser);

        switch (command) {
            case 'newtab': {
                page = await browser.newPage();
                const url = args[1] || 'about:blank';
                if (url !== 'about:blank') {
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                }
                console.log(JSON.stringify({
                    success: true,
                    url: page.url(),
                    title: await page.title()
                }));
                break;
            }

            case 'navigate': {
                const url = args[1];
                if (!url) throw new Error('URL required');
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                console.log(JSON.stringify({
                    success: true,
                    url: page.url(),
                    title: await page.title()
                }));
                break;
            }

            case 'screenshot': {
                const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
                console.log(JSON.stringify({
                    success: true,
                    screenshot: screenshot,
                    url: page.url()
                }));
                break;
            }

            case 'click': {
                const selector = args[1];
                if (!selector) throw new Error('Selector required');
                await page.waitForSelector(selector, { timeout: 5000 });
                await page.click(selector);
                console.log(JSON.stringify({ success: true, selector }));
                break;
            }

            case 'fill': {
                const selector = args[1];
                const value = args.slice(2).join(' ');
                if (!selector || !value) throw new Error('Selector and value required');
                await page.waitForSelector(selector, { timeout: 5000 });
                await page.type(selector, value);
                console.log(JSON.stringify({ success: true, selector, value }));
                break;
            }

            case 'select': {
                const pageIndex = parseInt(args[1]);
                const allPages = await browser.pages();
                if (!isNaN(pageIndex) && allPages[pageIndex]) {
                    page = allPages[pageIndex];
                    await page.bringToFront();
                    console.log(JSON.stringify({
                        success: true,
                        url: page.url(),
                        title: await page.title()
                    }));
                } else {
                    throw new Error('Invalid page index');
                }
                break;
            }

            default:
                console.log(JSON.stringify({ error: `Unknown command: ${command}` }));
                process.exit(1);
        }

        browser.disconnect();

    } catch (e) {
        console.log(JSON.stringify({ error: e.message, stack: e.stack }));
        process.exit(1);
    }
}

main();
