import { ethers } from 'hardhat';
import { packValidatorParams } from '../test/utils/pack-utils';
import { calculateQueryHash } from '../test/utils/utils';
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

export const QueryOperators = {
  $noop: Operators.NOOP,
  $eq: Operators.EQ,
  $lt: Operators.LT,
  $gt: Operators.GT,
  $in: Operators.IN,
  $nin: Operators.NIN,
  $ne: Operators.NE,
  $sd: Operators.SD
};

async function main() {
  // current v3 validator address on mumbai
  const validatorAddressV3 = '0xCBde9B14fcF5d56B709234528C44798B4ea64761';

  const erc20verifierAddress = '0xD0Fd3E9fDF448e5B86Cc0f73E5Ee7D2F284884c0'; //with sig    validatorc

  const owner = (await ethers.getSigners())[0];

  const ERC20Verifier = await ethers.getContractFactory('ERC20SelectiveDisclosureVerifier');
  const erc20Verifier = await ERC20Verifier.attach(erc20verifierAddress); // current mtp validator address on mumbai

  // await erc20Verifier.deployed();
  console.log(erc20Verifier, ' attached to:', erc20Verifier.address);

  // set default query
  const circuitIdV3 = 'credentialAtomicQueryV3OnChain-beta.0';

  const type = 'KYCAgeCredential';

  const queryHash = '';
  const circuitIds = [circuitIdV3];
  const skipClaimRevocationCheck = false;
  const allowedIssuers = [];
  const schemaUrl =
    'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
  const schema = '74977327600848231385663280181476307657';
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';
  const slotIndex = 0;
  const claimPathDoesntExist = 0;
  const requestIdModifier = 1;

  // you can run https://go.dev/play/p/3id7HAhf-Wi to get schema hash and claimPathKey using YOUR schema

  // init these values for non-merklized credential use case
  // const schemaUrl =
  //   'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-nonmerklized.jsonld';
  // const schemaClaimPathKey = '0';
  // const slotIndex = 2;
  // const claimPathDoesntExist = 1;
  // const schema = '198285726510688200335207273836123338699';
  // const requestIdModifier = 100;

  const ageQueries = [
    // EQ
    {
      requestId: 100 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 1,
      value: [19960424, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    //     // LT
    {
      requestId: 200 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 2,
      value: [20020101, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // GT
    {
      requestId: 300 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 3,
      value: [500, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // IN
    {
      requestId: 400 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 4,
      value: [...new Array(63).fill(0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // NIN
    {
      requestId: 500 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 5,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // NE
    {
      requestId: 600 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 6,
      value: [500, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // EQ (corner)

    {
      requestId: 150 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 1,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },

    // LT
    {
      requestId: 250 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 2,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // GT
    {
      requestId: 350 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 3,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // IN corner

    {
      requestId: 450 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 4,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // NIN corner
    {
      requestId: 550 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 5,
      value: [...new Array(63).fill(0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    },
    // NE corner
    {
      requestId: 650 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 6,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      claimPathNotExists: claimPathDoesntExist
    }
  ];

  try {
    for (let i = 0; i < ageQueries.length; i++) {
      const query = ageQueries[i];
      console.log(query.requestId);

      const operatorKey =
        Object.keys(QueryOperators)[Object.values(QueryOperators).indexOf(query.operator)];

      query.queryHash = calculateQueryHash(
        query.value,
        query.schema,
        query.slotIndex,
        query.operator,
        query.claimPathKey,
        claimPathDoesntExist
      ).toString();

      const invokeRequestMetadata = {
        id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
        typ: 'application/iden3comm-plain-json',
        type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
        thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
        body: {
          reason: 'for testing',
          transaction_data: {
            contract_address: erc20verifierAddress,
            method_id: 'b68967e2',
            chain_id: 80001,
            network: 'polygon-mumbai'
          },
          scope: [
            {
              id: query.requestId,
              circuitId: circuitIdV3,
              query: {
                allowedIssuers: ['*'],
                context: schemaUrl,
                credentialSubject: {
                  birthday: {
                    [operatorKey]:
                      query.operator === Operators.IN || query.operator === Operators.NIN
                        ? query.value
                        : query.value[0]
                  }
                },
                type: type
              }
            }
          ]
        }
      };

      const tx = await erc20Verifier.setZKPRequest(query.requestId, {
        metadata: JSON.stringify(invokeRequestMetadata),
        validator: validatorAddressV3,
        data: packValidatorParams(query)
      });

      console.log(tx.hash);
      await tx.wait();
    }
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
