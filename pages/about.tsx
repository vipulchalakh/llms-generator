import React from 'react'
import Layout from '../components/Layout'
import Head from 'next/head'

export default function About() {
  return (
    <Layout 
      title="About LLMs.txt Generator"
      description="Learn about llms.txt files and how our generator tool works to create structured website summaries."
    >
      <Head>
        <title>About | LLMs.txt Generator</title>
        <meta name="description" content="Learn about the LLMs.txt Generator project, its mission, and the team behind the tool for structured website summaries." />
      </Head>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              About LLMs.txt Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Understanding the power of structured website documentation for AI training and SEO optimization.
            </p>
          </div>

          <div className="prose-custom max-w-none">
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                What is llms.txt?
              </h2>
              <p>
                llms.txt is a structured markdown file that provides a comprehensive overview of a website's content, 
                navigation structure, and purpose. Similar to robots.txt for search engines, llms.txt serves as a 
                guide for AI systems and language models to understand website content.
              </p>
              <p>
                These files contain organized sections including website titles, descriptions, navigation links, 
                services offered, contact information, and page summaries. This structured format makes it easier 
                for AI systems to process and understand website content for training purposes.
              </p>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Why LLMs.txt Matters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">For AI Training</h3>
                  <p>
                    Language models need structured, high-quality data for training. llms.txt files provide 
                    clean, organized website content that can be used to train AI systems more effectively.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">For SEO Auditing</h3>
                  <p>
                    Website owners and SEO professionals can use llms.txt files to audit their content structure, 
                    identify missing information, and ensure their site is properly organized.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">For Content Analysis</h3>
                  <p>
                    Content teams can use these files to get a bird's-eye view of their website's information 
                    architecture and identify areas for improvement.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">For Documentation</h3>
                  <p>
                    llms.txt serves as a living document of your website's structure, making it easier for 
                    teams to understand and maintain their online presence.
                  </p>
                </div>
              </div>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                How Our Generator Works
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Website Crawling</h3>
                    <p>
                      Our tool starts by crawling your homepage and follows internal links to discover 
                      all relevant pages on your website (up to 500 pages).
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Extraction</h3>
                    <p>
                      For each page, we extract titles, descriptions, headings, first paragraphs, and 
                      categorize all internal links based on their content and purpose.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Organization</h3>
                    <p>
                      Links and content are automatically categorized into navigation, services, 
                      resources, and contact information sections.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Markdown Generation</h3>
                    <p>
                      Finally, we generate a structured markdown file that includes all the organized 
                      content, ready for use in AI training or SEO analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Who Should Use This Tool?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Researchers & Developers</h3>
                  <p>
                    Build better training datasets for language models with structured website content 
                    that's properly categorized and organized.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">SEO Professionals</h3>
                  <p>
                    Audit website content structure, identify missing information, and improve 
                    site organization for better search engine performance.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Teams</h3>
                  <p>
                    Get a comprehensive overview of your website's content architecture and 
                    identify areas for improvement or expansion.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Webmasters</h3>
                  <p>
                    Create documentation for your website that can be used for maintenance, 
                    updates, and team onboarding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
} 