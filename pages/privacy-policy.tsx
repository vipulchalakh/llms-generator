import React from 'react'
import Layout from '../components/Layout'
import Head from 'next/head'

export default function PrivacyPolicy() {
  return (
    <Layout 
      title="Privacy Policy"
      description="Learn about how LLMs.txt Generator collects, uses, and protects your information."
    >
      <Head>
        <title>Privacy Policy - LLMs.txt Generator</title>
        <meta name="description" content="Learn about how LLMs.txt Generator collects, uses, and protects your information." />
      </Head>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose-custom max-w-none">
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Introduction
              </h2>
              <p>
                LLMs.txt Generator ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, and safeguard your information 
                when you use our website and services.
              </p>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Information We Collect
              </h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Information You Provide
              </h3>
              <ul className="mb-6">
                <li>Website URLs you submit for llms.txt generation</li>
                <li>Contact information if you reach out to us (name, email, message)</li>
                <li>Any feedback or comments you provide</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Automatically Collected Information
              </h3>
              <ul>
                <li>IP address and browser information</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Generate llms.txt files for the websites you submit</li>
                <li>Improve our service and user experience</li>
                <li>Respond to your inquiries and provide support</li>
                <li>Analyze usage patterns and optimize our website</li>
                <li>Ensure the security and integrity of our service</li>
              </ul>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Website Crawling and Data Processing
              </h2>
              <p>
                When you submit a website URL for llms.txt generation, our system:
              </p>
              <ul>
                <li>Crawls only publicly accessible content on the specified website</li>
                <li>Extracts and processes content to create structured summaries</li>
                <li>Does not store or retain the crawled website content</li>
                <li>Only processes the data temporarily during generation</li>
                <li>Respects robots.txt files and standard web crawling practices</li>
              </ul>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Data Sharing and Disclosure
              </h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except:</p>
              <ul>
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Data Security
              </h2>
              <p>
                We implement appropriate security measures to protect your information against 
                unauthorized access, alteration, disclosure, or destruction. However, no method 
                of transmission over the internet is 100% secure, and we cannot guarantee 
                absolute security.
              </p>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Cookies and Tracking
              </h2>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze 
                usage patterns, and improve our service. You can control cookie settings 
                through your browser preferences.
              </p>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to our processing of your information</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Children's Privacy
              </h2>
              <p>
                Our service is not intended for children under 13 years of age. We do not 
                knowingly collect personal information from children under 13. If you are a 
                parent or guardian and believe your child has provided us with personal 
                information, please contact us.
              </p>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                International Users
              </h2>
              <p>
                Our service is operated from the United States. If you are accessing our 
                service from outside the United States, please be aware that your information 
                may be transferred to, stored, and processed in the United States where our 
                servers are located.
              </p>
            </div>

            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of 
                any changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">LLMs.txt Generator</p>
                <p>Email: support@llmstxtgenerator.info</p>
                <p>Website: llmstxtgenerator.info</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
} 