export class RetryService {
    static requestTimestamps = [];
    static DEFAULT_RATE_LIMIT = {
        requestsPerMinute: 30,
        requestsPerHour: 1000
    };
    static async withRetry(operation, options = {}) {
        const opts = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            backoffFactor: 2,
            jitter: true,
            ...options
        };
        let lastError;
        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                // Check rate limiting
                await this.enforceRateLimit();
                const result = await operation();
                // Reset rate limit tracking on success
                if (attempt > 0) {
                    console.log(`Operation succeeded on attempt ${attempt + 1}`);
                }
                return result;
            }
            catch (error) {
                lastError = error;
                if (attempt === opts.maxRetries) {
                    console.error(`Operation failed after ${opts.maxRetries + 1} attempts:`, lastError.message);
                    throw lastError;
                }
                // Calculate delay with exponential backoff and jitter
                const delay = this.calculateDelay(attempt, opts);
                console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
                await this.delay(delay);
            }
        }
        throw lastError;
    }
    static calculateDelay(attempt, options) {
        const { baseDelay = 1000, maxDelay = 30000, backoffFactor = 2, jitter = true } = options;
        let delay = baseDelay * Math.pow(backoffFactor, attempt);
        delay = Math.min(delay, maxDelay);
        if (jitter) {
            // Add random jitter (±25%)
            const jitterRange = delay * 0.25;
            delay += (Math.random() - 0.5) * 2 * jitterRange;
        }
        return Math.max(delay, 0);
    }
    static async enforceRateLimit(options = {}) {
        const opts = { ...this.DEFAULT_RATE_LIMIT, ...options };
        const now = Date.now();
        // Clean old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => now - timestamp < 60000 // Keep last minute
        );
        // Check minute limit
        if (this.requestTimestamps.length >= opts.requestsPerMinute) {
            const oldestRequest = Math.min(...this.requestTimestamps);
            const waitTime = 60000 - (now - oldestRequest);
            if (waitTime > 0) {
                console.log(`Rate limit reached, waiting ${waitTime}ms`);
                await this.delay(waitTime);
            }
        }
        // Add current request timestamp
        this.requestTimestamps.push(now);
    }
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static async withRateLimit(operation, rateLimitOptions = {}) {
        await this.enforceRateLimit(rateLimitOptions);
        return operation();
    }
}
// Enhanced User-Agent rotation
export class UserAgentService {
    static userAgents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
    ];
    static getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }
    static getHeaders() {
        return {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        };
    }
}
