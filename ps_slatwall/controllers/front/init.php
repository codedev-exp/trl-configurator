<?php

class Ps_SlatwallInitModuleFrontController extends ModuleFrontController
{
    public function initContent()
    {
        parent::initContent();

        // Sprawdź czy to zapytanie AJAX - jeśli tak, obsłuż je i zakończ
        if (Tools::getValue('ajax') == 1 && Tools::getValue('action') == 'AddToCart') {
            $this->displayAjaxAddToCart();
            return;
        }

        $moduleUri = $this->module->getPathUri();
        
        // Generujemy link do tego samego kontrolera dla zapytań AJAX
        // Używamy prostego formatu URL bez escapowania
        $ajaxUrl = $this->context->link->getModuleLink('ps_slatwall', 'init') . '?ajax=1&action=AddToCart';

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
        // Ustaw nagłówek JSON przed jakimkolwiek outputem
        header('Content-Type: application/json');

        // 1. Pobierz dane z Reacta (JSON payload)
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        // Logowanie dla debugowania (usuń w produkcji)
        if (defined('_PS_MODE_DEV_') && _PS_MODE_DEV_) {
            error_log('Slatwall AJAX: Otrzymano dane: ' . print_r($data, true));
        }

        if (!$data || !isset($data['items']) || empty($data['items'])) {
            echo json_encode(['success' => false, 'message' => 'Brak danych o produktach']);
            die();
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

            if ($qty <= 0) {
                $errors[] = "Nieprawidłowa ilość dla produktu ID: $id_product (Attr: $id_product_attribute)";
                continue;
            }

            // Sprawdź czy produkt istnieje
            $product = new Product($id_product);
            if (!Validate::isLoadedObject($product)) {
                $errors[] = "Produkt ID: $id_product nie istnieje";
                continue;
            }

            // Sprawdź czy kombinacja istnieje (jeśli jest podana)
            if ($id_product_attribute > 0) {
                $combination = new Combination($id_product_attribute);
                if (!Validate::isLoadedObject($combination)) {
                    $errors[] = "Kombinacja ID: $id_product_attribute nie istnieje";
                    continue;
                }
                if ($combination->id_product != $id_product) {
                    $errors[] = "Kombinacja ID: $id_product_attribute należy do produktu ID: {$combination->id_product}, a nie do $id_product";
                    continue;
                }
                // Usuwamy sprawdzanie available_for_order - PrestaShop sam to zweryfikuje przy dodawaniu
                // Niektóre kombinacje mogą nie mieć tego pola ustawionego, ale są dostępne
            }

            // Sprawdź dostępność (ale nie blokuj jeśli jest 0 - może być dostępne na zamówienie)
            $availableQuantity = Product::getQuantity($id_product, $id_product_attribute);
            // Sprawdzamy tylko czy nie ma ujemnej ilości (błąd w systemie)
            if ($availableQuantity < 0) {
                $errors[] = "Błąd stanu magazynowego produktu ID: $id_product (Attr: $id_product_attribute)";
                continue;
            }
            // Jeśli ilość jest 0, ale produkt jest dostępny na zamówienie, pozwalamy dodać
            // PrestaShop sam zweryfikuje dostępność przy dodawaniu

            // Sprawdź czy produkt jest już w koszyku
            $cartProduct = $cart->containsProduct($id_product, $id_product_attribute);
            
            if ($cartProduct) {
                // Produkt już jest w koszyku - zwiększ ilość
                $currentQty = $cart->getProductQuantity($id_product, $id_product_attribute);
                $newQty = $currentQty['quantity'] + $qty;
                $update = $cart->updateQty($newQty, $id_product, $id_product_attribute, null, 'up');
            } else {
                // Nowy produkt - dodaj do koszyka
                $update = $cart->updateQty($qty, $id_product, $id_product_attribute, null, 'up');
            }
            
            if (!$update) {
                // Pobierz szczegóły błędu z koszyka
                $cartErrors = $cart->getErrors();
                $errorMsg = "Błąd dodawania produktu ID: $id_product (Attr: $id_product_attribute)";
                if (!empty($cartErrors)) {
                    $errorMsg .= " - " . implode(', ', $cartErrors);
                }
                // Sprawdź też czy produkt jest aktywny
                if (!$product->active) {
                    $errorMsg .= " - Produkt jest nieaktywny";
                }
                $errors[] = $errorMsg;
            } else {
                $results[] = "Dodano produkt $id_product (Attr: $id_product_attribute, Qty: $qty)";
            }
        }

        // Odświeżamy koszyk, żeby przeliczył sumy
        $cart->update();

        // Jeśli część produktów została dodana, pokażemy częściowy sukces
        $totalItems = count($data['items']);
        $successCount = count($results);
        $errorCount = count($errors);

        if (!empty($errors) && !empty($results)) {
            // Częściowy sukces - niektóre produkty dodane, niektóre nie
            $response = [
                'success' => false, 
                'partial' => true,
                'message' => "Dodano $successCount z $totalItems produktów. Błędy: " . implode(', ', $errors),
                'added' => $successCount,
                'failed' => $errorCount,
                'errors' => $errors,
                'cart_id' => $cart->id
            ];
        } elseif (!empty($errors)) {
            // Wszystkie produkty nieudane
            $response = [
                'success' => false, 
                'message' => implode(', ', $errors),
                'errors' => $errors
            ];
        } else {
            // Wszystko OK
            $response = [
                'success' => true, 
                'message' => 'Produkty dodane do koszyka!', 
                'cart_id' => $cart->id,
                'added' => $successCount
            ];
        }
        
        // Logowanie dla debugowania
        if (defined('_PS_MODE_DEV_') && _PS_MODE_DEV_) {
            error_log('Slatwall AJAX: Odpowiedź: ' . print_r($response, true));
        }
        
        echo json_encode($response);
        
        // Ważne w PrestaShop AJAX - zabijamy proces, żeby nie renderował stopki/nagłówka
        die();
    }
}

