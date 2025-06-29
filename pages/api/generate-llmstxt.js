import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({
        success: false,
        error: 'URL is required',
        llms_txt: ''
      });
      return;
    }

    // Validate and normalize URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Crawl the website
    const result = await crawlWebsite(targetUrl);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`,
      llms_txt: ''
    });
  }
}

async function crawlWebsite(baseUrl) {
  try {
    const visitedUrls = new Set();
    const pagesData = [];
    const navigationLinks = [];
    const contactInfo = [];
    const services = [];
    const resources = [];
    
    const domain = new URL(baseUrl).hostname;
    
    // Start with the main page
    const mainPageData = await crawlPage(baseUrl, domain);
    if (mainPageData) {
      pagesData.push(mainPageData);
      visitedUrls.add(baseUrl);
      
      // Extract and categorize links from main page
      for (const link of mainPageData.links) {
        categorizeAndAddLink(link, mainPageData.title, navigationLinks, contactInfo, services, resources);
      }
      
      // Crawl additional pages (limit to 10 for performance)
      const additionalUrls = mainPageData.links
        .map(link => link.url)
        .filter(url => !visitedUrls.has(url))
        .slice(0, 10);
      
      for (const url of additionalUrls) {
        if (visitedUrls.size >= 10) break; // Limit total pages
        
        const pageData = await crawlPage(url, domain);
        if (pageData) {
          pagesData.push(pageData);
          visitedUrls.add(url);
          
          // Extract links from this page
          for (const link of pageData.links) {
            categorizeAndAddLink(link, pageData.title, navigationLinks, contactInfo, services, resources);
          }
        }
      }
    }
    
    // Generate llms.txt content
    const llmsTxt = generateLlmsTxt(baseUrl, pagesData, navigationLinks, contactInfo, services, resources);
    
    return {
      success: true,
      llms_txt: llmsTxt,
      pages_crawled: pagesData.length
    };
    
  } catch (error) {
    console.error('Crawling error:', error);
    return {
      success: false,
      error: `Crawling failed: ${error.message}`,
      llms_txt: ''
    };
  }
}

async function crawlPage(url, domain) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract basic page info
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').first().text().trim();
    const firstParagraph = $('p').first().text().trim();
    
    // Extract links
    const links = [];
    $('a[href]').each((i, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (href && text && text.length < 100 && text.length > 2) {
        const fullUrl = new URL(href, url).href;
        if (isInternalLink(fullUrl, domain)) {
          links.push({
            url: fullUrl,
            text: text,
            category: categorizeLink(fullUrl, text, title)
          });
        }
      }
    });
    
    return {
      url: url,
      title: title,
      description: metaDesc,
      h1: h1,
      first_paragraph: firstParagraph,
      links: links
    };
    
  } catch (error) {
    console.error(`Error crawling ${url}:`, error.message);
    return null;
  }
}

function isInternalLink(url, domain) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === domain;
  } catch {
    return false;
  }
}

function categorizeLink(url, text, pageTitle) {
  const urlLower = url.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Contact links
  const contactKeywords = ['contact', 'about', 'team', 'email', 'phone', 'tel:', 'mailto:', 'support', 'cv', 'resume'];
  if (contactKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'contact';
  }
  
  // Service links
  const serviceKeywords = ['service', 'product', 'pricing', 'features', 'solutions', 'offer', 'hire', 'work'];
  if (serviceKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'services';
  }
  
  // Resource links
  const resourceKeywords = ['blog', 'article', 'news', 'resource', 'guide', 'tutorial', 'help', 'docs', 'story', 'case'];
  if (resourceKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'resources';
  }
  
  // Navigation links (default)
  return 'navigation';
}

function categorizeAndAddLink(link, pageTitle, navigationLinks, contactInfo, services, resources) {
  const linkInfo = {
    url: link.url,
    text: link.text,
    page_title: pageTitle
  };
  
  switch (link.category) {
    case 'navigation':
      navigationLinks.push(linkInfo);
      break;
    case 'contact':
      contactInfo.push(linkInfo);
      break;
    case 'services':
      services.push(linkInfo);
      break;
    case 'resources':
      resources.push(linkInfo);
      break;
  }
}

function generateLlmsTxt(baseUrl, pagesData, navigationLinks, contactInfo, services, resources) {
  if (pagesData.length === 0) {
    return "No content found on the website.";
  }
  
  const mainPage = pagesData[0];
  const siteTitle = mainPage.title || `Website at ${new URL(baseUrl).hostname}`;
  const siteDescription = mainPage.description || mainPage.first_paragraph || "";
  
  const content = [];
  
  // Header
  content.push(`# ${siteTitle}`);
  content.push("");
  
  if (siteDescription) {
    content.push(siteDescription);
    content.push("");
  }
  
  content.push(`Website: ${baseUrl}`);
  content.push(`Generated on: ${new Date().toISOString()}`);
  content.push(`Total pages crawled: ${pagesData.length}`);
  content.push("");
  
  // Navigation Links
  if (navigationLinks.length > 0) {
    content.push("## Navigation Links");
    content.push("");
    navigationLinks.slice(0, 10).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Personal Information
  if (contactInfo.length > 0) {
    content.push("## Personal Information");
    content.push("");
    contactInfo.slice(0, 8).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Services and Contact
  if (services.length > 0) {
    content.push("## Services and Contact");
    content.push("");
    services.slice(0, 8).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Additional Resources
  if (resources.length > 0) {
    content.push("## Additional Resources");
    content.push("");
    resources.slice(0, 8).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Contact Information (extract from page content)
  const contactSection = extractContactInfo(pagesData);
  if (contactSection) {
    content.push("## Contact Information");
    content.push("");
    content.push(contactSection);
    content.push("");
  }
  
  // Page Summaries
  content.push("## Page Summaries");
  content.push("");
  pagesData.slice(0, 15).forEach(page => {
    if (page.title && page.title !== siteTitle) {
      const summary = page.h1 || page.first_paragraph?.substring(0, 100) || "No description available";
      content.push(`### ${page.title}`);
      content.push(`URL: ${page.url}`);
      content.push(`Summary: ${summary}`);
      content.push("");
    }
  });
  
  // Footer
  content.push("---");
  content.push("This llms.txt file was automatically generated by LLMs.txt Generator.");
  content.push("It provides a structured overview of the website content for AI training and SEO purposes.");
  
  return content.join("\n");
}

function extractContactInfo(pagesData) {
  const contactInfo = [];
  
  for (const page of pagesData) {
    const content = `${page.title} ${page.description} ${page.first_paragraph}`.toLowerCase();
    
    // Extract email
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatch) {
      contactInfo.push(`- Email: [${emailMatch[0]}](mailto:${emailMatch[0]}): The professional email address for inquiries and communication.`);
    }
    
    // Extract phone
    const phoneMatch = content.match(/[\+]?[0-9\s\-\(\)]{10,}/g);
    if (phoneMatch) {
      const phone = phoneMatch[0].replace(/\s+/g, '');
      contactInfo.push(`- Phone: [${phone}](tel:${phone}): The contact number for direct communication regarding services.`);
    }
  }
  
  return contactInfo.length > 0 ? contactInfo.join("\n") : null;
} 