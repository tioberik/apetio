# Nutritivni dnevnik — specifikacija za nativnu mobilnu aplikaciju (v1)

> Dokument za razvojnu (Claude Code) sesiju. Nastao iz funkcionalnog prototipa
> izgrađenog kao Claude artefakt (React + key-value pohrana) koji je validirao
> tokove unosa, podatkovni model i AI procjenu obroka. Sve odluke ispod su
> donesene svjesno s vlasnikom projekta; ne mijenjati bez dogovora.

## 1. Vizija i opseg

Osobni dnevnik prehrane za praćenje kalorija, makronutrijenata (proteini,
masti, ugljikohidrati), vode, suplemenata i tjelesne težine — s **AI procjenom
obroka kao središnjom funkcionalnošću**. Korisnik opiše obrok prirodnim
jezikom ("150 g pileća prsa, 100 g riže, salata" ili "Perutnina Ptuj pickles
cheese kobasica 105 g"), a AI vraća nutritivne vrijednosti po stavci, uz
obveznu web-provjeru deklaracija za brendirane proizvode i transparentan
izvor podataka po stavci.

**Primarno tržište/jezik:** Hrvatska i Bosna i Hercegovina (hrvatski jezik,
metrički sustav, decimalni zarez). Sekundarno: engleski.

**v1 = osobna aplikacija (BYOK):** korisnik unosi vlastiti Anthropic API
ključ. Bez korisničkih računa, bez backenda, bez analitike. Distribucija:
interni build / TestFlight. Objava na storeove je svjesno odgođena (vidi §15).

**Ne-ciljevi v1:** mikronutrijenti, sinkronizacija među uređajima preko
clouda, društvene funkcije, integracija s Apple Health/Google Fit (kasnije).

## 2. Ključne arhitektonske odluke (sažetak)

| # | Odluka | Obrazloženje |
|---|--------|--------------|
| A1 | React Native + **Expo** (managed workflow, EAS Build) | iOS build bez Maca, OTA update, gotovi moduli (kamera, SQLite, secure store, notifikacije) |
| A2 | **TypeScript strict** | Pouzdanost AI-asistiranog razvoja; tipizirana shema |
| A3 | **Local-first**: SQLite (expo-sqlite) + Drizzle ORM; MMKV za postavke | Privatnost arhitekturom, offline rad, trenutni upisi, bez backenda |
| A4 | AI = Anthropic Messages API, **BYOK**, ključ u expo-secure-store | Ključ se NIKAD ne ugrađuje u binary niti sprema u običan storage |
| A5 | AI procjena s **web_search alatom uključenim po defaultu** | Preciznost za regionalne brendove je glavna vrijednost aplikacije |
| A6 | Open Food Facts i USDA su **validacijski/sekundarni** izvori, ne primarni | Pokrivenost OFF-a za HR/BiH je nekonzistentna; AI + web je primaran put |
| A7 | i18n (hr default + en) **od F0** | Naknadno dodavanje jezika = skupo prevrtanje svih ekrana |
| A8 | Light i dark tema od F0, sistemski default | Zahtjev vlasnika |
| A9 | NativeWind (Tailwind sintaksa) | Prijenos dizajn-jezika iz prototipa |
| A10 | Kalkulator potreba: **Mifflin-St Jeor** motor, ON-stil čarobnjak forme | Vidi §8 — istraženo i obrazloženo |

## 3. Tehnološki stog

- **Expo SDK** (najnoviji stabilni), Expo Router (file-based navigacija)
- **TypeScript** (strict), ESLint + Prettier
- **NativeWind** za stilove; **FlashList** za liste; **react-native-svg** za grafove (prsten, stupci — portirati iz prototipa)
- **expo-sqlite + Drizzle ORM** (+ drizzle-kit migracije); **react-native-mmkv** (postavke/preference)
- **expo-secure-store** (API ključ), **expo-camera** (barkod + foto deklaracije), **expo-notifications** (podsjetnici za suplemente), **expo-haptics**
- **react-i18next + expo-localization**; formatiranje brojeva/datuma kroz `Intl` s aktivnim localeom
- Testovi: **Vitest/Jest** za čistu logiku (kalkulator, skaliranje, parser AI odgovora, uvoznik) — UI testovi nisu obavezni u v1

## 4. Arhitektura (slojevi)

```
app/            → ekrani (Expo Router)
src/components/ → prezentacijske komponente
src/features/   → domenska logika po značajkama (diary, foods, recipes, ai, water, supplements, weight, insights, settings)
src/db/         → shema (Drizzle), migracije, repozitoriji (jedini sloj koji dira SQL)
src/services/   → anthropic.ts (AI klijent), off.ts (Open Food Facts), export.ts (izvoz/uvoz)
src/i18n/       → hr.json, en.json
src/theme/      → tokeni boja/tipografije za light/dark
```

Pravila: ekrani ne diraju SQL direktno; sve kroz repozitorije. AI klijent je
jedan modul s jednom javnom funkcijom po slučaju (procjena teksta, čitanje
deklaracije sa slike). Sav tekst u UI-ju ide kroz `t('kljuc')` — nikad
hardkodirano.

## 5. Podatkovni model (SQLite, implementirati kroz Drizzle)

```sql
-- Namirnice (osobna baza; sjeme buduće regionalne baze)
CREATE TABLE foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,                      -- npr. 'Perutnina Ptuj'
  barcode TEXT,                    -- EAN, ako je skeniran
  unit TEXT NOT NULL CHECK (unit IN ('g','kom')),
  base_amount REAL NOT NULL CHECK (base_amount > 0),
  kcal REAL NOT NULL, protein REAL NOT NULL, fat REAL NOT NULL, carbs REAL NOT NULL,
  source TEXT,                     -- 'deklaracija' | 'off' | 'usda' | 'ai-procjena' | 'rucno'
  verified INTEGER NOT NULL DEFAULT 0,  -- korisnik potvrdio s etikete
  use_count INTEGER NOT NULL DEFAULT 1,
  last_used TEXT,                  -- ISO datum
  created_at TEXT NOT NULL
);

-- Dnevnički unosi (snapshot vrijednosti u trenutku unosa — izmjena namirnice NE mijenja povijest)
CREATE TABLE diary_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,              -- 'YYYY-MM-DD' LOKALNI datum (pouka iz prototipa: nikad UTC!)
  meal TEXT NOT NULL CHECK (meal IN ('dorucak','rucak','vecera','uzina')),
  name TEXT NOT NULL,
  unit TEXT NOT NULL, amount REAL NOT NULL,
  kcal REAL NOT NULL, protein REAL NOT NULL, fat REAL NOT NULL, carbs REAL NOT NULL,
  source TEXT,
  recipe_id TEXT,                  -- ako je unos recept
  created_at TEXT NOT NULL
);
CREATE INDEX idx_diary_date ON diary_entries(date);
-- Dnevni totali = SELECT date, SUM(...) GROUP BY date (u prototipu ručni 'day-index' — ovdje nepotreban)

CREATE TABLE recipes (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  portions REAL NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0, last_used TEXT, created_at TEXT NOT NULL
);
CREATE TABLE recipe_items (
  id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL, unit TEXT NOT NULL, amount REAL NOT NULL,
  kcal REAL NOT NULL, protein REAL NOT NULL, fat REAL NOT NULL, carbs REAL NOT NULL
);

CREATE TABLE day_meta (
  date TEXT PRIMARY KEY,
  water_ml INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE supplements (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, detail TEXT,
  doses INTEGER NOT NULL DEFAULT 1 CHECK (doses BETWEEN 1 AND 3),
  sort INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT               -- 'HH:MM' ili NULL
);
CREATE TABLE supplement_log (
  date TEXT NOT NULL, supplement_id TEXT NOT NULL,
  taken_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, supplement_id)
);
-- Seed suplemenata pri prvom pokretanju (vlasnikov protokol):
--   ('kreatin','Kreatin','5 g',1), ('magnezij','Magnezij glicinat','300 mg · 2+2 kapsule',2)

CREATE TABLE weight_log (
  date TEXT PRIMARY KEY, kg REAL NOT NULL
);
```

**MMKV (postavke):** ciljevi (kcal/B/M/UH, voda L), locale, tema, preferenca
web-pretrage u AI procjeni, zadnje korišteni obrok. **SecureStore:** samo
`anthropic_api_key`.

## 6. AI procjena — specifikacija

### 6.1. Konfiguracija
- Endpoint: `POST https://api.anthropic.com/v1/messages`, header `x-api-key` iz SecureStore + `anthropic-version`.
- Model: `claude-sonnet-4-6` (default; napredna postavka dopušta drugi model string).
- `max_tokens: 1500`. Web search alat: `{"type":"web_search_20250305","name":"web_search"}` — **uključen po defaultu**, isključiv po zahtjevu (preferenca se pamti). UI mora prikazati stanje "Pretražujem deklaracije…" jer poziv s pretragom traje 10–20 s.

### 6.2. Prompt (portirati doslovno, uz {locale} varijantu na en)
```
Ti si nutricionistički asistent. Za sljedeći opis obroka vrati na kraju ISKLJUČIVO JSON,
bez markdown ograda, točno u ovom obliku:
{"stavke":[{"naziv":"","kolicina":0,"jedinica":"g","kalorije":0,"proteini":0,"masti":0,
"ugljikohidrati":0,"izvor":""}],"napomena":""}

Pravila:
- "jedinica" je "g" ili "kom".
- kalorije/proteini/masti/ugljikohidrati su STVARNE vrijednosti za navedenu "kolicinu" (ne na 100g).
- Ako korisnik navede više namirnica, vrati zasebnu stavku za svaku.
- Ako količina nije navedena, pretpostavi uobičajenu prosječnu porciju i upiši je.
- Za svaki KUPOVNI/brendirani proizvod (naveden proizvođač ili zaštićeni naziv) OBAVEZNO
  potraži službenu nutritivnu deklaraciju web pretragom (stranica proizvođača, Open Food
  Facts, USDA ili web trgovina) i preračunaj je na navedenu količinu. Za generičke/domaće
  namirnice ne pretražuj, koristi standardne baze.
- "izvor" po stavci: odakle su brojke ("deklaracija proizvođača", "Open Food Facts",
  "USDA", "procjena prema sličnim proizvodima"). Nikad ne tvrdi da podaci nisu javno
  dostupni — ako deklaraciju nemaš, iskreno označi izvor kao procjenu.
- "napomena": jedna kratka rečenica o preciznosti procjene.
```

### 6.3. Parsiranje odgovora (pouka iz prototipa — obavezno ovako)
S uključenom pretragom `content` sadrži više blokova (text/tool_use/rezultati)
i tekst prije/poslije JSON-a. Parser: spoji sve `type==='text'` blokove →
skini ```json ograde → pronađi **zadnji** indeks podniza `{"stavke"` → hodaj
brojačem dubine zagrada preskačući stringove → `JSON.parse` izrezanog objekta.
Jedinični testovi za: čisti JSON, JSON s preambulom, ugniježđeni navodnici,
odsječen odgovor (→ greška).

### 6.4. Rukovanje greškama (točne poruke iz prototipa)
- HTTP 401 → "API ključ nije važeći — provjeri ga u Postavkama."
- 429 / `rate_limit_error` → poruka o limitu; ostatak aplikacije radi normalno.
- 529 / `overloaded_error` → "pokušaj za minutu-dvije".
- Parse greška → generička + ponuda ručnog unosa. UI rezultata: svaka stavka
  editabilna prije spremanja (naziv, količina, kcal, B, M, UH), checkbox po
  stavci, prikaz "Izvor: …" ispod stavke, gumb "Ponovi s web pretragom" ako je
  prva procjena rađena bez nje.

### 6.5. Čitanje deklaracije sa slike (novo, native-only)
Tok: kamera/galerija → slika deklaracije → Messages API s image blokom
(base64) + kratki prompt "pročitaj nutritivnu tablicu, vrati isti JSON format,
izvor='deklaracija (foto)'" → isti editabilni rezultat. Ovo je primarni put za
BiH proizvode kojih nema u javnim bazama.

## 7. Izvori podataka i strategija točnosti

Trokut, ovim redoslijedom povjerenja po tipu namirnice:
1. **Pakirani proizvod s barkodom** → sken (expo-camera) → Open Food Facts API
   (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`, bez ključa,
   User-Agent obavezan). Pogodak → predpopuni, korisnik potvrdi (verified=1,
   source='off'). Promašaj (očekivano čest za BiH) → fallback: AI procjena s
   web pretragom ILI foto deklaracije (§6.5).
2. **Pakirani proizvod bez skena** → AI + web pretraga (deklaracija proizvođača).
3. **Generičko/domaće** → AI (standardne baze; USDA vrijednosti).

Svaki zapis nosi `source`; potvrđeni s etikete dobivaju `verified=1`. Time
osobna baza organski postaje **sjeme regionalne HR/BiH baze proizvoda** —
polja `barcode`, `brand`, `verified` postoje od prvog dana upravo zato da
budući opt-in doprinos zajedničkoj bazi (§15) ne traži migraciju.

## 8. Kalkulator dnevnih potreba

**Istraženo (srpanj 2026):** Optimum Nutrition "Protein Calculator" je
čarobnjak od ~10 koraka (spol, dobne SKUPINE, visina, težina, cilj, dnevna
aktivnost opisana koracima/dan, tjedni trening, tip treninga, prehrambene
preferencije) i eksplicitno navodi da koristi **Harris-Benedict** jednadžbu;
rezultat gejtaju e-mailom uz preporuke vlastitih proizvoda i 15% popust.

**Naša odluka — motor:** **Mifflin-St Jeor** (1990), ne Harris-Benedict
(1919): MSJ je u validacijama najtočnija prediktivna jednadžba za zdrave
odrasle i standard modernih kalkulatora; HB sustavno precjenjuje BMR za
~5 %. Opcionalno **Katch-McArdle** ako korisnik unese % tjelesne masti.
Sve formule su ±10 % procjene — aplikacija to pošteno komunicira i (F7)
predlaže korekciju cilja iz stvarnog trenda težine.

```
BMR (MSJ):  muško  = 10·kg + 6.25·cm − 5·god + 5
            žensko = 10·kg + 6.25·cm − 5·god − 161
BMR (K-M):  370 + 21.6 · LBM_kg        (LBM = kg · (1 − BF%))
TDEE = BMR · faktor aktivnosti:
  sjedilački 1.2 | lagano 1.375 | umjereno 1.55 | vrlo 1.725 | ekstremno 1.9
Cilj: skidanje −15…−20 % (min. cap: žene 1200, muškarci 1500 kcal)
      održavanje ±0 | dobivanje +10…+15 %
Makroi: proteini 1.6–2.2 g/kg (default 1.8; trening s opterećenjem → 2.0)
        masti min. 0.8 g/kg (≈25 % kcal) | UH = ostatak kalorija
Voda (prijedlog): 33 ml/kg, zaokruženo na 0.25 L
```

**Forma — preuzimamo ON-ov UX, ne motor:** koračni čarobnjak; dnevna
aktivnost opisana konkretno koracima ("<3000 koraka/dan" … ">12000") jer
ljudi to procjenjuju točnije od apstraktnih pridjeva; trening odvojen od
životnog stila (dvije dimenzije → matrica faktora); "zašto pitamo?" uz svako
polje. **Odbacujemo:** dobne raspone (koristimo točnu dob — formula je
linearna po godinama), e-mail gate, preporuke proizvoda. Rezultat se upisuje
u ciljeve jednim dodirom, uz slobodno ručno uređivanje.

## 9. Ekrani (Expo Router)

```
/ (Danas)        prsten kcal + makro trake · voda + suplementi (grid 2 stupca,
                 litre, doze J/V) · 4 obroka s unosima · "Dodaj" + "Ponovi jučer"
/dodaj           bottom-sheet, tabovi: Baza (Često/Sve, ×N, uredi/briši) ·
                 Recepti · AI · Skener · Ručno (kvačica "spremi u bazu" = quick add)
/pregled         mjesečni kalendar (točkice: unutar/preko cilja, skok na dan) ·
                 graf 7/30 dana s linijom cilja · prosjeci · graf težine
/recepti/[id]    detalji/uređivanje (sastojci iz baze ili AI, porcije, totali)
/postavke        ciljevi (+ kalkulator čarobnjak) · suplementi (naziv/detalj/
                 doze/podsjetnik) · API ključ · jezik · tema · izvoz/uvoz · o aplikaciji
```

UX standardi: haptika na svaki uspješan unos; optimistični UI (SQLite je
lokalan — upis je trenutan, nema spinnera na spremanju); dinamična veličina
fonta; a11y oznake na svim interaktivnim elementima; AA kontrast u obje teme;
prazna stanja s uputom (portirati tekstove iz prototipa); decimalni zarez u
hr localeu.

## 10. i18n

- `react-i18next`, resursi `src/i18n/hr.json` (izvor istine) i `en.json`.
- Ključevi semantički (`diary.addFood`, ne `button1`). Hr je default;
  inicijalni jezik iz `expo-localization`, promjenjiv u Postavkama.
- Brojevi/datumi isključivo kroz `Intl.NumberFormat` / `Intl.DateTimeFormat`
  s aktivnim localeom (hr: "1,5 L"; en: "1.5 L").
- Pravilo za Claude Code: **nijedan string u JSX-u** — lint pravilo ili
  code-review disciplina od prvog commita.

## 11. Teme

Tokeni u `src/theme/` (light + dark), sistemski default + ručni izbor.
Paleta iz prototipa: teal (#0f766e) primarna, slate neutrale, amber za
"preko cilja", sky za vodu, violet za suplemente; serif naslovi. Dark
varijante definirati tokenima od F0 — ne naknadno bojati.

## 12. Sigurnost i privatnost

### 12.1. Načela
- Svi podaci lokalno (SQLite/MMKV); nema analitike, telemetrije, računa ni trećih SDK-ova.
- Mrežni promet postoji samo prema dva odredišta, isključivo na eksplicitnu korisničku radnju:
  1) `api.anthropic.com` — AI procjena; šalje se opis obroka ili fotografija deklaracije,
  2) `world.openfoodfacts.org` — barkod lookup; šalje se samo EAN.
  Base URL-ovi su **hardkodirani**; NE postoji postavka za promjenu endpointa
  (konfigurabilan endpoint = vektor za krađu API ključa preko phishing "konfiguracije").
