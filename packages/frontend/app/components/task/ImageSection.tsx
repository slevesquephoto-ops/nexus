'use client'

interface ImageSectionProps {
  src: string
  alt: string
  caption?: string
}

export default function ImageSection({ src, alt, caption }: ImageSectionProps) {
  return (
    <figure className="my-4 px-8">
      <img
        src={src}
        alt={alt}
        className="rounded-xl border border-nx-border w-full max-w-lg mx-auto block"
      />
      {caption && (
        <figcaption className="text-center text-xs text-nx-text-muted mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
