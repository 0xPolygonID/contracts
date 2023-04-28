import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
const pathOutputJson = path.join(__dirname, "./deploy_validator_output.json");

async function main() {
  const stateAddress = "0x624ce98D2d27b20b8f8d521723Df8fC4db71D79D"; // current iden3 state smart contract on main
  // const stateAddress = "0x134b1be34911e39a8397ec6289782989729807a4"; // current iden3 state smart contract on mumbai
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