- U aplikaciju ugraditi ekran/sekciju **"Što napušta uređaj"** koja ovo transparentno
  navodi — uključujući činjenicu da opis obroka putuje Anthropicu kad korisnik
  pokrene AI procjenu.

### 12.2. API ključ
- Isključivo **expo-secure-store** (iOS Keychain / Android Keystore); nikad u MMKV,
  SQLite, izvozu podataka, logovima, crash izvještajima ni React DevTools stanju
  koje se logira. U UI maskiran (vidljiva zadnja 4 znaka), unos lijepljenjem,
  gumb "Provjeri ključ" radi najjeftiniji mogući testni poziv.
- SecureStore konfigurirati tako da ključ **ne ulazi u OS backup**
  (`keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY` ili ekvivalent);
  SQLite baza smije u OS backup (praktičnost za korisnika) — dokumentirati oboje.

### 12.3. Podaci i datoteke
- Izvoz kroz OS share-sheet; opcionalna AES enkripcija lozinkom — **toggle ponuditi
  uključen po defaultu**, uz jasnu napomenu da je uvoz moguć samo uz istu lozinku.
- Fotografije deklaracija: obraditi u memoriji, prije slanja smanjiti na ≤1600 px
  i re-enkodirati (usput **briše EXIF/GPS metapodatke** i smanjuje tokene/trošak);
  ne spremati u galeriju ni cache nakon obrade. Kamera bez dozvole za lokaciju.
