import CryptoJS from "crypto-js";

export function encryptData(data, password) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), password).toString();
}

export function decryptData(cipher, password) {
  const decrypted = CryptoJS.AES.decrypt(cipher, password);
  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}
