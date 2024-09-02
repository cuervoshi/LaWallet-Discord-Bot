const once = false;
const name = "interactionCreate";

async function invoke(interaction) {
  // Check if the interaction is a command and call the invoke method in the corresponding file
  // The #commands ES6 import-abbreviation is defined in the package.json
  try {
    if (interaction.isChatInputCommand()) {
      (await import(`#commands/${interaction.commandName}`)).invoke(
        interaction
      );
    }
  } catch (err) {
    console.log("Error al enviar comando");
    console.log(err);
  }
}

export { once, name, invoke };
