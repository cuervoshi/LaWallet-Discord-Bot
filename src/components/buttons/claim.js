import dedent from "dedent-js";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import { getOrCreateAccount } from "../../handlers/accounts.js";
import { updateUserRank } from "../../handlers/donate.js";
import { getFaucet, addClaimerOnFaucet } from "../../handlers/faucet.js";
import { SimpleLock } from "../../handlers/SimpleLock.js";
import { AuthorConfig } from "../../utils/helperConfig.js";
import {
  EphemeralMessageResponse,
  FollowUpEphemeralResponse,
} from "../../utils/helperFunctions.js";

const customId = "claim";

const lock = new SimpleLock();
let claimQueue = [];

async function processQueue() {
  while (claimQueue.length > 0) {
    const { faucet, interaction } = claimQueue.shift();
    await handleClaim(faucet, interaction);
  }
}

async function handleClaim(faucet, interaction) {
  const release = await lock.acquire();

  try {
    await claimFaucet(faucet, interaction);
  } finally {
    release();
  }
}

const claimFaucet = async (faucet, interaction) => {
  try {
    let userId = interaction.user.id;
    let faucetId = faucet._id.toString();

    const userWallet = await getOrCreateAccount(
      userId,
      interaction.user.username
    );

    const faucetWallet = await getOrCreateAccount(faucetId, "account-faucet");

    const invoiceDetails = await userWallet.generateInvoice({
      milisatoshis: faucet.amount * 1000,
    });

    await faucetWallet.payInvoice({
      paymentRequest: invoiceDetails.pr,
      onSuccess: async () => {
        const content = interaction.message.embeds[0].fields[0].value;
        const subStr = content.indexOf(">");

        let senderUserId = subStr !== -1 ? content.substring(2, subStr) : "";
        let fieldInfo = interaction.message.embeds[0].fields[0];

        if (senderUserId)
          await updateUserRank(senderUserId, "comunidad", faucet.amount);

        await addClaimerOnFaucet(faucetId, userId);

        await updateMessage(faucetId, fieldInfo, interaction.message);

        const new_user_balance = await userWallet.getBalance("BTC");

        FollowUpEphemeralResponse(
          interaction,
          `Recibiste ${
            faucet.amount
          } sats por reclamar este faucet, tu nuevo balance es: ${(
            new_user_balance / 1000
          ).toFixed(0)} satoshis`
        );
      },
      onError: () => {
        EphemeralMessageResponse(
          interaction,
          "Ocurrió un error al reclamar la factura"
        );
      },
    });
  } catch (err) {
    EphemeralMessageResponse(
      interaction,
      "Ocurrió un error al reclamar la factura"
    );
    return;
  }
};

const updateMessage = async (faucetId, fieldInfo, message) => {
  try {
    const faucet = await getFaucet(faucetId);
    const uses = faucet.claimersIds.length;

    let claimersOutput = ``;
    faucet.claimersIds.forEach(async (claimer) => {
      claimersOutput += `
                      <@${claimer}>
                    `;
      claimersOutput = dedent(claimersOutput);
    });

    const embed = new EmbedBuilder()
      .setAuthor(AuthorConfig)
      .addFields([
        fieldInfo,
        {
          name: `Restantes: ${faucet.amount * (faucet.maxUses - uses)}/${
            faucet.amount * faucet.maxUses
          } sats`,
          value: `${":white_check_mark:".repeat(uses)}${
            faucet.maxUses - uses > 0 ? ":x:".repeat(faucet.maxUses - uses) : ""
          } \n\n`,
        },
        {
          name: "Reclamado por:",
          value: claimersOutput,
        },
      ])
      .setFooter({
        text: `Identificador: ${faucetId}`,
      });

    const disabledFaucet = faucet.maxUses <= uses;

    const components = [
      new ButtonBuilder()
        .setCustomId("claim")
        .setLabel(
          disabledFaucet ? "Todos los sats han sido reclamados" : `Reclamar`
        )
        .setEmoji({ name: `💸` })
        .setStyle(2)
        .setDisabled(disabledFaucet),
    ];

    if (!disabledFaucet)
      components.push(
        new ButtonBuilder()
          .setCustomId("closefaucet")
          .setLabel("Cerrar faucet")
          .setEmoji({ name: `✖️` })
          .setStyle(2)
      );

    const row = new ActionRowBuilder().addComponents(components);

    await message.edit({
      embeds: [embed],
      components: [row],
    });
  } catch (err) {
    console.log(err);
    await message.edit({ content: "Ocurrio un error" });
  }
};

const invoke = async (interaction) => {
  try {
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
    const userId = interaction.user.id;

    if (!faucet)
      return FollowUpEphemeralResponse(
        interaction,
        "El faucet que intentas reclamar no se encuentra en la base de datos"
      );

    if (faucet.claimersIds.includes(userId))
      return FollowUpEphemeralResponse(
        interaction,
        "Solo puedes reclamar el premio una vez"
      );

    if (faucet.closed)
      return FollowUpEphemeralResponse(
        interaction,
        "El faucet que intentas reclamar fue cerrado por su autor"
      );

    // if (faucet.discord_id === userId)
    //   return FollowUpEphemeralResponse(
    //     interaction,
    //     "No puedes reclamar tu propio faucet"
    //   );

    claimQueue.push({ faucet, interaction });

    if (claimQueue.length === 1) {
      processQueue();
    }
  } catch (err) {
    EphemeralMessageResponse(
      interaction,
      "Ocurrió un error al reclamar la factura"
    );
  }
};

export { customId, invoke };
