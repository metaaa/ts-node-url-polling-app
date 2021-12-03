import MetricCommon from './metricCommon';
import { Summary } from 'prom-client';

export default class SummaryBucket extends MetricCommon {
    private percentiles!: Array<number>;
	private maxAgeSeconds!: number;
	private ageBuckets!: number;
	private compressCount!: number;
    public metricObject!: Summary<string>

    constructor({ name, help, labelNames }: BucketParams) {
        super({name, help, labelNames})

        this.metricObject = new Summary({
            name: this.name,
            help: this.help,
            labelNames: this.labelNames,
            maxAgeSeconds: this.maxAgeSeconds || undefined,
            ageBuckets: this.ageBuckets || undefined,
            percentiles: this.percentiles || undefined,
            compressCount: this.compressCount || undefined,
        })
    }

    public getPercentiles(): Array<number> {
        return this.percentiles
    }

    public getMaxAgeSeconds(): number {
        return this.maxAgeSeconds
    }

    public getAgeBuckets(): number {
        return this.ageBuckets
    }

    public getCompressCount(): number {
        return this.compressCount
    }

    public setPercentiles(percentiles: Array<number>) {
        this.percentiles = percentiles
    }

    public setMaxAgeSeconds(maxAge: number) {
        this.maxAgeSeconds = maxAge
    }

    public setAgeBuckets(buckets: number) {
        this.ageBuckets = buckets
    }

    public setCompressCount(count: number) {
        this.compressCount = count
    }

}
