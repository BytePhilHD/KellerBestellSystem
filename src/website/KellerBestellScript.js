
window.onload = setupWebSocket();

    var bestellungen = 0;

    function setupWebSocket() {
    ws = new WebSocket("wss://" + location.hostname + ":2083/socket");


    ws.onmessage = messageEvent => {
    const data = messageEvent.data;
    if (data != null && data !== "") {
    const availibleDrinks = JSON.parse(data);
    console.log(availibleDrinks);
    for (const cocktail in availibleDrinks) {
    const element = document.getElementById(cocktail);
    if (element) {
    if (availibleDrinks[cocktail] !== true) {
    element.onclick = null;
}
    element.innerHTML = availibleDrinks[cocktail] ? "Bestellen" : "Nicht verfügbar";
}
}
}
}
    ws.onclose = closeEvent => {
    setupWebSocket();
}
}

    function orderDrink(clicked_id) {
    if (ws.readyState === WebSocket.OPEN) {
    var name = document.getElementById("input_name").value;
    if (name != "") {
    ws.send("ORDER: " + clicked_id + "; FROM: " + name);
    bestellungen++;
    if (bestellungen == 5) {
    window.alert("Cocktail " + clicked_id + " bestellt! \nSpenden gerne per PayPal oder in die Bierkasse :)");
} else {
    window.alert("Cocktail " + clicked_id + " bestellt!");
}
} else {
    window.alert("Bitte geben deinen Namen an (oben)");
}
} else {
    window.alert("Bestellung derzeit nicht möglich");
}
}
