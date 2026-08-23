import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { GachaScreen } from '../../src/screens/GachaScreen'
import { GACHA_BANNERS } from '../../src/data/gacha'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({
    gachaCurrency: 0,
    npCurrency: 0,
    gachaStorage: [],
    ownedCats: {},
    currency: 0,
  })
})

// specs/024-sistema-gacha US1/US2 — pestaña "Tirar".
describe('GachaScreen — Tirar', () => {
  it('US2: muestra al menos 2 banners, cada uno con tasas que suman 100%', () => {
    render(<GachaScreen onNavigate={noop} />)

    for (const banner of GACHA_BANNERS) {
      expect(screen.getByRole('button', { name: banner.name })).toBeInTheDocument()
    }
    expect(GACHA_BANNERS.length).toBeGreaterThanOrEqual(2)
  })

  it('US2: cambiar de banner actualiza el desglose de tasas mostrado', () => {
    render(<GachaScreen onNavigate={noop} />)

    // El banner activo por defecto es GACHA_BANNERS[0] (uberfest) — muestra Legendario 0.3%.
    expect(screen.getByText('0.3%')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Banner Estándar' }))

    // El banner estandar no ofrece Legendario en absoluto.
    expect(screen.queryByText('Legendario')).not.toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  it('US1: una tirada simple exitosa muestra el revelado y descuenta el saldo', async () => {
    useMetaStore.setState({ gachaCurrency: 150 })
    render(<GachaScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /Tirada Simple/ }))

    const continueButton = await screen.findByRole('button', { name: 'Continuar' })
    expect(continueButton).toBeInTheDocument()
    expect(useMetaStore.getState().gachaCurrency).toBe(0)
    expect(useMetaStore.getState().gachaStorage).toHaveLength(1)
  })

  it('US1: tras cerrar el revelado, vuelve a la pestaña "Tirar"', async () => {
    useMetaStore.setState({ gachaCurrency: 150 })
    render(<GachaScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /Tirada Simple/ }))
    const continueButton = await screen.findByRole('button', { name: 'Continuar' })
    fireEvent.click(continueButton)

    expect(screen.getByRole('button', { name: /Tirada Simple/ })).toBeInTheDocument()
  })

  it('US1: un gato recién obtenido por gacha no aparece en ownedCats hasta activarse', async () => {
    useMetaStore.setState({ gachaCurrency: 150 })
    render(<GachaScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /Tirada Simple/ }))
    await screen.findByRole('button', { name: 'Continuar' })

    const catId = useMetaStore.getState().gachaStorage[0].catId
    expect(useMetaStore.getState().ownedCats[catId]).toBeUndefined()
  })

  it('US1: la tirada simple está deshabilitada sin saldo suficiente', () => {
    useMetaStore.setState({ gachaCurrency: 0 })
    render(<GachaScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /Tirada Simple/ })).toBeDisabled()
  })

  it('US4: una tirada x11 exitosa muestra los 11 resultados juntos', async () => {
    useMetaStore.setState({ gachaCurrency: 1500 })
    render(<GachaScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /Tirada x11/ }))

    await screen.findByRole('button', { name: 'Continuar' })
    expect(useMetaStore.getState().gachaStorage).toHaveLength(11)
    expect(useMetaStore.getState().gachaCurrency).toBe(0)
  })

  it('US4: el botón de tirada x11 está deshabilitado si el saldo alcanza solo para la simple', () => {
    useMetaStore.setState({ gachaCurrency: 150 })
    render(<GachaScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /Tirada Simple/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Tirada x11/ })).toBeDisabled()
  })
})

// specs/024-sistema-gacha US3/US6 — pestaña "Almacén".
describe('GachaScreen — Almacén', () => {
  it('US3: lista las cápsulas pendientes y activar la de un gato no poseído lo retira de la lista', () => {
    useMetaStore.setState({ gachaStorage: [{ id: 1, catId: 'tank-cat', rarity: 'Raro' }] })
    render(<GachaScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /Almacén/ }))
    expect(screen.getByText('Gato Tanque')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Activar' }))

    expect(useMetaStore.getState().gachaStorage).toHaveLength(0)
    expect(useMetaStore.getState().ownedCats['tank-cat']).toBeDefined()
  })

  it('US6: cada cápsula ofrece "Intercambiar por XP"; solo Megarraro/Legendario ofrecen "Intercambiar por NP"', () => {
    useMetaStore.setState({
      gachaStorage: [
        { id: 1, catId: 'tank-cat', rarity: 'Raro' },
        { id: 2, catId: 'seed-cat-titan', rarity: 'Megarraro' },
      ],
    })
    render(<GachaScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /Almacén/ }))

    expect(screen.getAllByRole('button', { name: 'Intercambiar por XP' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Intercambiar por NP' })).toHaveLength(1)
  })

  it('US6: intercambiar por XP retira la cápsula y suma a currency', () => {
    useMetaStore.setState({ gachaStorage: [{ id: 1, catId: 'tank-cat', rarity: 'Raro' }], currency: 0 })
    render(<GachaScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /Almacén/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Intercambiar por XP' }))

    expect(useMetaStore.getState().gachaStorage).toHaveLength(0)
    expect(useMetaStore.getState().currency).toBeGreaterThan(0)
  })

  it('sin cápsulas pendientes, muestra un mensaje en vez de una lista vacía', () => {
    render(<GachaScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /Almacén/ }))

    expect(screen.getByText('Sin cápsulas pendientes.')).toBeInTheDocument()
  })
})
