import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
}

export default withNextIntl(nextConfig)
