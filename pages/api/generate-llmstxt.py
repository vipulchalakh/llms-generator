from http.server import BaseHTTPRequestHandler
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
from typing import Dict, List, Set, Optional
import time

class LLMsTxtGenerator:
    def __init__(self, base_url: str, max_pages: int = 20):  # Further reduced for Vercel
        self.base_url = base_url
        self.domain = urlparse(base_url).netloc
        self.max_pages = max_pages
        self.visited_urls: Set[str] = set()
        self.pages_data: List[Dict] = []
        self.navigation_links: List[Dict] = []
        self.contact_info: List[Dict] = []
        self.services: List[Dict] = []
        self.resources: List[Dict] = []
        
    def is_internal_link(self, url: str) -> bool:
        """Check if URL is internal to the same domain."""
        try:
            parsed = urlparse(url)
            return parsed.netloc == self.domain or not parsed.netloc
        except:
            return False
    
    def clean_url(self, url: str) -> str:
        """Clean and normalize URL."""
        if url.startswith('//'):
            url = 'https:' + url
        elif url.startswith('/'):
            url = urljoin(self.base_url, url)
        return url.split('#')[0]  # Remove fragments
    
    def extract_text_content(self, element) -> str:
        """Extract clean text content from HTML element."""
        if element is None:
            return ""
        
        # Remove script and style elements
        for script in element(["script", "style"]):
            script.decompose()
        
        text = element.get_text()
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        return text
    
    def categorize_link(self, url: str, text: str, title: str) -> str:
        """Categorize a link based on URL and text content."""
        url_lower = url.lower()
        text_lower = text.lower()
        title_lower = title.lower()
        
        # Contact links
        contact_keywords = ['contact', 'about', 'team', 'email', 'phone', 'tel:', 'mailto:', 'support']
        if any(keyword in url_lower or keyword in text_lower for keyword in contact_keywords):
            return 'contact'
        
        # Service links
        service_keywords = ['service', 'product', 'pricing', 'features', 'solutions', 'offer']
        if any(keyword in url_lower or keyword in text_lower for keyword in service_keywords):
            return 'services'
        
        # Resource links
        resource_keywords = ['blog', 'article', 'news', 'resource', 'guide', 'tutorial', 'help', 'docs']
        if any(keyword in url_lower or keyword in text_lower for keyword in resource_keywords):
            return 'resources'
        
        # Navigation links (default)
        return 'navigation'
    
    def crawl_page(self, url: str) -> Optional[Dict]:
        """Crawl a single page and extract information."""
        if url in self.visited_urls or len(self.visited_urls) >= self.max_pages:
            return None
        
        self.visited_urls.add(url)
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=3)  # Very short timeout
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract basic page info
            title = soup.find('title')
            title_text = title.get_text().strip() if title else ""
            
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc.get('content', '') if meta_desc else ""
            
            h1 = soup.find('h1')
            h1_text = h1.get_text().strip() if h1 else ""
            
            # Extract first paragraph
            first_p = soup.find('p')
            first_p_text = first_p.get_text().strip() if first_p else ""
            
            # Extract links
            links = []
            for link in soup.find_all('a', href=True):
                href = link.get('href')
                text = self.extract_text_content(link).strip()
                
                if href and text and len(text) < 100:  # Reasonable link text length
                    clean_href = self.clean_url(href)
                    if self.is_internal_link(clean_href):
                        category = self.categorize_link(clean_href, text, title_text)
                        links.append({
                            'url': clean_href,
                            'text': text,
                            'category': category
                        })
            
            return {
                'url': url,
                'title': title_text,
                'description': description,
                'h1': h1_text,
                'first_paragraph': first_p_text,
                'links': links
            }
            
        except Exception as e:
            print(f"Error crawling {url}: {str(e)}")
            return None
    
    def crawl_site(self):
        """Crawl the entire site starting from base URL."""
        urls_to_visit = [self.base_url]
        start_time = time.time()
        
        while urls_to_visit and len(self.visited_urls) < self.max_pages:
            # Check if we're approaching Vercel's timeout (5 seconds for safety)
            if time.time() - start_time > 5:
                print("Approaching timeout, stopping crawl")
                break
                
            url = urls_to_visit.pop(0)
            page_data = self.crawl_page(url)
            
            if page_data:
                self.pages_data.append(page_data)
                
                # Add new internal links to visit (limit to avoid infinite loops)
                for link in page_data['links'][:5]:  # Only first 5 links
                    if link['url'] not in self.visited_urls and link['url'] not in urls_to_visit:
                        urls_to_visit.append(link['url'])
            
            # No delay to speed up processing
    
    def organize_content(self):
        """Organize crawled content into categories."""
        for page in self.pages_data:
            for link in page['links']:
                link_info = {
                    'url': link['url'],
                    'text': link['text'],
                    'page_title': page['title']
                }
                
                if link['category'] == 'navigation':
                    self.navigation_links.append(link_info)
                elif link['category'] == 'contact':
                    self.contact_info.append(link_info)
                elif link['category'] == 'services':
                    self.services.append(link_info)
                elif link['category'] == 'resources':
                    self.resources.append(link_info)
    
    def generate_llms_txt(self) -> str:
        """Generate the final llms.txt content."""
        if not self.pages_data:
            return "No content found on the website."
        
        # Get main page info
        main_page = self.pages_data[0]
        site_title = main_page['title'] or f"Website at {self.domain}"
        site_description = main_page['description'] or main_page['first_paragraph'] or ""
        
        # Start building the content
        content = []
        content.append(f"# {site_title}\n")
        
        if site_description:
            content.append(f"{site_description}\n")
        
        content.append(f"Website: {self.base_url}\n")
        content.append(f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        content.append(f"Total pages crawled: {len(self.pages_data)}\n\n")
        
        # Navigation
        if self.navigation_links:
            content.append("## Navigation\n")
            for link in self.navigation_links[:5]:  # Limit to first 5
                content.append(f"- [{link['text']}]({link['url']}): {link['page_title']}")
            content.append("")
        
        # Services
        if self.services:
            content.append("## Services & Offerings\n")
            for service in self.services[:5]:
                content.append(f"- [{service['text']}]({service['url']}): {service['page_title']}")
            content.append("")
        
        # Resources
        if self.resources:
            content.append("## Resources & Content\n")
            for resource in self.resources[:5]:
                content.append(f"- [{resource['text']}]({resource['url']}): {resource['page_title']}")
            content.append("")
        
        # Contact Information
        if self.contact_info:
            content.append("## Contact Information\n")
            for contact in self.contact_info[:3]:
                content.append(f"- [{contact['text']}]({contact['url']}): {contact['page_title']}")
            content.append("")
        
        # Page Summaries
        content.append("## Page Summaries\n")
        for page in self.pages_data[:10]:  # Limit to first 10 pages
            if page['title'] and page['title'] != site_title:
                summary = page['h1'] or page['first_paragraph'][:100] or "No description available"
                content.append(f"### {page['title']}")
                content.append(f"URL: {page['url']}")
                content.append(f"Summary: {summary}")
                content.append("")
        
        # Footer
        content.append("---")
        content.append("This llms.txt file was automatically generated by LLMs.txt Generator.")
        content.append("It provides a structured overview of the website content for AI training and SEO purposes.")
        
        return "\n".join(content)

def generate_llms_txt_for_url(url: str) -> Dict:
    """Main function to generate llms.txt for a given URL."""
    try:
        # Validate URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Create generator and crawl
        generator = LLMsTxtGenerator(url)
        generator.crawl_site()
        generator.organize_content()
        
        # Generate the content
        llms_txt = generator.generate_llms_txt()
        
        return {
            "success": True,
            "llms_txt": llms_txt,
            "pages_crawled": len(generator.visited_urls)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "llms_txt": ""
        }

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            url = request_data.get('url', '')
            if not url:
                response = {
                    "success": False,
                    "error": "URL is required",
                    "llms_txt": ""
                }
            else:
                response = generate_llms_txt_for_url(url)
            
            # Send response
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            error_response = {
                "success": False,
                "error": f"Server error: {str(e)}",
                "llms_txt": ""
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 