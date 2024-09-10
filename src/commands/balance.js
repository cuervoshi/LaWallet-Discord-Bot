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
  handleBotResponse,
  publishProfile,
} from "../utils/helperFunctions.js";
import { NDKRelaySet } from "@nostr-dev-kit/ndk";

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

    const user = interaction.user;
    if (!user) throw new Error("No user interaction found");

    const userWallet = await getOrCreateAccount(user.id, user.username);
    const sats = await userWallet.getBalance("BTC");

    const { nostr } = await userWallet.fetch();
    if (!nostr) await publishProfile(userWallet, user);

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

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  } catch (err) {
    console.log(err);
    EphemeralMessageResponse(interaction, "Ocurrió un error");
  }
};

export { create, invoke };
