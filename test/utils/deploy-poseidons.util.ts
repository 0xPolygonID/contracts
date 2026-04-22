import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { poseidonContract } from 'circomlibjs';
import { Contract } from 'ethers';
import { contractsInfo } from '../helpers/constants';

export async function deployPoseidons(
  deployer: SignerWithAddress,
  poseidonSizeParams: number[]
): Promise<Contract[]> {
  poseidonSizeParams.forEach((size) => {
    if (![1, 2, 3, 4, 5, 6].includes(size)) {
      throw new Error(
        `Poseidon should be integer in a range 1..6. Poseidon size provided: ${size}`
      );
    }
  });

  const deployPoseidon = async (params: number) => {
    const abi = poseidonContract.generateABI(params);
    const code = poseidonContract.createCode(params);
    const PoseidonElements = new ethers.ContractFactory(abi, code, deployer);
    const poseidonElements = await PoseidonElements.deploy();
    await poseidonElements.waitForDeployment();
    console.log(`Poseidon${params}Elements deployed to:`, await poseidonElements.getAddress());
    return poseidonElements;
  };

  const result: Contract[] = [];
  for (const size of poseidonSizeParams) {
    result.push(await deployPoseidon(size));
  }

  return result;
}

export async function getPoseidonsUnifiedAddresses(
  deployer: SignerWithAddress,
  poseidonSizeParams: number[]
): Promise<Contract[]> {
  poseidonSizeParams.forEach((size) => {
    if (![1, 2, 3, 4].includes(size)) {
      throw new Error(
        `Poseidon should be integer in a range 1..4. Poseidon size provided: ${size}`
      );
    }
  });

  const getPoseidon = async (params: number) => {
    const abi = poseidonContract.generateABI(params);
    switch (params) {
      case 1:
        return new ethers.Contract(contractsInfo.POSEIDON_1.unifiedAddress, abi, deployer);
      case 2:
        return new ethers.Contract(contractsInfo.POSEIDON_2.unifiedAddress, abi, deployer);
      case 3:
        return new ethers.Contract(contractsInfo.POSEIDON_3.unifiedAddress, abi, deployer);
      case 4:
        return new ethers.Contract(contractsInfo.POSEIDON_4.unifiedAddress, abi, deployer);
      default:
        throw new Error(`Unsupported Poseidon size: ${params}`);
    }
  };

  const result: Contract[] = [];
  for (const size of poseidonSizeParams) {
    result.push(await getPoseidon(size));
  }

  return result;
}
