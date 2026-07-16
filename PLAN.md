# APETIO — Detaljni plan izrade (v1)

> Razrada specifikacije [`nutritivni-dnevnik-native-spec.md`](nutritivni-dnevnik-native-spec.md)
> u konkretan, izvršiv plan po fazama. Ovaj dokument je **operativni checklist za
> razvojnu sesiju** — spec ostaje izvor istine za *odluke*, ovaj plan je *kako*.
> Ništa u spec-u (prompt §6.2, formule §8, arhitektonske odluke §2) se ne mijenja
> bez potvrde vlasnika.
>
> **Projekt se službeno zove APETIO** — provući ime kroz `app.json` (name/slug),
> EAS profil, ikonu/splash, i18n naslov aplikacije te bundle identifier.

---

## Kako koristiti ovaj plan

- Radi se **faza po fazu** (F0 → F8). Ne preskače se faza bez dogovora (§16).
- Svaka faza završava jednim ili više commitova + kratkim sažetkom ispunjenih
  kriterija prihvaćanja.
- Faza je „gotova" tek kad prođe njezina **Definicija gotovo (DoD)** — ne samo kad
  „radi na simulatoru".
- Checkboxi (`- [ ]`) su namijenjeni za štrikanje tijekom rada.

### Globalna Definicija gotovo (vrijedi za SVE faze)

- [ ] `npx tsc --noEmit` prolazi (TS strict, **bez `any`**).
- [ ] `npm run lint` prolazi (uklj. pravilo protiv literalnih stringova u JSX-u).
- [ ] `npx expo-doctor` čist (§12.5).
- [ ] Svi jedinični testovi zeleni (`npm test`).
- [ ] Nijedan novi UI string nije hardkodiran — sve kroz `t('kljuc')` (hr **i** en).
- [ ] Nema tajni/ključeva u kodu, testovima, `eas.json` ni fixtureima (§12.5).
- [ ] Commit(ovi) + sažetak ispunjenih kriterija faze.

---

## Globalna pravila (podsjetnik iz §16 / §17)

