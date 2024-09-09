import { SlashCommandBuilder } from "discord.js";
import { getOrCreateAccount } from "../handlers/accounts.js";
import {
  EphemeralMessageResponse,
  FollowUpEphemeralResponse,
  validateAmountAndBalance,
} from "../utils/helperFunctions.js";
import { updateUserRank } from "../handlers/donate.js";

// Creates an object with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("zap")
    .setDescription("Regala sats a un usuario en discord")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Usuario a zappear").setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("La cantidad de satoshis a transferir")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("Un mensaje de la transferencia")
        .setRequired(false)
    );

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
const invoke = async (interaction) => {
  try {
    const user = interaction.user;
    if (!user) return;

    await interaction.deferReply({ ephemeral: true });
    const receiver = interaction.options.get(`user`);
    const amount = parseInt(interaction.options.get(`monto`).value);

    if (amount <= 0)
      return FollowUpEphemeralResponse(
        interaction,
        "No se permiten saldos negativos"
      );

    const msatsAmount = amount * 1000;

    const receiverData = await interaction.guild.members.fetch(
      receiver.user.id
    );

    const senderWallet = await getOrCreateAccount(user.id, user.username);

    const receiverWallet = await getOrCreateAccount(
      receiverData.user.id,
      receiverData.user.username
    );

    if (!senderWallet || !receiverWallet)
      return FollowUpEphemeralResponse(
        interaction,
        "Ocurrió un error al obtener la información del usuario"
      );

    if (senderWallet.pubkey === receiverWallet.pubkey)
      return FollowUpEphemeralResponse(
        interaction,
        "No puedes enviarte sats a vos mismo."
      );

    const senderBalance = await senderWallet.getBalance("BTC");
    console.log(senderBalance);
    const isValidAmount = validateAmountAndBalance(
      amount,
      senderBalance / 1000
    );

    if (!isValidAmount.status)
      return FollowUpEphemeralResponse(interaction, isValidAmount.content);

    const message = interaction.options.get(`message`)
      ? interaction.options.get(`message`)
      : {
          value: `${user.username} te envío ${amount} sats a través de discord`,
        };

    const invoiceDetails = await receiverWallet.generateInvoice({
      milisatoshis: msatsAmount,
      comment: "",
    });

    const onSuccess = async () => {
      try {
        await updateUserRank(interaction.user.id, "comunidad", amount);

        await interaction.deleteReply();

        await interaction.followUp({
          content: `${interaction.user.toString()} envió ${amount} satoshis a ${receiverData.toString()}`,
        });
      } catch (err) {
        console.log(err);
        EphemeralMessageResponse(interaction, "Ocurrió un error");
      }
    };

    await senderWallet.payInvoice({
      paymentRequest: invoiceDetails.pr,
      onSuccess,
      onError: () => {
        EphemeralMessageResponse(interaction, "Ocurrió un error");
      },
    });
  } catch (err) {
    console.log(err);
    EphemeralMessageResponse(interaction, "Ocurrió un error");
  }
};

export { create, invoke };
