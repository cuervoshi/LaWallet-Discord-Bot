import { getOrCreateAccount, LNDOMAIN } from "../../handlers/accounts.js";
import {
  EphemeralMessageResponse,
  normalizeLNDomain,
} from "../../utils/helperFunctions.js";

const customId = "registerhandle";

const invoke = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    const footerContent = interaction.message.embeds[0]?.footer?.text;
    const faucetSubStr = footerContent ? footerContent.indexOf(" ") : -1;

    const username =
      faucetSubStr !== -1
        ? footerContent.substring(faucetSubStr + 1, footerContent.length)
        : false;

    if (!username)
      return EphemeralMessageResponse(
        interaction,
        "No se encontró el nombre de usuario a registrar"
      );

    const userId = interaction.user.id;
    const wallet = await getOrCreateAccount(userId, interaction.user.username);
    if (!wallet.lnurlpData) await wallet.fetch();

    let walias = wallet.walias;
    if (walias && walias.length)
      return EphemeralMessageResponse(
        interaction,
        `Ya tienes un walias registrado: ${"`" + wallet.walias + "`"}`
      );

    const registered = await wallet.registerHandle(username);
    if (registered) {
      return EphemeralMessageResponse(
        interaction,
        `El usuario ${username}@${normalizeLNDomain(
          LNDOMAIN
        )} fue registrado con éxito.`
      );
    }
  } catch (err) {
    console.log(err);
    EphemeralMessageResponse(
      interaction,
      "Ocurrió un error al registrar el walias"
    );
  }
};

export { customId, invoke };
