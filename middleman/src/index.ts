import express, { Request, Response } from 'express';
import axios from 'axios';
import * as crypto from 'crypto';
import dotenv from 'dotenv';

const app = express();
app.use(express.json());
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;
const LIMIT_REQUESTS = 2;
const domainQueues: {
  [domainName: string]: {
    activeRequests: number;
    queue: { url: string; res: Response; endpoint: string }[];
  };
} = {};
const getDomainName = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return null;
  }
};

interface PendingRequest {
  url: string;
  isFinished: boolean;
  html: string;
  timeout?: NodeJS.Timeout;
}

app.post('/scrape', async (req: Request, res: Response) => {
  try {
    const urls: string[] = req.body.urls;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Invalid URLs array' });
    }

    const results: any[] = [];
    // Send requests to scrape each URL concurrently
    await Promise.all(urls.map(async (url) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/scrape`, { url });
        results.push({ url, data: response.data });
      } catch (error) {
        results.push({ url, error: error.message });
      }
    }));

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

    const results: any[] = [];
    // Send requests to scrape each URL concurrently
    await Promise.all(urls.map(async (url) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/scrape_soup`, { url });
        results.push({ url, data: response.data });
      } catch (error) {
        results.push({ url, error: error.message });
      }
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(3000, () => {
  console.log('Server running on port 3000');
});