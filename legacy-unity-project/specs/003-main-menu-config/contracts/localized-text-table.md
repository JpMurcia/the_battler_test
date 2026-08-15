# Contract: LocalizedTextTable

Capa: `TheBattler.Model`. Activo de datos (`ScriptableObject`), no un servicio inyectable — se referencia directamente desde componentes de `TheBattler.View` (mismo patrón que `ChapterDefinition`).

## Miembro público

```csharp
public string GetText(string key, SupportedLanguage language)
```

## `GetText(string key, SupportedLanguage language)`

- **Precondición**: ninguna (tolera claves no registradas).
- **Comportamiento**:
  1. Busca una `LocalizedStringEntry` cuyo `key` coincida exactamente (`StringComparison.Ordinal`).
  2. Si no existe ninguna entrada con ese `key` → devuelve `"[" + key + "]"` (marcador visible de clave faltante, útil en QA; **nunca lanza excepción**).
  3. Si existe la entrada, toma el campo correspondiente a `language` (`english`, `chinese`, `french`, o `spanish` si `language == Spanish`).
  4. Si ese campo está vacío o nulo → hace fallback al campo `spanish` de la misma entrada.
  5. Devuelve el texto resuelto.
- **Postcondición**: el valor devuelto nunca es `null` (en el peor caso, el marcador `"[key]"`); nunca lanza.

## Consumidor: `LocalizedTextBinder` (View)

Componente `MonoBehaviour` que se adjunta a un `TMP_Text` existente:

```csharp
public class LocalizedTextBinder : MonoBehaviour
{
    [SerializeField] private LocalizedTextTable m_Table;
    [SerializeField] private string m_Key;

    public void Refresh(SupportedLanguage language)
    {
        m_TmpText.text = m_Table.GetText(m_Key, language);
    }
}
```

- Se invoca `Refresh(language)` en todos los binders activos cuando el jugador confirma un cambio de idioma (FR-004) y una vez al arrancar cada escena, con el idioma cargado desde `MenuSettings`.
- No mantiene estado propio de idioma — siempre recibe el idioma activo desde quien orquesta (el controlador de menú, o un punto de entrada equivalente en escenas que no son el menú, p. ej. `Chapter1_Battle`).

## Doble de test

`LocalizedTextTableTests` (EditMode) construye una `LocalizedTextTable` en memoria (`ScriptableObject.CreateInstance`) con entradas de prueba para verificar: lookup exacto, fallback a español ante campo vacío, y el marcador `"[key]"` ante clave inexistente.