- Notifikacije podsjetnika sadrže samo naziv suplementa, ništa drugo.

### 12.4. Granice povjerenja i validacija ulaza
Nepovjerljivi ulazi su tri: **(a) AI odgovor** (uključuje sadržaj s weba kroz
web_search — potencijalni prompt-injection kanal), **(b) OFF odgovor**,
**(c) uvezena JSON datoteka**. Za sva tri vrijedi isti validator prije upisa u bazu:
- tipovi se strogo provjeravaju; brojevi moraju biti konačni (ne NaN/Infinity);
- granice: `amount > 0`; kcal 0–5000 po stavci; makroi 0–1000 g po stavci;
- konzistentnost: kcal ≈ 4·B + 4·UH + 9·M ± 35 % — izvan toga stavku označiti
  vizualno za ručnu provjeru (ne odbaciti automatski);
- stringovi ograničene duljine (naziv ≤ 120 znakova), bez kontrolnih znakova.
AI/web sadržaj tretira se **kao podaci, nikad kao instrukcije**: obrana od
prompt-injectiona kroz web rezultate je strogi JSON ugovor (§6.2–6.3) + ovaj
validator + obavezan korisnikov pregled/edit prije spremanja (već u UX-u).
Uvoz dodatno: razuman size limit datoteke, nepoznata polja se ignoriraju,
neispravna stavka preskače se bez rušenja cijelog uvoza.

