import { ethers, upgrades } from 'hardhat';
import { packV3ValidatorParams } from '../test/utils/pack-utils';
import { calculateQueryHashV3, buildVerifierId, coreSchemaFromStr } from '../test/utils/utils';
import { ChainIds, DID, DidMethod } from '@iden3/js-iden3-core';

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
  const value = [];
  const actualValueArraySize = 0;
  const merklized = 1;
  const slotIndex = 0; // because schema  is merklized for merklized credential, otherwise you should actual put slot index  https://docs.iden3.io/protocol/non-merklized/#motivation
  const isRevocationChecked = 1;

  const contractName = 'ERC20SelectiveDisclosureVerifier';
  const name = 'ERC20SelectiveDisclosureVerifier';
  const symbol = 'ERCZKP';
  const ERC20ContractFactory = await ethers.getContractFactory(contractName);
  const erc20instance = await upgrades.deployProxy(ERC20ContractFactory, [name, symbol]);
  const claimPathDoesntExist = 0; // 0 for inclusion (merklized credentials) - 1 for non-merklized

  await erc20instance.waitForDeployment();
  console.log(contractName, ' deployed to:', await erc20instance.getAddress());

  // set default query
  const circuitIdV3 = 'credentialAtomicQueryV3OnChain-beta.1';

  // current v3 validator address on mumbai
  // const validatorAddressV3 = '0x3412AB64acFf5d94Da4914F176A43aCbDdC7Fc4a';
  //
  // const chainId = 80001;
  //
  // const network = 'polygon-mumbai';

  // current v3 validator address on amoy

  const validatorAddressV3 = '0xa5f08979370AF7095cDeDb2B83425367316FAD0B';

  const chainId = 80002;

  const network = 'polygon-amoy';

  const networkFlag = Object.keys(ChainIds).find((key) => ChainIds[key] === chainId);

  if (!networkFlag) {
    throw new Error(`Invalid chain id ${chainId}`);
  }
  const [blockchain, networkId] = networkFlag.split(':');

  const id = buildVerifierId(await erc20instance.getAddress(), {
    blockchain,
    networkId,
    method: DidMethod.PolygonId
  });
  const verifierID = id.bigInt();
  const nullifierSessionID = 0;
  const schemaHash = coreSchemaFromStr(schema);
  console.log('verifier id = ' + id.bigInt().toString());

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
    queryHash: calculateQueryHashV3(
      value,
      schemaHash,
      slotIndex,
      Operators.SD,
      schemaClaimPathKey,
      actualValueArraySize,
      merklized,
      isRevocationChecked,
      verifierID.toString(),
      nullifierSessionID
    ).toString(),
    circuitIds: [circuitIdV3],
    allowedIssuers: [],
    skipClaimRevocationCheck: false,
    nullifierSessionID: 0,
    verifierID: verifierID.toString(),
    groupID: 0,
    proofType: 1
  };

  const requestIdV3 = await erc20instance.TRANSFER_REQUEST_ID_V3_VALIDATOR();

  console.log(DID.parseFromId(id).string());
  const invokeRequestMetadata = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    from: DID.parseFromId(id).string(),
    body: {
      reason: 'for testing',
      transaction_data: {
        contract_address: await erc20instance.getAddress(),
        method_id: 'b68967e2',
        chain_id: chainId,
        network: network
      },
      scope: [
        {
          id: requestIdV3,
          circuitId: circuitIdV3,
          proofType: 'BJJSignature2021',
          query: {
            allowedIssuers: ['*'],
            context: schemaUrl,
            credentialSubject: {
              birthday: {}
            },
            type: type
          }
        }
      ]
    }
  };

  try {
    const x = JSON.stringify(invokeRequestMetadata, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    );

    // v3 request set
    const txV3 = await erc20instance.setZKPRequest(requestIdV3, {
      metadata: JSON.stringify(invokeRequestMetadata, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v
      ),
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
