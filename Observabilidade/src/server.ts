import express from 'express';
import { routes } from './routes/index.routes';
import { metricsMiddleware, register } from './middlewares/metrics.middleware';

const app = express();

app.use(express.json());
app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use(routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
