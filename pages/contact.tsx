import React, { useState } from 'react'
import Layout from '../components/Layout'
import Head from 'next/head'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    // Simulate form submission (in a real app, you'd send to your backend)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setFormData({ name: '', email: '', message: '' })
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <Layout 
      title="Contact Us"
      description="Get in touch with the LLMs.txt Generator team for support, feedback, or questions."
    >
      <Head>
        <title>Contact - LLMs.txt Generator</title>
        <meta name="description" content="Get in touch with the LLMs.txt Generator team for support, feedback, or questions." />
      </Head>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about LLMs.txt Generator? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send us a message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="input-field resize-none"
                    placeholder="Tell us about your question or feedback..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700">Thank you! Your message has been sent successfully.</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">Sorry, there was an error sending your message. Please try again.</p>
                  </div>
                )}
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Get in touch
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 text-primary-600">
                      📧
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-gray-600">support@llmstxtgenerator.info</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 text-primary-600">
                      🌐
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Website</h3>
                      <p className="text-gray-600">llmstxtgenerator.info</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 text-primary-600">
                      ⏰
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Response Time</h3>
                      <p className="text-gray-600">We typically respond within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Common Questions
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      How does the generator work?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Our tool crawls your website, extracts content, and organizes it into a structured 
                      markdown format suitable for AI training and SEO analysis.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Is my data secure?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      We only crawl publicly accessible content and don't store any of your website data 
                      beyond the generation process.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Can I use this for commercial purposes?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Yes, the generated llms.txt files are yours to use for any purpose, including 
                      commercial AI training projects.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
} 