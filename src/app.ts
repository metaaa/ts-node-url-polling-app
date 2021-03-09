import * as bodyParser from 'body-parser'
import express from 'express'
import { register, collectDefaultMetrics, Summary } from 'prom-client'
import { loadTestUrl } from './middlewares/urlPoller.middleware'

export default class App {
    public app: express.Application
    public port: number
    public urlList: string
    public repeat: number
    public counter: number
    public endlessMode: boolean

    constructor(port: number, urlList: string, repeat: number, endlessMode: boolean) {
        this.app = express()
        this.port = port
        this.urlList = urlList
        this.repeat = repeat
        this.counter = 0
        this.endlessMode = endlessMode

        this.initializeMiddlewares()
        this.initializeRoutes()
        this.initializeListeners()
        this.initializesErrorHandlers()
        this.initializePromClient()
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the port: ${this.port}`)
        })
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

        const httpRequestDurationMicroseconds = new Summary({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'code'],
            maxAgeSeconds: 600,
            ageBuckets: this.urlList.length,
            // percentiles: [0.5, 0.75, 0.9, 0,95, 0.99],
        })

        register.registerMetric(httpRequestDurationMicroseconds)
        this.callLoadTest(httpRequestDurationMicroseconds)
    }

    /**
     * Calls the test recursively
     *
     * @param summary
     * @private
     */
    private async callLoadTest(summary: any) {
        for await (const url of this.urlList.split(',')) {
            await loadTestUrl(summary, url, this.repeat, this.endlessMode)
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
     * Initializes uncaugth exception and unhandled rejection listeners
     */
    private async initializeListeners() {
        process.on('uncaughtException', error => {
            console.error('UNCAUGHT EXCEPTION! App will shut down...')
            console.error(error.name, error.message)
            process.exit(1)
          })

        process.on("unhandledRejection", (error, promise) => {
            console.error("Unhandled Rejection at:", promise, "reason:", error)
        })
    }

    /**
     * Initializes an error handler to catch all unhandled errors
     */
    public async initializesErrorHandlers() {
        this.app.use(function(error: any, request: express.Request, response: express.Response, next: express.NextFunction) {
            console.error(error.message)
            response.status(error.status || 500)
          })
    }
}
