import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import { StateDeployHelper } from "../test/helpers/StateDeployHelper";
const pathOutputJson = path.join(__dirname, "./deploy_validator_output.json");

async function main() {
  const validatorContractAddress = "0x3DcAe4c8d94359D31e4C89D7F2b944859408C618"; // mumbai
  const validatorContractName = "CredentialAtomicQueryMTPValidator";

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
