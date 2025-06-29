import React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>LLMs.txt Generator - Generate Structured Website Summaries</title>
        <meta name="description" content="Generate structured llms.txt files for any website. Perfect for AI training, SEO auditing, and content understanding." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="llms.txt, AI training, SEO, web crawling, content analysis" />
        <meta name="author" content="LLMs.txt Generator" />
        
        {/* Open Graph */}
        <meta property="og:title" content="LLMs.txt Generator" />
        <meta property="og:description" content="Generate structured llms.txt files for any website" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://llmstxtgenerator.info" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LLMs.txt Generator" />
        <meta name="twitter:description" content="Generate structured llms.txt files for any website" />
        
        <link rel="icon" href="/llmtxt-favicon.png" />
        <link rel="canonical" href="https://llmstxtgenerator.info" />
      </Head>
      <Component {...pageProps} />
    </>
  )
} 