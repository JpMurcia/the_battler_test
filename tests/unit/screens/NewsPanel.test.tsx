import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { NEWS_ENTRIES } from '../../../src/data/news'
import { NewsPanel } from '../../../src/screens/NewsPanel'
import { useMetaStore } from '../../../src/state/useMetaStore'

beforeEach(() => {
  useMetaStore.setState({ readNewsIds: [] })
})

describe('NewsPanel (specs/026-navegacion-hub-mockup, FR-008/FR-009)', () => {
  it('lista NEWS_ENTRIES ordenadas de más reciente a más antigua, con título/fecha/descripción', () => {
    render(<NewsPanel />)

    const titles = screen.getAllByRole('listitem').map((item) => item.textContent)
    const sortedByDateDesc = [...NEWS_ENTRIES].sort((a, b) => (a.date < b.date ? 1 : -1))
    for (const entry of sortedByDateDesc) {
      expect(screen.getByText(entry.title)).toBeInTheDocument()
      expect(screen.getByText(entry.date)).toBeInTheDocument()
      expect(screen.getByText(entry.body)).toBeInTheDocument()
    }
    expect(titles[0]).toContain(sortedByDateDesc[0].title)
  })

  it('al montar, marca como leídas las entradas que no lo estaban', async () => {
    render(<NewsPanel />)

    await Promise.resolve()

    const readIds = useMetaStore.getState().readNewsIds
    for (const entry of NEWS_ENTRIES) {
      expect(readIds).toContain(entry.id)
    }
  })
})
