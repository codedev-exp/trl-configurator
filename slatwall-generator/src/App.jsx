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

  // --- RENDEROWANIE ---
  if (loading) return <div className="alert alert-info">Ładowanie konfiguratora...</div>;
  if (error) return <div className="alert alert-danger">Błąd: {error}</div>;

  return (
    <div className="sl-configurator row" style={{marginTop: '20px'}}>
      
      {/* LEWA KOLUMNA: WIZUALIZACJA */}
      <div className="col-md-7">
        <div style={{
            background: '#e9ecef', 
            padding: '40px 20px', 
            borderRadius: '8px', 
            minHeight: '400px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '2px'
        }}>
           {currentLayout.modules.map((modWidth, i) => (
             <div key={i} style={{
               width: `${(modWidth / width) * 100}%`,
               height: `${(parseInt(height) / 270) * 100}%`, // Skala wizualna
               background: isConfigurationValid ? '#fff' : '#ffcfcf',
               border: '1px solid #ced4da',
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               fontSize: '11px',
               color: '#495057',
               flexDirection: 'column'
             }}>
               <strong>{modWidth}cm</strong>
               {cartItems[i] && !cartItems[i].found && <span style={{color:'red'}}>Niedostępny</span>}
             </div>
           ))}
        </div>
        <div className="text-center mt-2 text-muted">
           Całkowita szerokość zabudowy: <strong>{width} cm</strong>
           {currentLayout.isCut && <span className="badge badge-warning ml-2">Wymaga docięcia</span>}
        </div>
      </div>

      {/* PRAWA KOLUMNA: OPCJE */}
      <div className="col-md-5">
        
        {/* SEKCJA 1: WYMIARY */}
        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">1. Wymiary</h5>
            
            <div className="form-group">
              <label>Szerokość (cm)</label>
              <input 
                type="number" 
                className="form-control" 
                value={width} 
                onChange={e => setWidth(Number(e.target.value))}
                step="10" min="40" max="1000"
              />
            </div>

            {layouts.length > 0 ? (
                <div className="form-group bg-light p-2 rounded">
                    <label className="small text-muted">Sugerowany podział modułów:</label>
                    {layouts.map((layout, idx) => (
                    <div key={idx} className="custom-control custom-radio">
                        <input 
                            type="radio" 
                            id={`layout-${idx}`} 
                            name="layoutLayout"
                            className="custom-control-input"
                            checked={activeLayoutIndex === idx}
                            onChange={() => setSelectedLayoutIndex(idx)}
                        />
                        <label className="custom-control-label" htmlFor={`layout-${idx}`}>
                            {layout.type}: <strong>{layout.modules.join('+')}</strong>
                        </label>
                    </div>
                    ))}
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
        <div className="card mb-3">
           <div className="card-body">
             <h5 className="card-title">2. Wykończenie</h5>
             <div className="form-row">
                <div className="col">
                    <label>Rozstaw</label>
                    <select className="form-control" value={spacing} onChange={e => setSpacing(e.target.value)}>
                        <option value="10">10 cm</option>
                        <option value="15">15 cm</option>
                    </select>
                </div>
                <div className="col">
                    <label>Wsuwka</label>
                    <select className="form-control" value={insertType} onChange={e => setInsertType(e.target.value)}>
                        <option value="ALU">Aluminium</option>
                        <option value="SZA">Szara</option>
                        <option value="CZA">Czarna</option>
                    </select>
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
                 </select>
             </div>
           </div>
        </div>

        {/* PODSUMOWANIE */}
        <div className={`card text-white ${isConfigurationValid ? 'bg-secondary' : 'bg-danger'}`}>
            <div className="card-body">
                <h5 className="card-title">Podsumowanie</h5>
                {isConfigurationValid ? (
                    <ul className="list-unstyled small mb-3">
                        {cartItems.map((item, i) => (
                            <li key={i}>
                                {item.width}x{height}cm ({item.data.id_kombinacji})
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="small">Wybrana kombinacja kolorów/wymiarów nie istnieje w katalogu.</p>
                )}
                
                <button 
                    className="btn btn-success btn-block btn-lg" 
                    disabled={!isConfigurationValid}
                    onClick={() => alert("Tutaj nastąpi dodanie ID produktów do koszyka: " + cartItems.map(i => i.data.id_kombinacji).join(', '))}
                >
                    Dodaj do Koszyka
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Configurator;

