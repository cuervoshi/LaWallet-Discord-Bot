import NDK from "@nostr-dev-kit/ndk";
import { Client, GatewayIntentBits } from "discord.js";
import {} from "dotenv/config";
import fs from "fs";
import { connect } from "mongoose";
import { log } from "./src/handlers/log.js";
import { requiredEnvVar } from "./src/utils/helperFunctions.js";

import WebSocket from "ws";
Object.assign(global, { WebSocket });

export const connectedNdk = new NDK({
  explicitRelayUrls: ["wss://relay.lawallet.ar/", "wss://relay.hodl.ar/"],
  autoConnectUserRelays: false,
  autoFetchUserMutelist: false,
});

const mongoURI = requiredEnvVar("MONGODB_URI");
const botToken = requiredEnvVar("BOT_TOKEN");

export const knownRelays = [];

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
  client.login(botToken);

  connectedNdk.pool.relays.forEach(async (relay) => {
    log(`conectando relay: ${relay.url}`, "done");
    knownRelays.push(relay.url);
    await relay.connect();
  });

  // setInterval(validateRelaysStatus, 30000);

  log("Started connecting to MongoDB...", "warn");

  connect(mongoURI)
    .then(() => {
      log("MongoDB is connected!", "done");
    })
    .catch((err) => {
      log("Error conectándose a MongoDB: ", err, "err");
    });
}

runBot();
