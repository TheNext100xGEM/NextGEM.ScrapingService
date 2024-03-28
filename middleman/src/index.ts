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

const pendingRequests: { [requestId: string]: PendingRequest } = {};

const randomHex = (length: number): string => {
  const numberOfBytes = Math.ceil(length / 2);
  const randomBytes = crypto.randomBytes(numberOfBytes);
  return randomBytes.toString('hex').slice(0, length);
};

const enqueueRequest = async (domainName: string, url: string, res: Response, endpoint: string): Promise<string> => {
  const requestId = randomHex(48);
  if (!domainQueues[domainName]) {
    domainQueues[domainName] = { activeRequests: 0, queue: [] };
  }
  pendingRequests[requestId] = { url, isFinished: false, html: '' };
  domainQueues[domainName].queue.push({ url, res, endpoint });
  const response = await processQueueForDomain(domainName, requestId);
  return response;
};

const processQueueForDomain = async (domainName: string, requestId?: string): Promise<string> => {
  const domainQueue = domainQueues[domainName];
  if (!domainQueue) return;

  if (domainQueue.activeRequests < LIMIT_REQUESTS && domainQueue.queue.length > 0) {
    const shiftedElement = domainQueue.queue.shift();
    if (shiftedElement) {
      const { url, res, endpoint } = shiftedElement;
      domainQueue.activeRequests++;

      console.log(`Processing ${url} for ${endpoint} in domain: ${domainName}`);

      let apiEndpoint: string;

      switch (endpoint) {
      case 'scrape':
        apiEndpoint = `${process.env.API_BASE_URL}/scrape`;
        break;
      case 'scrape_soup':
        apiEndpoint = `${process.env.API_BASE_URL}/scrape_soup`;
        break;
      default:
        throw new Error('Invalid endpoint');
      }

      try {
        // res.send({ requestId });
        const response = await axios.post(apiEndpoint, { url });
        // console.log(response.data);
        pendingRequests[requestId!].isFinished = true;
        pendingRequests[requestId!].html = response.data?.html;

        pendingRequests[requestId!].timeout = setTimeout(() => {
          delete pendingRequests[requestId!];
        }, 60 * 1000 * 2);
        return response.data.text;
      } catch (error) {
        res.status(500).send('Error processing your request');
      }
      domainQueue.activeRequests--;
      processQueueForDomain(domainName);
    }
    return;
  }
};

app.get('/result/:requestId', (req: Request, res: Response) => {
  const { requestId } = req.params;
  const request = pendingRequests[requestId];

  if (request) {
    const { isFinished, html, url } = request;
    res.json({ isFinished, html, url });
  } else {
    res.status(404).send('Request not found');
  }
});

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
        const response = await axios.post(`${process.env.API_BASE_URL}/scrape`, { url });
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
        const response = await axios.post(`${process.env.API_BASE_URL}/scrape_soup`, { url });
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
