'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function TheorySection({ content }: { content: string }) {
  return (
    <div className="px-8 py-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert prose-sm max-w-none
          prose-headings:text-nx-yellow prose-headings:font-semibold
          prose-p:text-nx-text prose-p:leading-loose
          prose-code:text-nx-cyan prose-code:bg-nx-surface prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-nx-surface prose-pre:border prose-pre:border-nx-border
          prose-strong:text-white
          prose-a:text-nx-cyan prose-a:no-underline hover:prose-a:underline
          prose-li:text-nx-text prose-li:marker:text-nx-yellow"
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
