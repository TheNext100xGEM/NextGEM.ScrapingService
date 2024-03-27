import express, { Request, Response } from 'express';
import axios from 'axios';
import * as crypto from 'crypto';

const app = express();
app.use(express.json());

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

function enqueueRequest(domainName: string, url: string, res: Response, endpoint: string): void {
  const requestId = randomHex(48);
  if (!domainQueues[domainName]) {
    domainQueues[domainName] = { activeRequests: 0, queue: [] };
  }

  pendingRequests[requestId] = { url, isFinished: false, html: '' };
  domainQueues[domainName].queue.push({ url, res, endpoint });
  processQueueForDomain(domainName, requestId);
}

const processQueueForDomain = async (domainName: string, requestId?: string): Promise<void> => {
  const domainQueue = domainQueues[domainName];
  if (!domainQueue) return;

  if (domainQueue.activeRequests < LIMIT_REQUESTS && domainQueue.queue.length > 0) {
    const { url, res, endpoint } = domainQueue.queue.shift()!;
    domainQueue.activeRequests++;

    console.log(`Processing ${url} for ${endpoint} in domain: ${domainName}`);

    let apiEndpoint: string;
    switch (endpoint) {
    case 'scrape':
      apiEndpoint = 'http://34.68.89.147:5000/scrape';
      break;
    case 'scrape_soup':
      apiEndpoint = 'http://34.68.89.147:5000/scrape_soup';
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
      res.send(response.data);
    } catch (error) {
      res.status(500).send('Error processing your request');
    }
    domainQueue.activeRequests--;
    processQueueForDomain(domainName);
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

app.post('/scrape', (req: Request, res: Response) => {
  const { url } = req.body;
  const domainName = getDomainName(url);
  if (domainName) {
    enqueueRequest(domainName, url, res, 'scrape');
  } else {
    res.status(400).send('Invalid URL');
  }
});

app.post('/scrape_soup', (req: Request, res: Response) => {
  const { url } = req.body;
  const domainName = getDomainName(url);
  if (domainName) {
    enqueueRequest(domainName, url, res, 'scrape_soup');
  } else {
    res.status(400).send('Invalid URL');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
