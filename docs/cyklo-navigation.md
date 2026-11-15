# CYKLO 1.1.0 — mapy, plánování a navigace

## Vydání
- **CYKLO Open** (`cyklo`) aktualizuje původní modul a zachovává jeho historii a nastavení. OpenFreeMap/MapLibre, explicitní hledání přes Photon, cyklistické výpočty přes BRouter (trekking, fastbike, mtb).
- **CYKLO Mapy.com** (`cyklo-mapy`) se sestavuje ze stejného zdroje; liší se konfigurací vydání. Turistický/základní/letecký raster, geokódování a výpočet přes Mapy REST API.
- Samostatné moduly mají oddělená úložiště podle současné architektury jádra. Přenos plánu je možný exportem/importem JSON; žádný modul nečte data druhého mimo své rozhraní.
- Neprovádí se registrace v referenčním katalogu Mapy.com ani aktivace placené spotřeby. Pro skutečné API je nutný vlastní projekt a klíč. Uživatelský klíč není součástí vydaného kódu; v zařízení je uložen v nastavení. Omezit doménou, např. `danielcech76.github.io`; nejde o serverové tajemství.

## Použití
1. Mapa → **Zjistit polohu**: nový GPS fix, souřadnice, přesnost, výška, stáří. Volitelné sledování bez časomíry/záznamu; žádný GPS požadavek při pouhém načtení modulu.
2. Jeden prst posouvá, dva přibližují a otáčejí (MapLibre). Ruční posun/rotace pozastaví sledování. Kompas nastaví sever, zaměřovač obnoví směr podle nastavení. Boční posuvník funguje i po ručním posunu. V plánování lze gesty oddálit mimo limit živého výhledu.
3. Trasy → Nová: start se pokusí získat aktuální GPS; při odmítnutí lze použít hledání nebo mapu. Start/cíl/via lze vybrat GPS, explicitním hledáním adresy nebo klepnutím v mapě. Nejvýše 15 via. Pořadí mění tlačítka ↑/↓ (mobil) nebo přetažení řádku; bod v mapě je přetahovatelný. Změna invaliduje vypočtenou linii.
4. Vypočítat → délka, odhad času a dostupný výškový profil. Uložit → seznam plánů oddělený od historie skutečných jízd. Kopie, změna názvu, otočení směru s novým výpočtem, smazání, JSON export/import a souvislý GPX import.
5. Simulace → modelová rychlost, 1×/5×/20×, pauza, posun, ukončení; bez GPS a bez vytváření jízdy. Během aktivního záznamu nebo čekání na start není spuštění dovoleno.
6. Použít trasu → původní start / výpočet příjezdu na start / připojení na nejbližší segment. Zapíná sledování GPS; záznam se spouští samostatným tlačítkem.
7. BRouter poskytuje odbočovací pokyny; bez pokynů (Mapy REST, GPX) se zobrazí poctivé sledování modré linie. Zbývající délka a orientační čas, detekce mimo trasu po 5 s nad max(40 m, 1,5×přesnost GPS); přepočet na pokyn se zbývajícími via. GPX se automaticky nepřepočítává, aby nezměnil původní linii.
8. Navigovat v Mapy.com → potvrzení předání bodů externí aplikaci, se zřetelnou informací o přerušení CYKLO na pozadí. Externí aplikace může trasu přepočítat jinak.

