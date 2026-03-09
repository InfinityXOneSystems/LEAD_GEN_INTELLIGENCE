from unittest.mock import MagicMock, patch

import pytest

from app.scrapers.base import BaseScraper
from app.scrapers.website import WebsiteCrawler
from app.services.lead_scorer import LeadScorer


class ConcreteScraper(BaseScraper):
    def scrape(self, query, city="", state=""):
        return [{"company_name": "Test Co", "city": city, "state": state}]

    def parse_results(self, raw_content):
        return []


def test_base_scraper_random_user_agent():
    scraper = ConcreteScraper()
    ua = scraper.random_user_agent()
    assert isinstance(ua, str)
    assert "Mozilla" in ua


def test_base_scraper_get_headers():
    scraper = ConcreteScraper()
    headers = scraper.get_headers()
    assert "User-Agent" in headers
    assert "Accept" in headers


def test_base_scraper_scrape():
    scraper = ConcreteScraper()
    results = scraper.scrape("test", city="Austin", state="TX")
    assert len(results) == 1
    assert results[0]["company_name"] == "Test Co"


def test_website_crawler_extract_emails():
    crawler = WebsiteCrawler()
    html = "Contact us at info@acme-corp.com or support@mycompany.org for help"
    emails = crawler._extract_emails(html)
    assert "info@acme-corp.com" in emails
    assert "support@mycompany.org" in emails


def test_website_crawler_extract_phones():
    crawler = WebsiteCrawler()
    html = "Call us at (555) 123-4567 or 800-555-9999"
    phones = crawler._extract_phones(html)
    assert len(phones) >= 1


def test_website_crawler_extract_owner_name():
    from bs4 import BeautifulSoup

    crawler = WebsiteCrawler()
    html = "<p>Owner: John Smith runs this business</p>"
    soup = BeautifulSoup(html, "html.parser")
    name = crawler._extract_owner_name(soup)
    assert name == "John Smith"


def test_lead_scorer_full_score():
    scorer = LeadScorer()

    class Lead:
        email = "test@test.com"
        phone = "555-1234"
        website = "https://test.com"
        reviews = 50
        rating = 4.5

    assert scorer.score(Lead()) == 100.0


def test_lead_scorer_empty():
    scorer = LeadScorer()

    class Lead:
        email = None
        phone = None
        website = None
        reviews = 0
        rating = 0.0

    assert scorer.score(Lead()) == 0.0


def test_lead_scorer_partial():
    scorer = LeadScorer()

    class Lead:
        email = "test@test.com"
        phone = None
        website = "https://test.com"
        reviews = 2
        rating = 3.0

    assert scorer.score(Lead()) == 40.0
