# Slatwall Generator - React Configurator

Projekt React z Vite do generowania konfiguracji paneli Slatwall dla PrestaShop.

## Instalacja

1. Zainstaluj zależności:
```bash
npm install
```

## Rozwój

Uruchom serwer deweloperski:
```bash
npm run dev
```

## Budowanie

Zbuduj plik produkcyjny:
```bash
npm run build
```

**Plik `build.js` zostanie automatycznie wygenerowany w folderze `../ps_slatwall/assets/js/build.js`**

## Wdrożenie

1. Zbuduj projekt: `npm run build` (plik trafia automatycznie do modułu)
2. Skopiuj cały folder `ps_slatwall/` na serwer do `/modules/ps_slatwall/`
3. Wyczyść cache PrestaShop
4. Odśwież stronę konfiguratora

**Uwaga:** Cały folder modułu `ps_slatwall/` można przerzucić na serwer - wszystko jest gotowe!

## Struktura projektu

```
slatwall-generator/
├── src/
│   ├── utils/
│   │   └── solver.js    # Logika obliczania układu modułów
│   ├── App.jsx          # Główny komponent React
│   └── main.jsx         # Punkt wejścia aplikacji
├── dist/                # Skompilowane pliki (po build)
├── package.json
└── vite.config.js      # Konfiguracja Vite

