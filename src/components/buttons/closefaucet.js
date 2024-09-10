import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import { getOrCreateAccount } from "../../handlers/accounts.js";
import { closeFaucet, getFaucet } from "../../handlers/faucet.js";
import { AuthorConfig } from "../../utils/helperConfig.js";
import {
  EphemeralMessageResponse,
  FollowUpEphemeralResponse,
} from "../../utils/helperFunctions.js";
import { log } from "../../handlers/log.js";

const customId = "closefaucet";

const invoke = async (interaction) => {
  try {
    const user = interaction.user;
    if (!user) return;

    await interaction.deferReply({ ephemeral: true });
    const footerContent = interaction.message.embeds[0]?.footer?.text;
    const faucetSubStr = footerContent ? footerContent.indexOf(" ") : -1;

    const faucetId =
      faucetSubStr !== -1
        ? footerContent.substring(faucetSubStr + 1, footerContent.length)
        : false;

    if (!faucetId)
      return EphemeralMessageResponse(interaction, "No se encontró el faucet");

    const faucet = await getFaucet(faucetId);

    if (!faucet)
      return FollowUpEphemeralResponse(
        interaction,
        "El faucet que intentas cerrar no se encuentra en la base de datos"
      );

    if (faucet.owner_id !== interaction.user.id)
      return FollowUpEphemeralResponse(
        interaction,
        "No puedes cerrar un faucet que no te pertenece"
      );

    const fieldsInfo = interaction.message.embeds[0].fields;

    const embed = new EmbedBuilder()
      .setAuthor(AuthorConfig)
      .addFields(fieldsInfo)
      .setFooter({
        text: `Identificador: ${faucetId}`,
      });

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId("closefaucet")
        .setLabel("El faucet ha sido cerrado por su autor")
        .setEmoji({ name: `✖️` })
        .setStyle(2)
        .setDisabled(true),
    ]);

    if (faucet.closed) {
      await interaction.message.edit({
        embeds: [embed],
        components: [row],
      });

      return FollowUpEphemeralResponse(
        interaction,
        "El faucet ya se encuentra cerrado."
      );
    }

    const wallet = await getOrCreateAccount(user.id, user.username);
    const faucetWallet = await getOrCreateAccount(faucetId, "faucet-account");
    const closedFaucet = await closeFaucet(faucetId);

    if (closedFaucet) {
      let milisatoshis = await faucetWallet.getBalance("BTC");
      if (!milisatoshis || milisatoshis < 1000) return;

      const invoiceDetails = await wallet.generateInvoice({
        milisatoshis,
      });
      if (!invoiceDetails || !invoiceDetails.pr) return;

      await faucetWallet.payInvoice({
        paymentRequest: invoiceDetails.pr,
        onSuccess: async () => {
          FollowUpEphemeralResponse(
            interaction,
            `Cerraste el faucet exitosamente, se reintegraron ${
              milisatoshis / 1000
            } sats`
          );
        },
        onError: async () => {
          FollowUpEphemeralResponse(
            interaction,
            `Ocurrió un error al reintegrar ${
              milisatoshis / 1000
            } sats. Id del faucet: ${faucetId}`
          );
        },
      });

      if (closedFaucet.closed) {
        try {
          if (closedFaucet.channelId && closedFaucet.messageId) {
            const channel = await interaction.guild.channels.fetch(
              closedFaucet.channelId
            );

            if (channel) {
              const message = await channel.messages.fetch(
                closedFaucet.messageId
              );

              if (message) {
                await message.edit({
                  embeds: [embed],
                  components: [row],
                });
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  } catch (err) {
    log(
      `Error cuando @${interaction.username} intentó cerrar un faucet - Código de error ${err.code} Mensaje: ${err.message}`,
      "err"
    );
    EphemeralMessageResponse(interaction, "Ocurrió un error");
  }
};

export { customId, invoke };
