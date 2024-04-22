import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { expressjwt } from 'express-jwt';

dotenv.config();

const app = express();
app.use(express.json());

const API_BASE_URL = process.env.API_BASE_URL || 'http://default.api.url';
const PORT = +process.env.EXPRESS_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

const authenticateJWT = expressjwt({ secret: JWT_SECRET, algorithms: ['HS256'] });

interface ScrapeData {
  text: string;
}
interface ScrapeResult {
  url: string;
  data?: ScrapeData;
  error?: string;
  responseTime?: number;
}

const scrapeEndpoint = async (req: Request, res: Response, endpoint: string) => {
  try {
    const urls: string[] = req.body.urls;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Invalid URLs array' });
    }

    const results: ScrapeResult[] = [];
    await Promise.all(urls.map(async (url) => {
      try {
        const startTime = Date.now();
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, { url });
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        results.push({ url, data: response.data, responseTime: elapsedTime });
      } catch (error) {
        results.push({ url, error: error.message });
      }
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

app.post('/scrape', authenticateJWT, async (req: Request, res: Response) => {
  await scrapeEndpoint(req, res, '/scrape');
});

app.post('/scrape_soup', authenticateJWT, async (req: Request, res: Response) => {
  await scrapeEndpoint(req, res, '/scrape_soup');
});

// Login route to generate JWT token
app.post('/login', (req: Request, res: Response) => {
  // Here you should validate the user credentials
  const username = req.body.username;
  const password = req.body.password;

  // Dummy check, replace it with your authentication logic
  if (username === 'admin' && password === 'nextgemai') {
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Error handling middleware for JWT authentication
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});