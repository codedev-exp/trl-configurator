# Instrukcja budowania i wdrożenia

## Krok 1: Instalacja zależności

W terminalu, w katalogu `slatwall-generator`, wykonaj:

```bash
npm install
```

To zainstaluje React, ReactDOM i Vite wraz z wszystkimi zależnościami.

## Krok 2: Budowanie projektu

Po zainstalowaniu zależności, zbuduj projekt:

```bash
npm run build
```

To utworzy folder `dist/` z plikiem `build.js` - to jest skompilowana wersja Twojej aplikacji React.

## Krok 3: Wdrożenie na serwer

1. **Skopiuj plik `build.js`** z folderu `dist/` na Twój komputer
2. **Zaloguj się na serwer FTP** Twojego PrestaShop
3. **Przejdź do katalogu**: `/modules/ps_slatwall/assets/js/`
4. **Wgraj plik `build.js`** do tego katalogu (nadpisze stary, jeśli istnieje)

## Krok 4: Wyczyść cache PrestaShop

W panelu administracyjnym PrestaShop:
- Przejdź do **Zaawansowane parametry → Wydajność**
- Kliknij **Wyczyść cache**

## Krok 5: Sprawdź działanie

1. Wejdź na stronę konfiguratora: `https://twojsklep.pl/konfigurator`
2. Powinieneś zobaczyć nowy interfejs React z:
   - Wizualizacją modułów po lewej stronie
   - Formularzem konfiguracji po prawej stronie
   - Możliwością wyboru różnych układów modułów

## Rozwój lokalny (opcjonalnie)

Jeśli chcesz testować zmiany lokalnie przed wdrożeniem:

```bash
npm run dev
```

To uruchomi serwer deweloperski. **UWAGA**: Aby to działało, musisz mieć dostęp do pliku `catalog.json` z serwera (możesz skopiować go lokalnie i zmienić URL w kodzie).

## Rozwiązywanie problemów

### Plik build.js nie ładuje się
- Sprawdź, czy plik został wgrany w odpowiednim miejscu
- Sprawdź uprawnienia do pliku na serwerze (powinny być 644)
- Wyczyść cache przeglądarki (Ctrl+F5)

### Błędy w konsoli przeglądarki
- Otwórz konsolę przeglądarki (F12)
- Sprawdź, czy są błędy JavaScript
- Sprawdź, czy zmienna `sl_catalog_url` jest zdefiniowana

### Aplikacja nie wyświetla się
- Sprawdź, czy element `#slatwall-root` istnieje w HTML
- Sprawdź, czy plik `build.js` jest poprawnie załadowany (zakładka Network w DevTools)

