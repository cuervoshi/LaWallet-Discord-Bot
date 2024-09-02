import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import AccountModel from "../schemas/AccountSchema.js";
import { Wallet } from "@lawallet/sdk";

const createAccount = async (discord_id) => {
  try {
    const signer = NDKPrivateKeySigner.generate();

    const newAccount = new AccountModel({
      discord_id,
      key: signer.privateKey,
    });

    await newAccount.save();

    return new Wallet({ signer });
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getOrCreateAccount = async (discord_id) => {
  try {
    const userAccount = await AccountModel.findOne({ discord_id });
    if (userAccount)
      return new Wallet({
        signer: new NDKPrivateKeySigner(userAccount.key),
      });

    const createdAccount = createAccount(discord_id);
    return createdAccount;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export { createAccount, getOrCreateAccount };
