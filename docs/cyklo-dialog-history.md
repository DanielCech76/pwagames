# CYKLO 1.13.2 / jádro 2.1.1: historie dialogů

Přechod hledání → vybrané místo zavírá původní dialog a otevírá nový v jedné akci. Původní protokol ukládal obě okna jako vnořené položky historie. Zavření vybraného místa potom vracelo předchozí dialog místo mapy. Samostatný test handleru tlačítka tento problém nepokrýval.

CYKLO používá bridge v3 (interní volba sestavení bridgeVersion=3). Oznámení otevření obsahuje replaceDialog jen tehdy, když je dříve oznámený dialog už zavřený. Jádro nahradí aktuální položku historie pouze při shodě tohoto ID s aktuálním dialogem. Skutečně vnořený dialog nad stále otevřeným rodičem nadále přidává krok historie. Při návratu na rodiče jádro výslovně zavře odcházející dialog a synchronizuje runtime.dialog. Bridge nehlásí opožděný close již znovu otevřeného okna a neoznamuje duplicitní otevření z příkazu jádra.

Tím zůstává zachované hardwarové Zpět, přechody plánovače a původní most pro ostatní moduly. Starší vydané balíčky se nemění. CYKLO 1.13.2 vyžaduje jádro 2.1.1, protože oprava historie je na obou stranách protokolu.

Test tests/cyklo-dialog-history.test.cjs propojuje skutečný message handler jádra, bridge v3 a CyclePlanner; simuluje oddělené fronty MutationObserver, nativního close a postMessage. Ověřuje zobrazení místa bez znovuotevření oken, cílové souřadnice, vypnutí GPS follow, hardwarové Zpět a skutečně vnořené dialogy. Proměnná REPRO_OLD_CORE použije starý handler z origin/main pouze pro lokální reprodukci před publikací.

## CYKLO 1.13.3: dokončení přesunu kamery

Po změně obrazovky následuje resize a render. Původní focus používal easeTo s animací 300 ms, zatímco render volal setPitch i při nezměněném sklonu. Vendored MapLibre implementuje setPitch přes jumpTo a jumpTo začíná stop(), což ruší rozběhnutý přesun. Proto mohl dialog zmizet, ale mapa zůstat u původní polohy.

Focus nyní uchovává požadavek do načtení a zobrazení mapy, zastaví předchozí animaci, přeměří mapu a nastaví cílový střed/zoom atomicky pomocí jumpTo. Marker-only repaint požadavek neruší. Render nastavuje sklon jen při skutečném rozdílu. Vyhledání drží follow=false; nové GPS body tak místo nepřepíšou. Nový test cyklo-place-camera.test.cjs ověřuje skutečný cílový střed modelu kamery po resize/render, čekání na styl, skrytou mapu a GPS aktualizaci. Stejný test na publikovaném zdroji 1.13.2 selže. Jádro zůstává 2.1.1.
