import { ethers, upgrades } from 'hardhat';
import fs from 'fs';
import path from 'path';
const pathOutputJson = path.join(__dirname, './deploy_validator_output.json');

async function main() {
  const stateAddress = '0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896'; // current iden3 state smart contract on the network you want to deploy the identity contract to
  const [signer] = await ethers.getSigners();

  const groth16VerifierContractWrapperName = 'Groth16VerifierMTPWrapper';
  const validatorContractName = 'CredentialAtomicQueryMTPV2Validator';
  const Groth16VerifierMTPWrapper = await ethers.getContractFactory(
    groth16VerifierContractWrapperName
  );
  const verifierWrapper = await Groth16VerifierMTPWrapper.deploy();

  await verifierWrapper.waitForDeployment();
  console.log(
    groth16VerifierContractWrapperName,
    ' deployed to:',
    await verifierWrapper.getAddress()
  );

  const CredentialAtomicQueryValidator = await ethers.getContractFactory(validatorContractName);

  const CredentialAtomicQueryValidatorProxy = await upgrades.deployProxy(
    CredentialAtomicQueryValidator,
    [stateAddress, await verifierWrapper.getAddress(), await signer.getAddress()]
  );

  await CredentialAtomicQueryValidatorProxy.waitForDeployment();
  console.log(
    validatorContractName,
    ' deployed to:',
    await CredentialAtomicQueryValidatorProxy.getAddress()
  );

  const outputJson = {
    groth16VerifierContractWrapperName,
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