### 12.5. Repo i build higijena
- Nikakvi ključevi/tajne u kodu, testovima, `eas.json` ni fixture datotekama
  (BYOK arhitektura znači da build uopće ne treba tajne — održati to).
- Lockfile u repozitoriju; samo provjereni Expo/community paketi;
  `npx expo-doctor` čist prije svake faze.

## 13. Migracija podataka iz prototipa (obavezno u F1)

Uvoznik prihvaća točan JSON izvoz artefakta:

```jsonc
{
  "foods":   [{ "id","name","unit","baseAmount","calories","protein","fat","carbs","useCount","lastUsed" }],
  "settings": { "calories","protein","fat","carbs","waterGoal", "supplements":[{ "id","name","detail","doses" }] },
  "recipes": [{ "id","name","portions","useCount","lastUsed", "items":[{ "name","unit","amount","calories","protein","fat","carbs" }] }],
  "logs": { "log:YYYY-MM-DD": { "entries":[{ "id","meal","name","unit","amount","calories","protein","fat","carbs" }],
             "water": 0, "supplements": { "<suppId>": 0 } } }
}
```

Napomene: stariji dnevni zapisi mogu biti **goli niz** unosa (bez water/
supplements) — normalizirati; `waterGoal` je u ml; polja `calories→kcal`;
`useCount` default 1; sve nepoznato preskočiti bez rušenja. Jedinični test
s pravim izvozom vlasnika.

