import { ethers, run, upgrades } from 'hardhat';
import fs from 'fs';
import path from 'path';
const pathOutputJson = path.join(__dirname, './deploy_validator_output.json');

async function main() {
  // const stateAddress = '0x624ce98D2d27b20b8f8d521723Df8fC4db71D79D'; // current iden3 state smart contract on main
  // const stateAddress = '0x134b1be34911e39a8397ec6289782989729807a4'; // current iden3 state smart contract on mumbai
  // const stateAddress = '0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124'; // current iden3 state smart contract on amoy testnet
  const stateAddress = '0xD8869a439a07Edcc990F8f21E638702ee9273293'; // curren iden3 readonly only state smart contract on linea sepolia

  const verifierContractWrapperName = 'VerifierV3Wrapper';
  const validatorContractName = 'CredentialAtomicQueryV3Validator';
  const VerifierSigWrapper = await ethers.getContractFactory(verifierContractWrapperName);
  const verifierWrapper = await VerifierSigWrapper.deploy();

  await verifierWrapper.waitForDeployment();
  console.log(verifierContractWrapperName, ' deployed to:', await verifierWrapper.getAddress());

  await run("verify:verify", {
    address: await verifierWrapper.getAddress(),
    constructorArguments: [],
  });

  const CredentialAtomicQueryValidator = await ethers.getContractFactory(validatorContractName);

  const CredentialAtomicQueryValidatorProxy = await upgrades.deployProxy(
    CredentialAtomicQueryValidator,
    [await verifierWrapper.getAddress(), stateAddress] // current state address on mumbai
  );

  await CredentialAtomicQueryValidatorProxy.waitForDeployment();
  console.log(
    validatorContractName,
    ' deployed to:',
    await CredentialAtomicQueryValidatorProxy.getAddress()
  );

  await run("verify:verify", {
    address: await CredentialAtomicQueryValidatorProxy.getAddress(),
    constructorArguments: [],
  });

  const outputJson = {
    verifierContractWrapperName,
    validatorContractName,
    validator: await CredentialAtomicQueryValidatorProxy.getAddress(),
    verifier: await verifierWrapper.getAddress(),
    network: process.env.HARDHAT_NETWORK
  };
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
