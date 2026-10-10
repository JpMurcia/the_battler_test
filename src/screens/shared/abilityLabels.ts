import type { ImmunizableAbilityKind } from '../../engine/types'

/** Nombres en español de las habilidades ofensivas que un defensor puede ignorar (specs/040, FR-010). */
const IMMUNITY_LABELS: Record<ImmunizableAbilityKind, string> = {
  MassiveDamage: 'Golpe Letal',
  TraitKiller: 'Killer',
  Knockback: 'Retroceso',
}

/**
 * specs/040-dinero-extra-inmunidades (FR-010). Texto de las inmunidades de una unidad para el detalle de unidad y la
 * Guía de Enemigos. Cadena vacía si la lista es ausente o vacía — el llamador no renderiza nada en ese caso.
 */
export function describeImmunities(immuneAbilities: ImmunizableAbilityKind[] | undefined): string {
  return (immuneAbilities ?? []).map((kind) => IMMUNITY_LABELS[kind]).join(', ')
}