## Hranice dat a dostupnosti
- Výsledná geometrie, instrukce ani statistiky Mapy API se nikdy nezapisují do PlanStore/exportů. Ukládá se uživatelský plán z vybraných bodů; jeho výpočet je po opětovném otevření online. Smluvní možnost trvalého ukládání API výsledků je nadále otevřená. Vlastní GPS záznam je samostatný.
- BRouter/Photon veřejné služby nemají garantovanou dostupnost. Žádné průběžné dotazování při psaní ani automatické opakování/přepočítávání; timeout 45 s. Zadaný dotaz/body se odesílají příslušné službě, viditelné mapové oblasti poskytovateli podkladu.
- Mapy logotyp a copyright jsou přítomné v mapě i samostatných vyhledávacích/plánovacích obrazovkách. Logotyp je originál https://api.mapy.com/img/api/logo.svg, viz https://developer.mapy.com/rest-api-mapy-cz/atribution/.
- Mapy data se nepřidávají do offline cache service workeru. Klientské HTTP požadavky mají `no-store`, mapové dlaždice se načítají běžným rendererem.
- 3D je perspektivní sklopení rovinné mapy, ne terénní model. Výšky GPS jsou orientační; import/výpočet bez výšek zobrazí nedostupnost.
- PWA záznam funguje při viditelné aplikaci. Pozadí ukončí GPS watch a přeruší záznam; pokračování pouze ručně.
- Pokud není dostupný WebGL/mapový podklad, funguje schematická modrá plánovaná a zelená zaznamenaná stopa. Výběr cest a mapová gesta vyžadují funkční renderer; lze nadále hledat místa a zaznamenávat GPS.

## Ověření
- Automatické regresní sady pro engine, úložiště, kameru, UI a mapový životní cyklus; nové sady `cyklo-navigation.test.cjs` a `cyklo-planner.test.cjs` pro projekci na trasu, smyčky, simulaci, waypointy, turn hinty, provider kontrakty a zákaz persistence Mapy výsledků.
- UI test ověřuje jednotlivý GPS fix a průběžné sledování bez vytvoření jízdy, nulovou výšku i zastavení watch ID 0 při pozadí.
- Prohlížeč: skutečné hledání Praha hl. n. / Vyšehrad přes Photon, výpočet BRouter (3,6 km), výškový profil, uložení a spuštění simulace.
- Cloudový prohlížeč neposkytl použitelný WebGL; zobrazení podkladu/gesta na telefonu a fyzická GPS zůstávají k terénnímu ověření. Skutečné Mapy.com API nelze ověřit bez uživatelského klíče; testovány kontrakty a chování bez klíče.

## 1.2.0 — jemné karty a sloupcová výška
- Zachovaný layout a paleta, jemné okraje a stíny podle varianty A; výškové sloupce s decentním barevným přechodem podle varianty B.
- Plán, historie i simulace používají společný profil: 24 stejně dlouhých úseků podle vzdálenosti. Výška sloupce je průměr vážený délkou úseku, nikoli počtem vzorků. Tenké značky min/max zachovávají krátké vrcholy; neúplná výšková data zůstávají jako mezery.
- Graf jasně označuje lokální rozsah v metrech (minimální rozsah 2 m pro roviny) a vzdálenost v km. Nulová i záporná výška jsou platná data.
- Simulace obsahuje kompaktní profil pod mapou: projeté zelené sloupce, oranžový aktuální sloupec s výškovým štítkem a světlejší budoucí úseky. Pauza, seek, rychlost přehrávání a konec trasy aktualizují profil ze stejného simulačního stavu.
- Hlavička během simulace uvádí „Simulace“, nezobrazuje starý GPS fix. Skutečné jízdní metriky jsou nahrazeny vysvětlením modelové rychlosti. Opakované informační proužky byly sjednoceny.
- Agregace se cachuje podle trasy; při přehrávání se znovu nezpracovává celý seznam GPS bodů. Změna rozměrů/otočení překreslí oba profily.
- Test `cyklo-elevation.test.cjs` ověřuje vážení, mezery, nulu, rovinu, zachování vrcholů, krajní polohy simulace, cache a přístupný popis grafu. Planner test ověřuje profil i posun jeho aktuálního sloupce při seeku.

