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
    
    // Step 4: Analyze content and create dynamic categories
    const dynamicCategories = createDynamicCategories(pagesData);
    
    // Step 5: Generate llms.txt content
    const llmsTxt = generateLlmsTxt(baseUrl, pagesData, dynamicCategories);
    
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
            category: null // Will be determined by dynamic categorization
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

function createDynamicCategories(pagesData) {
  // Collect all links and their context
  const allLinks = [];
  pagesData.forEach(page => {
    page.links.forEach(link => {
      allLinks.push({
        ...link,
        page_title: page.title,
        page_url: page.url,
        context: `${page.title} ${page.description} ${page.first_paragraph}`.toLowerCase()
      });
    });
  });
  
  // Analyze link patterns and create categories
  const categories = analyzeLinkPatterns(allLinks);
  
  // Categorize each link
  const categorizedLinks = {};
  categories.forEach(category => {
    categorizedLinks[category.name] = new Map();
  });
  
  allLinks.forEach(link => {
    const category = determineLinkCategory(link, categories);
    if (category && !categorizedLinks[category].has(link.url)) {
      categorizedLinks[category].set(link.url, {
        url: link.url,
        text: link.text,
        page_title: link.page_title
      });
    }
  });
  
  return { categories, categorizedLinks };
}

function analyzeLinkPatterns(allLinks) {
  const categories = [];
  const linkTexts = allLinks.map(link => link.text.toLowerCase());
  const linkUrls = allLinks.map(link => link.url.toLowerCase());
  
  // Common patterns that indicate categories
  const patterns = {
    'General Information': {
      keywords: ['about', 'contact', 'privacy', 'terms', 'disclaimer', 'policy'],
      urlPatterns: ['/about', '/contact', '/privacy', '/terms', '/disclaimer'],
      minLinks: 2
    },
    'Main Navigation': {
      keywords: ['home', 'menu', 'navigation', 'skip'],
      urlPatterns: ['/#', '/menu', '/nav'],
      minLinks: 3
    },
    'Content & Resources': {
      keywords: ['blog', 'article', 'news', 'post', 'guide', 'resource', 'help'],
      urlPatterns: ['/blog', '/article', '/news', '/post', '/guide'],
      minLinks: 2
    },
    'Services & Products': {
      keywords: ['service', 'product', 'buy', 'shop', 'store', 'purchase'],
      urlPatterns: ['/service', '/product', '/buy', '/shop'],
      minLinks: 2
    },
    'Tools & Calculators': {
      keywords: ['calculator', 'tool', 'estimator', 'finder', 'compute'],
      urlPatterns: ['/calculator', '/tool', '/estimator'],
      minLinks: 2
    },
    'Support & Help': {
      keywords: ['support', 'help', 'faq', 'assistance', 'contact'],
      urlPatterns: ['/support', '/help', '/faq'],
      minLinks: 2
    }
  };
  
  // Check which patterns match the website content
  Object.entries(patterns).forEach(([categoryName, pattern]) => {
    const matchingLinks = allLinks.filter(link => {
      const textMatch = pattern.keywords.some(keyword => 
        link.text.toLowerCase().includes(keyword) || 
        link.page_title.toLowerCase().includes(keyword)
      );
      const urlMatch = pattern.urlPatterns.some(urlPattern => 
        link.url.toLowerCase().includes(urlPattern)
      );
      return textMatch || urlMatch;
    });
    
    if (matchingLinks.length >= pattern.minLinks) {
      categories.push(categoryName);
    }
  });
  
  // If no patterns match, create generic categories based on URL structure
  if (categories.length === 0) {
    const urlPaths = new Set();
    allLinks.forEach(link => {
      try {
        const path = new URL(link.url).pathname.split('/')[1];
        if (path) urlPaths.add(path);
      } catch {}
    });
    
    urlPaths.forEach(path => {
      if (path && path.length > 2) {
        categories.push(`${path.charAt(0).toUpperCase() + path.slice(1)}`);
      }
    });
  }
  
  // Always include these basic categories if they have content
  const basicCategories = ['General Information', 'Main Navigation'];
  basicCategories.forEach(cat => {
    if (!categories.includes(cat)) {
      const hasContent = allLinks.some(link => 
        link.text.toLowerCase().includes('about') || 
        link.text.toLowerCase().includes('contact') ||
        link.text.toLowerCase().includes('home')
      );
      if (hasContent) categories.push(cat);
    }
  });
  
  return categories;
}

function determineLinkCategory(link, categories) {
  const text = link.text.toLowerCase();
  const url = link.url.toLowerCase();
  
  // Check each category pattern
  for (const category of categories) {
    const patterns = getCategoryPatterns(category);
    const matches = patterns.some(pattern => 
      text.includes(pattern) || url.includes(pattern)
    );
    if (matches) return category;
  }
  
  // Default to first category or "Other"
  return categories[0] || "Other";
}

function getCategoryPatterns(category) {
  const patternMap = {
    'General Information': ['about', 'contact', 'privacy', 'terms', 'disclaimer'],
    'Main Navigation': ['home', 'menu', 'navigation'],
    'Content & Resources': ['blog', 'article', 'news', 'post', 'guide', 'resource'],
    'Services & Products': ['service', 'product', 'buy', 'shop', 'store'],
    'Tools & Calculators': ['calculator', 'tool', 'estimator', 'finder'],
    'Support & Help': ['support', 'help', 'faq', 'assistance']
  };
  
  return patternMap[category] || [category.toLowerCase()];
}

function generateLlmsTxt(baseUrl, pagesData, dynamicCategories) {
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
  
  // Dynamic categories
  const { categories, categorizedLinks } = dynamicCategories;
  
  categories.forEach(category => {
    const links = categorizedLinks[category];
    if (links && links.size > 0) {
      content.push(`## ${category}`);
      content.push("");
      Array.from(links.values()).slice(0, 10).forEach(link => {
        content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
      });
      content.push("");
    }
  });
  
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