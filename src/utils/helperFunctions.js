const validateAmountAndBalance = (amount, balance) => {
  if (amount <= 0)
    return {
      status: false,
      content: "No puedes usar números negativos o flotantes",
    };

  if (amount > balance)
    return {
      status: false,
      content: `No tienes saldo suficiente para realizar esta acción. \nRequerido: ${amount} - balance en tu billetera: ${balance}`,
    };

  return {
    status: true,
    content: "",
  };
};

const handleBotResponse = async (Interaction, objConfig) => {
  Interaction.deferred
    ? await Interaction.editReply(objConfig)
    : await Interaction.reply(objConfig);
};

const EphemeralMessageResponse = async (Interaction, content) => {
  const objectResponse = {
    content,
    ephemeral: true,
  };

  await handleBotResponse(Interaction, objectResponse);
};

const FollowUpEphemeralResponse = async (Interaction, content) => {
  await Interaction.deleteReply();
  await Interaction.followUp({
    content: content,
    ephemeral: true,
  });
};

export {
  EphemeralMessageResponse,
  FollowUpEphemeralResponse,
  handleBotResponse,
  validateAmountAndBalance,
};
