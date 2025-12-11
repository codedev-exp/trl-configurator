import React, { useState, useEffect } from 'react';
import { solveLayout } from './utils/solver';

const Configurator = () => {
  // --- STAN APLIKACJI ---
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wybory użytkownika
  const [width, setWidth] = useState(360);
  const [height, setHeight] = useState("180"); // string bo klucze w JSON to stringi
  const [spacing, setSpacing] = useState("15");
  const [insertType, setInsertType] = useState("ALU");
  const [panelColor, setPanelColor] = useState("BIA");
  const [selectedLayoutIndex, setSelectedLayoutIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);

  // --- ŁADOWANIE DANYCH ---
  useEffect(() => {
    // Pobieramy URL z globalnej zmiennej ustawionej w Prestashop (plik .tpl)
    const url = window.sl_catalog_url;
    
    if (!url) {
      setError("Brak URL katalogu. Sprawdź plik .tpl");
      setLoading(false);
      return;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Błąd pobierania pliku JSON");
        return res.json();
      })
      .then(data => {
        setCatalog(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // --- LOGIKA BIZNESOWA ---
  
  // 1. Oblicz układ modułów dla podanej szerokości
  const layouts = solveLayout(width);
  
  // Zabezpieczenie: jeśli zmienimy szerokość i stary index wyjdzie poza zakres
  const activeLayoutIndex = selectedLayoutIndex >= layouts.length ? 0 : selectedLayoutIndex;
  const currentLayout = layouts[activeLayoutIndex] || { modules: [] };

  // 2. Walidacja dostępności produktów (SKU Matcher)
  const cartItems = currentLayout.modules.map((modWidth, index) => {
    // Wzór SKU: TP{SZER}X{WYS}-{ROZSTAW}-{WSUWKA}-{KOLOR}
    const sku = `TP${modWidth}X${height}-${spacing}-${insertType}-${panelColor}`;
    
    // Szukamy w załadowanym JSONie
    const product = catalog.find(p => p.referencja_kombinacji === sku);
    
    return {
      id: index,
      width: modWidth,
      sku: sku,
      found: !!product,
      data: product
    };
  });

  const isConfigurationValid = cartItems.length > 0 && cartItems.every(item => item.found);

  // --- FUNKCJA DODAWANIA DO KOSZYKA ---
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
        
        if (!url) {
            console.error('Brak URL do API koszyka:', window.sl_ajax_url);
            alert("Błąd: Brak URL do API koszyka. Sprawdź konfigurację modułu.\n\nSprawdź konsolę przeglądarki (F12) dla szczegółów.");
            setAddingToCart(false);
            return;
        }

        console.log('Wysyłanie zapytania do:', url);
        console.log('Dane:', itemsPayload);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin', // Ważne dla PrestaShop - wysyła cookies
            body: JSON.stringify({ items: itemsPayload })
        });

        console.log('Odpowiedź status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Błąd HTTP:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }

        // Sprawdź czy odpowiedź nie jest pusta
        const responseText = await response.text();
        console.log('Odpowiedź tekstowa:', responseText);
        
        if (!responseText || responseText.trim() === '') {
            throw new Error('Pusta odpowiedź z serwera. Sprawdź, czy metoda displayAjaxAddToCart() jest wywoływana.');
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Błąd parsowania JSON:', parseError);
            console.error('Otrzymany tekst:', responseText);
            throw new Error('Nieprawidłowa odpowiedź JSON z serwera: ' + responseText.substring(0, 200));
        }
        
        console.log('Wynik:', result);

        if (result.success) {
            // Przekieruj do koszyka
            window.location.href = window.location.origin + '/koszyk?action=show'; 
        } else if (result.partial) {
            // Częściowy sukces - niektóre produkty dodane
            const confirmMsg = `${result.message}\n\nCzy chcesz przejść do koszyka mimo błędów?`;
            if (window.confirm(confirmMsg)) {
                window.location.href = window.location.origin + '/koszyk?action=show';
            }
        } else {
            // Całkowity błąd
            alert("Wystąpił błąd: " + result.message);
        }

    } catch (err) {
        console.error('Błąd podczas dodawania do koszyka:', err);
        console.error('URL:', window.sl_ajax_url);
        console.error('Dane:', itemsPayload);
        alert("Błąd komunikacji z serwerem.\n\nSzczegóły w konsoli przeglądarki (F12).\n\nBłąd: " + err.message);
    } finally {
        setAddingToCart(false);
    }
  };

  // --- RENDEROWANIE ---
  if (loading) return <div className="alert alert-info">Ładowanie konfiguratora...</div>;
  if (error) return <div className="alert alert-danger">Błąd: {error}</div>;

  // URL do filmiku
  const getVideoUrl = () => {
    if (window.sl_module_uri && window.sl_base_url) {
      return window.sl_base_url + window.sl_module_uri + 'assets/images/TraderLine_Anim.mp4';
    } else if (window.sl_module_uri) {
      return window.sl_module_uri + 'assets/images/TraderLine_Anim.mp4';
    } else if (window.sl_catalog_url) {
      return window.sl_catalog_url.replace('/catalog.json', '/images/TraderLine_Anim.mp4');
    }
    return '/modules/ps_slatwall/assets/images/TraderLine_Anim.mp4';
  };
  const videoUrl = getVideoUrl();

  return (
    <>
      {/* POPUP Z FILMIKIEM */}
      {showVideoPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '800px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowVideoPopup(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: '1',
                zIndex: 10001
              }}
            >
              ×
            </button>
            <h3 style={{marginTop: 0, marginBottom: '15px'}}>Instrukcja konfiguracji paneli Spacewall</h3>
            <video
              src={videoUrl}
              autoPlay
              controls
              style={{
                width: '100%',
                borderRadius: '8px'
              }}
            >
              Twoja przeglądarka nie obsługuje odtwarzania wideo.
            </video>
            <div style={{marginTop: '15px', textAlign: 'center'}}>
              <button
                onClick={() => setShowVideoPopup(false)}
                className="btn-add-cart"
                style={{maxWidth: '200px', margin: '0 auto'}}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="sl-configurator row" style={{marginTop: '20px'}}>
      
      {/* LEWA KOLUMNA: WIZUALIZACJA + OPCJE (3/4 szerokości) */}
      <div className="col-md-9">
        {/* WIZUALIZACJA */}
        <div className="visualizer-card">
          <div className="visualizer-canvas">
             {currentLayout.modules.map((modWidth, i) => (
               <div 
                 key={i} 
                 className={`sl-panel-visual ${cartItems[i] && !cartItems[i].found ? 'invalid' : ''}`}
                 style={{
                   width: `${(modWidth / width) * 100}%`,
                   height: `${parseInt(height)}px`, // Bezpośrednie mapowanie: 180cm = 180px
                 }}
               >
                 <strong>{modWidth}cm</strong>
                 {cartItems[i] && !cartItems[i].found && <span style={{color:'red', fontSize: '10px'}}>Niedostępny</span>}
               </div>
             ))}
          </div>
          <div className="text-center mt-3" style={{color: '#666'}}>
             Całkowita szerokość zabudowy: <strong>{width} cm</strong>
             {currentLayout.isCut && <span className="badge badge-warning ml-2">Wymaga docięcia</span>}
          </div>
        </div>

        {/* OPCJE KONFIGURACJI */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px'}}>
        
        {/* SEKCJA 1: WYMIARY */}
        <div className="card">
          <div className="card-body">
            <h5 className="section-title">1. Wymiary</h5>
            
            <div className="form-group">
              <label>Szerokość (cm)</label>
              <input 
                type="number" 
                className="form-control form-control-lg" 
                value={width} 
                onChange={e => setWidth(Number(e.target.value))}
                step="10" min="40" max="1000"
              />
            </div>

            {layouts.length > 0 ? (
                <div className="form-group">
                    <label className="small text-muted" style={{fontWeight: 600}}>Sugerowany podział modułów:</label>
                    <div className="layout-selector">
                        {layouts.map((layout, idx) => (
                        <div 
                            key={idx} 
                            className={`layout-option ${activeLayoutIndex === idx ? 'active' : ''}`}
                            onClick={() => setSelectedLayoutIndex(idx)}
                        >
                            <input 
                                type="radio" 
                                id={`layout-${idx}`} 
                                name="layoutLayout"
                                className="layout-radio"
                                checked={activeLayoutIndex === idx}
                                onChange={() => setSelectedLayoutIndex(idx)}
                            />
                            <div>
                                <div style={{fontWeight: 600}}>{layout.type}</div>
                                <small style={{color: '#666'}}>{layout.modules.join(' + ')} cm</small>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="alert alert-warning py-1 small">Brak możliwego układu dla tej szerokości.</div>
            )}

            <div className="form-group mt-3">
               <label>Wysokość</label>
               <select className="form-control" value={height} onChange={e => setHeight(e.target.value)}>
                   <option value="90">90 cm</option>
                   <option value="180">180 cm</option>
               </select>
            </div>
          </div>
        </div>

        {/* SEKCJA 2: OPCJE */}
        <div className="card">
           <div className="card-body">
             <h5 className="section-title">2. Wykończenie</h5>
             <div style={{display: 'flex', gap: '15px'}}>
                <div style={{flex: 1}}>
                    <div className="form-group">
                        <label>Rozstaw</label>
                        <select className="form-control" value={spacing} onChange={e => setSpacing(e.target.value)}>
                            <option value="10">10 cm</option>
                            <option value="15">15 cm</option>
                        </select>
                    </div>
                </div>
                <div style={{flex: 1}}>
                    <div className="form-group">
                        <label>Wsuwka</label>
                        <select className="form-control" value={insertType} onChange={e => setInsertType(e.target.value)}>
                            <option value="ALU">Aluminiowa (ALU)</option>
                            <option value="SZA">Plastik Szara (SZA)</option>
                            <option value="CZA">Plastik Czarna (CZA)</option>
                            <option value="BIA">Plastik Biała (BIA)</option>
                            <option value="GRA">Plastik Grafit (GRA)</option>
                            <option value="BEZ">Bez wsuwki (BEZ)</option>
                        </select>
                    </div>
                </div>
             </div>
             
             <div className="form-group mt-3">
                 <label>Kolor Panelu</label>
                 <select className="form-control" value={panelColor} onChange={e => setPanelColor(e.target.value)}>
                    <option value="BIA">Biały (BIA)</option>
                    <option value="CZA">Czarny (CZA)</option>
                    <option value="ALA">Alaska (ALA)</option>
                    <option value="KLO">Klon (KLO)</option>
                    <option value="GRA">Grafit (GRA)</option>
                    <option value="POP">Popiel (POP)</option>
                 </select>
             </div>
           </div>
        </div>

        </div>
      </div>

      {/* PRAWA KOLUMNA: SIDEBAR Z PODSUMOWANIEM (1/4 szerokości) */}
      <div className="col-md-3">
        <div className="options-sidebar">
          {/* BANNER Z FILMIKIEM */}
          <div 
            onClick={() => setShowVideoPopup(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              textAlign: 'center',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              marginBottom: '12px'
            }}>
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="white"
                style={{marginLeft: '3px'}}
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div style={{fontSize: '16px', fontWeight: 600, marginBottom: '5px'}}>
              Zobacz konfigurację
            </div>
            <div style={{fontSize: '14px', opacity: 0.9}}>
              paneli Spacewall
            </div>
          </div>

          {/* PODSUMOWANIE */}
          <div className={`summary-box ${!isConfigurationValid ? 'bg-danger' : ''}`} style={!isConfigurationValid ? {background: '#dc3545'} : {}}>
              <h5 className="section-title" style={{color: 'white', borderColor: 'rgba(255,255,255,0.2)'}}>Podsumowanie</h5>
              {isConfigurationValid ? (
                  <ul className="summary-list">
                      {cartItems.map((item, i) => (
                          <li key={i}>
                              <span>{item.width}x{height}cm</span>
                              <span style={{fontWeight: 600}}>ID: {item.data.id_kombinacji}</span>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="small" style={{color: 'rgba(255,255,255,0.9)'}}>Wybrana kombinacja kolorów/wymiarów nie istnieje w katalogu.</p>
              )}
              
              <button 
                  className="btn-add-cart" 
                  disabled={!isConfigurationValid || addingToCart}
                  onClick={handleAddToCart}
              >
                  {addingToCart ? 'Dodawanie...' : 'Dodaj do koszyka'}
              </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Configurator;

