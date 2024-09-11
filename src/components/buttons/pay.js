import { ActionRowBuilder, ButtonBuilder } from "discord.js";
import { getOrCreateAccount } from "../../handlers/accounts.js";
import { log } from "../../handlers/log.js";
import { validateRelaysStatus } from "../../utils/helperFunctions.js";

const customId = "pay";

const invoke = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });
    await validateRelaysStatus();

    const payUrl = interaction.message.embeds[0].fields.find(
      (field) => field.name === "Solicitud de pago"
    );

    const amountOnSats = interaction.message.embeds[0].fields.find(
      (field) => field.name === "monto (sats)"
    );

    if (payUrl) {
      const userWallet = await getOrCreateAccount(
        interaction.user.id,
        interaction.user.username
      );

      const mSatsBalance = await userWallet.getBalance("BTC");
      const satsBalance = mSatsBalance * 1000;

      if (satsBalance < amountOnSats.value) {
        return FollowUpEphemeralResponse(
          interaction,
          `No tienes balance suficiente para pagar esta factura. \nTu balance: ${satsBalance} - Requerido: ${amountOnSats.value}`
        );
      } else {
        await userWallet.payInvoice({
          paymentRequest: payUrl.value,
          onSuccess: async () => {
            const row = new ActionRowBuilder().addComponents([
              new ButtonBuilder()
                .setCustomId("pay")
                .setLabel(`Pagada por @${interaction.user.username}`)
                .setEmoji({ name: `💸` })
                .setStyle(2)
                .setDisabled(true),
            ]);

            interaction.message.edit({ components: [row] });
          },
          onError: () => {
            FollowUpEphemeralResponse(interaction, "Ocurrió un error");
          },
        });

        return interaction.editReply({
          content: "Interacción con pago de factura completada.",
          ephemeral: true,
        });
      }
    }
  } catch (err) {
    log(
      `Error cuando @${interaction.user.username} intentó pagar una factura de /solicitar - Código de error ${err.code} Mensaje: ${err.message}`,
      "err"
    );
    return FollowUpEphemeralResponse(interaction, "Ocurrió un error");
  }
};

export { invoke, customId };