## 1.2.1 — obnova mapy a diagnostika Mapy.com
- Opraveno trvalé překrytí mapy náhradním plátnem po jediné chybě dlaždice. Skutečně načtená rastrová dlaždice obnoví podklad; chyba jedné dlaždice nezakryje již funkční mapu. Metadata zdroje sama nepotvrzují úspěšné načtení dlaždice.
- Chyby rozlišují HTTP 401/403, 402, 404, 429, serverové potíže, síť a WebGL. Žádné URL ani API klíče se nevypisují do uživatelského hlášení.
- Nastavení Mapy.com: **Otestovat klíč** a automatické ověření po **Použít klíč a podklad**. GET jedné pevné světové dlaždice `basic/256/0/0/0` (bez GPS), bez ukládání odpovědi, timeout 15 s. Úspěšný HTTP obrázek potvrzuje přístup k Map tiles, nikoli funkčnost WebGL či všech oblastí ostatních mapových sad.
- Nastavení oprávnění klíče: HTTP referer `danielcech76.github.io` bez protokolu a cesty; povolená služba Map tiles. Podle oficiální dokumentace se změny omezení mohou projevit do přibližně 15 minut: https://developer.mapy.com/my-account/api-key-security/.
- Reálný klíč uživatele nebyl čten ani testován. Přesnou příčinu jeho HTTP odmítnutí lze určit až z výsledku testu na jeho zařízení. Samotný původní snímek potvrzuje náhradní podklad, nikoli konkrétní chybu klíče.

## 1.3.0 — rozložení, témata a stabilní zoom
- Nastavení → Vzhled a rozložení: analogový rychloměr dole / nahoře / vodorovný rychlostní pruh nahoře. Výchozí je horní pruh a Lesní krém. Další témata: Modrá mlha a Noční grafit. Volby jsou nezávislé, okamžité a uložené do nastavení každé edice bez změny historie nebo API klíče.
- Rychlostní pruh využívá stejnou vyhlazenou rychlost jako ručička; přesný údaj zůstává doplňkový. Není interaktivním posuvníkem.
- Zoom: pevná kruhová tlačítka 48 × 48 px, kulatý jezdec 24 px na dotykové ploše 48 px. Délka dráhy se přizpůsobuje, tlačítka se nesmršťují. Při výšce mapy pod 320 px se ovládání přesune vodorovně dole. AUTO a zaměření jsou samostatně vpravo nahoře. Kamera i schematický fallback ponechávají místo nad kompaktním ovládáním.
- Témata mění ovládání, ciferník a výškový profil; mapový podklad zůstává ve vlastní paletě poskytovatele. Obě edice sdílejí implementaci.

## 1.3.1 — simulace a svislý zoom
- Volba jiné spodní obrazovky přeruší simulaci, zruší časovač i simulační polohu a otevře vybraný režim. Interní přechod plánovače do mapy při spuštění simulace ji nepřeruší. Spuštění skutečné jízdy nejprve ukončí simulaci. Přepnutí obrazovky samo nezapíná GPS ani záznam.
- Zoom je vždy svisle vpravo, včetně simulace. Automatický vodorovný režim z 1.3.0 je odstraněn. Minimální výška mapy 320 px zajišťuje místo pro ovladač; při nedostatku místa je obsah posuvný.
- Nastavení → Vzhled a rozložení → Průměr ovladače zoomu: 40 / 48 / 56 px (výchozí 48). Tlačítka +/− a jezdec jsou kruhové, mění se jejich průměr i šířka lišty. Celková výška lišty závisí na mapě, nikoli na zvoleném průměru; při změně velikosti zůstává stejná. Volba je uložená lokálně pro každou edici.
- Všech 20 testovacích souborů, build a kontrola balíčků prošly. Integrační UI test spouští skutečný plánovač a ověřuje přechod ze simulace do Jízdy, Tras i Historie bez vytvoření záznamu. Prohlížeč: přechod na Trasy a opětovné spuštění simulace, svislý ovladač 8 px od pravého okraje; změna průměru 48 → 56 px ponechala výšku 216 px, tlačítko i jezdec mají 56 px. Snímek screenshots/cyklo-1.3.1-zoom.jpg. WebGL v cloudovém prohlížeči není dostupné, ověřeno na schematickém podkladu.

## 1.3.2 — zavřené mapové informace
AttributionControl je v kompaktním režimu na všech šířkách a po počátečním načtení stylu je sbalený. Tlačítko i zachovává standardní rozbalení/sbalení i všechny zdrojové informace. Regresní test ověřuje kompaktní konfiguraci a sbalení po načtení; další aktualizace mapy neruší ruční otevření.

