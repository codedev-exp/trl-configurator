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

Po zbudowaniu, plik `dist/build.js` będzie gotowy do wgrania na serwer.

## Wdrożenie

1. Zbuduj projekt: `npm run build`
2. Skopiuj plik `dist/build.js` do `/modules/ps_slatwall/assets/js/build.js` na serwerze PrestaShop
3. Wyczyść cache PrestaShop
4. Odśwież stronę konfiguratora

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

