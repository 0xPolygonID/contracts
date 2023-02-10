import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
const pathOutputJson = path.join(__dirname, "./deploy_validator_output.json");

async function main() {
  const stateAddress = "0x134B1BE34911E39A8397ec6289782989729807a4";
  const verifierContractWrapperName = "VerifierMTPWrapper";
  const validatorContractName = "CredentialAtomicQueryMTPValidator";
  const VerifierMTPWrapper = await ethers.getContractFactory(
    verifierContractWrapperName
  );
  const verifierWrapper = await VerifierMTPWrapper.deploy();

  await verifierWrapper.deployed();
  console.log(
    verifierContractWrapperName,
    " deployed to:",
    verifierWrapper.address
  );

  const CredentialAtomicQueryValidator = await ethers.getContractFactory(
    validatorContractName
  );

  const CredentialAtomicQueryValidatorProxy = await upgrades.deployProxy(
    CredentialAtomicQueryValidator,
    [verifierWrapper.address, stateAddress] // current state address on mumbai
  );

  await CredentialAtomicQueryValidatorProxy.deployed();
  console.log(
    validatorContractName,
    " deployed to:",
    CredentialAtomicQueryValidatorProxy.address
  );

  const outputJson = {
    verifierContractWrapperName,
    validatorContractName,
    validator: CredentialAtomicQueryValidatorProxy.address,
    verifier: verifierWrapper.address,
    network: process.env.HARDHAT_NETWORK,
  };
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
