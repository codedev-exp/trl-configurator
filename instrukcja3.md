To świetna wiadomość. Skoro logika w React (Solver + Wizualizacja) już działa, to najtrudniejszą część "matematyczną" mamy za sobą.

Teraz musimy sprawić, aby konfigurator przestał być tylko "zabawką" i zaczął sprzedawać.

Oto plan na Fazę 3: Integracja z Koszykiem i Finalizacja UX.

Musimy zrealizować trzy rzeczy:

Backend (PHP): PrestaShop standardowo dodaje do koszyka jeden produkt. My musimy dodać cały zestaw (np. 3 panele + 2 cokoły + 15 wsuwek) jednym kliknięciem. Potrzebujemy do tego specjalnej funkcji w kontrolerze.

Frontend (React): Podpiąć przycisk "Dodaj do koszyka" pod ten nowy kontroler.

Styl (CSS): Dopieścić wygląd, aby przypominał Twój projekt graficzny (czysty, profesjonalny look).

Zacznijmy od Integracji z Koszykiem (Batch Add to Cart).

KROK 1: Aktualizacja Kontrolera PHP (controllers/front/init.php)
Musimy dodać obsługę AJAX, która przyjmie listę produktów i wrzuci je do koszyka.

Otwórz plik ps_slatwall/controllers/front/init.php i zamień jego zawartość na poniższy kod. Dodałem metodę displayAjaxAddToCart:

PHP

<?php

class Ps_SlatwallInitModuleFrontController extends ModuleFrontController
{
    public function initContent()
    {
        parent::initContent();

        $moduleUri = $this->module->getPathUri();
        
        // Generujemy link do tego samego kontrolera dla zapytań AJAX
        $ajaxUrl = $this->context->link->getModuleLink('ps_slatwall', 'init', ['ajax' => 1, 'action' => 'AddToCart']);

        $this->context->smarty->assign([
            'catalog_url' => $moduleUri . 'assets/catalog.json',
            'ajax_url' => $ajaxUrl, // <-- Nowa zmienna dla Reacta
            'module_uri' => $moduleUri,
            'base_url' => $this->context->shop->getBaseURL()
        ]);

        $this->setTemplate('module:ps_slatwall/views/templates/front/app.tpl');
    }

    // Ta funkcja uruchomi się, gdy React wyśle zapytanie z parametrem ?ajax=1&action=AddToCart
    public function displayAjaxAddToCart()
    {
        header('Content-Type: application/json');

        // 1. Pobierz dane z Reacta (JSON payload)
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!$data || !isset($data['items']) || empty($data['items'])) {
            die(json_encode(['success' => false, 'message' => 'Brak danych o produktach']));
        }

        $cart = $this->context->cart;

        // Jeśli klient nie ma koszyka, utwórz nowy
        if (!$cart->id) {
            if ($this->context->cookie->id_guest) {
                $guest = new Guest($this->context->cookie->id_guest);
                $this->context->cart->mobile_theme = $guest->mobile_theme;
            }
            $this->context->cart->add();
            if ($this->context->cart->id) {
                $this->context->cookie->id_cart = (int)$this->context->cart->id;
            }
        }

        $results = [];
        $errors = [];

        // 2. Pętla po produktach i dodawanie do koszyka
        foreach ($data['items'] as $item) {
            $id_product = (int)$item['id_product'];
            $id_product_attribute = (int)$item['id_product_attribute']; // ID Kombinacji
            $qty = (int)$item['qty'];

            if ($qty <= 0) continue;

            // Standardowa funkcja Presty do dodawania/aktualizacji koszyka
            // updateQty(ilość, id_prod, id_atrybutu)
            $update = $cart->updateQty($qty, $id_product, $id_product_attribute);
            
            if (!$update) {
                $errors[] = "Błąd dodawania produktu ID: $id_product (Attr: $id_product_attribute)";
            } else {
                $results[] = "Dodano produkt $id_product";
            }
        }

        // Odświeżamy koszyk, żeby przeliczył sumy
        $cart->update();

        if (!empty($errors)) {
            echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
        } else {
            echo json_encode(['success' => true, 'message' => 'Produkty dodane do koszyka!']);
        }
        
