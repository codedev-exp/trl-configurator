# Debugowanie problemu z dodawaniem do koszyka

## Krok 1: Sprawdź konsolę przeglądarki

1. Otwórz konfigurator w przeglądarce
2. Naciśnij **F12** (lub Cmd+Option+I na Mac)
3. Przejdź do zakładki **Console**
4. Kliknij "Dodaj do koszyka"
5. Sprawdź, co się wyświetla w konsoli

**Szukaj:**
- `Konfigurator Config:` - powinien pokazać `catalog` i `ajax` URL
- `Wysyłanie zapytania do:` - powinien pokazać pełny URL
- `Odpowiedź status:` - powinien pokazać kod HTTP (200 = OK)
- Wszelkie błędy w kolorze czerwonym

## Krok 2: Sprawdź zakładkę Network

1. W DevTools przejdź do zakładki **Network**
2. Kliknij "Dodaj do koszyka"
3. Znajdź zapytanie do URL z `ajax=1&action=AddToCart`
4. Kliknij na nie i sprawdź:
   - **Status Code** (powinno być 200)
   - **Request Payload** (czy dane są poprawnie wysłane)
   - **Response** (czy serwer odpowiada)

## Krok 3: Sprawdź zmienne JavaScript

W konsoli przeglądarki wpisz:

```javascript
console.log('Catalog URL:', window.sl_catalog_url);
console.log('AJAX URL:', window.sl_ajax_url);
```

**Oczekiwany wynik:**
- `Catalog URL:` powinien wskazywać na `catalog.json`
- `AJAX URL:` powinien zawierać `ajax=1&action=AddToCart`

Jeśli `sl_ajax_url` jest `undefined`, oznacza to, że:
- Plik `.tpl` nie został zaktualizowany na serwerze
- Cache PrestaShop nie został wyczyszczony

## Krok 4: Sprawdź pliki na serwerze

Upewnij się, że na serwerze są zaktualizowane:

1. **`modules/ps_slatwall/controllers/front/init.php`**
   - Musi zawierać metodę `displayAjaxAddToCart()`
   - Musi generować `$ajaxUrl` w `initContent()`

2. **`modules/ps_slatwall/views/templates/front/app.tpl`**
   - Musi zawierać linię: `var sl_ajax_url = "{$ajax_url|escape:'javascript':'UTF-8'}";`

3. **`modules/ps_slatwall/assets/js/build.js`**
   - Musi być najnowsza wersja (po `npm run build`)

## Krok 5: Wyczyść cache

1. W panelu admina PrestaShop
2. **Zaawansowane parametry → Wydajność**
3. Kliknij **Wyczyść cache**
4. Odśwież stronę konfiguratora (Ctrl+F5)

## Krok 6: Sprawdź logi serwera (jeśli masz dostęp)

Jeśli masz dostęp do logów PHP, sprawdź:
- `/var/log/apache2/error.log` lub
- `/var/log/nginx/error.log` lub
- Logi w panelu hostingowym

Szukaj wpisów z "Slatwall AJAX"

## Najczęstsze problemy:

### Problem: "Błąd komunikacji z serwerem"
**Przyczyna:** URL AJAX nie jest zdefiniowany lub nieprawidłowy
**Rozwiązanie:** Sprawdź Krok 3 i upewnij się, że plik `.tpl` jest zaktualizowany

### Problem: HTTP 404
**Przyczyna:** URL jest nieprawidłowy lub routing nie działa
**Rozwiązanie:** Sprawdź, czy URL zawiera `ajax=1&action=AddToCart`

### Problem: HTTP 500
**Przyczyna:** Błąd w kodzie PHP
**Rozwiązanie:** Sprawdź logi serwera i upewnij się, że metoda `displayAjaxAddToCart()` istnieje

### Problem: CORS Error
**Przyczyna:** Zapytanie jest blokowane przez przeglądarkę
**Rozwiązanie:** Upewnij się, że używasz `credentials: 'same-origin'` w fetch (już dodane)

## Test ręczny URL

Możesz przetestować URL ręcznie w przeglądarce:
1. Skopiuj URL z konsoli (`sl_ajax_url`)
2. Otwórz go w nowej karcie
3. Powinieneś zobaczyć błąd JSON (to normalne, bo nie wysyłasz danych POST)
4. Jeśli widzisz błąd 404, URL jest nieprawidłowy

