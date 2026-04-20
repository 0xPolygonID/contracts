import hre, { ethers } from 'hardhat';
import { packV3ValidatorParams } from '../test/utils/pack-utils';
import { Blockchain, DID, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { coreSchemaFromStr, getChainId } from '../test/utils/utils';
import {
  buildVerifierId,
  calculateQueryHashV3,
  calculateRequestId,
  CircuitId
} from '@0xpolygonid/js-sdk';
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
  // current v3 stable validator unified address
  const validatorAddressV3 = '0x0d78ADDD050a75a94e21eD14d54591933B9B7546';
  const erc20verifierAddress = '0x30c4dfC99CF5e9dFD9053faDd86E087cB06d589B'; //your erc20 verifier deployed address
  const verifierLibAddress = '0xdaC4f3e3174Ce82909FA109de8307F8C3aed1453'; // verifier lib deployed address
  const owner = (await ethers.getSigners())[0];

  const ERC20Verifier = await ethers.getContractFactory('ERC20SelectiveDisclosureVerifier', {
    libraries: {
      VerifierLib: verifierLibAddress
    }
  });
  const erc20Verifier = await ERC20Verifier.attach(erc20verifierAddress); // current mtp validator address on mumbai
  console.log(`ERC20Verifier attached to: ${await erc20Verifier.getAddress()}`);

  const type = 'KYCAgeCredential';

  const queryHash = '';
  const circuitIds = [CircuitId.AtomicQueryV3OnChainStable];
  const skipClaimRevocationCheck = false;
  const allowedIssuers = [];
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

  const chainId = await getChainId();

  const network = hre.network.name;

  const verifierId = buildVerifierId(await erc20Verifier.getAddress(), {
    blockchain: Blockchain.Privado,
    networkId: NetworkId.Main,
    method: DidMethod.Iden3
  });

  console.log(verifierId.bigInt());
  const ageQueries: any = [
    // EQ
    {
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
      const data = packV3ValidatorParams(query);
      const requestId = calculateRequestId(data, await owner.getAddress());
      query.requestId = requestId;
      console.log(query.requestId);

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
              circuitId: CircuitId.AtomicQueryV3OnChainStable,
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

      // console.log('Invoke Request Metadata:', invokeRequestMetadata);
      const tx = await erc20Verifier.setRequests([
        {
          requestId: requestId.toString(),
          metadata: JSON.stringify(invokeRequestMetadata, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v
          ),
          validator: validatorAddressV3,
          creator: await owner.getAddress(),
          params: data
        }
      ]);
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