## 1.4.0 — Aero Glass, LED Pulse a dotykové vyvolání ovládání
- Nastavení → Vzhled a rozložení → Vzhled: B · Aero Glass / G · LED Pulse. Kompaktní společné ovladače, jemné skleněné vrstvy, vlastní SVG ikona kola. Volba vzhledu je nezávislá na dosavadních třech barevných tématech. Stávající uživatelé dostávají Aero Glass se zachovaným rozložením, tématem i velikostí zoomu.
- LED Pulse při výběru zapne nový horní LED rychloměr; při přepnutí zpět do Aero Glass se LED rozložení přepne na vodorovný pruh. Ručičkové rozložení dole/nahoře i pruh jsou stále volitelné. Nové LED rozložení lze vybrat také samostatně.
- 24 samostatných hranatých LED segmentů: tyrkysové/zelené, jantarové a červené pásmo podle zvoleného rozsahu rychloměru (40/60/80 km/h). Barevná pásma nejsou bezpečnostní varování. Segmenty používají stejnou vyhlazenou rychlost jako ručička; přesné sedmisegmentové číslice se obnovují po 500 ms, respektují desetiny a locale. Bez aktuální rychlosti je údaj pomlčka a LED zhasnuté, nikoli falešná nula. Simulační rychlost zůstává označená jako modelová.
- Skrývat ovládací prvky: výchozí zapnuto, interval 4/6/10/15 sekund, výchozí 6. Na Jízdě/Mapě se skryjí sekundární mapové ovladače, spodní navigace, metriky a simulační panel. Rychlost, stav GPS, pokyny, mapové autorství a rychlá pauza/pokračování v hlavičce zůstávají dostupné. Před prvním startem zůstává tlačítko Spustit jízdu. Chyby a obnova rozpracované jízdy se neskrývají.
- Jakýkoli pointerdown/dotyk v aplikaci obnoví ovladače; vedle mapy je také záložka Ovládání. První probouzecí gesto mapy neotevře výběr místa. U držení prstu, vícedotykového gesta, otevřeného dialogu nebo klávesového focus-visible ovladače se skrytí odloží. Trasy/Historie se neskrývají. Změna obrazovky zobrazí ovladače; zavření modulu odpojí listenery a časovač. Mapa se po změně velikosti přepočítá.
- U detailu trasy jsou Kopie, Export a Smazat pod rozbalovací nabídkou Další akce. Existující potvrzení mazání a obsluha akcí zůstávají zachované. Žádná změna schématu plánů nebo historie.

## 1.4.1 — věrnější provedení schválených B/G návrhů
Předchozí 1.4.0 měnila převážně povrchy původního layoutu. Tato verze mění hierarchii a konstrukci vizuálních prvků: Aero Glass má světle tyrkysové skleněné doky, gradientní horní panel a plovoucí navigaci; LED Pulse má jednotné tmavomodré doky s tyrkysovými hranami, včetně AUTO, zoomu, navigace, dialogů a profilů. Pulse používá vlastní tmavou kontrastní paletu i pro canvas grafy. Mapová kartografie se nemění.
LED číslice jsou vlevo (53 px při šířce 390 px), LED pás vpravo s čitelnou stupnicí nad segmenty. Bez GPS zůstává správná pomlčka, nově se stabilní šířkou dvou číslic; neaktivní segmenty mají rozlišitelná barevná pásma. Neukazuje se vymyšlená rychlost. Barvy segmentů vyjadřují rozsah, nikoli bezpečnostní hodnocení.
Horní pruh/LED mají čtyři základní metriky v jedné kompaktní řadě, rozšířené metriky nepřeplňují kokpit. SVG ikony nahradily emoji spodní navigace a startu. Text tlačítek Pauza/Pokračovat nepoužívá problematické glyphy. Použít trasu je hlavní akce před sekundárními akcemi. Při skrytém ovládání má tlačítko Spustit jízdu kompaktní plovoucí podobu; vyvolávací záložka je na pravé hraně mapy. Velikost kruhů zoomu a jeho celková výška zůstávají řízené dosavadním nastavením.

