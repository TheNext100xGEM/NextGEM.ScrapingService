import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium_stealth import stealth
from bs4 import BeautifulSoup
import fitz  # PyMuPDF

def get_soup(url: str, taskid: str, logger):
    """ Scraping with or without Selenium driver """
    # Start headless browser (stealthy as fuck)
    service = ChromeService()

    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # run in headless mode
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--disable-popup-blocking')  # disable pop-up blocking
    options.add_argument('--start-maximized')  # start the browser window in maximized mode
    options.add_argument('--disable-extensions')  # disable extensions
    options.add_argument('--no-sandbox')  # disable sandbox mode
    options.add_argument('--disable-dev-shm-usage')  # disable shared memory usage

    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    # TODO: rotate user agent if needed (https://www.zenrows.com/blog/selenium-stealth#scrape-with-stealth)

    stealth(driver, languages=["en-US", "en"], vendor="Google Inc.", platform="Win32", webgl_vendor="Intel Inc.",
            renderer="Intel Iris OpenGL Engine", fix_hairline=True)
        
    # Get soup
    try:
        logger.info(f'[{taskid}] Trying Selenium')
        driver.get(url)
        while driver.execute_script("return document.readyState") != "complete":
            pass
        soup = BeautifulSoup(driver.page_source, "html.parser")
        logger.info(f'[{taskid}] {url} soup length: {len(soup.text)}')
        return soup
    except Exception as e:
        # Probably a timeout or bot detection
        logger.info(f'[{taskid}] Trying BS4, Selenium exception: {e}')
        try:
            response = requests.get(url)
            soup = BeautifulSoup(response.text, "html.parser")
            logger.info(f'[{taskid}] {url} soup length: {len(soup.text)}')
            return soup
        except Exception as ee:
            logger.info(f'[{taskid}] BS4 exception: {ee}')
            return None


def soup_to_text(soup, taskid, logger):
    """ Extract text from bs4 soup """
    paragraphs = soup.find_all(text=True)

    texts = [p.text for p in paragraphs if (len(p.text) > 1) and (" " in p.text)]  # Filter short texts

    # Concat text segments
    if len(texts) > 1:
        texts = [texts[i] for i in range(1, len(texts) - 1) if texts[i] != texts[i + 1]]
    text = '\n'.join(texts)

    if 'page not found' in text.lower():
        logger.info(f'[{taskid}] "Page Not Found" in text, returning empty string')
        return ''
    else:
        return text


def get_pdf_text(url: str, taskid: str, logger):
    try:
        response = requests.get(url)
        pdf = fitz.open("pdf", response.content)

        # Extract text from each page
        text = ""
        for page_number, page in enumerate(pdf):
            page_text = page.get_text()
            if len(page_text) > 0:
                text += page_text
            else:
                # TODO text might be saved as image on the PDF page, probably needs OCR like PyTessaract
                pass
        logger.info(f'[{taskid}] PDF parsing success')
        pdf.close()  # Close the document object when done
    except Exception as e:
        logger.info(f'[{taskid}] PDF parsing error: {response} - {e}')
        return ""
    return text


def get_text(url: str, taskid: str, logger):
    if ".pdf" in url.lower():
        logger.info(f'[{taskid}] Processing as PDF file')
        text = get_pdf_text(url, taskid, logger)
    else:
        logger.info(f'[{taskid}] Processing as web page')
        soup = get_soup(url, taskid, logger)
        text = '' if soup is None else soup_to_text(soup, taskid, logger)

    logger.info(f'[{taskid}] {url} text length: {len(text)}')
    return text
