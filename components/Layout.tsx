import React from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function Layout({ children, title, description }: LayoutProps) {
  const pageTitle = title ? `${title} - LLMs.txt Generator` : 'LLMs.txt Generator'
  const pageDescription = description || 'Generate structured llms.txt files for any website'

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Head>
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-gray-900">LLMs.txt Generator</span>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-xl font-bold">LLMs.txt Generator</span>
              </div>
              <p className="text-gray-300 mb-4">
                Generate structured llms.txt files for any website. Perfect for AI training, 
                SEO auditing, and content understanding.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LLMs.txt Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 