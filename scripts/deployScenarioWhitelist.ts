import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import {
  deployPoseidons,
  deploySpongePoseidon,
} from "../test/utils/deploy-poseidons.util";
import { generateRequestData } from "./generateRequestData";
const pathOutputJson = path.join(
  __dirname,
  "./deploy_erc20verifier_output.json"
);

const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6, // not equal
};

export const getIDScanRequest = async () => {
  const schemaQueryParameters = {
    credentialType: "IDScan" as "IDScan",
    operator: Operators.GT,
    value: 18,
    fieldName: "age",
  };
  const requestData = await generateRequestData(
    schemaQueryParameters.credentialType,
    schemaQueryParameters.fieldName,
    schemaQueryParameters.value
  );
  return {
    schema: requestData.schemaHash,
    claimPathKey: requestData.schemaClaimPathKey,
    operator: schemaQueryParameters.operator, // operator
    value: [requestData.formatedValue, ...new Array(63).fill(0).map((i) => 0)], // for operators 1-3 only first value matters
  };
};

export const getProofOfResidenceScanRequest = async () => {
  const schemaQueryParameters = {
    credentialType: "ProofOfResidence" as "ProofOfResidence",
    operator: Operators.NE,
    value: "USA",
    fieldName: "country",
  };
  const requestData = await generateRequestData(
    schemaQueryParameters.credentialType,
    schemaQueryParameters.fieldName,
    schemaQueryParameters.value
  );
  return {
    schema: requestData.schemaHash,
    claimPathKey: requestData.schemaClaimPathKey,
    operator: schemaQueryParameters.operator, // operator
    value: [requestData.formatedValue, ...new Array(63).fill(0).map((i) => 0)], // for operators 1-3 only first value matters
  };
};

async function main() {
  // you can run https://go.dev/play/p/rnrRbxXTRY6 to get schema hash and claimPathKey using YOUR schema
  const schemaBigInt = "74977327600848231385663280181476307657";

  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaClaimPathKey =
    "20376033832371109177683048456014525905119173674985843915445634726167450989630";

  const owner = (await ethers.getSigners())[0];

  // const [poseidon6Contract] = await deployPoseidons(owner, [6]);

  // const spongePoseidon = await deploySpongePoseidon(poseidon6Contract.address);

  // console.log("poseidon6:",poseidon6Contract.address);
  // console.log("spongePoseidon:",spongePoseidon.address);

  const contractName = "ScenarioWhitelist";
  //const name = "ScenarioWhitelist";
  //const symbol = "ERCZKP";
  const ScenarioWhitelistFactory = await ethers.getContractFactory(
    contractName,
    {
      libraries: {
        PoseidonFacade: "0xD65f5Fc521C4296723c6Eb16723A8171dCC12FB0",
      },
    }
  );
  const scenarioWhitelistInstance = await ScenarioWhitelistFactory.deploy();

  await scenarioWhitelistInstance.deployed();
  console.log(contractName, " deployed to:", scenarioWhitelistInstance.address);

  // set default query
  const circuitId = "credentialAtomicQuerySigV2OnChain"; //"credentialAtomicQuerySigV2OnChain";

  // mtp:validator: 0x3DcAe4c8d94359D31e4C89D7F2b944859408C618   // current mtp validator address on mumbai
  // sig:validator: 0xF2D4Eeb4d455fb673104902282Ce68B9ce4Ac450   // current sig validator address on mumbai

  // mtp:validator: 0x5f24dD9FbEa358B9dD96daA281e82160fdefD3CD   // current mtp validator address on main
  // sig:validator: 0x9ee6a2682Caa2E0AC99dA46afb88Ad7e6A58Cd1b   // current sig validator address on main
  const validatorAddress = "0xF2D4Eeb4d455fb673104902282Ce68B9ce4Ac450";

  const query = {
    requestId: 1,
    schema: schemaBigInt,
    claimPathKey: schemaClaimPathKey,
    operator: Operators.LT, // operator
    value: [20020101, ...new Array(63).fill(0).map((i) => 0)], // for operators 1-3 only first value matters
  };

  //const requestId = await scenarioWhitelistInstance.TRANSFER_REQUEST_ID();
  try {
    const idScanRequest = await getIDScanRequest();
    await scenarioWhitelistInstance.setZKPRequest(
      1,
      validatorAddress,
      idScanRequest.schema,
      idScanRequest.claimPathKey,
      idScanRequest.operator,
      idScanRequest.value
    );
    console.log("Request set for IDScan");

    const proofOfResidenceRequest = await getProofOfResidenceScanRequest();
    let tx = await scenarioWhitelistInstance.setZKPRequest(
      2,
      validatorAddress,
      proofOfResidenceRequest.schema,
      proofOfResidenceRequest.claimPathKey,
      proofOfResidenceRequest.operator,
      proofOfResidenceRequest.value
    );
    console.log("Request set for Proof Of Residence");
    // let tx = await scenarioWhitelistInstance.setZKPRequest(
    //   requestId,
    //   validatorAddress,
    //   query.schema,
    //   query.claimPathKey,
    //   query.operator,
    //   query.value
    // );
    console.log(tx.hash);
  } catch (e) {
    console.log("error: ", e);
  }

  const outputJson = {
    circuitId,
    token: scenarioWhitelistInstance.address,
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
