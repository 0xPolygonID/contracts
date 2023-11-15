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
  NE: 6 // not equal
};

export const QueryOperators = {
  $noop: Operators.NOOP,
  $eq: Operators.EQ,
  $lt: Operators.LT,
  $gt: Operators.GT,
  $in: Operators.IN,
  $nin: Operators.NIN,
  $ne: Operators.NE
};

async function main() {
  // sig:validator:    // current sig validator address on mumbai
  const validatorAddressSig = '0x2b098c24Db48C84426967cdDF8CD235087CdA315';

  // mtp:validator:    // current mtp validator address on mumbai
  const validatorAddressMTP = '0x4332C2F58dcAAb0cC4d264fb0022aC1fE3D6Fe9d';

  const erc20verifierAddress = '0xeDB5a9231D87040Cf1d0c308f87281bC73176984'; //with sig    validatorc

  const owner = (await ethers.getSigners())[0];

  const ERC20Verifier = await ethers.getContractFactory('ERC20Verifier');
  const erc20Verifier = await ERC20Verifier.attach(erc20verifierAddress); // current mtp validator address on mumbai

  // await erc20Verifier.deployed();
  console.log(erc20Verifier, ' attached to:', erc20Verifier.address);
  const schema = '74977327600848231385663280181476307657';

  // set default query
  const circuitIdSig = 'credentialAtomicQuerySigV2OnChain';
  const circuitIdMTP = 'credentialAtomicQueryMTPV2OnChain';

  const schemaUrl =
    'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
  const type = 'KYCAgeCredential';
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';

  // set default query

  const slotIndex = 0;
  const queryHash = '';
  const circuitIds = [circuitIdSig];
  const skipClaimRevocationCheck = false;
  const allowedIssuers = [];
  const ageQueries = [
    // EQ
    {
      requestId: 100,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 1,
      value: [19960424, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    //     // LT
    {
      requestId: 200,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 2,
      value: [20020101, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // GT
    {
      requestId: 300,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 3,
      value: [500, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // IN
    {
      requestId: 400,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 4,
      value: [...new Array(63).fill(0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // NIN
    {
      requestId: 500,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 5,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // NE
    {
      requestId: 600,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 6,
      value: [500, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // EQ (corner)

    {
      requestId: 150,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 1,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },

    // LT
    {
      requestId: 250,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 2,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // GT
    {
      requestId: 350,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 3,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // IN corner

    {
      requestId: 450,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 4,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // NIN corner
    {
      requestId: 550,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 5,
      value: [...new Array(63).fill(0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
    },
    // NE corner
    {
      requestId: 650,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: 6,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck
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
        0
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
              circuitId: circuitIdSig,
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
        validator: validatorAddressSig,
        data: packValidatorParams(query)
      });

      console.log(tx.hash);
      await tx.wait();

      query.circuitIds = [circuitIdMTP];
      query.requestId = query.requestId + 1000;
      console.log(query.requestId);

      invokeRequestMetadata.body.scope[0].circuitId = circuitIdMTP;
      invokeRequestMetadata.body.scope[0].id = query.requestId;
      // mtp request set
      const txMtp = await erc20Verifier.setZKPRequest(query.requestId, {
        metadata: JSON.stringify(invokeRequestMetadata),
        validator: validatorAddressMTP,
        data: packValidatorParams(query)
      });
      console.log(txMtp.hash);
      await txMtp.wait();
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
