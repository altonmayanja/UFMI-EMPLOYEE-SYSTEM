'use client'

import { useState, useCallback, useMemo } from 'react'
import { translations, type Locale } from './translations'

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('en')

  // Initialize locale from localStorage (only once, during first render)
  const mounted = useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ufmi_language') as Locale | null
      if (saved && translations[saved]) {
        return saved
      }
    }
    return 'en' as Locale
  }, [])

  // Sync the initial locale from localStorage on mount
  const [initialized, setInitialized] = useState(false)
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ufmi_language') as Locale | null
      if (saved && translations[saved]) {
        setLocaleState(saved)
      }
    }
    return undefined
  })

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    let text = translations[locale]?.[key] || translations.en[key] || key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v))
      })
    }
    return text
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale)
      localStorage.setItem('ufmi_language', newLocale)
    }
  }, [])

  return { t, locale, setLocale, mounted: true }
}