        // Ważne w PrestaShop AJAX - zabijamy proces, żeby nie renderował stopki/nagłówka
        die();
    }
}
KROK 2: Przekazanie URL do Reacta (views/templates/front/app.tpl)
Musimy zaktualizować szablon, aby nowa zmienna $ajax_url była dostępna dla JavaScriptu.

Edytuj ps_slatwall/views/templates/front/app.tpl (sekcja <script>):

HTML

    <script>
        var sl_catalog_url = "{$catalog_url|escape:'javascript':'UTF-8'}";
        var sl_ajax_url = "{$ajax_url|escape:'javascript':'UTF-8'}"; // <--- DODAJ TĘ LINIĘ
        
        console.log('Konfigurator Config:', {
            catalog: sl_catalog_url,
            ajax: sl_ajax_url
        });
    </script>
KROK 3: Aktualizacja Reacta (src/App.jsx) – Funkcja "Dodaj do koszyka"
Teraz wróć do swojego lokalnego środowiska deweloperskiego (tam gdzie masz pliki Reacta). Musimy zastąpić alert() prawdziwym zapytaniem fetch.

W pliku src/App.jsx:

1. Znajdź przycisk "Dodaj do koszyka" i dodaj stan ładowania:

JavaScript

// Na początku komponentu dodaj stan:
const [addingToCart, setAddingToCart] = useState(false);

// ... (reszta kodu)

// 2. Dodaj nową funkcję obsługi koszyka:
const handleAddToCart = async () => {
    setAddingToCart(true);

    // Przygotuj dane dla PHP (tylko to, co potrzebne: ID i ilość)
    // Grupujemy te same produkty (np. 3 panele 120cm to jeden wpis z qty: 3)
    const itemsPayload = [];
    
    // Zliczanie ilości
    cartItems.forEach(item => {
        if (!item.found) return;
        
        const existing = itemsPayload.find(p => 
            p.id_product === item.data.id_produktu_glównego && 
            p.id_product_attribute === item.data.id_kombinacji
        );

        if (existing) {
            existing.qty += 1;
        } else {
            itemsPayload.push({
                id_product: item.data.id_produktu_glównego,
                id_product_attribute: item.data.id_kombinacji,
                qty: 1
            });
        }
    });
    
    // Jeśli z jakiegoś powodu pusto
    if (itemsPayload.length === 0) {
        alert("Błąd: Brak dostępnych produktów do dodania.");
        setAddingToCart(false);
        return;
    }

    try {
        const url = window.sl_ajax_url; // URL z szablonu .tpl
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: itemsPayload })
        });

        const result = await response.json();

        if (result.success) {
            // Przekieruj do koszyka lub pokaż modal
            window.location.href = window.location.origin + '/koszyk?action=show'; 
            // Lub tylko komunikat:
            // alert("Dodano do koszyka!");
        } else {
            alert("Wystąpił błąd: " + result.message);
        }

    } catch (err) {
        console.error(err);
        alert("Błąd komunikacji z serwerem.");
    } finally {
        setAddingToCart(false);
    }
};
3. Podepnij funkcję pod przycisk:

JavaScript

<button 
    className="btn btn-success btn-lg btn-block mt-3" 
    disabled={!isValid || addingToCart} // Zablokuj jak mieli
    onClick={handleAddToCart}
>
    {addingToCart ? 'Dodawanie...' : 'Dodaj do koszyka'}
</button>
KROK 4: Zbuduj i Wyślij
W folderze lokalnym: npm run build.

Wyślij nowy dist/build.js na serwer FTP do ps_slatwall/assets/js/.

Zaktualizuj pliki PHP (init.php i app.tpl) na serwerze.

Co to da?
Po wykonaniu tych kroków, kliknięcie przycisku "Dodaj do koszyka":

Zbierze wszystkie wybrane panele z wizualizacji.

Zgrupuje je (np. zamiast wysyłać 3 razy ten sam panel, wyśle "Ilość: 3").

Wyśle to do Twojego kontrolera w PrestaShop.

PrestaShop doda produkty do koszyka klienta i zwróci sukces.

Przekieruje klienta do podsumowania koszyka, gdzie zobaczy listę wszystkich elementów do zamówienia.

To zamknie główny proces zakupowy. Następnie zajmiemy się CSS-em, żeby wyglądało to "drogo" i profesjonalnie. Działam