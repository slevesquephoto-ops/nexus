import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const SUPPORTED = ['fr', 'en']

export default getRequestConfig(async () => {
  const raw = cookies().get('NEXT_LOCALE')?.value
  const locale = raw && SUPPORTED.includes(raw) ? raw : 'fr'
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
