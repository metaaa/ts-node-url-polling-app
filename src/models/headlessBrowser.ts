
import puppeteer, { Browser, BrowserContext, Page } from 'puppeteer'
import { successC, resetC, warnC, bold } from '../helpers/terminalColors';

export default class HeadlessBrowser {
    private browserInstance!: Browser
    private incognitoBrowserContext!: BrowserContext

    /**
     * Creates a new incognito browser context. This won't share cookies/cache with other
     * browser contexts.
     */
    public async initIncognitoBrowserContext() {
        try {
            this.browserInstance = await puppeteer.launch({
                headless: true,
                args: ['--use-gl=egl'],
            });
            this.incognitoBrowserContext = await this.browserInstance.createIncognitoBrowserContext()

            console.log(`${bold}[ ${successC}UP${resetC}${bold} ] - A browser instance were created (${(await this.browserInstance.version()).toString()})`)

            this.incognitoBrowserContext.on('targetdestroyed', () => {
                this.browserInstance.pages()
                .then(async (pageList) => {
                    if (pageList.length === 1) {
                        console.log(`${bold}Shutting down browser...`)
                        
                        await this.browserInstance.close()
                    }
                })
            })
        } catch (err) {
            console.error(`Failed to initiate browser instance`)
            process.exit(1)
        }
    }

    /**
     * Creates a new page in the browser context.
     * 
     * @returns { Promise }
     */
    public async openNewPage(): Promise<Page> {
        const newPage = await this.incognitoBrowserContext.newPage()
        // disable caching 
        await newPage.setCacheEnabled(false)

        return newPage
    }

    public closeBrowser(): void {
        this.browserInstance.close()
        console.log(`[ ${warnC}CLOSED${resetC} ] Browser is closed, because every polling is done.`)
    }
}
