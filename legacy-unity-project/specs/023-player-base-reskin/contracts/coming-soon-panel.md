# Contract: Panel "Próximamente" compartido (`ComingSoonUIController`)

Ver [research.md §2-§4](../research.md) para las decisiones de diseño detrás de este contrato.

## `ComingSoonUIController` — contrato de uso

```text
ShowSystem(systemName: string):
    si m_SystemNameLabel == null: return   # fallback silencioso
    m_SystemNameLabel.text = systemName
```

**Regla de contrato**: `ShowSystem()` no activa el `GameObject` que lo contiene — el llamador (`PlayerBaseDashboardUIController`) es responsable de `SetActive(true)` antes de invocarlo, exactamente el mismo orden que ya usa para los 7 paneles existentes (`m_XPanel.SetActive(true); m_XUIController.OnPanelOpened();`).

## `PlayerBaseDashboardUIController.OpenComingSoon(string systemName)` — contrato de apertura

```text
OpenComingSoon(systemName):
    si m_ComingSoonPanel == null: return
    m_ComingSoonPanel.SetActive(true)
    si m_ComingSoonUIController != null: m_ComingSoonUIController.ShowSystem(systemName)
```

Cada uno de los 4 listeners nuevos (`m_GamatotoNavigationButton`, `m_GachaNavigationButton`, `m_StorageNavigationButton`, `m_ShopNavigationButton`) llama a este único método con su nombre de sistema fijo — no hay 4 métodos de apertura casi idénticos, hay 1 método + 4 nombres.

**Regla de contrato (instancia compartida)**: no se instancia un `ComingSoonPanel` nuevo por sistema — es el mismo `GameObject`/componente para los 4, reabierto con un nombre distinto cada vez. Tocar dos accesos "Próximamente" seguidos no debe dejar más de una instancia activa.

**Regla de contrato (no interfiere con los 7 accesos reales)**: `OpenComingSoon()` no toca `m_UpgradePanel`/`m_TeamPanel`/etc. ni ningún otro campo existente — es aditivo, mismo criterio que el resto de esta spec (FR-003/FR-004/FR-005 de spec.md).

## Acceptance mapping

| Escenario de spec.md | Cubierto por |
|---|---|
| US1 (cabecera con nuevo estilo, mismos valores) | `Themed*` sobre la cabecera; `PlayerBaseFlowController`/`Refresh()` sin cambios (data-model.md) |
| US2 Escenario 1 (botón "Mejorar" abre el mismo panel, con nuevo tema) | `Themed*` sobre el botón existente; `OpenUpgradePanel()` sin cambios |
| US2 Escenario 2 (panel opcional no asignado no rompe el layout) | Mismo patrón nulo-seguro ya existente, sin modificar |
| US2 Escenario 3 (contenido interno de los 7 paneles no cambia) | Esta spec solo toca el chrome del Hub, no el interior de `UnitUpgradeUIController`/etc. (fuera de alcance, FR-004) |
| US3 Escenario 1 (los 4 accesos "Próximamente" visibles y themeados) | `Themed*` sobre los 4 botones nuevos, igual que sobre los 7 existentes |
| US3 Escenario 2 (tocar cualquiera abre el mismo panel compartido con el nombre correcto) | `OpenComingSoon(string)` + `ComingSoonUIController.ShowSystem(string)`, ver arriba |
| Edge case (panel opcional no asignado) | `OpenComingSoon()`/`OpenXPanel()` retornan sin efecto si su `GameObject` es `null` |
| Edge case (acceso a sistema no construido no navega a ninguna pantalla real ni excepciona) | `ComingSoonUIController` no depende de ningún sistema (Gamatoto/Gacha/Storage/Shop) — no hay nada que pueda fallar por su ausencia |
| Edge case (varios accesos "Próximamente" seguidos reutilizan la misma instancia) | Instancia única compartida (ver "Regla de contrato (instancia compartida)" arriba) |
