// Funkcja inicjalizująca - czeka na załadowanie DOM i zmiennej
console.log('✅ app.js został załadowany!');

(function() {
    function initConfigurator() {
        const root = document.getElementById('slatwall-root');
        if (!root) {
            console.error('Błąd: element #slatwall-root nie został znaleziony');
            return;
        }

        // Pobierz URL z data-attribute lub zmiennej globalnej
        let catalogUrl = root.getAttribute('data-catalog-url');
        if (!catalogUrl && typeof sl_catalog_url !== 'undefined') {
            catalogUrl = sl_catalog_url;
        }

        if (!catalogUrl) {
            console.error('Błąd: nie można znaleźć URL katalogu');
            root.innerHTML = '<div class="alert alert-danger">Błąd: Nie można załadować konfiguratora. Brak URL katalogu.</div>';
            return;
        }

        // Ustaw globalną zmienną dla kompatybilności
        if (typeof sl_catalog_url === 'undefined') {
            window.sl_catalog_url = catalogUrl;
        }

        startApp(root, catalogUrl);
    }

    async function startApp(root, catalogUrl) {
        // 1. Pobierz dane z JSON (Symulacja React State)
        root.innerHTML = '<div class="alert alert-info">Pobieranie katalogu produktów...</div>';
        
        let products = [];
        try {
            console.log('Ładowanie katalogu z:', catalogUrl);
            const response = await fetch(catalogUrl);
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            
            products = await response.json();
            
            if (!Array.isArray(products)) {
                throw new Error('Otrzymane dane nie są tablicą');
            }
            
            console.log('Katalog załadowany. Ilość produktów:', products.length);
            root.innerHTML = '<div class="alert alert-success">Katalog załadowany! Ilość wariantów: ' + products.length + '</div>';
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
            root.innerHTML = '<div class="alert alert-danger">Błąd ładowania danych: ' + error.message + '<br><small>URL: ' + catalogUrl + '</small></div>';
            return;
        }

        // 2. Interfejs testowy (HTML wstrzykiwany przez JS)
        const ui = document.createElement('div');
        ui.innerHTML = `
            <div style="background:#f4f4f4; padding:20px; border-radius:8px; margin-top:20px;">
                <h3>Tester Logiki SKU</h3>
                <div class="row">
                    <div class="col-md-3">
                        <label>Szerokość modułu (cm)</label>
                        <select id="sel-width" class="form-control">
                            <option value="40">40 cm</option>
                            <option value="80">80 cm</option>
                            <option value="100">100 cm</option>
                            <option value="120">120 cm</option>
                            <option value="200">200 cm</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label>Wysokość modułu (cm)</label>
                        <select id="sel-height" class="form-control">
                            <option value="90">90 cm</option>
                            <option value="180">180 cm</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label>Rozstaw wsuwek (cm)</label>
                        <select id="sel-spacing" class="form-control">
                            <option value="10">10 cm</option>
                            <option value="15">15 cm</option>
                        </select>
                    </div>
                     <div class="col-md-3">
                        <label>Typ Wsuwki</label>
                        <select id="sel-insert" class="form-control">
                            <option value="ALU">Aluminiowa</option>
                            <option value="SZA">Plastik Szara</option>
                            <option value="CZA">Plastik Czarna</option>
                        </select>
                    </div>
                     <div class="col-md-3">
                        <label>Kolor Panelu</label>
                        <select id="sel-color" class="form-control">
                            <option value="BIA">Biały</option>
                            <option value="CZA">Czarny</option>
                            <option value="KLO">Klon</option>
                             <option value="ALA">Alaska</option>
                        </select>
                    </div>
                </div>
                <hr>
                <button id="btn-check" class="btn btn-primary btn-lg">Sprawdź dostępność i Cenę</button>
                <div id="result-box" style="margin-top:20px; font-weight:bold; font-size:1.2em;"></div>
            </div>
        `;
        root.appendChild(ui);

        // 3. Logika Szukania (To jest to, co przeniesiemy do Reacta)
        document.getElementById('btn-check').addEventListener('click', () => {
            const w = document.getElementById('sel-width').value;
            const h = document.getElementById('sel-height').value;
            const s = document.getElementById('sel-spacing').value;
            const i = document.getElementById('sel-insert').value;
            const c = document.getElementById('sel-color').value;

            // Generowanie SKU według Twojego wzoru
            // Wzór z pliku JSON: TP{SZER}X{WYS}-{ROZSTAW}-{WSUWKA}-{KOLOR}
            const generatedSKU = `TP${w}X${h}-${s}-${i}-${c}`;
            
            console.log("Szukam SKU:", generatedSKU);

            // Szukanie w załadowanym JSON
            const foundProduct = products.find(p => p.referencja_kombinacji === generatedSKU);

            const resultBox = document.getElementById('result-box');
            
            if (foundProduct) {
                resultBox.innerHTML = `
                    <span style="color:green">ZNALEZIONO!</span><br>
                    SKU: ${foundProduct.referencja_kombinacji}<br>
                    ID Kombinacji Presta: ${foundProduct.id_kombinacji}<br>
                    ID Produktu Głównego: ${foundProduct.id_produktu_glównego}
                `;
                // Tutaj React wysłałby te ID do koszyka
            } else {
                resultBox.innerHTML = `
                    <span style="color:red">PRODUKT NIEDOSTĘPNY</span><br>
                    Szukane SKU: ${generatedSKU}<br>
                    <small>Taka kombinacja nie występuje w pliku JSON.</small>
                `;
            }
        });
    }

    // Czekaj na załadowanie DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConfigurator);
    } else {
        // DOM już załadowany, ale czekamy chwilę na zmienną sl_catalog_url
        setTimeout(initConfigurator, 100);
    }
})();

