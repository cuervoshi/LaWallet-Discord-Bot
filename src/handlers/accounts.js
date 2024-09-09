import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import AccountModel from "../schemas/AccountSchema.js";
import { createFederationConfig, Wallet } from "@lawallet/sdk";
import { decryptData, encryptData } from "../utils/crypto.js";
import { connectedNdk } from "../../Bot.js";

const SALT = process.env.SALT ?? "";

const federationConfig = createFederationConfig({
  endpoints: { lightningDomain: "https://fixedsats.com" },
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
    await wallet.registerHandle(discord_username);

    return wallet;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getOrCreateAccount = async (discord_id, discord_username) => {
  try {
    const userAccount = await AccountModel.findOne({ discord_id });
    if (userAccount)
      return new Wallet({
        signer: new NDKPrivateKeySigner(decryptData(userAccount.sk, SALT)),
        ndk: connectedNdk,
        federationConfig,
      });

    const createdAccount = createAccount(discord_id, discord_username);
    return createdAccount;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export { createAccount, getOrCreateAccount };
