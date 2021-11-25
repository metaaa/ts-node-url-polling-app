import * as bodyParser from 'body-parser'
import express from 'express'
import { register, collectDefaultMetrics, Summary, Counter } from 'prom-client'
import { loadTestUrl } from './middlewares/loadTest.middleware'
import ResourceCLI from './models/resourceCLI'

export default class App {
    public app: express.Application
    public port: number
    public urlList: string

    constructor(
        port: number,
        urlList: string,
    ) {
        this.app = express()
        this.port = port
        this.urlList = urlList

        this.initializeMiddlewares()
        this.initializeRoutes()
        this.initializeListeners()
        this.initializesErrorHandlers()
        this.initializePromClient()

        /**
         * If silent mode enabled all console.log() will be disabled
         */
        if (App.isCLIMode() && this.isSilentMode()) {
            console.log = function () {}
        }
    }

    /**
     * Is the app running in silent mode
     * 
     * @returns { boolean }
     */
    public isSilentMode(): boolean {
        return process.env['SILENT_MODE']?.toLowerCase() === 'true'
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the port: ${this.port}`)
        })
    }

    /**
     * Returns whether the app runs in verbose mode
     *
     * @returns { boolean }
     */
    static isVerboseMode(): boolean {
        return process.env['VERBOSE_MODE']?.toLowerCase() === 'true'
    }

    /**
     * Returns whether the app runs in CLI mode
     *
     * @returns { boolean }
     */
    static isCLIMode(): boolean {
        return process.env['CLI_MODE']?.toLowerCase() === 'true'
    }

    /**
     * Register the summary type metrics for the prom-client
     *
     * @private
     */
    private async initializePromClient() {
        register.setDefaultLabels({
            app: 'nodejs-url-poller'
        })

        collectDefaultMetrics({ register })

        /**
         * This metric registers the load times
         */
        const summary = new Summary({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'code'],
            maxAgeSeconds: 600,
            ageBuckets: this.urlList.length,
            // custom percentiles
            // percentiles: [0.5, 0.75, 0.9, 0,95, 0.99],
        })

        /**
         * This metric registers the failed request/invalid responses counter
         */
        const errorCounter = new Counter({
            name: 'http_request_invalid_responses',
            help: 'Counts invalid responses and timed out requests',
            labelNames: ['type', 'route'],
        })

        register.registerMetric(summary)
        register.registerMetric(errorCounter)

        /**
         * If the app is controlled from the command line the polling should start automatically
         */
        if (App.isCLIMode()) {
            await this.callLoadTest(summary, errorCounter)
        }
    }

    /**
     * Starts the polling for each of the provided urls
     *
     * @param summary
     * @param errorCounter
     * @private
     */
    private async callLoadTest(summary: Summary<any>, errorCounter: Counter<any>) {
        for await (const url of this.urlList.split(',')) {
            const resourceParams = new ResourceCLI(url)
            await loadTestUrl(summary, errorCounter, resourceParams)
        }
    }

    /**
     * Initializes middlewares
     */
    private async initializeMiddlewares() {
        try {
            this.app.use(bodyParser.json())
            this.app.use(bodyParser.urlencoded({ extended: true }))
            console.log(`Middlewares are ready!`)
        } catch (error) {
            console.error(`Couldn't set up middlewares: ${error}`)
        }
    }

    /**
     * Initializes routes
     */
    private async initializeRoutes() {
        try {
            this.app.route('/metrics')
                .get(async (request: express.Request, response: express.Response) => {
                    response.setHeader('Content-Type', register.contentType)
                    response.end(await register.metrics())
                })
            console.log(`Routes were set up!`)
        } catch (error) {
            console.error(`Couldn't set up routes: ${error}`)
        }
    }

    /**
     * Initializes uncaught exception and unhandled rejection listeners
     */
    private async initializeListeners() {
        process.on('uncaughtException', error => {
            console.error('UNCAUGHT EXCEPTION! App will shut down...')
            console.error(error.name, error.message)
            process.exit(1)
          })

        process.on('unhandledRejection', (error, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason: ', error)
        })
    }

    /**
     * Initializes an error handler to catch all unhandled errors
     */
    private async initializesErrorHandlers() {
        this.app.use(
            function(error: any, request: express.Request, response: express.Response, next: express.NextFunction) {
                console.error(error.message)
                response.status(error.status || 500)
          })
    }
}