import { SlashCommandBuilder } from "discord.js";
import { getOrCreateAccount } from "../handlers/accounts.js";
import { formatter } from "../utils/helperFormatter.js";
import {
  EphemeralMessageResponse,
  handleBotResponse,
} from "../utils/helperFunctions.js";

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

    await userWallet.fetch();

    const yourPubkeyText = "Tu Walias es: \n`" + userWallet.walias + "`";

    handleBotResponse(interaction, {
      content: `Balance: **${formatter(0, 0).format(
        sats / 1000
      )} satoshis** \n\n${yourPubkeyText}`,
      ephemeral: true,
    });
  } catch (err) {
    console.log(err);
    EphemeralMessageResponse(interaction, "Ocurrió un error");
  }
};

export { create, invoke };
