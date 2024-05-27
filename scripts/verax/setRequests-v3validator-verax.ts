import { ethers } from 'hardhat';
import { packV3ValidatorParams } from '../../test/utils/pack-utils';
import { ChainIds, DID, DidMethod, registerDidMethodNetwork } from '@iden3/js-iden3-core';
import { buildVerifierId, calculateQueryHashV3, coreSchemaFromStr } from '../../test/utils/utils';
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
  const validatorAddressV3 = '0xba0EB888B1CDD41523d541E0d06246460f0D32a8';
  const erc20verifierAddress = '0x04669EFfB55D3Ed7EEeC10b6E8227405AEA9B33a'; // verax validator

  const ERC20Verifier = await ethers.getContractFactory('VeraxZKPVerifier');
  const erc20Verifier = await ERC20Verifier.attach(erc20verifierAddress); // current mtp validator address on mumbai
  console.log(erc20Verifier, ' attached to:', await erc20Verifier.getAddress());

  // set default query
  const circuitIdV3 = 'credentialAtomicQueryV3OnChain-beta.1';

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
  const merklized = 1;
  const requestIdModifier = 1;
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

  const verifierId = buildVerifierId(await erc20Verifier.getAddress(), {
    blockchain,
    networkId,
    method: DidMethod.PolygonId
  });
  console.log(verifierId.bigInt());
  const ageQueries = [
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
      nullifierSessionID: 5543,
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
