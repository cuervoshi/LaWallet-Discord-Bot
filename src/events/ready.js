import fs from "fs";
import { log } from "../handlers/log.js";

const once = true;
const name = "ready";

async function invoke(client) {
  const commands = fs
    .readdirSync("./src/commands")
    .filter((file) => file.endsWith(".js"))
    .map((file) => file.slice(0, -3));

  const commandsArray = [];

  for (let command of commands) {
    log(`Added /${command} slash command`, "info");
    const commandFile = await import(`#commands/${command}`);
    commandsArray.push(commandFile.create());
  }

  client.application.commands.set(commandsArray);

  log(`Successfully logged in as ${client.user.tag}!`, "done");
}

export { once, name, invoke };
