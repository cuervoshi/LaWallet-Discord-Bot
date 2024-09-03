import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { AuthorConfig } from "../utils/helperConfig.js";
import { EphemeralMessageResponse } from "../utils/helperFunctions.js";
import dedent from "dedent-js";
import { commandsArray } from "#events/ready.js";

// Creates an object with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("ayuda")
    .setDescription("Obtener ayuda sobre los comandos.");

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
const invoke = async (interaction) => {
  try {
    let cmdOutput = [];
    commandsArray.forEach(async (cmd) => {
      if (cmd.name != `ayuda`) {
        let params = ``;
        cmd.options.forEach(async (opt) => {
          params += `${opt.name}: <${opt.type}> `;
        });

        cmdOutput.push({
          name: `${cmd.name[0].toUpperCase()}${cmd.name.substring(
            1,
            cmd.name.length
          )} - (\`/${cmd.name}${params ? ` ${params.trimEnd()}` : ""}\`)`,
          value: `${cmd.description}\n`,
        });
      }
      // Output[cmdOutput.length - 1] = dedent(cmdOutput);
    });

    if (!cmdOutput.length)
      return EphemeralMessageResponse(interaction, "No hay comandos");

    const embed = new EmbedBuilder()
      .setColor(`#0099ff`)
      .setAuthor(AuthorConfig)
      .setDescription(
        dedent(`
    Este bot le permite interactuar con otros usuarios utilizando el poder de la red lightning. Ya tienes una billetera asociada a tu usuario, puedes utilizarla con los comandos que se definen a continuación:
    `)
      )
      .addFields(
        { name: `\u200B`, value: `\u200B` },
        {
          name: `INFORMACIÓN IMPORTANTE`,
          value: `¡Este es un servicio de custodia, no controlas tu dinero hasta que lo retiras!`,
        },
        { name: `\u200B`, value: `\u200B` },
        ...cmdOutput.map((cmd) => cmd)
      );

    interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.log(err);
    EphemeralMessageResponse(interaction, "Ocurrió un error");
  }
};

export { create, invoke };
