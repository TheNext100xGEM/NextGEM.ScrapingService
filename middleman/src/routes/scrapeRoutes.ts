import express from 'express';
import { scrape, scrapeSoup } from '../controllers/scrapeController';

const router = express.Router();

router.post('/scrape', scrape);
router.post('/scrape_soup', scrapeSoup);

export default router;
