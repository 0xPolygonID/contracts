import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import {deployPoseidons, deploySpongePoseidon} from "../test/utils/deploy-poseidons.util";
const pathOutputJson = path.join(
  __dirname,
  "./deploy_erc20verifier_output.json"
);


const Operators = {
  NOOP : 0, // No operation, skip query verification in circuit
  EQ : 1, // equal
  LT : 2, // less than
  GT : 3, // greater than
  IN : 4, // in
  NIN : 5, // not in
  NE : 6   // not equal
}

async function main() {

// you can run https://go.dev/play/p/rnrRbxXTRY6 to get schema hash and claimPathKey using YOUR schema
  const schemaBigInt = "74977327600848231385663280181476307657"

  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaClaimPathKey = "20376033832371109177683048456014525905119173674985843915445634726167450989630"


  const owner = (await ethers.getSigners())[0];

  // const [poseidon6Contract] = await deployPoseidons(owner, [6]);
  //
  // const spongePoseidon = await deploySpongePoseidon(poseidon6Contract.address);


  // console.log("poseidon6:",poseidon6Contract.address);
  // console.log("spongePoseidon:",spongePoseidon.address);

  const contractName ="ERC20Verifier"
  const name = "ERC20ZKPVerifier";
  const symbol = "ERCZKP";
  const ERC20ContractFactory = await ethers.getContractFactory(contractName,{
    libraries: {
      SpongePoseidon: "0xD1d3e0524E676afe079D0b2acE58ec7aB4ddE11f",
      PoseidonUnit6L: "0xa39f0793BB43cE04d64C4EdE16cc737bfBb4E1ce"
    },
  } );
  const erc20instance = await ERC20ContractFactory.deploy(
    name,
    symbol
  );

  await erc20instance.deployed();
  console.log(contractName, " deployed to:", erc20instance.address);

  // set default query
  const circuitId = "credentialAtomicQuerySigV2OnChain"; //"credentialAtomicQuerySigV2OnChain";

  // mtp:validator: 0x3DcAe4c8d94359D31e4C89D7F2b944859408C618   // current mtp validator address on mumbai
  // sig:validator: 0xF2D4Eeb4d455fb673104902282Ce68B9ce4Ac450   // current sig validator address on mumbai

  // mtp:validator: 0x5f24dD9FbEa358B9dD96daA281e82160fdefD3CD   // current mtp validator address on main
  // sig:validator: 0x9ee6a2682Caa2E0AC99dA46afb88Ad7e6A58Cd1b   // current sig validator address on main
  const validatorAddress = "0x9ee6a2682Caa2E0AC99dA46afb88Ad7e6A58Cd1b";


  const query = {
    requestId: 1,
    schema: schemaBigInt,
    claimPathKey  : schemaClaimPathKey,
    operator: Operators.LT, // operator
    value: [20020101, ...new Array(63).fill(0).map(i => 0)], // for operators 1-3 only first value matters
  };

  const requestId = await erc20instance.TRANSFER_REQUEST_ID();
  try {
    let tx = await erc20instance.setZKPRequest(
        requestId,
        validatorAddress,
        query.schema,
        query.claimPathKey,
        query.operator,
        query.value,
    );
    console.log(tx.hash);
  } catch (e) {
    console.log("error: ", e);
  }

  const outputJson = {
    circuitId,
    token: erc20instance.address,
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
