import NDK from "@nostr-dev-kit/ndk";
import { Client, GatewayIntentBits } from "discord.js";
import {} from "dotenv/config";
import fs from "fs";
import { connect } from "mongoose";
import { log } from "./src/handlers/log.js";

import WebSocket from "ws";
Object.assign(global, { WebSocket });

export const connectedNdk = new NDK({
  explicitRelayUrls: ["wss://relay.lawallet.ar/"],
  autoConnectUserRelays: false,
  autoFetchUserMutelist: false,
});

const mongoHost = process.env.MONGO_HOST || "mongo";
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoDB = process.env.MONGO_DB || "lnbot";

let knownRelays = [];

function validateRelaysStatus() {
  let connectedRelays = connectedNdk.pool.connectedRelays();

  knownRelays.map((relayUrl) => {
    let isRelayConnected = connectedRelays.find(
      (relay) => relay.url === relayUrl
    );

    if (!isRelayConnected) {
      let disconnectedRelay = connectedNdk.pool.relays.get(relayUrl);

      if (disconnectedRelay) disconnectedRelay.connect();
    }
  });
}

async function runBot() {
  // Create a new Client with the Guilds intent
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  // Fetch all js files in ./events
  const events = fs
    .readdirSync("./src/events")
    .filter((file) => file.endsWith(".js"));

  // Check for an event and execute the corresponding file in ./events
  for (let event of events) {
    // The #events ES6 import-abbreviation is defined in the package.json
    // Note that the entries in the list of files (created by readdirSync) end with .js,
    // so the abbreviation is different to the #commands abbreviation
    const eventFile = await import(`#events/${event}`);
    // But first check if it's an event emitted once
    if (eventFile.once) {
      client.once(eventFile.name, (...args) => {
        eventFile.invoke(...args);
      });
    } else {
      client.on(eventFile.name, (...args) => {
        eventFile.invoke(...args);
      });
    }
  }

  // Login with the credentials stored in .env
  client.login(process.env.BOT_TOKEN);

  connectedNdk.pool.relays.forEach(async (relay) => {
    console.log("conectando relay: ", relay.url);
    knownRelays.push(relay.url);
    await relay.connect();
  });

  setInterval(validateRelaysStatus, 30000);

  log("Started connecting to MongoDB...", "warn");

  const mongoURI = `mongodb://${mongoHost}:${mongoPort}/${mongoDB}`;

  connect(mongoURI)
    .then(() => {
      log("MongoDB is connected!", "done");
    })
    .catch((err) => {
      log("Error conectándose a MongoDB: ", err, "err");
    });
}

runBot();
