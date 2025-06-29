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
    const domain = new URL(baseUrl).hostname;
    const allUrls = new Set();
    const pagesData = [];
    
    // Step 1: Get URLs from sitemap and robots.txt
    const sitemapUrls = await getSitemapUrls(baseUrl);
    const robotsUrls = await getRobotsUrls(baseUrl);
    
    // Combine all URLs and remove duplicates
    const allUniqueUrls = new Set([baseUrl, ...sitemapUrls, ...robotsUrls]);
    
    // Step 2: Crawl main page first to get additional links
    const mainPageData = await crawlPage(baseUrl, domain);
    if (mainPageData) {
      pagesData.push(mainPageData);
      
      // Add internal links from main page
      mainPageData.links.forEach(link => {
        if (isInternalLink(link.url, domain)) {
          allUniqueUrls.add(link.url);
        }
      });
    }
    
    // Step 3: Crawl all unique URLs (limit to 50 for performance)
    const urlsToCrawl = Array.from(allUniqueUrls).slice(0, 50);
    
    for (const url of urlsToCrawl) {
      if (pagesData.length >= 50) break; // Limit total pages
      
      const pageData = await crawlPage(url, domain);
      if (pageData) {
        pagesData.push(pageData);
        
        // Add new internal links found on this page
        pageData.links.forEach(link => {
          if (isInternalLink(link.url, domain)) {
            allUniqueUrls.add(link.url);
          }
        });
      }
    }
    
    // Step 4: Organize content by categories
    const organizedContent = organizeContent(pagesData);
    
    // Step 5: Generate llms.txt content
    const llmsTxt = generateLlmsTxt(baseUrl, pagesData, organizedContent);
    
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

async function getSitemapUrls(baseUrl) {
  const urls = new Set();
  
  try {
    // Try to find sitemap from robots.txt
    const robotsResponse = await axios.get(`${baseUrl}/robots.txt`, { timeout: 3000 });
    const sitemapMatches = robotsResponse.data.match(/Sitemap:\s*(.+)/gi);
    
    if (sitemapMatches) {
      for (const match of sitemapMatches) {
        const sitemapUrl = match.replace(/Sitemap:\s*/i, '').trim();
        const sitemapUrls = await parseSitemap(sitemapUrl);
        sitemapUrls.forEach(url => urls.add(url));
      }
    }
  } catch (error) {
    console.log('Could not fetch robots.txt:', error.message);
  }
  
  // Try common sitemap locations
  const commonSitemaps = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap/sitemap.xml',
    '/sitemap1.xml'
  ];
  
  for (const sitemapPath of commonSitemaps) {
    try {
      const sitemapUrl = `${baseUrl}${sitemapPath}`;
      const sitemapUrls = await parseSitemap(sitemapUrl);
      sitemapUrls.forEach(url => urls.add(url));
    } catch (error) {
      // Continue to next sitemap
    }
  }
  
  return Array.from(urls);
}

async function parseSitemap(sitemapUrl) {
  const urls = [];
  
  try {
    const response = await axios.get(sitemapUrl, { timeout: 5000 });
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    // Handle sitemap index
    $('sitemap > loc').each((i, element) => {
      const sitemapUrl = $(element).text().trim();
      // Recursively parse nested sitemaps
      parseSitemap(sitemapUrl).then(nestedUrls => {
        nestedUrls.forEach(url => urls.push(url));
      });
    });
    
    // Handle regular sitemap
    $('url > loc').each((i, element) => {
      const url = $(element).text().trim();
      if (url) urls.push(url);
    });
    
  } catch (error) {
    console.log(`Could not parse sitemap ${sitemapUrl}:`, error.message);
  }
  
  return urls;
}

