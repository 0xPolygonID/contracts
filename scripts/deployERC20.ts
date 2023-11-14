import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { packValidatorParams } from '../test/utils/pack-utils';
const pathOutputJson = path.join(__dirname, './deploy_erc20verifier_output.json');

const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6 // not equal
};

async function main() {
  // you can run https://go.dev/play/p/rnrRbxXTRY6 to get schema hash and claimPathKey using YOUR schema
  const schemaBigInt = '74977327600848231385663280181476307657';

  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';

  const contractName = 'ERC20Verifier';
  const name = 'ERC20ZKPVerifier';
  const symbol = 'ERCZKP';
  const ERC20ContractFactory = await ethers.getContractFactory(contractName);
  const erc20instance = await ERC20ContractFactory.deploy(name, symbol);

  await erc20instance.deployed();
  console.log(contractName, ' deployed to:', erc20instance.address);

  // set default query
  const circuitId = 'credentialAtomicQueryMTPV2OnChain'; //"credentialAtomicQuerySigV2OnChain";

  // mtp:validator: 0xf43Ace301b6b29b7FFEE786335ef25ce1dfa1a0A   // current mtp validator address on mumbai
  // sig:validator: 0xB574207F445507016C4b176A92A74b9ecf3CA11b   // current sig validator address on mumbai

  // mtp:validator:    // current mtp validator address on main
  // sig:validator:    // current sig validator address on main
  const validatorAddress = '0xf43Ace301b6b29b7FFEE786335ef25ce1dfa1a0A';



  const query = {
    schema: ethers.BigNumber.from(schemaBigInt),
    claimPathKey: ethers.BigNumber.from(schemaClaimPathKey),
    operator: ethers.BigNumber.from(Operators.LT),
    slotIndex: ethers.BigNumber.from(0),
    value: [
      ethers.BigNumber.from('20020101'),
      ...new Array(63).fill('0').map((x) => ethers.BigNumber.from(x))
    ],
    queryHash: ethers.BigNumber.from(
      '1496222740463292783938163206931059379817846775593932664024082849882751356658'
    ),
    circuitIds: [circuitId],
    allowedIssuers: [],
    skipClaimRevocationCheck: false
  };
  const requestId = await erc20instance.TRANSFER_REQUEST_ID();

  const invokeRequestMetadata = {
    "id": "7f38a193-0918-4a48-9fac-36adfdb8b542",
    "typ": "application/iden3comm-plain-json",
    "type": "https://iden3-communication.io/proofs/1.0/contract-invoke-request",
    "thid": "7f38a193-0918-4a48-9fac-36adfdb8b542",
    "body": {
      "reason": "for testing",
      "transaction_data": {
        "contract_address": erc20instance.address ,
        "method_id": "b68967e2",
        "chain_id": 80001,
        "network": "polygon-mumbai"
      },
      "scope": [
        {
          "id": requestId,
          "circuitId": circuitId,
          "query": {
            "allowedIssuers": [
              "*"
            ],
            "context": "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
            "credentialSubject": {
              "birthday": {
                "$lt": 20020101
              }
            },
            "type": "KYCAgeCredential"
          }
        }
      ]
    }
  }


  try {
    let tx = await erc20instance.setZKPRequest(requestId, {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: validatorAddress,
      data: packValidatorParams(query)
    });
    console.log(tx.hash);
  } catch (e) {
    console.log('error: ', e);
  }

  const outputJson = {
    circuitId,
    token: erc20instance.address,
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
