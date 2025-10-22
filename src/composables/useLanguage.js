import { useI18n } from 'vue-i18n'

export function useLanguage() {
  const { locale, t } = useI18n()

  function toggleLanguage() {
    locale.value = locale.value === 'en' ? 'vi' : 'en'
    localStorage.setItem('locale', locale.value)
  }

  function setLanguage(lang) {
    locale.value = lang
    localStorage.setItem('locale', lang)
  }

  return {
    locale,
    t,
    toggleLanguage,
    setLanguage
  }
}
