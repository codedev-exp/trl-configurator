Zagladnij na repozytoiurm,



W catalog.json mam np taki wariant

TP100X180-10-BIA-CZA



Zeby go znalezc wpisuje szerokosc 100, wysokosc 180, rozstaw wsuwek 10, ale nie widze wyboru białej wsuwki.

To klasyczny błąd "hardcodowania". Produkt istnieje w bazie (catalog.json), ale Twój interfejs (frontend) nie ma przycisku, który pozwoliłby wygenerować odpowiedni kod SKU.

W pliku JSON masz wariant: TP100X180-10-BIA-CZA. Rozbijmy to na części:

TP100X180 = Wymiar

10 = Rozstaw

BIA = Wsuwka (Tu jest problem)

CZA = Kolor panelu

W kodzie Reacta (src/App.jsx) lub JS (app.js) w sekcji wyboru wsuwki zdefiniowaliśmy na sztywno tylko 3 opcje: Alu, Szara, Czarna. Brakuje tam opcji "Biała" (kod BIA), dlatego React nigdy nie składa zapytania o ten wariant.

Jak to naprawić?
Musisz zaktualizować listę <option> w swoim kodzie, aby uwzględniała wszystkie warianty, które występują w pliku catalog.json.

Otwórz plik src/App.jsx (lub app.js jeśli korzystasz z wersji vanilla) i znajdź sekcję <select> dla wsuwek. Dopisz brakujące opcje:

JavaScript
<select className="form-control" value={insertType} onChange={e => setInsertType(e.target.value)}>
    <option value="ALU">Aluminiowa (ALU)</option>
    <option value="SZA">Plastik Szara (SZA)</option>
    <option value="CZA">Plastik Czarna (CZA)</option>
    
    {/* --- DODAJ TE LINIJKI --- */}
    <option value="BIA">Plastik Biała (BIA)</option>
    <option value="GRA">Plastik Grafit (GRA)</option>
    <option value="BEZ">Bez wsuwki (BEZ)</option>
</select>
Podobnie sprawdź selektor Kolorów Panelu – w catalog.json widzę też kolory, których mogło brakować w kodzie (np. Popiel POP czy Grafit GRA):

JavaScript
<select className="form-control" value={panelColor} onChange={e => setPanelColor(e.target.value)}>
    <option value="BIA">Biały (BIA)</option>
    <option value="CZA">Czarny (CZA)</option>
    <option value="ALA">Alaska (ALA)</option>
    <option value="KLO">Klon (KLO)</option>
    
    {/* --- DODAJ BRAKUJĄCE KOLORY Z JSONA --- */}
    <option value="GRA">Grafit (GRA)</option>
    <option value="POP">Popiel (POP)</option>
</select>
Co zrobić po zmianie?

Zapisz plik.

Uruchom npm run build (jeśli używasz Reacta).

Wyślij nowy plik build.js na serwer.

Po tej zmianie, gdy wybierzesz wsuwkę "Biała", system wygeneruje kod ...-BIA-... i poprawnie znajdzie Twój produkt TP100X180-10-BIA-CZA.