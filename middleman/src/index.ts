import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Redis from 'ioredis';

const app = express();
app.use(express.json());
dotenv.config();

interface ScrapeData {
  text: string;
}

interface ScrapeResult {
  url: string;
  data?: ScrapeData[];
  error?: string;
}

const API_BASE_URL = process.env.API_BASE_URL;
const REDIS_PORT = +process.env.REDIS_PORT || 6379;
const client = new Redis({
  host: '127.0.0.1', // Kubernetes will resolve this to the correct IP
  port: REDIS_PORT, // Redis default port
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

const processUrl = async (url: string): Promise<ScrapeResult> => {
  try {
    const response = await axios.post<ScrapeData[]>(`${API_BASE_URL}/scrape`, { url });
    return { url, data: response.data };
  } catch (error) {
    return { url, error: error.message };
  }
};

const processUrlIfNotProcessing = async (url: string): Promise<ScrapeResult> => {
  const isProcessing = await client.exists(url);

  if (!isProcessing) {
    await client.set(url, 'processing');
    const result = await processUrl(url);
    await client.del(url);
    return result;
  } else {
    return { url, error: 'URL is already being processed' };
  }
};

app.post('/scrape', async (req: Request, res: Response) => {
  try {
    const urls: string[] = req.body.urls;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Invalid URLs array' });
    }

    const results = await Promise.all(urls.map(processUrlIfNotProcessing));
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(6000, () => {
  console.log('Server running on port 3000');
});
