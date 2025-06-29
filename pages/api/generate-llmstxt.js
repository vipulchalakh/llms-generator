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

    // Crawl the website with timeout protection
    const result = await crawlWebsiteWithTimeout(targetUrl);
    
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

async function crawlWebsiteWithTimeout(baseUrl) {
  const startTime = Date.now();
  const maxTime = 8000; // 8 seconds max for Vercel
  
  try {
    const domain = new URL(baseUrl).hostname;
    const allUrls = new Set();
    const pagesData = [];
    
    // Step 1: Quick sitemap check (with timeout)
    const sitemapUrls = await Promise.race([
      getSitemapUrls(baseUrl),
      new Promise(resolve => setTimeout(() => resolve([]), 2000))
    ]);
    
    // Combine URLs
    const allUniqueUrls = new Set([baseUrl, ...sitemapUrls]);
    
    // Step 2: Crawl main page first
    const mainPageData = await crawlPageFast(baseUrl, domain);
    if (mainPageData) {
      pagesData.push(mainPageData);
      
      // Add internal links from main page
      mainPageData.links.forEach(link => {
        if (isInternalLink(link.url, domain)) {
          allUniqueUrls.add(link.url);
        }
      });
    }
    
    // Step 3: Crawl additional pages (limited and fast)
    const urlsToCrawl = Array.from(allUniqueUrls).slice(0, 15); // Reduced limit
    
    for (const url of urlsToCrawl) {
      // Check timeout
      if (Date.now() - startTime > maxTime) {
        console.log('Timeout approaching, stopping crawl');
        break;
      }
      
      if (pagesData.length >= 15) break; // Reduced limit
      
      const pageData = await crawlPageFast(url, domain);
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
    
    // Step 4: Quick categorization
    const dynamicCategories = createDynamicCategoriesFast(pagesData);
    
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
    // Try common sitemap locations first (faster)
    const commonSitemaps = [
      '/sitemap.xml',
      '/sitemap_index.xml'
    ];
    
    for (const sitemapPath of commonSitemaps) {
      try {
        const sitemapUrl = `${baseUrl}${sitemapPath}`;
        const sitemapUrls = await parseSitemapFast(sitemapUrl);
        sitemapUrls.forEach(url => urls.add(url));
        if (urls.size > 20) break; // Limit sitemap URLs
      } catch (error) {
        // Continue to next sitemap
      }
    }
  } catch (error) {
    console.log('Could not fetch sitemaps:', error.message);
  }
  
  return Array.from(urls);
}

async function parseSitemapFast(sitemapUrl) {
  const urls = [];
  
  try {
    const response = await axios.get(sitemapUrl, { timeout: 2000 }); // Reduced timeout
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    // Handle regular sitemap (skip nested sitemaps for speed)
    $('url > loc').each((i, element) => {
      const url = $(element).text().trim();
      if (url && urls.length < 20) urls.push(url); // Limit URLs
    });
    
  } catch (error) {
    console.log(`Could not parse sitemap ${sitemapUrl}:`, error.message);
  }
  
  return urls;
}

async function crawlPageFast(url, domain) {
  try {
    const response = await axios.get(url, {
      timeout: 3000, // Reduced timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract basic page info
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').first().text().trim();
    const firstParagraph = $('p').first().text().trim();
    
    // Extract links (limited for speed)
    const links = [];
    const seenLinks = new Set();
    
    $('a[href]').each((i, element) => {
      if (links.length >= 20) return false; // Stop after 20 links
      
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
            category: null
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

function createDynamicCategoriesFast(pagesData) {
  // Collect all links
  const allLinks = [];
  pagesData.forEach(page => {
    page.links.forEach(link => {
      allLinks.push({
        ...link,
        page_title: page.title,
        page_url: page.url
      });
    });
  });
  
  // Quick category detection
  const categories = detectCategoriesFast(allLinks);
  
  // Categorize links
  const categorizedLinks = {};
  categories.forEach(category => {
    categorizedLinks[category] = new Map();
  });
  
  allLinks.forEach(link => {
    const category = determineLinkCategoryFast(link, categories);
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

function detectCategoriesFast(allLinks) {
  const categories = [];
  const linkTexts = allLinks.map(link => link.text.toLowerCase());
  
  // Quick pattern matching
  const patterns = {
    'General Information': ['about', 'contact', 'privacy', 'terms'],
    'Main Navigation': ['home', 'menu', 'navigation'],
    'Content & Resources': ['blog', 'article', 'news', 'post', 'guide'],
    'Services & Products': ['service', 'product', 'buy', 'shop'],
    'Tools & Calculators': ['calculator', 'tool', 'estimator'],
    'Support & Help': ['support', 'help', 'faq']
  };
  
  Object.entries(patterns).forEach(([categoryName, keywords]) => {
    const matchingLinks = allLinks.filter(link => 
      keywords.some(keyword => 
        link.text.toLowerCase().includes(keyword) || 
        link.page_title.toLowerCase().includes(keyword)
      )
    );
    
    if (matchingLinks.length >= 2) {
      categories.push(categoryName);
    }
  });
  
  // Fallback categories
  if (categories.length === 0) {
    categories.push('Main Navigation', 'General Information');
  }
  
  return categories;
}

function determineLinkCategoryFast(link, categories) {
  const text = link.text.toLowerCase();
  
  for (const category of categories) {
    const patterns = getCategoryPatternsFast(category);
    const matches = patterns.some(pattern => text.includes(pattern));
    if (matches) return category;
  }
  
  return categories[0] || "Other";
}

function getCategoryPatternsFast(category) {
  const patternMap = {
    'General Information': ['about', 'contact', 'privacy', 'terms'],
    'Main Navigation': ['home', 'menu', 'navigation'],
    'Content & Resources': ['blog', 'article', 'news', 'post', 'guide'],
    'Services & Products': ['service', 'product', 'buy', 'shop'],
    'Tools & Calculators': ['calculator', 'tool', 'estimator'],
    'Support & Help': ['support', 'help', 'faq']
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
      Array.from(links.values()).slice(0, 8).forEach(link => { // Reduced limit
        content.push(`- [${link.text}](${link.url}): ${link.page_title}`);
      });
      content.push("");
    }
  });
  
  // Contact Information (quick extraction)
  const contactSection = extractContactInfoFast(pagesData);
  if (contactSection) {
    content.push("## Contact Information");
    content.push("");
    content.push(contactSection);
    content.push("");
  }
  
  // Page Summaries (limited)
  content.push("## Page Summaries");
  content.push("");
  pagesData.slice(0, 10).forEach(page => { // Reduced limit
    if (page.title && page.title !== siteTitle) {
      const summary = page.h1 || page.first_paragraph?.substring(0, 80) || "No description available";
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

function extractContactInfoFast(pagesData) {
  const contactInfo = [];
  const seenContacts = new Set();
  
  // Only check first few pages for speed
  pagesData.slice(0, 5).forEach(page => {
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
  });
  
  return contactInfo.length > 0 ? contactInfo.join("\n") : null;
} 