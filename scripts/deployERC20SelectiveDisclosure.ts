import { ethers } from 'hardhat';
import { packV3ValidatorParams } from '../test/utils/pack-utils';
import { calculateQueryHash, buildVerifierId } from '../test/utils/utils';
import { ChainIds, DidMethod } from '@iden3/js-iden3-core';

const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6, // not equal
  SD: 16 // selective disclosure
};

async function main() {
  // you can run https://go.dev/play/p/3id7HAhf-Wi  to get schema hash and claimPathKey using YOUR schema
  const schema = '74977327600848231385663280181476307657';
  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaUrl =
    'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
  const type = 'KYCAgeCredential';
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';
  const value = [0, ...new Array(63).fill(0)];
  const slotIndex = 0; // because schema  is merklized for merklized credential, otherwise you should actual put slot index  https://docs.iden3.io/protocol/non-merklized/#motivation

  const contractName = 'ERC20SelectiveDisclosureVerifier';
  const name = 'ERC20SelectiveDisclosureVerifier';
  const symbol = 'ERCZKP';
  const ERC20ContractFactory = await ethers.getContractFactory(contractName);
  const erc20instance = await ERC20ContractFactory.deploy(name, symbol);
  const claimPathDoesntExist = 0; // 0 for inclusion (merklized credentials) - 1 for non-merklized

  await erc20instance.deployed();
  console.log(contractName, ' deployed to:', erc20instance.address);

  // set default query
  const circuitIdV3 = 'credentialAtomicQueryV3OnChain-beta.0';

  // current v3 validator address on mumbai
  const validatorAddressV3 = '0xCBde9B14fcF5d56B709234528C44798B4ea64761';

  const chainId = 80001;

  const network = 'polygon-mumbai';

  const networkFlag = Object.keys(ChainIds).find((key) => ChainIds[key] === chainId);

  if (!networkFlag) {
    throw new Error(`Invalid chain id ${chainId}`);
  }
  const [blockchain, networkId] = networkFlag.split(':');

  const id = buildVerifierId(erc20instance.address, {
    blockchain,
    networkId,
    method: DidMethod.Iden3
  });

  console.log('verifier id = ' + id.bigInt().toString())

  // current v3 validator address on main
  // const validatorAddressV3 = '';

  // const network = 'polygon-main';
  //
  // const chainId = 137;
  const query = {
    schema: schema,
    claimPathKey: schemaClaimPathKey,
    operator: Operators.SD,
    slotIndex: slotIndex,
    value: value,
    queryHash: calculateQueryHash(
      value,
      schema,
      slotIndex,
      Operators.SD,
      schemaClaimPathKey,
      claimPathDoesntExist
    ).toString(),
    circuitIds: [circuitIdV3],
    allowedIssuers: [],
    skipClaimRevocationCheck: false,
    claimPathNotExists: claimPathDoesntExist,
    nullifierSessionID: 0,
    verifierID: id.bigInt().toString(),
    groupID: 0,
    proofType: 1
  };

  const requestIdV3 = await erc20instance.TRANSFER_REQUEST_ID_V3_VALIDATOR();

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
        chain_id: chainId,
        network: network
      },
      scope: [
        {
          id: requestIdV3,
          circuitId: circuitIdV3,
          query: {
            allowedIssuers: ['*'],
            context: schemaUrl,
            credentialSubject: {
              birthday: {}
            },
            type: type,
          },
        }
      ]
    }
  };

  try {
    // v3 request set
    const txV3 = await erc20instance.setZKPRequest(requestIdV3, {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: validatorAddressV3,
      data: packV3ValidatorParams(query)
    });

    console.log(txV3.hash);
    await txV3.wait();
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
