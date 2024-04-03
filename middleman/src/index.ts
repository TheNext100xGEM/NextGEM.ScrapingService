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
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const client = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

const processUrls = (urls: string[], path: string): Promise<ScrapeResult[]> => {
  const requests = urls.map(url => axios.post(`${API_BASE_URL}/${path}`, { url }));
  return axios.all(requests).then(axios.spread((...responses) => {
    return responses.map(response => ({
      url: JSON.parse(response.config.data).url,
      data: response.data
    }));
  })).catch(error => {
    console.error('Error processing URLs:', error);
    return [];
  });
};

const scrapeUrls = async (urls: string[], path: string): Promise<ScrapeResult[]> => {
  const results: ScrapeResult[] = [];
  const batchSize = 10; // Adjust batch size as needed
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batchUrls = urls.slice(i, i + batchSize);
    const batchResults = await processUrls(batchUrls, path);
    results.push(...batchResults);
  }
  
  return results;
};

const handleScrapingRequest = async (req: Request, res: Response, path: string) => {
  try {
    const urls: string[] = req.body.urls;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Invalid URLs array' });
    }
    const results = await scrapeUrls(urls, path);
    res.json({ results });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

app.post('/scrape', (req: Request, res: Response) => {
  handleScrapingRequest(req, res, req.path);
});

app.post('/scrape_soup', (req: Request, res: Response) => {
  handleScrapingRequest(req, res, req.path);
});

app.listen(EXPRESS_PORT, () => {
  console.log(`Server running on port ${EXPRESS_PORT}`);
});
