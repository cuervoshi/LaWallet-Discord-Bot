import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getOrCreateAccount } from "../handlers/accounts.js";
import { formatter } from "../utils/helperFormatter.js";
import {
  EphemeralMessageResponse,
  publishProfile,
  validateRelaysStatus,
} from "../utils/helperFunctions.js";
import { log } from "../handlers/log.js";
// Creates an object with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Devuelve el saldo de tu billetera.");

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
const invoke = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });
    await validateRelaysStatus();

    const user = interaction.user;
    if (!user) throw new Error("No user interaction found");

    log(`@${user.username} utilizó /balance`, "info");

    const userWallet = await getOrCreateAccount(user.id, user.username);
    const sats = await userWallet.getBalance("BTC");

    if (!userWallet.lnurlpData) await userWallet.fetch();

    if (!userWallet.nostr) {
      log(`Publicando perfil de @${user.username}`, "info");
      await publishProfile(userWallet, user);
    }

    const yourWaliasText = !userWallet.walias
      ? "No tienes un walias asociado a tu cuenta \nRegistrá el tuyo con el comando `/registrar-walias <nombre>`"
      : userWallet.walias;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Información de tu cuenta`,
        iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}`,
      })
      .addFields([
        {
          name: `Balance`,
          value: `**${formatter(0, 0).format(sats / 1000)} satoshis**`,
        },
        { name: `\u2009`, value: `\u2009` },
        {
          name: "**Walias/Nip05**",
          value: yourWaliasText,
        },
      ]);

    let profileUrl = `https://zapcito.app/p/${userWallet.pubkey}`;

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setStyle(5)
        .setLabel("Ir a mi perfil")
        .setURL(`${profileUrl}`),
    ]);

    log(
      `Balance de @${user.username} resuelto: ${sats / 1000} satoshis`,
      "info"
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  } catch (err) {
    log(
      `Error en el comando /balance ejecutado por @${interaction.user.username} - Código de error ${err.code} Mensaje: ${err.message}`,
      "err"
    );

    EphemeralMessageResponse(interaction, "Ocurrió un error");
  }
};

export { create, invoke };
