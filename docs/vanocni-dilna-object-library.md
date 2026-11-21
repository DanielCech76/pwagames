# Knihovna objektů Vánoční dílny

Soubor ZIP může obsahovat jednu nebo více skupin. V kořeni musí být soubor
`manifest.json` v UTF-8. Hodnota `format` je `vanocni-dilna-object-library`
a `version` je číslo `1`.

```json
{
  "format": "vanocni-dilna-object-library",
  "version": 1,
  "groups": [
    {
      "id": "vesnice",
      "name": "Vánoční vesnice",
      "cover": "groups/vesnice/cover.svg",
      "items": [
        { "id": "kostel", "name": "Gotický kostel", "svg": "groups/vesnice/items/kostel.svg" }
      ]
    }
  ]
}
```

- `id` obsahuje 1 až 80 znaků z množiny A–Z, a–z, 0–9, podtržítko a pomlčka.
  ID skupin jsou jedinečná v balíčku. ID motivů jsou jedinečná v rámci skupiny.
- `name` je zobrazovaný název o nejvýše 120 znacích.
- `iconItem` je nepovinné ID motivu ze stejné skupiny použitého jako titulní ikona. Samostatná obálka `cover` má přednost.
- `cover` je nepovinná cesta k SVG obálce. Bez obálky se použije první motiv
  nebo ikona prázdné skupiny.
- `items` je seznam SVG motivů a může být prázdný. `svg` odkazuje na soubor
  s příponou `.svg`. Cesty jsou relativní ke kořeni archivu, používají lomítka
  a mají segmenty se znaky A–Z, a–z, 0–9, tečka, podtržítko a pomlčka.
- SVG musí mít `viewBox` nebo pevné rozměry. Použij jednobarevnou siluetu
  a skutečně průhledné výřezy. Skripty, externí zdroje, text a vložené obrázky
  import nepodporuje. Zdrojové SVG zůstává v knihovně a exportuje se beze
  změny. Pro kompozici editor vytváří jednobarevný obrys ze vzorkované masky.
- Limity archivu jsou 16 MB, nejvýše 500 souborů, 2 MB na soubor, 100 skupin
  a 400 motivů na skupinu. Celkový rozbalený obsah je omezen na 16 MB.
