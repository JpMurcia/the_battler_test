import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTranslation } from '../../../src/i18n/useTranslation'
import { useMetaStore } from '../../../src/state/useMetaStore'

beforeEach(() => {
  useMetaStore.setState({ settings: { musicVolume: 1, sfxVolume: 1, language: 'es' } })
})

describe('useTranslation', () => {
  it('t() usa el idioma activo de useMetaStore.settings.language', () => {
    useMetaStore.setState({ settings: { musicVolume: 1, sfxVolume: 1, language: 'en' } })

    const { result } = renderHook(() => useTranslation())

    expect(result.current.t('title.play')).toBe('Play')
  })

  it('t() usa español por defecto cuando el idioma activo es "es"', () => {
    const { result } = renderHook(() => useTranslation())

    expect(result.current.t('title.play')).toBe('Jugar')
  })
})