## 14. Faze razvoja i kriteriji prihvaćanja

- **F0 — Temelji.** Expo+TS+Router+NativeWind+Drizzle+MMKV+i18n+teme+lint+EAS.
  ✓ Prazna aplikacija se builda za iOS/Android, mijenja jezik i temu.
- **F1 — Podatkovni sloj + uvoz.** Shema §5, repozitoriji, migracije, uvoznik §13.
  ✓ Vlasnikov stvarni izvoz uveze se bez greške; totali dana odgovaraju prototipu.
- **F2 — Dnevnik.** Ekran Danas, obroci, unos iz baze/ručno/quick add,
  "Ponovi jučer", Često/×N, uređivanje namirnica.
  ✓ Cijeli dan se vodi bez AI-ja; snapshot semantika potvrđena testom.
- **F3 — AI (BYOK).** Ključ u postavkama, procjena teksta §6.2–6.4, foto
  deklaracije §6.5. ✓ "Perutnina pickles cheese 105 g" s pretragom vraća
  deklaracijske vrijednosti s izvorom; bez ključa jasan onboarding.
- **F4 — Barkod + OFF.** Sken → OFF → potvrda; promašaj → AI/foto fallback.
  ✓ EAN poznatog HR proizvoda predpopuni podatke; nepoznat EAN nudi fallback.
