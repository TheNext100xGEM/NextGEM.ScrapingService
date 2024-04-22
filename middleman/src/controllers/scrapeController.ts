import { Request, Response } from 'express';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

export async function scrape(req: Request, res: Response) {
  const urls: string[] = req.body.urls;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'Invalid URLs array' });
  }

  try {
    const results = await Promise.all(urls.map(async (url) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/scrape`, { url });
        return { url, data: response.data };
      } catch (error) {
        return { url, error: error.message };
      }
    }));

    res.json({ results });
  } catch (error) {
    console.error('Scrape error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function scrapeSoup(req: Request, res: Response) {
  const urls: string[] = req.body.urls;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'Invalid URLs array' });
  }

  try {
    const results = await Promise.all(urls.map(async (url) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/scrape_soup`, { url });
        return { url, data: response.data };
      } catch (error) {
        return { url, error: error.message };
      }
    }));

    res.json({ results });
  } catch (error) {
    console.error('Scrape error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
