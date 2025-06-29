import React, { useState } from 'react'
import Layout from '../components/Layout'
import Head from 'next/head'

interface GenerationResult {
  llms_txt: string
  success: boolean
  error?: string
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    setIsGenerating(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/generate-llmstxt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to generate llms.txt file')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (result?.llms_txt) {
      try {
        await navigator.clipboard.writeText(result.llms_txt)
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  const downloadFile = () => {
    if (result?.llms_txt) {
      const blob = new Blob([result.llms_txt], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'llms.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Generate Your llms.txt File Instantly</title>
        <meta name="description" content="Get a structured summary of your website in seconds. Useful for AI training, content auditing, or LLM indexing." />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Generate Your llms.txt File Instantly
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get a structured summary of your website in seconds. Useful for AI training, 
            content auditing, or LLM indexing.
          </p>

          {/* Generator Form */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your homepage URL (e.g., https://example.com)"
                  className="input-field text-lg"
                  disabled={isGenerating}
                />
              </div>
              <button
                type="submit"
                disabled={isGenerating}
                className="btn-primary text-lg w-full md:w-auto"
              >
                {isGenerating ? 'Generating...' : 'Generate llms.txt'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Output Section */}
      {result && (
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Generated llms.txt</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={copyToClipboard}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <span>📄</span>
                    <span>Copy All</span>
                  </button>
                  <button
                    onClick={downloadFile}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>📥</span>
                    <span>Download llms.txt</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 overflow-auto max-h-96">
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                  {result.llms_txt}
                </pre>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEO Content Sections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* What is llms.txt? */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                What is llms.txt?
              </h2>
              <div className="prose-custom">
                <p>
                  llms.txt is a structured markdown file that summarizes your website content. 
                  It is helpful for AI/LLM training datasets, search engine crawling, and 
                  auditing your website's information architecture.
                </p>
              </div>
            </div>

            {/* Why Use LLMs.txt Generator? */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Why Use LLMs.txt Generator?
              </h2>
              <div className="prose-custom">
                <p>
                  Instead of manually documenting every page on your website, this tool 
                  automates it using intelligent content crawling and section-wise organization. 
                  Whether you're training an AI or improving SEO, llms.txt saves hours of manual work.
                </p>
              </div>
            </div>

            {/* What's Included in the Output? */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                What's Included in the Output?
              </h2>
              <div className="prose-custom">
                <p>Your generated llms.txt file includes:</p>
                <ul>
                  <li>Website Title and Description</li>
                  <li>Navigation Links</li>
                  <li>Personal or Business Info</li>
                  <li>Services and Offerings</li>
                  <li>Blog or Resource Links</li>
                  <li>Contact Information</li>
                  <li>A concluding summary paragraph</li>
                </ul>
              </div>
            </div>

            {/* Who Can Use This? */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Who Can Use This?
              </h2>
              <div className="prose-custom">
                <ul>
                  <li>SEO professionals and agencies</li>
                  <li>AI developers building language models</li>
                  <li>Content teams managing large websites</li>
                  <li>Webmasters wanting a clear overview of their site</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loading Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your llms.txt is generating...
            </h3>
            <p className="text-gray-600">
              This may take a few moments as we crawl your website and analyze the content.
            </p>
          </div>
        </div>
      )}
    </Layout>
  )
} 