- **F5 — Voda, suplementi, podsjetnici.** Litre (±0,25/0,5), doze J/P/V,
  konfigurabilna lista, lokalne notifikacije. ✓ Nečekiran kreatin javi se u
  zadano vrijeme; sve po danu i u povijesti.
- **F6 — Recepti.** Builder (baza + AI), porcije (decimalne), jedan zapis u
  dnevniku, ×N sortiranje. ✓ Recept od 5 sastojaka → unos u ≤3 dodira.
- **F7 — Pregled + težina + kalkulator.** Kalendar, grafovi 7/30, prosjeci,
  weight_log s trendom, čarobnjak §8 upisuje ciljeve. ✓ Kalkulator za
  poznati profil daje MSJ vrijednosti (test s ručnim izračunom).
- **F8 — Poliranje.** Izvoz/uvoz (+lozinka), a11y prolaz, dark fino, prazna
  stanja, ikona/splash, TestFlight/interna distribucija. ✓ Checklist a11y i
  oba jezika na svim ekranima.

## 15. Budućnost (izvan v1 — samo dokumentirano)

- **Objava na storeove:** proxy za API ključ (Cloudflare Worker, limit po
  uređaju), politika privatnosti, onboarding bez BYOK-a.
- **Regionalna baza proizvoda:** opt-in dijeljenje `verified` namirnica
  (barcode+brand+makroi) u laganu zajedničku bazu s moderacijom — schema je
  već spremna (§7). Ovo je dugoročni odgovor na prazninu OFF-a za HR/BiH.
