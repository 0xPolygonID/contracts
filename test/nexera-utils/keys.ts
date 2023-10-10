import eccrypto from "eccrypto";

export const generateRandomKey = () => {
  const privateKey = eccrypto.generatePrivate();
  const publicKey = eccrypto.getPublic(Buffer.from(privateKey));
  return { privateKey, publicKey };
};
