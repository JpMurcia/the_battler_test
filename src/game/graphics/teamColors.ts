import type { BattleUnit } from '../../engine/types'

/**
 * specs/042-unidades-mundo-cartoon (data-model.md § 5). Color de equipo para la capa de información del
 * campo de batalla (barra de vida individual y anillo de equipo). Son los espejos numéricos de los tokens
 * `--bc-cyan` y `--bc-red` de `src/theme.css`: el código de Pixi no lee variables CSS (biblia de arte §4,
 * «valores espejo que se mantienen»). Sustituye a `CYBER_TEAM_COLOR`, retirado junto con el cuerpo "cyber".
 */
export const TEAM_INFO_COLOR: Record<BattleUnit['team'], number> = {
  Player: 0x22d3ee, // --bc-cyan: aliado
  Enemy: 0xef4444, // --bc-red: enemigo
}