- **Sync među uređajima**, Health/Fit integracija, adaptivni ciljevi iz
  trenda težine, widgeti.

## 16. Konvencije za razvojnu sesiju

- Radi fazu po fazu; svaka faza = zaseban(i) commit(i) + kratak sažetak što
  je ispunjeno od kriterija. Ne preskakati faze bez dogovora.
- TS strict bez `any`; identifikatori na engleskom, UI stringovi kroz i18n.
- Jedinični testovi obavezni za: kalkulator (§8), parser AI odgovora (§6.3),
  validator ulaza (§12.4), uvoznik (§13), skaliranje recepata i namirnica.
- Nikad ne mijenjati prompt (§6.2) ni formule (§8) bez eksplicitne potvrde
  vlasnika — to su validirane odluke.
- Sve nutritivne prikaze zaokruživati: kcal na cijeli broj, makroi na 1 dec.
- Datumi: uvijek lokalni 'YYYY-MM-DD' (nikad `toISOString().slice(0,10)`).

## 17. Poznate implementacijske zamke (obavezni checklist)

**N+1 upiti — najveći rizik performansi ove aplikacije.** Prototip je ovu
grešku doslovno imao u key-value obliku (kalendar bi zahtijevao čitanje 30+
dnevnih zapisa pojedinačno) i morao ju je zaobići ručno održavanim indeksom
totala; u SQLite-u rješenje je trivijalan agregatni upit, ali ga treba
disciplinirano koristiti:
- Kalendar i grafovi 7/30: **jedan** upit
  `SELECT date, SUM(kcal), SUM(protein), … FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY date`
  — nikad petlja po danima.
- Lista recepata s totalima: `JOIN recipe_items … GROUP BY recipe_id` — ne upit po receptu.
- Sekcija "Često" i lista namirnica: jedan `ORDER BY use_count DESC, name` upit.
- Ekran Danas: jedan upit za sve unose dana; podjela po obrocima u memoriji.
- Pravilo: UI sloj **nikad ne poziva repozitorij u petlji**; repozitoriji nude
  agregatne metode. Za svaki novi upit nad `diary_entries` u code review proći
  `EXPLAIN QUERY PLAN` (indeks `idx_diary_date` postoji u shemi).

**SQL injection — da, i u lokalnoj bazi.** Nazivi namirnica dolaze iz AI-ja,
weba i uvoza. Isključivo parametrizirani upiti (Drizzle default); `sql.raw`
s korisničkim/AI podacima je zabranjen.

**Transakcije za višekoračne upise.** Recept + sastojci, uvoz sigurnosne
kopije, "Ponovi jučer" s više stavki — sve u jednoj transakciji; pola
zapisanog recepta je korupcija podataka.

**Datumi oko ponoći.** Lokalni 'YYYY-MM-DD' svugdje (§16); jedinični test za
ponašanje u 00:30 lokalno i pri promjeni vremenske zone — prototip je imao
UTC bug koji je kasnovečernje unose upisivao u jučerašnji dan.

**Snapshot semantika dnevnika.** Izmjena ili brisanje namirnice u bazi ne
smije promijeniti postojeće `diary_entries` (regresijski test u F2).

**Odrezani AI odgovori.** `max_tokens` može odrezati JSON usred objekta —
parser to mora tretirati kao grešku s ponudom ponovnog pokušaja, nikad
parsirati djelomične stavke.

**Performanse lista.** FlashList s memoiziranim redovima i stabilnim
`keyExtractor`-om; dodir na vodu ne smije re-renderirati listu obroka
(razdvojiti stanje po komponentama).

**Notifikacije i vremenske zone.** Podsjetnik zakazan za 'HH:MM' mora
preživjeti promjenu zone i restart uređaja (ponovno zakazivanje pri
pokretanju aplikacije).
