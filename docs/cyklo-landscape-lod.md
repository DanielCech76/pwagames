# CYKLO 1.14.0 — vzdálená textura a blízké 3D objekty

## Ovládání

Ve 3D krajině je ve výchozím stavu zapnuté „Vzdálenou krajinu nahradit texturami“. Dosah 3D detailů lze zvolit 100 / 200 / 350 / 500 / 1000 / 2000 metrů; výchozí je 500 m od kamery. Max. oblast 3D vegetace dále omezuje poloměr výpočtu stromů a keřů. Menší dosah detailů snižuje množství vytvářené a vykreslované geometrie, vzdálený porost ale nadále zobrazuje plošná textura. Při vypnutí přepínače se vrací předchozí zjednodušované vzdálené modely.

## Podporované prvky

- Listnaté, jehličnaté a smíšené lesy: vzdálené koruny mají stejnou paletu jako 3D modely. Hustota a velikost vegetace mění počet a velikost korun v textuře. Ruční typ lesa má přednost; v režimu auto se pro výplň uplatní dostupný leaf_type/leaf:type/wood. Bez těchto dat používá textura stejný regionální výškový odhad jako modely. Textura je obraz očekávaného porostu, nikoli fotografie nebo evidence konkrétních stromů.
- Křoviny, nízké porosty a podrost: textura a 3D shluky využívají stejnou paletu a společný dosah.
- Louky a pole: používají lehké procedurální povrchové textury; 3D stébla ani jednotlivé plodiny aplikace nepodporuje. Pole používají skutečnou vrstvu landuse, ostatní porosty landcover.
- Zapnuté 3D budovy v krajině: mimo dosah zůstanou ploché texturované půdorysy. Filtr skutečně vyřadí vzdálené extruze; jejich výška a základna klesá v přechodovém pásmu. Původní filtr a výškové výrazy se zachovávají a obnovují po vypnutí funkce. Dostupné jen tam, kde podklad podporuje vektorové 3D budovy; raster Mapy.com je nepodporuje.

## Vzdálenost a výkon

Z projektivní matice se počítá skutečná poloha kamery pro shader. Pro přípravu lokální geometrie se používá poslední odpovídající poloha kamery; do její dostupnosti odhad z veřejných údajů zoomu, náklonu, směru a výšky viewportu. Vzdálenost zohledňuje i výšku kamery. Pokud je celá scéna za dosahem detailů, neprovádí se ani dotazování/samplování polygonů stromů, nevzniká mesh a starý mesh se invaliduje. Při přiblížení se generuje pouze blízká oblast. Limity kvality (1000/3000/6000 prvků), worker, omezení vrcholů a vyloučení vody, budov a okolí cest zůstávají zachované.

Shader vypíná detail za hranicí dosahu a posledních 25 % překrývá s texturou pomocí levné uspořádané masky bez průhledného blendování. Příprava geometrie je omezená a časovaná, nikoli spuštěná pro každý snímek. Textury jsou 64×64, procedurální, lokální a aktualizované jen při změně parametrů/regionálního profilu. Barevné palety sdílí kód s 3D objekty; textura i vzorek jsou deterministické. Textury se vkládají pod dostupné vektorové cesty/vodu/budovy. U rastrového podkladu jsou plochy pouze stylizovaným překryvem; jejich geometrie může být jiná než v rastru.

## Ověření

Automatické testy ověřují nulovou geometrii a nulové samplování ve vzdáleném pohledu, vznik blízkých modelů, invalidaci po oddálení, vliv hustoty/typu/velikosti na textury, extrakci kamery z projektivní matice, filtrování budov, pořadí vrstev, cache a úklid. Původní testy ověřují polygonové otvory, vyloučení vody/cest/budov, DEM, GL stav a worker. Shadery byly navíc skutečně přeloženy a slinkovány v OpenGL ES 3 kontextu EGL. Výkon na konkrétním telefonu ani vizuální přechody za jízdy tím nejsou změřené.

## 1.14.1 — nový základ velikosti

Nových 100 % odpovídá původním 50 %. Výška i odvozená šířka všech vegetačních modelů a velikost jejich stopy v dosavadní textuře používají poloviční základ. Při jednorázovém převodu nastavení (`treeSizeVersion=2`) se původních 50 % převede na 100 %; původní výchozí 100 % také přijme nový menší základ. Ostatní vlastní hodnoty se zdvojnásobí, aby zachovaly fyzickou velikost. Rozsah je proto nově 50–300 %. Styl textury se tímto vydáním nemění; šest návrhů je pouze k výběru před další implementací.