## 1.5.0 — horní lišta A a automatický přepočet
- Schválená horní lišta A je přímo pod rychloměrem, v základním stavu 58 px vysoká: SVG šipka, vzdálenost po trase, instrukce a doplňující údaj. Zůstává při skrytém ovládání, lze ji vypnout v Nastavení nebo přes její nabídku; znovu zapnout tlačítkem v mapové liště. Vypnutí nezastaví navigaci ani simulaci.
- Data pocházejí z existujících instrukcí trasy, v Open z BRouter voicehints. Mapy.com routing ani běžné GPX zde instrukce nepředávají; panel poctivě ukazuje sledování linie. Pouhé změny směru geometrie nejsou vydávány za instrukce na křižovatkách.
- Výchozí automatický přepočet zapnutý, vzdálenost 50 m (20–200), čas 15 s (5–60). Bere se v úvahu i nejistota GPS: efektivní mez je nejméně 1,5× přesnost fixu. Pro automatiku je nutná známá přesnost nejvýše 50 m a aktuální čas fixu. Mezery mezi fixy nad 5 s resetují souvislé čekání, poloha starší 15 s přepočet nespustí; po 10 s bez nového fixu panel označí neaktuální polohu.
- Během tolerované odchylky oranžový panel ukazuje vzdálenost a zbývající čekání. Návrat do tolerance resetuje časovač a zruší probíhající automatický požadavek. GPS neposouvá splnění průjezdních bodů pouhou boční projekcí; body se považují za projeté až při skutečném přiblížení. Dovést na start zachovává původní start jako výslovný průjezdní bod. Při křížení linie se projekce omezuje kontinuitou předchozího úseku.
- Nejvýše jeden požadavek současně, automatické pokusy s odstupem nejméně 30 s včetně chyb. Ruční Přepočítat zůstává dostupné. Nový výpočet začíná aktuální GPS a zachovává neprojeté body, cíl a profil kola. Původní plán v seznamu se nepřepisuje. Návrat na trasu, ukončení navigace, pozadí, změna parametrů nebo vypnutí automatiky ruší zastaralý automatický požadavek; jeho opožděný výsledek navigaci neobnoví. Výpadek služby ponechá původní trasu.
- Importované GPX bez plánovacích bodů nemá automatickou změnu linie; dostane upozornění na odchylku. Údaje tolerancí se ukládají průběžně, platný rozpracovaný údaj nepřepíše jiná volba.
- Neprovádí se změna schématu historie/plánů ani migrace GPS bodů. Nové předvolby se normalizují a uchovávají spolu s dosavadními.


## 1.11.0 — samostatné hledání z mapy

Kompaktní SVG lupa vlevo nahoře pod přepínači mapy otevírá sdílený dialog hledání bez založení trasy. Skrývá se se sekundárním ovládáním a dotyk ji znovu zpřístupní; centrování vpravo nahoře zůstává trvale dostupné. Hledání používá dosavadní Photon/OpenStreetMap v Open edici nebo Mapy.com v Mapy edici s vlastním klíčem. Zadaný dotaz se odešle službě až po potvrzení formuláře. GPS a záznam se automaticky nezapínají.

Výběr výsledku přepne na Mapu, pozastaví sledování kamery bez vypnutí GPS, zaměří výsledek a vytvoří samostatnou značku. Název a souřadnice jsou v dialogu s akcemi Start zde / Průjezdní bod / Cíl zde / Uložit místo. Pouhé hledání ani výběr nemění rozpracovaný plán nebo běžící navigaci. Teprve při přiřazení k trase se použije existující workflow editoru. Uložená místa jsou dostupná i při příštím samostatném hledání. Značka zůstává po zavření dialogu a při obnovení mapy; obnovení značky nesmí převzít GPS sledování. Značka se uvolní při zničení mapy. V náhradním schématu je vybrané místo označeno barevným bodem.

Režim přiřazení do trasy a režim samostatného hledání jsou explicitně oddělené indexem bodu. Otevření a zavření dialogu zneplatňuje staré odpovědi; opožděné čtení uložených míst se také ignoruje. Automatické regrese ověřují hledání s existujícím i neexistujícím plánem, neměnnost plánu a počtů GPS volání, uložení místa a původní přiřazování výsledku do trasy.

Živé UI ověření: dotaz Praha vrátil výsledky Photon, výběr Prague, Czechia otevřel akce a Uložit místo zpřístupnilo místo při dalším hledání. Žádná skutečná GPS poloha nebo API klíč nebyly použity.
