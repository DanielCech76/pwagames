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

## Verze 1.3.0 · Návrat míčku, grafika a odezva

- Míček, který se vrátí do spodní části vystřelovací šachty, se znovu připraví k vystřelení. Počet míčků, skóre a terče zůstávají zachované. Ošetřený je i téměř stojící míček v šachtě.
- Plný zdvih páčky má rychlost 32 rad/s místo 13 rad/s: přibližně 29 ms místo 70 ms. Pohyb začíná v prvním fyzikálním kroku po zachycení vstupu. Celková dotyková latence závisí na displeji a prohlížeči.
- Ilustrovaný podklad stolu, kovové lišty, číslované svítící terče a detailnější mechanické prvky.
- `pinball-renderer.js` odděluje vykreslování od ovládání. Pozadí, lišty a těla odrážečů se připraví do jedné statické vrstvy; páčky, kulička a světla používají připravené obrázky. Náročné stíny a ilustrace se nepřepočítávají každý snímek.
- `assets/neon-playfield.jpg` je originální generovaný ilustrovaný podklad, součást offline cache. Přesná kolizní geometrie a pohyblivé prvky se vykreslují kódem nad ním.

Doplněné regresní testy ověřují znovunabití vráceného i stojícího míčku, zachování skóre a počtu míčků a úplný zdvih obou páček do 33 ms simulovaného času.

## Verze 1.4.0 · Laboratoř telefonu

Nová součást kolekce je samostatné funkční demo, nezávislé na hrách. V menu otevři **Laboratoř telefonu**, potom vyber **Zapnout senzory**. Pro polohu použij zvlášť **Zapnout polohu**. Pokud prohlížeč požádá o oprávnění, povol příslušný přístup.

Zobrazuje:

- Náklon a orientaci α/β/γ ve stupních, absolutní/relativní referenci, vizualizaci náklonu a natočení. Kalibrace nastaví neutrální polohu vizualizace, původní úhly zůstávají dostupné. Nejde o garantovaný kompas.
- Zrychlení X/Y/Z s gravitací i bez gravitace v m/s². Velikost zrychlení se počítá jen při dostupnosti všech tří os.
- Rychlost otáčení X/Y/Z (β/γ/α) v °/s z DeviceMotionEvent.rotationRate, interval událostí a jejich průměrnou četnost.
- Zeměpisnou šířku/délku, přesnost, výšku, přesnost výšky, rychlost v km/h, směr pohybu a čas posledního určení polohy. Poloha může vycházet z různých systémových zdrojů, není zaručeno přímé GPS měření.

Pomlčka značí chybějící údaj; nula je platná hodnota. Detekce rozhraní není důkazem dostupného hardwaru: demo rozlišuje čekání, odmítnutí přístupu, události bez hodnot, zastaralá data a živá data. Některá zařízení neposkytují všechny údaje. Data senzorů nejsou získávána z cloudu ani simulována.

Přístup vyžaduje zabezpečený kontext (HTTPS nebo localhost). Povolení pohybu/orientace se vyžádá z kliknutí tam, kde prohlížeč poskytuje requestPermission. Sledování se zastaví při odchodu z laboratoře nebo přepnutí do pozadí a znovu se zapíná ručně. Údaje se drží jen v paměti otevřené stránky, neodesílají se a neukládají. Po zastavení zůstávají viditelné poslední hodnoty; při odchodu z laboratoře se vymažou.

Testy: `node tests/phone-lab.test.cjs`. Ověřují aktivaci, povolení, nulové/chybějící hodnoty, mapování os, kalibraci, ukončení geolokačního sledování i s ID 0, zastavení na pozadí a odchod během čekání na povolení. Skutečná dostupnost senzorů a přesnost polohy vyžadují ověření na fyzickém zařízení.
