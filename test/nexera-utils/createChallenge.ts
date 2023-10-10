import { ethers } from "hardhat";

export const createChallenge = async () => {
  // Create challenge for the request
  const [addr1] = await ethers.getSigners();
  let address: string = await addr1.getAddress();
  const swappedHex = Buffer.from(address.substring(2), "hex")
    .reverse()
    .toString("hex");
  const challenge = BigInt("0x" + swappedHex);
  return {
    challenge,
    address,
  };
};
