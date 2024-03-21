const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const LIMIT_REQUESTS = 2;
let domainQueues = {}; // Stores queues for each domain

function getDomainName(url) {
    try {
        return new URL(url).hostname;
    } catch (error) {
        return null;
    }
}

// [requestId]: {url, isFinished, html, timeout}

let pendingRequests = {}

const randomHex = (length) => {

    const numberOfBytes = Math.ceil(length / 2);
    const randomBytes = crypto.randomBytes(numberOfBytes);

    return randomBytes.toString('hex').slice(0, length);
}

function enqueueRequest(domainName, url, res, endpoint) {
    const requestId = randomHex(48);
    if (!domainQueues[domainName]) {
        domainQueues[domainName] = { activeRequests: 0, queue: [] };
    }
    
    pendingRequests[requestId] = { url, isFinished: false, html: ''};
    domainQueues[domainName].queue.push({ url, res, endpoint });
    processQueueForDomain(domainName, requestId);
}
const processQueueForDomain = async (domainName, requestId)  => {
    const domainQueue = domainQueues[domainName];
    if (!domainQueue) return;

    if (domainQueue.activeRequests < LIMIT_REQUESTS && domainQueue.queue.length > 0) {
        const { url, res, endpoint } = domainQueue.queue.shift();
        domainQueue.activeRequests++;

        console.log(`Processing ${url} for ${endpoint} in domain: ${domainName}`);

        const apiEndpoint = endpoint === 'scrape' ? 'http://localhost:3001/scrape' : 'http://localhost:3001/scrape_soup';
        try{
           
            let response = await axios.post(apiEndpoint, { url })
            pendingRequests[requestId].isFinished = true;
            pendingRequests[requestId].html = response.data.html;
            
            pendingRequests.timeout = setTimeout(() => { 
                delete pendingRequests[requestId];
            }, 60*1000*2);
        
        }catch(UnhandledPromiseRejectionWarning){
            res.status(500).send("Error processing your request");
        }
        domainQueue.activeRequests--;
        processQueueForDomain(domainName);
    
    }
}

app.get('/result/:requestId', (req, res) => {
    const { requestId } = req.params;
    const request = pendingRequests[requestId];

    const {
        isFinished,
        html,
        url
    } = request;

    if (request) {
        res.json(
            { 
                isFinished,
                html,
                url 
            }
        );

    } else {
        res.status(404).send('Request not found');
    }
})

app.post('/scrape', (req, res) => {
    const { url } = req.body;
    const domainName = getDomainName(url);
    if (domainName) {
        enqueueRequest(domainName, url, res, 'scrape');
    } else {
        res.status(400).send("Invalid URL");
    }
});

app.post('/scrape_soup', (req, res) => {
    const { url } = req.body;
    const domainName = getDomainName(url);
    if (domainName) {
        enqueueRequest(domainName, url, res, 'scrape_soup');
    } else {
        res.status(400).send("Invalid URL");
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});