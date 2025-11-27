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
            $response = ['success' => false, 'message' => implode(', ', $errors)];
        } else {
            $response = ['success' => true, 'message' => 'Produkty dodane do koszyka!', 'cart_id' => $cart->id];
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

