import hre, { ethers } from 'hardhat';
import { packV2ValidatorParams } from '../test/utils/pack-utils';
import { calculateQueryHashV2, calculateRequestId, CircuitId } from '@0xpolygonid/js-sdk';
import { coreSchemaFromStr, getChainId } from '../test/utils/utils';

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
  // sig:validator:    // current sig validator unified address
  const validatorAddressSig = '0x5BD60F3Ef5890260906172EEe1f0a965707791f1';

  // mtp:validator:    // current mtp validator unified address
  const validatorAddressMTP = '0xec9EF9c4595B46abF2b6A923BD1529081E03fbBB';

  const erc20verifierAddress = '0x30c4dfC99CF5e9dFD9053faDd86E087cB06d589B'; //your erc20 verifier deployed address
  const verifierLibAddress = '0xdaC4f3e3174Ce82909FA109de8307F8C3aed1453'; // verifier lib deployed address

  const owner = (await ethers.getSigners())[0];

  const ERC20Verifier = await ethers.getContractFactory('ERC20Verifier', {
    libraries: {
      VerifierLib: verifierLibAddress
    }
  });
  const erc20Verifier = await ERC20Verifier.attach(erc20verifierAddress);

  console.log(`ERC20Verifier attached to: ${await erc20Verifier.getAddress()}`);

  // set default query
  const type = 'KYCAgeCredential';

  const queryHash = '';
  const circuitIds = [CircuitId.AtomicQuerySigV2OnChain];
  const skipClaimRevocationCheck = false;
  const allowedIssuers = [];
  const schemaUrl =
    'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
  const schema = '74977327600848231385663280181476307657';
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';
  const slotIndex = 0;
  const claimPathDoesntExist = 0;

  const chainId = await getChainId();
  const network = hre.network.name;

  // you can run https://go.dev/play/p/3id7HAhf-Wi to get schema hash and claimPathKey using YOUR schema

  // init these values for non-merklized credential use case
  // const schemaUrl =
  //   'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-nonmerklized.jsonld';
  // const schemaClaimPathKey = '0';
  // const slotIndex = 2;
  // const claimPathDoesntExist = 1;
  // const schema = '198285726510688200335207273836123338699';
  // const requestIdModifier = 100;

  const ageQueries: any[] = [
    // EQ
    {
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

      const operatorKey =
        Object.keys(QueryOperators)[Object.values(QueryOperators).indexOf(query.operator)];

      query.queryHash = calculateQueryHashV2(
        query.value,
        coreSchemaFromStr(query.schema),
        query.slotIndex,
        query.operator,
        query.claimPathKey,
        claimPathDoesntExist
      ).toString();

      let data = packV2ValidatorParams(query);
      let requestId = calculateRequestId(data, await owner.getAddress());
      query.requestId = requestId;

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
            chain_id: chainId,
            network: network
          },
          scope: [
            {
              id: query.requestId,
              circuitId: CircuitId.AtomicQuerySigV2OnChain,
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

      const tx = await erc20Verifier.setRequests([
        {
          requestId: requestId.toString(),
          metadata: JSON.stringify(invokeRequestMetadata, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v
          ),
          validator: validatorAddressSig,
          creator: await owner.getAddress(),
          params: data
        }
      ]);
      console.log(tx.hash);
      await tx.wait();

      query.circuitIds = [CircuitId.AtomicQueryMTPV2OnChain];
      data = packV2ValidatorParams(query);
      requestId = calculateRequestId(data, await owner.getAddress());
      query.requestId = requestId;
      console.log(query.requestId);

      invokeRequestMetadata.body.scope[0].circuitId = CircuitId.AtomicQueryMTPV2OnChain;
      invokeRequestMetadata.body.scope[0].id = query.requestId;
      // mtp request set

      const txMtp = await erc20Verifier.setRequests([
        {
          requestId: requestId.toString(),
          metadata: JSON.stringify(invokeRequestMetadata, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v
          ),
          validator: validatorAddressMTP,
          creator: await owner.getAddress(),
          params: data
        }
      ]);

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
