'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { setLocale } from '../../actions/locale'

export default function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()

  async function toggle() {
    await setLocale(locale === 'fr' ? 'en' : 'fr')
    window.location.reload()
  }

  return (
    <button
      onClick={toggle}
      title={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
      className="px-3 py-1.5 rounded-lg border border-nx-border text-nx-gray hover:border-nx-yellow/40 hover:text-white transition-colors text-sm font-medium select-none"
    >
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  )
}
