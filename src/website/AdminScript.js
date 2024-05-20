const bestellungen = [];

// Zeige Bestellungen in der Liste an
const bestellungenListe = document.getElementById("bestellungen");
bestellungen.forEach((bestellung, index) => {
    const li = document.createElement("li");
    li.textContent = `${bestellung.cocktail} - ${bestellung.besteller}`;

    li.addEventListener("click", () => {
        // Klickevent: Toggle fertig/ungefertigt
        bestellungen[index].fertig = !bestellungen[index].fertig;
        li.classList.toggle("completed");
    });
    bestellungenListe.appendChild(li);
});

// Empfangsfunktion für Websocket-Nachrichten
const ws = new WebSocket("wss://" + location.hostname + ":2083/send");
ws.onmessage = (messageEvent) => {
    if (messageEvent.data.includes("DRINKS")) {
        let data = messageEvent.data.replace("DRINKS", "");
        if (data !== null && data !== "") {
            const drinkCheckliste = JSON.parse(data);

            const checkboxes = document.querySelectorAll('input[type="checkbox"]');

            checkboxes.forEach((checkbox) => {
                const label = checkbox.parentElement.textContent.trim();
                checkbox.checked = drinkCheckliste[label];
            });
        }
    } else {
        const neueBestellung = JSON.parse(messageEvent.data);
        // Überprüfe, ob die Bestellung bereits in der Liste ist
        const bestehendeBestellung = bestellungen.find(bestellung =>
                bestellung.cocktail === neueBestellung.cocktail &&
                bestellung.besteller === neueBestellung.besteller &&
                bestellung.fertig === neueBestellung.fertig
            )
        ;
        // Wenn die Bestellung nicht bereits in der Liste ist, füge sie hinzu
        if (!bestehendeBestellung) {
            bestellungen.push(neueBestellung);
            const li = document.createElement("li");
            li.textContent = `${neueBestellung.cocktail} - ${neueBestellung.besteller}`;
            if (neueBestellung.fertig) {
                li.classList.add("completed");
            }

            li.addEventListener("click", () => {
                // Klickevent: Toggle fertig/ungefertigt
                ws.send(JSON.stringify(neueBestellung));
                neueBestellung.fertig = !neueBestellung.fertig;
                li.classList.toggle("completed");
            });
            bestellungenListe.appendChild(li);
        } else if (bestehendeBestellung.fertig !== neueBestellung.fertig) {
            // Wenn die Bestellung bereits in der Liste ist, aber der Status geändert wurde
            bestehendeBestellung.fertig = neueBestellung.fertig;
            const li = Array.from(bestellungenListe.children).find(child =>
                child.textContent.includes(`${neueBestellung.cocktail} - ${neueBestellung.besteller}`)
            )
        }
    }};
document.getElementById('clearButton').addEventListener('click', () => {
    ws.send("CLEAR");
    location.reload();
});
document.getElementById('drinkslistButton').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selectedCheckboxes = {};

    checkboxes.forEach((checkbox) => {
        const label = checkbox.parentElement.textContent.trim();
        selectedCheckboxes[label] = checkbox.checked;
    });

    const jsonResult = JSON.stringify(selectedCheckboxes, null, 2);
    ws.send("DRINKS" + jsonResult);
    window.alert("Verfügbarkeit der Cocktails aktualisiert!")
});
setInterval(() => {
    ws.send("UPDATE");
}, 2000); // 2000 Millisekunden = 2 Sekunden