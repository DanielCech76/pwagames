# Kapesní arkáda · PWA Games

## Pong 1.1.0

Pong v češtině pro jednoho hráče proti počítači nebo pro dva hráče na jednom displeji. První na 7 bodů vyhrává. Další plánovaná hra: Pinball.

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
