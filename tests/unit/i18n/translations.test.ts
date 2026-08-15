import { describe, expect, it } from 'vitest'
import { translate } from '../../../src/i18n/translations'

describe('translate', () => {
  it('devuelve la traducción en el idioma solicitado cuando existe', () => {
    const dict = { greeting: { es: 'Hola', en: 'Hello' } }

    expect(translate(dict, 'greeting', 'en')).toBe('Hello')
  })

  it('cae a español cuando la clave no tiene traducción para el idioma solicitado', () => {
    const dict = { greeting: { es: 'Hola' } }

    expect(translate(dict, 'greeting', 'fr')).toBe('Hola')
  })
})