| Pravilo | Gdje se primjenjuje |
|---|---|
| Identifikatori na engleskom; UI stringovi kroz i18n | svugdje |
| Datumi **uvijek** lokalni `'YYYY-MM-DD'`, nikad `toISOString().slice(0,10)` | `src/lib/date.ts`, svi upisi |
| Zaokruživanje: kcal na cijeli broj, makroi na 1 decimalu | svi nutritivni prikazi |
| Decimalni **zarez** u hr localeu (kroz `Intl`) | svi brojevi u UI-ju |
| UI sloj **nikad** ne poziva repozitorij u petlji; repozitoriji nude agregatne metode | §17, N+1 |
| Samo parametrizirani upiti (Drizzle default); `sql.raw` s AI/korisničkim podacima zabranjen | §17, SQLi |
| Višekoračni upisi (recept+sastojci, uvoz, „Ponovi jučer") u **jednoj transakciji** | §17 |
| 3 nepovjerljiva ulaza (AI odgovor, OFF odgovor, uvoz) → isti validator prije upisa | §12.4 |
| Ekrani ne diraju SQL — sve kroz repozitorije | §4 |

---

## Testna strategija

- **Vitest** za čistu logiku u `src/` (framework-agnostičan TS). Alternativa
  `jest-expo` — vidi odluku D3.
- Za testove repozitorija/upita u Node-u: **`better-sqlite3`** s identičnom Drizzle
  shemom (izvrši migracije u memoriji, provjeri agregatne upite i `EXPLAIN QUERY PLAN`).
- **Obavezni jedinični testovi (§16)** i faza u kojoj nastaju:

  | Modul | Faza | Ključni slučajevi |
  |---|---|---|
  | Lokalni datum (`date.ts`) | F1 | 00:30 lokalno, promjena vremenske zone |
  | Validator ulaza (§12.4) | F1 | granice, NaN/Infinity, kcal≈4B+4UH+9M ±35 %, kontrolni znakovi |
  | Skaliranje namirnica | F2 | promjena količine → preračun iz `base_amount` |
  | Izvoz/uvoz vlastitog formata | F8 | round-trip (šifrirano + obično), neispravna stavka se preskače |
  | Parser AI odgovora (§6.3) | F3 | čist JSON, JSON s preambulom, ugniježđeni navodnici, **odsječen → greška** |
  | Skaliranje recepata | F6 | porcije (decimalne) |
  | Kalkulator MSJ/K-M (§8) | F7 | muško/žensko, K-M, faktori aktivnosti, cap ciljeva, makroi, voda |

---

## Odluke (potvrđene s vlasnikom + preostale)

| # | Pitanje | Odluka | Faza |
|---|---|---|---|
| D1 | Bundle identifier / slug | `com.apetio.app` (iOS/Android), slug `apetio` — *predlažem, čeka potvrdu* | F0 (EAS) |
| D2 | EAS / Expo račun i Apple Team za TestFlight | koristiti vlasnikov | F0/F8 |
| D3 | Test runner za čistu logiku | **Vitest** (brže, čisti TS); `jest-expo` ako zatreba RN mockove | F0 |
| D4 ✅ | **Model za Anthropic** | **`claude-sonnet-5`** (default) — najbolji omjer preciznost/cijena za web-search + procjenu; alat **`web_search_20260209`** (dinamičko filtriranje → manje tokena); override u naprednim postavkama (`claude-opus-4-8` = max točnost, `claude-haiku-4-5` = max ušteda). Vidi §6.1 razradu niže. | F3 |
| D5 | AES enkripcija izvoza (§12.3) | `expo-crypto` (random/hash) + provjerena JS AES lib (`aes-js`/`crypto-es`) — odluka pri dolasku u F8 | F8 |
| D6 ✅ | **Prikaz doza suplemenata** | brojač **`uzeto/cilj`** (npr. „1/3", „2/3", „3/3"); dodir = +1 do dnevnog cilja doza | F5 |
| D7 ✅ | **Recept u dnevniku** | **jedan** `diary_entry` (zbrojene, skalirane vrijednosti, `recipe_id`) — potvrđeno | F6 |
| D8 | Minimalna verzija OS-a | iOS 15+, Android 8+ (Expo default) | F0 |
| D9 ✅ | **Kompatibilnost s prototipom** | **NIJE potrebna** — radi po najboljim praksama. **Uvoznik §13 se izbacuje iz F1** (nema fixture testa s izvozom vlasnika). Izvoz/uvoz **vlastitog** formata ostaje u F8. | F1/F8 |

---

## Matrica ovisnosti (paketi po fazi)

- **F0 (temelj):** `expo`, `expo-router`, `react-native-safe-area-context`,
  `react-native-screens`, `react-native-gesture-handler`, `react-native-reanimated`,
  `nativewind` + `tailwindcss` (dev), `react-native-mmkv`, `expo-sqlite`,
  `drizzle-orm` + `drizzle-kit` (dev), `react-i18next` + `i18next` +
  `expo-localization`, `expo-haptics`, `react-native-svg`, `@shopify/flash-list`,
  `expo-secure-store`, `expo-camera`, `expo-notifications`, `expo-status-bar`,
  `expo-constants`. Dev: `typescript`, `eslint` + `eslint-config-expo`, `prettier`,
  `vitest`, `better-sqlite3`.
- **F1:** — (bez novih ovisnosti; UUID kroz `expo-crypto` `randomUUID`).
- **F2:** `@gorhom/bottom-sheet` (ako se ne koristi Router modal).
- **F3:** `expo-image-picker`, `expo-image-manipulator`. (camera/secure-store iz F0.)
- **F4:** — (koristi `expo-camera` iz F0).
- **F5:** — (koristi `expo-notifications` iz F0).
- **F6:** —
- **F7:** — (koristi `react-native-svg` iz F0).
- **F8:** `expo-sharing`, `expo-document-picker`, `expo-file-system`, AES lib (D5), ikona/splash alati (`expo` ugrađeno).

---

# F0 — Temelji

**Cilj (spec):** Prazna aplikacija se builda za iOS/Android, mijenja jezik i temu.

### Zadaci
- [ ] Inicijalizirati Expo projekt (TS + Expo Router): `npx create-expo-app@latest`
      → naziv **APETIO**, slug `apetio`, `app.json` name/slug/bundleId (D1).
- [ ] TS **strict**: `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`).
- [ ] ESLint + Prettier (`eslint-config-expo`). Dodati pravilo protiv literalnih
      stringova u JSX-u (`react/jsx-no-literals` ili `eslint-plugin-i18next`) —
      **od prvog commita** (§10).
- [ ] NativeWind: `tailwind.config.js`, babel/metro konfiguracija, `global.css`,
      `nativewind-env.d.ts`.
- [ ] **Tokeni tema** `src/theme/` (light + dark) — **jedan izvor istine** koji se
      ubacuje i u `tailwind.config`: teal `#0f766e` primarna, slate neutrale, amber
      (preko cilja), sky (voda), violet (suplementi), serif naslovi (§11).
      Dark varijante definirane **odmah**, ne naknadno bojati.
- [ ] `ThemeProvider`: sistemski default + ručni izbor, izbor persistiran u MMKV.
- [ ] i18n: `src/i18n/{hr,en}.json` (hr = izvor istine), init u root layoutu,
      inicijalni jezik iz `expo-localization`, prebacivanje u Postavkama, persist MMKV.
- [ ] MMKV wrapper `src/lib/mmkv.ts` + `src/features/settings/store.ts`
      (ciljevi, locale, tema, preferenca web-pretrage — polja se pune kasnije).
- [ ] Drizzle „vodovod": `src/db/client.ts` (otvaranje baze), `drizzle.config.ts`,
      pokretač migracija pri startu (shema dolazi u F1 — ovdje dokazati da se baza otvara).
- [ ] EAS: `eas.json` s profilima `development` (dev client), `preview` (interna
      distribucija), `production`. **Bez tajni** (BYOK). `eas build` dev profil prolazi.
- [ ] Skele ekrana (Expo Router): `app/_layout.tsx` (provideri: SafeArea, Gesture,
      Theme, i18n, DB), tabovi `app/(tabs)/_layout.tsx` + `index` (Danas), `pregled`,
      `postavke`; `app/dodaj.tsx` (modal placeholder); `app/recepti/[id].tsx` placeholder.
- [ ] Postavke: radni prekidači za **jezik** i **temu** (dokaz kriterija).
- [ ] Vitest konfiguriran; „hello" test prolazi.

### Ključne datoteke
```
app/_layout.tsx · app/(tabs)/{_layout,index,pregled,postavke}.tsx · app/dodaj.tsx · app/recepti/[id].tsx
src/theme/{colors,index}.ts · src/i18n/{index,hr.json,en.json}
src/lib/mmkv.ts · src/features/settings/store.ts · src/db/client.ts
tailwind.config.js · babel.config.js · metro.config.js · global.css · nativewind-env.d.ts
app.json (ili app.config.ts) · eas.json · eslint.config.js · .prettierrc · tsconfig.json · vitest.config.ts
```

### DoD + kriteriji
- [ ] Prazna aplikacija se builda za iOS **i** Android (EAS dev profil).
- [ ] Prebacivanje jezika (hr↔en) i teme (light/dark/sistem) radi i pamti se.
- [ ] Globalni DoD checklist prolazi.

### Rizici/zamke
- NativeWind + Reanimated + Metro konfiguracija (redoslijed babel pluginova).
- Duplikacija tokena boja između JS-a i Tailwinda → **jedan** izvor istine.

### Plan commitova
`chore: init APETIO (expo, ts strict, router)` · `feat: theming (light/dark tokens)` ·
`feat: i18n (hr/en)` · `chore: eas build profiles` · `chore: test setup (vitest)`

---

# F1 — Podatkovni sloj

> **Promjena vs spec (D9):** uvoznik prototipa (§13) **se izbacuje** — kompatibilnost s
> prototipom nije potrebna, gradi se po najboljim praksama. Vlastiti izvoz/uvoz (backup)
> dolazi u F8. Validator (§12.4) se svejedno gradi ovdje jer ga koriste AI/OFF/backup.

**Cilj:** Kompletna shema, repozitoriji i migracije rade; agregatne metode spremne;
lokalni datum i validator ulaza testirani.

### Zadaci
- [ ] Drizzle shema §5: `foods`, `diary_entries` (+ `idx_diary_date`), `recipes`,
      `recipe_items`, `day_meta`, `supplements`, `supplement_log`, `weight_log`.
      CHECK ograničenja (unit, meal, doses, base_amount>0) kroz Drizzle.
- [ ] Migracije: `drizzle-kit generate` + pokretač pri startu (idempotentno).
- [ ] **Repozitoriji** `src/db/repositories/*` — jedini sloj koji dira SQL.
      Odmah dizajnirati **agregatne** metode (dnevni totali, raspon za kalendar/grafove,
      „Često" poredak) da se preduhitri N+1 (§17).
- [ ] `src/lib/date.ts` — `getLocalDateString()` (lokalni `YYYY-MM-DD`) + helperi.
      **Jedinični test: 00:30 lokalno i promjena TZ.**
- [ ] `src/lib/id.ts` — generiranje ID-eva (`expo-crypto` `randomUUID`).
- [ ] **Validator ulaza** `src/lib/validation/nutrition.ts` (§12.4): strogi tipovi,
      konačni brojevi, granice (`amount>0`, kcal 0–5000, makroi 0–1000), konzistentnost
      kcal ≈ 4·B+4·UH+9·M ±35 % (**označi**, ne odbaci), naziv ≤120 znakova bez
      kontrolnih znakova. Jedinični testovi.
- [ ] Seed suplemenata pri prvom pokretanju (kreatin, magnezij — §5), idempotentno.

### Ključne datoteke
```
src/db/schema.ts · src/db/migrations/* · src/db/client.ts (migrate)
src/db/repositories/{foods,diary,recipes,dayMeta,supplements,weight}.ts
src/lib/{date,id}.ts · src/lib/validation/nutrition.ts
tests: date.test.ts · nutrition.test.ts · repo-aggregates.test.ts (better-sqlite3)
```

### DoD + kriteriji
- [ ] Migracije se izvrše na čistoj bazi; seed suplemenata jednom.
- [ ] Agregatni upiti (dan, raspon, „Često") vraćaju ispravne totale (test s `better-sqlite3`).
- [ ] Snapshot temelj postavljen: `diary_entries` nose vlastite vrijednosti (kopija, ne referenca).

### Rizici/zamke
- Transakcije za višekoračni upis (§17) — pola zapisanog = korupcija.
- Lokalni datum (nikad UTC); nepoznata polja u validatoru se preskaču bez rušenja.

### Plan commitova
`feat: db schema + migrations (Drizzle)` · `feat: repositories (aggregate-first)` ·
`feat: local date + input validator (+tests)` · `feat: supplement seed`

---

# F2 — Dnevnik

**Cilj (spec):** Cijeli dan se vodi bez AI-ja; snapshot semantika potvrđena testom.

### Zadaci
- [ ] Ekran **Danas** (`app/(tabs)/index.tsx`): prsten kcal + makro trake
      (SVG, portirati iz prototipa, memoizirano), 4 obroka (dorucak/rucak/vecera/uzina)
      s unosima, „Dodaj" + „Ponovi jučer". Voda/suplementi grid — layout sada, logika F5.
- [ ] SVG komponente `src/components/{CalorieRing,MacroBars}.tsx` (memo, stabilni props).
- [ ] Podaci Danas: **jedan** upit za sve unose dana → podjela po obrocima u memoriji (§17).
      Totali agregatno; ciljevi iz MMKV.
- [ ] `app/dodaj.tsx` bottom-sheet, tabovi: **Baza** (Često/Sve, ×N, uredi/briši),
      **Ručno**, kvačica „spremi u bazu" (quick add). (Recepti tab → F6; AI/Skener → F3/F4 — zasad skriveni.)
- [ ] Baza tab: FlashList namirnica `ORDER BY use_count DESC, name` (**jedan** upit),
      sekcija „Često", ×N stepper, uredi/briši namirnicu. Dodavanje → **snapshot**
      `diary_entry` (kopija vrijednosti) + bump `use_count`/`last_used`.
- [ ] Ručni unos: forma (naziv, jedinica g/kom, količina, kcal, B, M, UH) → validator →
      `diary_entry`. Opcionalno spremi u `foods` (quick add).
- [ ] „Ponovi jučer": pročitaj jučerašnje unose → ubaci kopije za danas u **jednoj transakciji** (§17).
- [ ] Uredi/briši `diary_entry`. `src/lib/scale.ts` — promjena količine → preračun iz `base_amount`. **Test.**
- [ ] Haptika na uspješan unos; **optimistični UI** (bez spinnera); prazna stanja
      (portirati tekstove iz prototipa); decimalni zarez u hr.

### Ključne datoteke
```
app/(tabs)/index.tsx · app/dodaj.tsx
src/components/{CalorieRing,MacroBars}.tsx
src/features/diary/* · src/features/foods/* · src/lib/scale.ts
tests: scale.test.ts · snapshot-semantics.test.ts · repeat-yesterday.test.ts
```

### DoD + kriteriji
- [ ] Cijeli dan se vodi **bez AI-ja** (unos iz baze, ručno, quick add, Često/×N, uredi/briši).
- [ ] **Snapshot regresijski test:** izmjena/brisanje namirnice **ne mijenja** postojeće `diary_entries`.
- [ ] „Ponovi jučer" radi u jednoj transakciji.

### Rizici/zamke
- N+1 (jedan upit za dan) · FlashList memoizacija + stabilan `keyExtractor` ·
  razdvojiti stanje da dodir na vodu ne re-renderira listu obroka (§17, priprema za F5).

### Plan commitova
`feat: Danas (ring/bars, meals)` · `feat: dodaj/Baza + Ručno + quick add` ·
`feat: repeat-yesterday (tx)` · `feat: scaling + snapshot tests`

---

# F3 — AI (BYOK)

**Cilj (spec):** „Perutnina pickles cheese 105 g" s pretragom vraća deklaracijske
vrijednosti s izvorom; bez ključa jasan onboarding.

### Zadaci
- [ ] **Ključ (SecureStore)** `src/services/secureKey.ts`: spremi/čitaj/briši
      `anthropic_api_key`; `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`
      (ne ulazi u OS backup). UI: maskiran (zadnja 4 znaka), unos lijepljenjem,
      „Provjeri ključ" = najjeftiniji testni poziv. **Nikad** u MMKV/SQLite/izvoz/log.
- [ ] **AI klijent** `src/services/anthropic.ts`: jedan modul, jedna javna funkcija po
      slučaju. `POST /v1/messages`, header `x-api-key` + `anthropic-version`.
      **Model default `claude-sonnet-5`** (postavka dopušta override), web_search alat
      **`web_search_20260209`** (dinamičko filtriranje = manja potrošnja tokena) **uključen
      po defaultu** (toggle persist MMKV). Base URL **hardkodiran** (§12.1).
- [ ] **Kontrola troška/tokena (bitno za BYOK).** Sonnet 5 ima adaptivno „razmišljanje"
      uključeno po defaultu (troši tokene) i novi tokenizer (~30 % više tokena za isti
      tekst). Za jeftinu procjenu: postaviti **`thinking: {type:"disabled"}`** ILI
      `output_config:{effort:"low"}`, i **podići `max_tokens` (~2000–2500)** jer web-pretraga
      + JSON ne smiju biti odrezani (parser §6.3 odsječen JSON = greška). Točne vrijednosti
      izmjeriti empirijski na „Perutnina pickles cheese 105 g" i sličnim upitima.
      *Napomena: spec §6.1 navodi `max_tokens:1500` uz `claude-sonnet-4-6` bez razmišljanja —
      s Sonnet 5 to je premalo; usklađeno uz očuvanje cilja (točnost + ušteda).*
- [ ] **Prompt (§6.2)** portiran **doslovno** (hr) + `{locale}` en varijanta;
      konstanta koja se ne mijenja bez potvrde vlasnika (§16).
- [ ] **Parser (§6.3)** `src/services/aiParse.ts`: spoji `type==='text'` blokove →
      skini ```` ```json ```` ograde → nađi **zadnji** `{"stavke"` → hodaj dubinom
      zagrada preskačući stringove → `JSON.parse`. Odsječen odgovor → **greška**
      (nikad parsirati djelomične stavke). Testovi: čist / preambula / navodnici / odsječen→greška.
- [ ] **Greške (§6.4)** točne poruke (i18n): 401, 429/`rate_limit_error`,
      529/`overloaded_error`, parse → generička + ponuda ručnog unosa.
- [ ] **AI tab** (`dodaj`): tekst → procjena → stanje „Pretražujem deklaracije…" (10–20 s)
      → editabilna lista: svaka stavka uredljiva (naziv, količina, kcal, B, M, UH),
      checkbox po stavci, „Izvor: …" ispod, „Ponovi s web pretragom" ako je prva bila bez.
      **Kroz validator §12.4** prije spremanja; nekonzistentne stavke vizualno označene.
- [ ] **Foto deklaracije (§6.5)**: kamera/galerija → slika → smanji na ≤1600 px +
      re-enkodiraj (`expo-image-manipulator`; briše EXIF/GPS, smanjuje tokene) →
      base64 image blok + kratki prompt → isti editabilni rezultat, `izvor='deklaracija (foto)'`.
      Kamera **bez** dozvole za lokaciju; slika se ne sprema u galeriju/cache nakon obrade.
- [ ] **„Što napušta uređaj" (§12.1)**: sekcija u Postavkama — transparentno navodi
      da opis obroka / fotografija putuju Anthropicu na eksplicitnu radnju.

### Ključne datoteke
```
src/services/{anthropic,aiParse,secureKey}.ts · src/features/ai/*
app/dodaj.tsx (AI + Foto tabovi) · app/(tabs)/postavke.tsx (API ključ + „Što napušta uređaj")
tests: aiParse.test.ts · anthropic-errors.test.ts
```

### DoD + kriteriji
- [ ] „Perutnina pickles cheese 105 g" **s pretragom** → deklaracijske vrijednosti + izvor po stavci.
- [ ] Bez ključa → jasan onboarding (upute + link na Postavke).
- [ ] Odsječen JSON = greška s ponovnim pokušajem; sve stavke prošle validator.

### Rizici/zamke
- **Prompt-injection** kroz web_search rezultate → AI/web sadržaj = **podaci, ne instrukcije**;
  obrana = strogi JSON ugovor + validator + obavezan korisnikov pregled (§12.4).
- Odsječen `max_tokens` JSON; dugi zahtjev (UX stanje); ključ nikad u log/backup.
- Adaptivno razmišljanje + web-pretraga mogu odrezati JSON pri malom `max_tokens` — vidi kontrolu tokena gore.

### Plan commitova
`feat: secure API key + verify` · `feat: anthropic client + prompt (verbatim)` ·
`feat: response parser (+tests)` · `feat: AI estimate UI (editable + source)` ·
`feat: photo declaration (resize/EXIF strip)` · `feat: "Što napušta uređaj"`

---

# F4 — Barkod + Open Food Facts

**Cilj (spec):** EAN poznatog HR proizvoda predpopuni podatke; nepoznat EAN nudi fallback.

### Zadaci
- [ ] **Skener** tab: `expo-camera` skeniranje EAN-13/8.
- [ ] **OFF servis** `src/services/off.ts`: `GET world.openfoodfacts.org/api/v2/product/{barcode}.json`,
      bez ključa, **obavezan User-Agent**. Mapiraj proizvod (name, brand, nutrimenti /100 g → baza).
      **Kroz validator §12.4** (OFF = nepovjerljivi ulaz (b)).
- [ ] Pogodak → predpopuni formu namirnice, korisnik potvrdi (`verified=1`, `source='off'`),
      spremi u `foods` s `barcode`.
- [ ] Promašaj (očekivano čest za BiH) → fallback UI: AI procjena s web pretragom **ili**
      foto deklaracije (§6.5).
- [ ] `barcode`/`brand`/`verified` popunjeni → organsko sjeme regionalne baze (§7).

### Ključne datoteke
```
src/services/off.ts · src/features/foods/barcode* · app/dodaj.tsx (Skener tab)
tests: off-parse.test.ts (fixture: pogodak, promašaj, djelomični nutrimenti)
```

### DoD + kriteriji
- [ ] EAN poznatog HR proizvoda predpopuni podatke (potvrda → `verified=1`).
- [ ] Nepoznat EAN → ponuđen AI/foto fallback bez rušenja.

### Rizici/zamke
- OFF = nepovjerljivi ulaz (isti validator). User-Agent obavezan (inače blok).
- Nutrimenti: /100 g vs po porciji; nedostajuća polja. Mreža samo na eksplicitnu radnju.

### Plan commitova
`feat: barcode scan` · `feat: OFF lookup + map + validate` · `feat: miss → AI/photo fallback`

---

# F5 — Voda, suplementi, podsjetnici

**Cilj (spec):** Nečekiran kreatin javi se u zadano vrijeme; sve po danu i u povijesti.

### Zadaci
- [ ] **Voda:** `day_meta.water_ml`; UI ±0,25/0,5 L na Danas; cilj iz MMKV (L).
      Optimistično; **stanje razdvojeno** da dodir na vodu ne re-renderira obroke (§17).
- [ ] **Suplementi:** CRUD `supplements` (naziv/detalj/`doses`=dnevni cilj 1–3/sort/`reminder_time`);
      `supplement_log` po danu (`taken_count`). Danas grid 2 stupca; prikaz **brojača
      `taken_count/doses`** (npr. „1/3", „2/3", „3/3"); dodir = +1 dok se ne dosegne cilj (D6).
- [ ] Postavke: konfigurabilna lista suplemenata (naziv/detalj/doze/podsjetnik).
- [ ] **Lokalne notifikacije** `src/services/notifications.ts` (`expo-notifications`):
      podsjetnik u `'HH:MM'`; sadržaj **samo naziv suplementa** (§12.3). Dozvola.
      **Ponovno zakazivanje pri pokretanju** — preživi promjenu TZ i restart (§17).
- [ ] Povijest: voda + `supplement_log` po danu (prikaz u Pregledu F7; podaci sada).

### Ključne datoteke
```
src/features/water/* · src/features/supplements/* · src/services/notifications.ts
app/(tabs)/postavke.tsx (suplementi) · app/(tabs)/index.tsx (voda+grid)
tests: notifications-schedule.test.ts (HH:MM → sljedeći okidač, TZ) · doses.test.ts
```

### DoD + kriteriji
- [ ] Nečekiran kreatin → notifikacija u zadano vrijeme; preživi restart/TZ.
- [ ] Voda i doze vode se po danu i vidljive u povijesti.

### Rizici/zamke
- Notifikacije: TZ + reboot → ponovno zakazivanje pri startu (§17).
- Privatnost notifikacije (samo naziv). Dozvole (kamera lokacija isključena i ovdje nebitna).

### Plan commitova
`feat: water tracking` · `feat: supplements CRUD + doses` · `feat: reminders (reschedule on launch)`

---

# F6 — Recepti

**Cilj (spec):** Recept od 5 sastojaka → unos u ≤3 dodira.

### Zadaci
- [ ] **Builder** `app/recepti/[id].tsx`: sastojci iz baze **ili** AI; porcije (decimalne); totali.
- [ ] `recipes` + `recipe_items` CRUD u **jednoj transakciji** (§17).
- [ ] `src/lib/scale.ts` proširiti za skaliranje po porcijama. **Test.**
- [ ] **Recepti tab** (`dodaj`): lista recepata s totalima `JOIN recipe_items … GROUP BY recipe_id`
      (**jedan** upit, ne po receptu — §17); ×N `use_count` sort.
- [ ] Dodavanje recepta = **jedan** `diary_entry` (zbrojene, skalirane vrijednosti,
      `recipe_id` postavljen) — D7.
- [ ] Recept iz AI: procjena više stavki → spremi kao recept.

### Ključne datoteke
```
app/recepti/[id].tsx · src/features/recipes/* · src/lib/scale.ts
tests: recipe-scale.test.ts · recipe-totals-query.test.ts · recipe-to-diary-tx.test.ts
```

### DoD + kriteriji
- [ ] Recept od 5 sastojaka → unos u **≤3 dodira**.
- [ ] Lista recepata bez N+1; upis recepta+sastojaka atomski.

### Rizici/zamke
- Transakcija recept+sastojci (pola = korupcija). N+1 na listi. Decimalne porcije.

### Plan commitova
`feat: recipe builder (+tx)` · `feat: recipe list totals (single query)` · `feat: recipe → diary`

---

# F7 — Pregled + težina + kalkulator

**Cilj (spec):** Kalkulator za poznati profil daje MSJ vrijednosti (test s ručnim izračunom).

### Zadaci
- [ ] **Pregled** `app/(tabs)/pregled.tsx`: mjesečni kalendar (točkice unutar/preko
      cilja, skok na dan) — **jedan** rasponski agregatni upit
      `SELECT date, SUM(...) FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY date` (§17);
      graf 7/30 dana s linijom cilja (SVG, port); prosjeci; graf težine.
- [ ] `weight_log` CRUD + trend linija.
- [ ] **Kalkulator čarobnjak (§8)**: koračni wizard (spol, **točna** dob, visina, težina,
      cilj, aktivnost opisana **koracima/dan**, trening odvojen → matrica faktora,
      „zašto pitamo?" uz polja). Motor `src/features/calculator/engine.ts` (čist, testiran):
  - MSJ BMR (m/ž), opcionalno **Katch-McArdle** ako je unesen % masti;
  - TDEE faktori (1.2 / 1.375 / 1.55 / 1.725 / 1.9);
  - cilj: skidanje −15…−20 % (**cap** ž 1200 / m 1500), održavanje, dobivanje +10…+15 %;
  - makroi (proteini 1.6–2.2 g/kg, default 1.8; trening → 2.0; masti min 0.8 g/kg; UH = ostatak);
  - voda 33 ml/kg zaokruženo na 0.25 L.
  - Rezultat → ciljevi (MMKV) jednim dodirom, uz slobodno ručno uređivanje.
  - Aplikacija pošteno komunicira ±10 % (§8).
- [ ] Za svaki novi upit nad `diary_entries` u review proći `EXPLAIN QUERY PLAN`
      (koristi `idx_diary_date`).

### Ključne datoteke
```
app/(tabs)/pregled.tsx · src/features/insights/* · src/features/weight/*
src/features/calculator/engine.ts + wizard UI
tests: calculator.test.ts (m/ž, K-M, faktori, capovi, makroi, voda) · range-query.test.ts
```

### DoD + kriteriji
- [ ] Kalkulator za poznati profil daje **MSJ vrijednosti** (test protiv ručnog izračuna).
- [ ] Kalendar/grafovi = jedan agregatni upit (nema petlje po danima).

### Rizici/zamke
- N+1 na kalendaru → jedan upit. **Formule se ne mijenjaju bez potvrde vlasnika** (§16).

### Plan commitova
`feat: overview (calendar + 7/30 graphs, single query)` · `feat: weight log + trend` ·
`feat: needs calculator engine (+tests)` · `feat: calculator wizard → goals`

---

# F8 — Poliranje

**Cilj (spec):** Checklist a11y i oba jezika na svim ekranima.

### Zadaci
- [ ] **Izvoz/uvoz UI (§12.3):** izvoz kroz OS share-sheet (`expo-sharing`);
      opcionalna **AES enkripcija lozinkom — toggle uključen po defaultu** (D5), uz jasnu
      napomenu da je uvoz moguć samo uz istu lozinku. Uvoz koristi F1 uvoznik + file-picker.
      Razuman size-limit, nepoznata polja ignoriraj, neispravna stavka preskočena bez rušenja (§12.4).
- [ ] **a11y prolaz:** oznake na svim interaktivnim elementima, **AA kontrast** u obje
      teme, dinamična veličina fonta.
- [ ] Dark tema fino; prazna stanja (tekstovi iz prototipa).
- [ ] **Ikona + splash** (branding APETIO).
- [ ] EAS build → **TestFlight / interna distribucija**.
- [ ] Puni i18n audit (oba jezika, svi ekrani); lint bez literalnih stringova.
- [ ] Dokumentirati backup semantiku: SecureStore (ključ) **izvan** OS backupa; SQLite **u** backupu (§12.2).

### Ključne datoteke
```
src/services/export.ts (share + AES) · app/(tabs)/postavke.tsx (izvoz/uvoz)
assets/ (ikona, splash) · a11y izmjene kroz ekrane
tests: export-import-roundtrip.test.ts (šifrirano + obično)
```

### DoD + kriteriji
- [ ] a11y checklist prođe; oba jezika na **svim** ekranima.
- [ ] Izvoz→uvoz round-trip (šifrirano i obično) očuva podatke.
- [ ] TestFlight/interni build dostupan vlasniku.

### Rizici/zamke
- AES u RN (izbor lib — D5). Backup semantika dokumentirana. Pokrivenost a11y.

### Plan commitova
`feat: export/import UI (+AES)` · `chore: a11y pass` · `feat: icon/splash + branding` ·
`chore: i18n audit` · `build: TestFlight/internal`

---

## Sigurnosni checkpointi (provući kroz sve faze)

- [ ] **BYOK:** ključ isključivo u SecureStore, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`;
      nikad u MMKV/SQLite/izvoz/log/crash/DevTools (§12.2). — *F3*
- [ ] **Endpoint hardkodiran**, bez postavke za promjenu (anti-phishing). — *F3*
- [ ] **Tri nepovjerljiva ulaza** (AI, OFF, uvoz) → isti validator prije upisa (§12.4). — *F1/F3/F4*
- [ ] **Prompt-injection:** web/AI sadržaj = podaci; JSON ugovor + validator + korisnikov pregled. — *F3*
- [ ] **Foto:** resize ≤1600 px + re-enkod (briše EXIF/GPS), bez spremanja nakon obrade;
      kamera bez dozvole za lokaciju. — *F3*
- [ ] **Notifikacije:** samo naziv suplementa. — *F5*
- [ ] **Bez tajni** u kodu/testovima/`eas.json`/fixtureima; lockfile u repo; expo-doctor čist. — *sve*
- [ ] **„Što napušta uređaj"** ekran istinit i ažuran. — *F3+*

---

## Otvorena pitanja za vlasnika (preostalo)

1. **D1/D2** — potvrda bundle id/slug (`com.apetio.app`?), EAS/Expo račun, Apple Team za TestFlight.
2. **D5** — izbor AES biblioteke za šifrirani izvoz (odluka pri dolasku u F8).

**Riješeno u ovoj sesiji:** D4 (model = `claude-sonnet-5` + `web_search_20260209`),
D6 (doze `uzeto/cilj`), D7 (recept = jedan zapis), D9 (bez kompatibilnosti s prototipom
→ uvoznik §13 izbačen iz F1).

---

### Redoslijed i procjena

`F0 → F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8` (strogo, faza po fazu).
Kritični putevi vrijednosti: **F2** (dnevnik bez AI) i **F3** (AI procjena — središnja
funkcionalnost). Sve „čiste logike" (validator, parser, kalkulator, skaliranje) su
testirane **prije** UI-ja koji ih koristi.
