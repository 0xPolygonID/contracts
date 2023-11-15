import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { packValidatorParams } from '../test/utils/pack-utils';
import { calculateQueryHash } from '../test/utils/utils';
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
  const schema = '74977327600848231385663280181476307657';
  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaUrl =
    'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
  const type = 'KYCAgeCredential';
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';
  const value = [20020101, ...new Array(63).fill(0)];
  const slotIndex = 0; // because schema  is merklized for merklized credential, otherwise you should actual put slot index  https://docs.iden3.io/protocol/non-merklized/#motivation

  const contractName = 'ERC20Verifier';
  const name = 'ERC20ZKPVerifier';
  const symbol = 'ERCZKP';
  const ERC20ContractFactory = await ethers.getContractFactory(contractName);
  const erc20instance = await ERC20ContractFactory.deploy(name, symbol);

  await erc20instance.deployed();
  console.log(contractName, ' deployed to:', erc20instance.address);

  // set default query
  const circuitIdSig = 'credentialAtomicQuerySigV2OnChain';
  const circuitIdMTP = 'credentialAtomicQueryMTPV2OnChain';

  // sig:validator:    // current sig validator address on mumbai
  const validatorAddressSig = '0xB574207F445507016C4b176A92A74b9ecf3CA11b';

  // mtp:validator:    // current mtp validator address on mumbai
  const validatorAddressMTP = '0xf43Ace301b6b29b7FFEE786335ef25ce1dfa1a0A';

  const query = {
    schema: schema,
    claimPathKey: schemaClaimPathKey,
    operator: Operators.LT,
    slotIndex: slotIndex,
    value: value,
    queryHash: calculateQueryHash(
      value,
      schema,
      slotIndex,
      Operators.LT,
      schemaClaimPathKey,
      0 // 0 for inclusion (merklized credentials) - 1 for non-merklized
    ).toString(),
    circuitIds: [circuitIdSig],
    allowedIssuers: [],
    skipClaimRevocationCheck: false
  };

  const requestIdSig = await erc20instance.TRANSFER_REQUEST_ID_SIG_VALIDATOR();
  const requestIdMtp = await erc20instance.TRANSFER_REQUEST_ID_MTP_VALIDATOR();

  const invokeRequestMetadata = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    body: {
      reason: 'for testing',
      transaction_data: {
        contract_address: erc20instance.address,
        method_id: 'b68967e2',
        chain_id: 80001,
        network: 'polygon-mumbai'
      },
      scope: [
        {
          id: requestIdSig,
          circuitId: circuitIdSig,
          query: {
            allowedIssuers: ['*'],
            context: schemaUrl,
            credentialSubject: {
              birthday: {
                $lt: value[0]
              }
            },
            type: type
          }
        }
      ]
    }
  };

  try {
    // sig request set
    const txSig = await erc20instance.setZKPRequest(requestIdSig, {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: validatorAddressSig,
      data: packValidatorParams(query)
    });

    query.circuitIds = [circuitIdMTP];
    invokeRequestMetadata.body.scope[0].circuitId = circuitIdMTP;
    invokeRequestMetadata.body.scope[0].id = requestIdMtp;

    // mtp request set
    const txMtp = await erc20instance.setZKPRequest(requestIdMtp, {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: validatorAddressMTP,
      data: packValidatorParams(query)
    });
  } catch (e) {
    console.log('error: ', e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
