import hre, { ethers } from 'hardhat';
import { coreSchemaFromStr, getChainId, verifyContract } from '../test/utils/utils';
import { contractsInfo } from '../test/helpers/constants';
import {
  buildVerifierId,
  calculateQueryHashV3,
  calculateRequestId,
  CircuitId,
  Operators
} from '@0xpolygonid/js-sdk';
import { Blockchain, DID, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { packV3ValidatorParams } from '../test/utils/pack-utils';

const universalVerifierAddress = contractsInfo.UNIVERSAL_VERIFIER.unifiedAddress; // your universal verifier address here

async function main() {
  // you can run https://go.dev/play/p/3id7HAhf-Wi to get schema hash and claimPathKey using YOUR schema
  const schema = '74977327600848231385663280181476307657';
  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaUrl =
    'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
  const type = 'KYCAgeCredential';
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';
  const value = [20020101, ...new Array(63).fill(0)];
  const slotIndex = 0; // because schema  is merklized for merklized credential, otherwise you should actual put slot index  https://docs.iden3.io/protocol/non-merklized/#motivation
  const claimPathDoesntExist = 0; // 0 for inclusion (merklized credentials) - 1 for non-merklized
  const allowedIssuers = []; // TODO put your allowed issuers here
  const circuitName: CircuitId = CircuitId.AtomicQueryV3OnChainStable; // TODO put your circuit here;
  const methodId = '06c86a91'; // submitResponse
  const nullifierSessionID = 11839218; // you can generate random number for nullifier session id, but make sure to use the same in the circuit input when you generate proof, otherwise the proof will not be verified

  const [signer] = await ethers.getSigners();
  console.log(`Deployer address: ${await signer.getAddress()}`);

  if (!ethers.isAddress(universalVerifierAddress)) {
    throw new Error('Please set universal verifier address');
  }
  const verifierName = 'ERC20LinkedUniversalVerifier';
  const verifierSymbol = 'zkERC20';

  const verifier = await ethers.deployContract(verifierName, [
    universalVerifierAddress,
    verifierName,
    verifierSymbol
  ]);
  await verifier.waitForDeployment();
  console.log(verifierName, ' contract address:', await verifier.getAddress());

  const universalVerifier = await ethers.getContractAt(
    contractsInfo.UNIVERSAL_VERIFIER.name,
    universalVerifierAddress
  );
  const chainId = await getChainId();
  const network = hre.network.name;

  const validatorAddress = contractsInfo.VALIDATOR_V3_STABLE.unifiedAddress;

  const verifierId = buildVerifierId(await universalVerifier.getAddress(), {
    blockchain: Blockchain.Privado,
    networkId: NetworkId.Main,
    method: DidMethod.Iden3
  });

  let query: any = {
    schema: schema,
    claimPathKey: schemaClaimPathKey,
    operator: Operators.LT,
    slotIndex: slotIndex,
    queryHash: '',
    value: value,
    circuitIds: [circuitName],
    skipClaimRevocationCheck: false,
    claimPathNotExists: claimPathDoesntExist
  };

  query = {
    ...query,
    allowedIssuers: allowedIssuers,
    verifierID: verifierId.bigInt(),
    nullifierSessionID: nullifierSessionID,
    groupID: 0,
    proofType: 0
  };

  query.queryHash = calculateQueryHashV3(
    query.value.map((i) => BigInt(i)),
    coreSchemaFromStr(query.schema),
    query.slotIndex,
    query.operator,
    query.claimPathKey,
    1, //queryV3KYCAgeCredential.value.length, // for operator NE, LT it should be 1 for value
    1, // merklized
    query.skipClaimRevocationCheck ? 0 : 1,
    query.verifierID.toString(),
    query.nullifierSessionID
  ).toString();
  const data = packV3ValidatorParams(query);
  const requestId = calculateRequestId(data, await signer.getAddress());
  query.requestId = requestId;

  const invokeRequestMetadata = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    from: DID.parseFromId(verifierId).string(),
    body: {
      reason: 'for testing',
      transaction_data: {
        contract_address: await universalVerifier.getAddress(),
        method_id: methodId,
        chain_id: chainId,
        network: network
      },
      scope: [
        {
          id: requestId.toString(),
          circuitId: circuitName,
          query: {
            allowedIssuers: !allowedIssuers.length ? ['*'] : allowedIssuers,
            context: schemaUrl,
            credentialSubject: {
              birthday: {
                $lt: value[0]
              }
            },
            type: type
          }
        }
      ]
    }
  };

  const requestIdExists = await universalVerifier.requestIdExists(requestId);
  if (requestIdExists) {
    throw new Error(`Request ID: ${requestId} already exists`);
  } else {
    console.log(`Request ID to create: ${requestId}`);
  }

  try {
    const tx = await universalVerifier.setRequests([
      {
        requestId: requestId.toString(),
        metadata: JSON.stringify(invokeRequestMetadata, (_, v) =>
          typeof v === 'bigint' ? v.toString() : v
        ),
        validator: validatorAddress,
        creator: await signer.getAddress(),
        params: data
      }
    ]);
    await tx.wait();

    console.log(JSON.stringify(invokeRequestMetadata, null, '\t'));

    console.log(`Request ID: ${requestId} is set in tx: ${tx.hash}`);
    const txSetTransferRequestId = await verifier.setTransferRequestId(requestId.toString());
    await txSetTransferRequestId.wait();
    console.log(`Transfer Request ID is set in tx: ${txSetTransferRequestId.hash}`);
  } catch (e) {
    console.log('error: ', e);
  }

  console.log('Verifying contracts...');
  await verifyContract(hre, await verifier.getAddress(), {
    constructorArgsImplementation: [universalVerifierAddress, verifierName, verifierSymbol],
    libraries: {}
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
