# Azulejo QR Studio — modul 1.0.0

## Začlenění

- ID `azulejo`, API 1, jádro 2.1.0+, schéma dat 1, `largeData: true`.
- Samostatný offline balíček, položka nabídky a instalace vycházejí ze standardního katalogu; jádro není upraveno.
- Předloha: samostatné Azulejo QR Studio, export kódu z verze 6. Převod zachovává editor, šest ornamentů, import a ořez obrázku, nastavení, kontrolu dekódování a PNG/SVG.
- `ArcadeHost.register`: editor se inicializuje až po INIT. STOP zneplatní asynchronní výsledky, zruší časovače, posluchače a blob URL, uzavře dialogy a vyčká na probíhající zápis obrázku.
- PAUSE přeruší kontrolu/render čekající na časovač. Návrat do viditelného dokumentu editor obnoví. Žádné senzory, kameru ani externí službu modul nepotřebuje.
- `moduleBack` volá `ArcadeHost.back()`. Dialogy `large` a `cropDialog` registruje společný bridge pro historii a systémové Zpět.

## Data a soukromí

`ArcadeHost.storage['settings']` uchovává nastavení editoru. `ArcadeHost.storageAsync['custom-image']` obsahuje objekt `{image, name}` s oříznutým JPEG. Nezapisuje se do nepojmenovaného localStorage ani do samostatné databáze. Proto na obě úložiště působí standardní snapshot/restore a odebrání včetně dat.

Obrázek zůstává na zařízení. Galerie má šest zabalených předloh a jedno místo pro vlastní obrázek; nový import ho nahradí. Vstup do 20 MiB a 40 megapixelů, výstup ořezu 900 × 900. SVG jako import není podporováno. Průhledné části mají bílé pozadí. Samostatná webová aplikace je na jiné doméně; její lokální data nelze automaticky číst, vlastní obraz lze znovu importovat.

Offline instalace obsahuje všechny obrázky, QR generátor i dekodér. Ze stránky se neexportuje HTML závislé na hostiteli; pro výsledky jsou PNG/SVG.

## Ověření

`node tests/azulejo-module.test.cjs` pokrývá inicializaci až po INIT, pozdní dokončení po STOP, čekání na zápis obrázku při STOP, odmítnutí nesprávného typu, ořez nečtvercového obrazu, načtení/smazání uloženého obrázku, návrat, zrušení časovačů a posluchačů, úplnost UI a absenci vnějších podkladů.

`python scripts/check-build.py` kontroluje manifest, SHA-256 a velikost každého souboru, unikátní HTML ID a syntaxi JS. Stávající testy instalací, offline workeru a velkých dat prověřují standardní správu balíčku, namespace, snapshot/restore, zrušení a nedostatek místa.

V prohlížeči bylo navíc ověřeno stažení přes skutečný správce balíčků a kontrola integrity, spuštění v iframe hostitele, systémové Zpět ze zvětšeného náhledu, návrat do kolekce, import/ořez vlastního obrázku, jeho obnovení po novém spuštění, PNG export a spuštění s vykreslením ornamentu po vypnutí testovacího HTTP serveru (ze service-worker cache). Jádro zůstalo 2.1.0.

Tato kontrola nezaručuje čitelnost každého uměleckého QR telefonem. Vlastní obsah, velikost, krytí a tisk vyžadují ověření konkrétního výstupu.

## Licence předloh a knihoven

Šest ornamentálních předloh pochází z vytvořených podkladů Azulejo QR Studio. `qrcode-generator` 1.4.4: MIT, copyright Kazuhiko Arase; `jsQR` 1.4.0: Apache-2.0. Licence jsou součástí `vendor/` a distribuovaného balíčku.
