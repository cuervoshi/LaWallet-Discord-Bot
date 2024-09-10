import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import AccountModel from "../schemas/AccountSchema.js";
import { createFederationConfig, Wallet } from "@lawallet/sdk";
import { decryptData, encryptData } from "../utils/crypto.js";
import { connectedNdk } from "../../Bot.js";
import SimpleCache from "./SimpleCache.js";

const accountsCache = new SimpleCache();

const SALT = process.env.SALT ?? "";
const LW_DEFAULT_DOMAIN = "https://lawallet.ar";
export const LNDOMAIN = process.env.LIGHTNING_DOMAIN ?? LW_DEFAULT_DOMAIN;

const federationConfig = createFederationConfig({
  endpoints: { lightningDomain: LNDOMAIN },
});

const createAccount = async (discord_id, discord_username) => {
  try {
    const signer = NDKPrivateKeySigner.generate();

    const newAccount = new AccountModel({
      discord_id,
      discord_username,
      sk: encryptData(signer.privateKey, SALT),
    });

    await newAccount.save();

    const wallet = new Wallet({ signer, ndk: connectedNdk, federationConfig });
    await wallet.fetch();

    return wallet;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getOrCreateAccount = async (discord_id, discord_username) => {
  try {
    const cachedAccount = accountsCache.get(`account:${discord_id}`);
    if (cachedAccount) return cachedAccount;

    const userAccount = await AccountModel.findOne({ discord_id });
    if (userAccount) {
      const accountWallet = new Wallet({
        signer: new NDKPrivateKeySigner(decryptData(userAccount.sk, SALT)),
        ndk: connectedNdk,
        federationConfig,
      });

      await accountWallet.fetch();
      accountsCache.set(`account:${discord_id}`, accountWallet, 3600000);
      return accountWallet;
    }

    const createdAccount = createAccount(discord_id, discord_username);
    accountsCache.set(`account:${discord_id}`, createdAccount, 3600000);

    return createdAccount;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export { createAccount, getOrCreateAccount };
