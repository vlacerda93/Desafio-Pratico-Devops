import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a custom registry
const register = new client.Registry();

// Enable default metrics scrape (CPU, Memory, etc.)
client.collectDefaultMetrics({ register });

// Define counter for HTTP request total count
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests made to the API',
  labelNames: ['method', 'route', 'status_code'],
});

// Define histogram for HTTP response duration in seconds
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDurationSeconds);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    // Get matched route pattern or fallback to path to avoid path parameter cardinality explosion
    const route = req.route ? req.route.path : (req.baseUrl + (req.path === '/' ? '' : req.path));
    const routeLabel = route || 'unknown';

    httpRequestCounter.labels(req.method, routeLabel, res.statusCode.toString()).inc();
    httpRequestDurationSeconds.labels(req.method, routeLabel, res.statusCode.toString()).observe(durationInSeconds);
  });

  next();
};

export { register };
