import { ethers } from 'hardhat';
import { packV3ValidatorParams } from '../../test/utils/pack-utils';
import { ChainIds, DID, DidMethod, registerDidMethodNetwork } from '@iden3/js-iden3-core';
import { buildVerifierId, calculateQueryHashV3, coreSchemaFromStr } from '../../test/utils/utils';
import { Merklizer } from '@iden3/js-jsonld-merklization';
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
  const validatorAddressV3 = '0x03e26bf5B8Aa3287a6D229B524f9F444151a44B2';
  const veraxZKPVerifierAddress = '0x1571fA0f7CCb065Fc8F27c221C0a4ad4ea8c2A46'; // verax validator

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const veraxVerifier = await veraxVerifierFactory.attach(veraxZKPVerifierAddress); // current mtp validator address on mumbai
  console.log(veraxVerifier, ' attached to:', await veraxVerifier.getAddress());

  // set default query
  const circuitIdV3 = 'credentialAtomicQueryV3OnChain-beta.1';

  const type = 'AnimaProofOfIdentity';

  const queryHash = '';
  const circuitIds = [circuitIdV3];
  const skipClaimRevocationCheck = false;
  const allowedIssuers = [];
  const schemaUrl =
    'https://raw.githubusercontent.com/anima-protocol/claims-polygonid/main/schemas/json-ld/pol-v1.json-ld';
  const schema = '124850561539049671310487367157968055340';
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';
  const slotIndex = 0;
  const merklized = 1;
  const groupID = 0;

  const chainId = 59141;

  const network = 'linea-sepolia';

  registerDidMethodNetwork({
    method: DidMethod.PolygonId,
    blockchain: 'linea',
    chainId: 59141,
    network: 'sepolia',
    networkFlag: 0b0100_0000 | 0b0000_1000
  });

  const networkFlag = Object.keys(ChainIds).find((key) => ChainIds[key] === chainId);

  if (!networkFlag) {
    throw new Error(`Invalid chain id ${chainId}`);
  }
  const [blockchain, networkId] = networkFlag.split(':');

  const verifierId = buildVerifierId(await veraxVerifier.getAddress(), {
    blockchain,
    networkId,
    method: DidMethod.PolygonId
  });
  console.log(verifierId.bigInt());
  const value = [true];

  const dateOfBirthQuery = [
    {
      requestId: 3001,
      schema: schema,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.EQ,
      value: [await Merklizer.hashValue('http://www.w3.org/2001/XMLSchema#boolean', value[0])],
      slotIndex,
      queryHash,
      circuitIds,
      allowedIssuers,
      skipClaimRevocationCheck,
      verifierID: verifierId.bigInt(),
      nullifierSessionID: 0,
      groupID,
      proofType: 0
    }
  ];
  console.log(DID.parseFromId(verifierId).string());

  try {
    for (let i = 0; i < dateOfBirthQuery.length; i++) {
      const query = dateOfBirthQuery[i];
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
            contract_address: veraxZKPVerifierAddress,
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
                  date_of_birth: {
                    [operatorKey]:
                      query.operator === Operators.IN || query.operator === Operators.NIN
                        ? value
                        : value[0]
                  }
                },
                type: type
              }
            }
          ]
        }
      };

      const tx = await veraxVerifier.setZKPRequest(query.requestId, {
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