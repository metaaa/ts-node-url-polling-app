interface BucketParams {
    // common properties
    name: string,
    help: string,
    labelNames: Array<string>,
    // summary specific properties
    percentiles?: Array<number>;
	maxAgeSeconds?: number;
	ageBuckets?: number;
	compressCount?: number;
}