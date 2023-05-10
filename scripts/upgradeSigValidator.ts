import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import { StateDeployHelper } from "../test/helpers/StateDeployHelper";
const pathOutputJson = path.join(__dirname, "./deploy_validator_output.json");

async function main() {
  const validatorContractAddress = "0xF2D4Eeb4d455fb673104902282Ce68B9ce4Ac450"; // mumbai
  const validatorContractName = "CredentialAtomicQuerySigValidator";

  const stateDeployHelper = await StateDeployHelper.initialize();

  const v = await stateDeployHelper.upgradeValidator(
    validatorContractAddress,
    validatorContractName
  );
  console.log(
    validatorContractName,
    "validator upgraded on ",
    v.validator.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