async function getRobotsUrls(baseUrl) {
  const urls = [];
  
  try {
    const response = await axios.get(`${baseUrl}/robots.txt`, { timeout: 3000 });
    const lines = response.data.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('Allow:') || line.startsWith('Disallow:')) {
        const path = line.split(':')[1]?.trim();
        if (path && path !== '/') {
          urls.push(`${baseUrl}${path}`);
        }
      }
    }
  } catch (error) {
    console.log('Could not fetch robots.txt:', error.message);
  }
  
  return urls;
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
    const seenLinks = new Set();
    
    $('a[href]').each((i, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (href && text && text.length < 100 && text.length > 2) {
        const fullUrl = new URL(href, url).href;
        
        // Only add if we haven't seen this URL before
        if (!seenLinks.has(fullUrl) && isInternalLink(fullUrl, domain)) {
          seenLinks.add(fullUrl);
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
  
  // General Information
  const generalKeywords = ['about', 'contact', 'disclaimer', 'privacy', 'terms', 'policy'];
  if (generalKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'general';
  }
  
  // Vehicle Categories
  const vehicleKeywords = ['scooter', 'bike', 'car', 'vehicle', 'tesla', 'audi', 'kia', 'tata'];
  if (vehicleKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'vehicles';
  }
  
  // Tools and Calculators
  const toolKeywords = ['calculator', 'estimator', 'finder', 'tool', 'emi', 'tco', 'range', 'charging'];
  if (toolKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'tools';
  }
  
  // News and Blog
  const newsKeywords = ['news', 'blog', 'article', 'post', 'update'];
  if (newsKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'news';
  }
  
  // Technical/Glossary
  const techKeywords = ['glossary', 'technical', 'battery', 'converter', 'coolant', 'charging'];
  if (techKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'technical';
  }
  
  // Guides and Resources
  const guideKeywords = ['guide', 'resource', 'help', 'support', 'faq'];
  if (guideKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'guides';
  }
  
  // Services
  const serviceKeywords = ['service', 'consultation', 'support', 'help'];
  if (serviceKeywords.some(keyword => urlLower.includes(keyword) || textLower.includes(keyword))) {
    return 'services';
  }
  
  // Default to navigation
  return 'navigation';
}

function organizeContent(pagesData) {
  const organized = {
    general: new Map(),
    vehicles: new Map(),
    tools: new Map(),
    news: new Map(),
    technical: new Map(),
    guides: new Map(),
    services: new Map(),
    navigation: new Map()
  };
  
  pagesData.forEach(page => {
    page.links.forEach(link => {
      const linkInfo = {
        url: link.url,
        text: link.text,
        page_title: page.title
      };
      
      // Use Map to automatically handle duplicates
      if (!organized[link.category].has(link.url)) {
        organized[link.category].set(link.url, linkInfo);
      }
    });
  });
  
  return organized;
}

function generateLlmsTxt(baseUrl, pagesData, organizedContent) {
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
  
  // General Information
  if (organizedContent.general.size > 0) {
    content.push("## General Information");
    content.push("");
    Array.from(organizedContent.general.values()).slice(0, 10).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Vehicle Categories
  if (organizedContent.vehicles.size > 0) {
    content.push("## Vehicle Categories");
    content.push("");
    Array.from(organizedContent.vehicles.values()).slice(0, 10).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Tools and Calculators
  if (organizedContent.tools.size > 0) {
    content.push("## Tools and Calculators");
    content.push("");
    Array.from(organizedContent.tools.values()).slice(0, 10).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // News and Updates
  if (organizedContent.news.size > 0) {
    content.push("## News and Updates");
    content.push("");
    Array.from(organizedContent.news.values()).slice(0, 10).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Technical Insights
  if (organizedContent.technical.size > 0) {
    content.push("## Technical Insights");
    content.push("");
    Array.from(organizedContent.technical.values()).slice(0, 10).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Guides and Resources
  if (organizedContent.guides.size > 0) {
    content.push("## Guides and Resources");
    content.push("");
    Array.from(organizedContent.guides.values()).slice(0, 10).forEach(link => {
      content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
    });
    content.push("");
  }
  
  // Services
  if (organizedContent.services.size > 0) {
    content.push("## Services");
    content.push("");
    Array.from(organizedContent.services.values()).slice(0, 10).forEach(link => {
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
  pagesData.slice(0, 20).forEach(page => {
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
  const seenContacts = new Set();
  
  for (const page of pagesData) {
    const content = `${page.title} ${page.description} ${page.first_paragraph}`.toLowerCase();
    
    // Extract email
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatch && !seenContacts.has(emailMatch[0])) {
      seenContacts.add(emailMatch[0]);
      contactInfo.push(`- Email: [${emailMatch[0]}](mailto:${emailMatch[0]}): The professional email address for inquiries and communication.`);
    }
    
    // Extract phone
    const phoneMatch = content.match(/[\+]?[0-9\s\-\(\)]{10,}/g);
    if (phoneMatch && !seenContacts.has(phoneMatch[0])) {
      seenContacts.add(phoneMatch[0]);
      const phone = phoneMatch[0].replace(/\s+/g, '');
      contactInfo.push(`- Phone: [${phone}](tel:${phone}): The contact number for direct communication regarding services.`);
    }
  }
  
  return contactInfo.length > 0 ? contactInfo.join("\n") : null;
} 