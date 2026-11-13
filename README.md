# Kapesní arkáda · PWA Games

## Pong 1.1.0

Pong v češtině pro jednoho hráče proti počítači nebo pro dva hráče na jednom displeji. První na 7 bodů vyhrává. Součástí kolekce je také Pinball Neon Arcade.

- Celookenní hra, automatický požadavek na celou obrazovku při spuštění (podle možností prohlížeče).
- Samostatné dotykové pásy mimo hřiště; pro dva hráče fungují současně.
- Automatické rozložení na výšku/šířku, ruční otočení v nastavení.
- Fialovo-mentolový vzhled, světelné pálky a stopa míčku.
- Pauza, nová hra a automatické pozastavení při přepnutí do pozadí.
- PWA instalace a offline provoz po prvním úplném načtení.

## Ovládání

Táhni prstem v ovládacím pásu. Poloha v pásu odpovídá poloze pálky. Na výšku máš pás dole, soupeř nahoře. Na šířku jsou pásy na bocích. Počítač ovládací pás nepotřebuje.

Klávesnice: šipky vlevo/vpravo nebo A/D pro tebe; J/L pro druhého hráče. Mezerník pozastaví hru. Režim, novou hru, otočení a celou obrazovku najdeš pod ozubeným kolem.

## Lokálně

Bez sestavení a bez závislostí: `python -m http.server 8000`, pak http://localhost:8000. Service worker vyžaduje HTTPS nebo localhost.

## GitHub Pages

Workflow `.github/workflows/pages.yml` publikuje větev `main`. V Settings → Pages nastav Source na **GitHub Actions**, pokud automatické zapnutí není povoleno. Adresa: https://danielcech76.github.io/pwagames/

Android Chrome: otevři web a vyber Instalovat aplikaci / Přidat na plochu. Úplný fullscreen závisí na prohlížeči; při odmítnutí hra využije celé dostupné okno.

## Aktualizace

Při změně statických souborů zvyš verzi cache v `sw.js`. Nová verze se po stažení aktivuje automaticky a obnoví stránku. Rozehrané skóre se neukládá.

## Pinball 1.2.0 · Neon Arcade

V menu vyber Pinball. Hra obsahuje tři odrážeče, šest terčů, dvě páčky, vystřelovací dráhu a tři míčky. Podrž VYSTŘELIT a pusť pro nastavení síly. Obě velká tlačítka páček fungují současně a jsou mimo hřiště. Na šířku je stůl zachovaný na výšku a ovládání je vedle něj. Rekord je uložen lokálně pro konkrétní stůl.

Klávesnice: A/D nebo šipky vlevo/vpravo, mezerník vystřelí, P pozastaví. Páčky je možné držet. Přepnutí do pozadí pozastaví hru. Novou hru najdeš v nastavení.

Body: odrážeč 100, nový terč 250, boční odrážeč 25. Kompletní sada terčů přidá 2 000 bodů a zvýší násobič až na ×5. Body se násobí aktuálním bonusem. Terče se po kompletní sadě obnoví.

### Rozšíření o další stoly

- `pinball-tables.js`: registr stolů a deklarativní geometrie, gravitace, páčky, počty míčků, barvy a bodování. Každý stůl má stabilní `id` pro oddělený rekord.
- `pinball-engine.js`: fyzika nezávislá na DOM, pevný krok 1/240 s, kolize a rychlost pohybujících se páček. Události oddělují pravidla od rozhraní.
- `pinball.js`: ovládání, herní smyčka, vykreslení Neon Arcade a lokální rekord.

Aktuální vykreslení je pro stůl 600 × 1000. Další stůl stejného typu může použít jinou geometrii a nastavení; pro nový vizuální styl se přidá renderer a pro nový druh mechaniky odpovídající kolizní prvek. Při přidání druhého stolu se doplní výběr z registru před spuštěním. Rampy a multiball nejsou součástí první verze.

Kontroly fyziky: `node tests/pinball-engine.test.cjs`. Ověřují průchod vystřelovací dráhou při třech silách, stabilitu simulace, odraz a skóre, aktivní páčku, bonus, tři míčky a reset.
