package de.bytephil;

import io.javalin.Javalin;
import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;

import org.eclipse.jetty.server.*;
import org.eclipse.jetty.util.ssl.SslContextFactory;

import java.net.http.WebSocket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class Main {

    private Javalin app;

    public static void main(String[] args) {
        System.out.println("Hello world!");

        new Main().startApp();
    }

    public void startApp() {
        // Erstelle eine SSL-Kontextfabrik mit dem Keystore-Pfad und den Passwörtern
        SslContextFactory.Server sslContextFactory = new SslContextFactory.Server();
        sslContextFactory.setKeyStorePath("keystore.jks");
        sslContextFactory.setKeyStorePassword("KellerBestell");
        sslContextFactory.setKeyManagerPassword("KellerBestell");

        // Erstelle eine HTTPS-Konfiguration mit einem SecureRequestCustomizer
        HttpConfiguration httpsConfig = new HttpConfiguration();
        httpsConfig.addCustomizer(new SecureRequestCustomizer());

        // Erstelle einen Jetty-Server mit einem SSL-Connector
        Server server = new Server();
        ServerConnector sslConnector = new ServerConnector(
                server,
                new SslConnectionFactory(sslContextFactory, "http/1.1"),
                new HttpConnectionFactory(httpsConfig));
        sslConnector.setPort(2083);

        server.setConnectors(new Connector[]{sslConnector});

        List<String> eingehendeBestellungen = new ArrayList<>();

        // Erstelle eine Javalin-App mit der Server-Instanz
        Javalin app = Javalin.create(config -> {
            config.server(() -> server); // Verwende den Jetty-Server für die Javalin-App
        }).start(2083);

        // Erstelle einen WebSocket-Handler für die Route "/socket"
        app.ws("/socket", ws -> {
            ws.onConnect(session -> {
                System.out.println("Connected");
                session.send("Hello!");
            });
            ws.onMessage(ctx -> {
                System.out.println("Received: " + ctx.message());
                eingehendeBestellungen.add("{\"cocktail\": \"" + ctx.message().split(";")[0].replace("ORDER: ", "") + "\", \"besteller\": \"" + ctx.message().split(";")[1].replace("FROM: ", "") + "\"}"); // Speichere die eingehende Bestellung
            });
        });

        // WebSocket-Handler für die Route "/send"
        app.ws("/send", ws -> {
            ws.onConnect(session -> {
                // Sende alle gespeicherten Bestellungen nacheinander
                for (String bestellung : eingehendeBestellungen) {
                    session.send(bestellung);
                }
            });
            ws.onMessage(ctx -> {
                if (ctx.message().contains("UPDATE")) {
                    for (String bestellung : eingehendeBestellungen) {
                        ctx.send(bestellung);
                    }
                }
            });
        });
    }


}