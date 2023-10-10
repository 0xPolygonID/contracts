import { ethers } from "hardhat";

export const getUserAddress = async () => {
  const [user1] = await ethers.getSigners();
  return await user1.getAddress();
};

export const getSigner1 = async () => {
  const [user1] = await ethers.getSigners();
  return user1;
};
