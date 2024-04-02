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
const EXPRESS_PORT = +process.env.EXPRESS_PORT || 3000;
const client = new Redis({
  host: '127.0.0.1',
  port: REDIS_PORT,
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

const processUrl = async (url: string, path: string): Promise<ScrapeResult> => {
  try {
    const response = await axios.post<ScrapeData[]>(`${API_BASE_URL}/${path}`, { url });
    return { url, data: response.data };
  } catch (error) {
    return { url, error: error.message };
  }
};

const processUrlIfNotProcessing = async (url: string, path: string): Promise<ScrapeResult> => {
  const isProcessing = await client.exists(url);
  if (!isProcessing) {
    await client.set(url, 'processing');
    const result = await processUrl(url, path);
    await client.del(url);
    return result;
  } else {
    return { url, error: 'URL is already being processed' };
  }
};

const scrapeUrls = async (urls: string[], path: string): Promise<ScrapeResult[]> => {
  const pipeline = client.pipeline();

  // Check if each URL is already being processed
  urls.forEach((url) => {
    pipeline.exists(url);
  });

  // Execute Redis pipeline
  const isProcessingResults = await pipeline.exec();

  // Filter URLs that are not being processed
  const nonProcessingUrls = urls.filter((url, index) => !isProcessingResults[index][1]);

  // Process non-processing URLs concurrently
  const results = await Promise.all(nonProcessingUrls.map((url) => processUrl(url, path)));
  return results;
};

app.post('/scrape', async (req: Request, res: Response) => {
  try {
    const urls: string[] = req.body.urls;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Invalid URLs array' });
    }

    const results = await scrapeUrls(urls, req.path);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/scrape_soup', async (req: Request, res: Response) => {
  try {
    const urls: string[] = req.body.urls;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Invalid URLs array' });
    }

    const results = await scrapeUrls(urls, req.path);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(EXPRESS_PORT, () => {
  console.log(`Server running on port ${EXPRESS_PORT}`);
});
