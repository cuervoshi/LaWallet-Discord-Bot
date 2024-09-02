import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getOrCreateAccount } from "../handlers/accounts.js";
import {
  EphemeralMessageResponse,
  FollowUpEphemeralResponse,
  validateAmountAndBalance,
} from "../utils/helperFunctions.js";
import { updateUserRank } from "../handlers/donate.js";
import lnurl from "lnurl-pay";
import { formatter } from "../utils/helperFormatter.js";

// Creates an object with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("donar")
    .setDescription("Realiza donaciones al pozo de la crypta.")
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("La cantidad de satoshis a donar")
        .setRequired(true)
    );

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
const invoke = async (interaction) => {
  try {
    const user = interaction.user;
    if (!user) return;

    await interaction.deferReply();

    const amount = parseInt(interaction.options.get(`monto`).value);

    const wallet = await getOrCreateAccount(user.id);
    const senderBalance = await wallet.getBalance("BTC");

    const isValidAmount = validateAmountAndBalance(
      amount,
      senderBalance / 1000
    );

    if (!isValidAmount.status)
      return FollowUpEphemeralResponse(Interaction, isValidAmount.content);

    const invoice = await lnurl.requestInvoice({
      lnUrlOrAddress: process.env.POOL_ADDRESS,
      tokens: amount,
    });

    if (invoice && invoice.invoice) {
      await wallet.payInvoice({
        paymentRequest: invoice.invoice,
        onSuccess: async () => {
          const updatedRank = await updateUserRank(
            interaction.user.id,
            "pozo",
            amount
          );

          const embed = new EmbedBuilder()
            .setColor(`#0099ff`)
            .setAuthor({
              name: `${interaction.user.globalName}`,
              iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}`,
            })
            .addFields(
              {
                name: `Donación a ${process.env.POOL_ADDRESS}`,
                value: `${interaction.user.toString()} ha donado ${formatter(
                  0,
                  2
                ).format(amount)} satoshis al pozo!`,
              },
              {
                name: "Total donado",
                value:
                  updatedRank && updatedRank.amount
                    ? `${formatter(0, 0).format(updatedRank.amount)}`
                    : "0",
              }
            );

          return interaction.editReply({ embeds: [embed] });
        },
        onError: () => {
          EphemeralMessageResponse(
            interaction,
            "Ocurrió un error al realizar el pago."
          );
        },
      });
    }
  } catch (err) {
    console.log(err);
    EphemeralMessageResponse(interaction, "Ocurrió un error");
  }
};

export { create, invoke };
