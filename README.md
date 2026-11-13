# Kapesní arkáda · PWA Games

První verze: **Pong** pro jednoho hráče proti počítači nebo pro dva hráče na jednom displeji. České rozhraní, multitouch, otočení hřiště po 90°, pauza, restart, celá obrazovka a offline režim. Další plánovaná hra: Pinball.

## Spuštění

Statická aplikace bez závislostí a sestavení. Lokálně: `python -m http.server 8000`, potom otevřít http://localhost:8000. Service worker vyžaduje HTTPS nebo localhost.

## GitHub Pages

Workflow `.github/workflows/pages.yml` publikuje větev `main`. V Settings → Pages nastavte Source na **GitHub Actions**, pokud automatické zapnutí není povoleno. Očekávaná adresa: https://danielcech76.github.io/pwagames/

Android Chrome: otevřít web → Instalovat aplikaci / Přidat na plochu. Instalace a první načtení vyžadují připojení, potom lze hrát offline.

## Ovládání

- Telefon/tablet: táhnout prstem po vlastní polovině; pro dva hráče lze použít dva prsty současně.
- Jeden hráč ovládá levou pálku, pravou počítač. Po otočení se orientace ovládání přepočítá.
- Klávesnice: W/S a šipky nahoru/dolů; mezerník pro pauzu.
- Hraje se do 7 bodů. Opuštění okna automaticky pozastaví hru.

## Aktualizace

Při změně souborů změňte verzi cache v `sw.js`. Nová verze se aktivuje po zavření všech oken staré aplikace a opětovném otevření.
