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
  const validatorAddressV3 = '0x9ee6a2682Caa2E0AC99dA46afb88Ad7e6A58Cd1b';
  const veraxZKPVerifierAddress = '0x07D5A8d32A3B42536c3019fD10F62A893aCc9021'; // verax validator

  // const validatorAddressV3 = '0x266fe15bE3a1969496967aE44F0bAc3EFb7ca6f5'; sepolia
  // const veraxZKPVerifierAddress = '0x91a3a28B401adDeBcb5Cd0b1364474fF6255F00b'; // verax validator sepolia


  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const veraxVerifier = await veraxVerifierFactory.attach(veraxZKPVerifierAddress); // current mtp validator address on mumbai
  console.log(veraxVerifier, ' attached to:', await veraxVerifier.getAddress());

  // set default query
  const circuitIdV3 = 'credentialAtomicQueryV3OnChain-beta.1';

  const type = 'AnimaProofOfLife';

  const queryHash = '';
  const circuitIds = [circuitIdV3];
  const skipClaimRevocationCheck = false;
  const allowedIssuers = ['did:iden3:privado:main:2ScrbEuw9jLXMapW3DELXBbDco5EURzJZRN1tYj7L7'];
  const schemaUrl =
    'https://raw.githubusercontent.com/anima-protocol/claims-polygonid/main/schemas/json-ld/pol-v1.json-ld';
  const schema = '210527560731691333146408988058384574850';
  const schemaClaimPathKey =
    '13751106843739971482657571607497906795066562763243795313411556194188082993570';
  const slotIndex = 0;
  const merklized = 1;
  const groupID = 0;

  const chainId = 59144;

  const network = 'linea-main';

  registerDidMethodNetwork({
    method: DidMethod.Iden3,
    blockchain: 'linea',
    chainId: chainId,
    network: 'main',
    networkFlag: 0b0100_0000 | 0b0000_1001
  });

  const networkFlag = Object.keys(ChainIds).find((key) => ChainIds[key] === chainId);

  if (!networkFlag) {
    throw new Error(`Invalid chain id ${chainId}`);
  }
  const [blockchain, networkId] = networkFlag.split(':');

  const verifierId = buildVerifierId(await veraxVerifier.getAddress(), {
    blockchain,
    networkId,
    method: DidMethod.Iden3
  });
  console.log(verifierId.bigInt());
  const value = [true];

  const polQuery = [
    {
      requestId: 100001,
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
      nullifierSessionID: 100001,
      groupID,
      proofType: 0
    }
  ];
  console.log(DID.parseFromId(verifierId).string());

  try {
    for (let i = 0; i < polQuery.length; i++) {
      const query = polQuery[i];
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
                allowedIssuers: !allowedIssuers.length ? ['*'] : allowedIssuers,
                context: schemaUrl,
                credentialSubject: {
                  human: {
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

      const issuers = !allowedIssuers.length ? [] : allowedIssuers.map( issuer => DID.idFromDID(DID.parse(issuer)).bigInt().toString())

      const tx = await veraxVerifier.setZKPRequest(query.requestId, {
        metadata: JSON.stringify(invokeRequestMetadata),
        validator: validatorAddressV3,
        data: packV3ValidatorParams(query,issuers)
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
