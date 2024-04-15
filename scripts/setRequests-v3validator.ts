import { ethers } from 'hardhat';
import { packV3ValidatorParams } from '../test/utils/pack-utils';
import { ChainIds, DID, DidMethod } from '@iden3/js-iden3-core';
import { buildVerifierId, calculateQueryHashV3, coreSchemaFromStr } from '../test/utils/utils';
const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6, // not equal
  SD: 16, // selective disclosure
  LTE: 7, // less than equal
  GTE: 8, // greater than equal
  BETWEEN: 9, // between
  NONBETWEEN: 10, // non between
  EXISTS: 11 // exists
};

export const QueryOperators = {
  $noop: Operators.NOOP,
  $eq: Operators.EQ,
  $lt: Operators.LT,
  $gt: Operators.GT,
  $in: Operators.IN,
  $nin: Operators.NIN,
  $ne: Operators.NE,
  $sd: Operators.SD,
  $between: Operators.BETWEEN,
  $nonbetween: Operators.NONBETWEEN,
  $exists: Operators.EXISTS,
  $lte: Operators.LTE,
  $gte: Operators.GTE
};

async function main() {
  // current v3 validator address on mumbai
  // const validatorAddressV3 = '0x3412AB64acFf5d94Da4914F176A43aCbDdC7Fc4a';
  //
  // const erc20verifierAddress = '0x36eB0E70a456c310D8d8d15ae01F6D5A7C15309A';
  //
  // current v3 validator address on amoy
  const validatorAddressV3 = '0xa5f08979370AF7095cDeDb2B83425367316FAD0B';
  const erc20verifierAddress = '0xc5Cd536cb9Cc3BD24829502A39BE593354986dc4';
  const owner = (await ethers.getSigners())[0];

  const ERC20Verifier = await ethers.getContractFactory('ERC20SelectiveDisclosureVerifier');
  const erc20Verifier = await ERC20Verifier.attach(erc20verifierAddress); // current mtp validator address on mumbai
  console.log(erc20Verifier, ' attached to:', await erc20Verifier.getAddress());

  // set default query
  const circuitIdV3 = 'credentialAtomicQueryV3OnChain-beta.1';

  const type = 'KYCAgeCredential';

  const queryHash = '';
  const circuitIds = [circuitIdV3];
  const skipClaimRevocationCheck = false;
  const allowedIssuers = [];
  // const schemaUrl =
  //   'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
  // const schema = '74977327600848231385663280181476307657';
  // const schemaClaimPathKey =
  //   '20376033832371109177683048456014525905119173674985843915445634726167450989630';
  // const slotIndex = 0;
  // const merklized = 1;
  // const requestIdModifier = 1;
  const groupID = 0;
  // you can run https://go.dev/play/p/3id7HAhf-Wi to get schema hash and claimPathKey using YOUR schema
  //init these values for non-merklized credential use case
  const schemaUrl =
    'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-nonmerklized.jsonld';
  const schemaClaimPathKey = '0';
  const slotIndex = 2;
  const merklized = 0;
  const schema = '198285726510688200335207273836123338699';
  const requestIdModifier = 100;

  // you can set linked requests by changing group id

  // const groupID = 1;
  // const requestIdModifier = 10000;
  //
  // const chainId = 80001;
  //
  // const network = 'polygon-mumbai';

  const chainId = 80002;

  const network = 'polygon-amoy';

  const networkFlag = Object.keys(ChainIds).find((key) => ChainIds[key] === chainId);

  if (!networkFlag) {
    throw new Error(`Invalid chain id ${chainId}`);
  }
  const [blockchain, networkId] = networkFlag.split(':');

  const verifierId = buildVerifierId(await erc20Verifier.getAddress(), {
    blockchain,
    networkId,
    method: DidMethod.PolygonId
  });
  console.log(verifierId.bigInt());
  const ageQueries = [
    // EQ
    {
      requestId: 100 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.EQ,
      value: [19960424],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // LT
    {
      requestId: 200 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.LT,
      value: [20020101],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // GT
    {
      requestId: 300 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.GT,
      value: [500],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // IN
    {
      requestId: 400 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.IN,
      value: [...new Array(63).fill(0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // NIN
    {
      requestId: 500 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.NIN,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // NE
    {
      requestId: 600 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.NE,
      value: [500],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },

    // BETWEEN
    {
      requestId: 700 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.BETWEEN,
      value: [20000101, 20050101],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },

    // NON BETWEEN
    {
      requestId: 800 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.NONBETWEEN,
      value: [20030101, 20050101],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },

    // EXISTS
    {
      requestId: 900 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.EXISTS,
      value: [1],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // LTE
    {
      requestId: 1000 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.LTE,
      value: [20020101],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },

    // GTE
    {
      requestId: 1100 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.GTE,
      value: [20020101],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },

    // EQ (corner)

    {
      requestId: 150 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.EQ,
      value: [0],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },

    // LT
    {
      requestId: 250 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.LT,
      value: [0],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // GT
    {
      requestId: 350 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.GT,
      value: [0],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // IN corner

    {
      requestId: 450 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.IN,
      value: [0],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // NIN corner
    {
      requestId: 550 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.NIN,
      value: [...new Array(63).fill(0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    },
    // NE corner
    {
      requestId: 650 * requestIdModifier,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.NE,
      value: [0],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt().toString(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    }
  ];
  console.log(DID.parseFromId(verifierId).string());

  try {
    for (let i = 0; i < ageQueries.length; i++) {
      const query = ageQueries[i];
      console.log(query.requestId);

      const operatorKey =
        Object.keys(QueryOperators)[Object.values(QueryOperators).indexOf(query.operator)];

      const schemaHash = coreSchemaFromStr(query.schema);
      query.queryHash = calculateQueryHashV3(
        query.value.map((i) => BigInt(i)),
        schemaHash,
        query.slotIndex,
        query.operator,
        query.claimPathKey,
        query.value.length,
        merklized,
        query.skipClaimRevocationCheck ? 0 : 1,
        query.verifierID.toString(),
        query.nullifierSessionID
      ).toString();

      const invokeRequestMetadata = {
        id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
        typ: 'application/iden3comm-plain-json',
        type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
        thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
        from: DID.parseFromId(verifierId).string(),
        body: {
          reason: 'for testing',
          transaction_data: {
            contract_address: erc20verifierAddress,
            method_id: 'b68967e2',
            chain_id: chainId,
            network: network
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
        data: packV3ValidatorParams(query)
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
