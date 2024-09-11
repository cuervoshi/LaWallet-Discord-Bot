import { getOrCreateAccount, LNDOMAIN } from "../../handlers/accounts.js";
import { log } from "../../handlers/log.js";
import { SimpleLock } from "../../handlers/SimpleLock.js";
import {
  EphemeralMessageResponse,
  normalizeLNDomain,
  validateRelaysStatus,
} from "../../utils/helperFunctions.js";

const customId = "registerhandle";

const lock = new SimpleLock();
let claimQueue = [];

async function processQueue() {
  while (claimQueue.length > 0) {
    const { wallet, username, interaction } = claimQueue.shift();
    await handleClaimHandle(wallet, username, interaction);
  }
}

async function handleClaimHandle(wallet, username, interaction) {
  const release = await lock.acquire();

  log(
    `Lock de reclamar faucet adquirido para ${interaction.user.username}`,
    "info"
  );

  try {
    const registered = await wallet.registerHandle(username);
    if (registered) {
      log(
        `@${interaction.user.username} registró el walias ${username}`,
        "info"
      );

      EphemeralMessageResponse(
        interaction,
        `El usuario ${username}@${normalizeLNDomain(
          LNDOMAIN
        )} fue registrado con éxito.`
      );
    } else {
      log(
        `@${interaction.user.username} intentó registrar el walias ${username} pero ocurrió un error`,
        "err"
      );

      EphemeralMessageResponse(
        interaction,
        `Ocurrió un error al registrar ${username}@${normalizeLNDomain(
          LNDOMAIN
        )}`
      );
    }
  } finally {
    log(
      `Lock de reclamar faucet de ${interaction.user.username} liberado`,
      "info"
    );

    release();
    return;
  }
}

const invoke = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });
    await validateRelaysStatus();

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

    claimQueue.push({ wallet, username, interaction });

    if (claimQueue.length === 1) {
      processQueue();
    }
  } catch (err) {
    log(
      `Error cuando @${interaction.user.username} intentó registrar un walias - Código de error ${err.code} Mensaje: ${err.message}`,
      "err"
    );
    EphemeralMessageResponse(
      interaction,
      "Ocurrió un error al registrar el walias"
    );
  }
};

export { customId, invoke };
