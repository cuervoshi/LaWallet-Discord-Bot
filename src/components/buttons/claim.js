const customId = "claim";

const invoke = async (interaction) => {
  await interaction.deferReply({ ephemeral: true });
  return interaction.editReply("test");
};

export { invoke, customId };
