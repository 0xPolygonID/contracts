import hre, { ethers, upgrades } from 'hardhat';
import { packV2ValidatorParams, packV3ValidatorParams } from '../test/utils/pack-utils';
import { coreSchemaFromStr, getChainId, verifyContract } from '../test/utils/utils';
import {
  buildVerifierId,
  calculateQueryHashV2,
  calculateQueryHashV3,
  calculateRequestId,
  CircuitId
} from '@0xpolygonid/js-sdk';
import { Blockchain, DID, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { deployVerifierLib } from '../test/utils/deploy-utils';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';

const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6 // not equal
};

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

  const contractName = 'ERC20Verifier';
  const name = 'ERC20ZKPVerifier';
  const symbol = 'ERCZKP';

  const claimPathDoesntExist = 0; // 0 for inclusion (merklized credentials) - 1 for non-merklized
  const allowedIssuers = []; // TODO put your allowed issuers here
  const circuitName: CircuitId = CircuitId.AtomicQueryV3OnChainStable; // TODO put your circuit here;
  const methodId = '06c86a91'; // submitResponse
  const nullifierSessionID = 11838218; // you can generate random number for nullifier session id, but make sure to use the same in the circuit input when you generate proof, otherwise the proof will not be verified
  const stateAddress = '0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896'; // State contract address in the network you are deploying. Review Readme for more details.
  let requestId: bigint;

  const [signer] = await ethers.getSigners();
  console.log(`Deployer address: ${await signer.getAddress()}`);

  // Deploy ERC20Verifier contract

  const verifierLib = await deployVerifierLib();
  await verifierLib.waitForDeployment();

  const ERC20ContractFactory = await ethers.getContractFactory(contractName, {
    libraries: {
      VerifierLib: await verifierLib.getAddress()
    }
  });
  const erc20instance = await upgrades.deployProxy(
    ERC20ContractFactory,
    [name, symbol, stateAddress],
    {
      unsafeAllow: ['external-library-linking']
    }
  );
  await erc20instance.waitForDeployment();

  console.log(contractName, ' deployed to:', await erc20instance.getAddress());

  const chainId = await getChainId();
  const network = hre.network.name;

  let validatorAddress: string;
  let data: string;

  const verifierId = buildVerifierId(await erc20instance.getAddress(), {
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

  switch (circuitName) {
    case CircuitId.AtomicQueryMTPV2OnChain:
      // TODO put your V2 MTP validator address here
      validatorAddress = '0xec9EF9c4595B46abF2b6A923BD1529081E03fbBB';
      query.queryHash = calculateQueryHashV2(
        query.value,
        coreSchemaFromStr(query.schema),
        query.slotIndex,
        query.operator,
        query.claimPathKey,
        query.claimPathNotExists
      ).toString();
      data = packV2ValidatorParams(query);
      requestId = calculateRequestId(data, await signer.getAddress());
      query.requestId = requestId;
      break;
    case CircuitId.AtomicQuerySigV2OnChain:
      // TODO put your V2 Sig validator address here
      validatorAddress = '0x5BD60F3Ef5890260906172EEe1f0a965707791f1';
      query.queryHash = calculateQueryHashV2(
        query.value,
        coreSchemaFromStr(query.schema),
        query.slotIndex,
        query.operator,
        query.claimPathKey,
        query.claimPathNotExists
      ).toString();
      data = packV2ValidatorParams(query);
      requestId = calculateRequestId(data, await signer.getAddress());
      query.requestId = requestId;
      break;
    case CircuitId.AtomicQueryV3OnChain:
      // TODO put your V3 validator address here
      validatorAddress = '0xC616963610A5545EF89b373e1fEAE8A1e505FaFF';
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
      data = packV3ValidatorParams(query);
      requestId = calculateRequestId(data, await signer.getAddress());
      query.requestId = requestId;
      break;
    case CircuitId.AtomicQueryV3OnChainStable:
      // TODO put your V3 validator address here
      validatorAddress = '0x0d78ADDD050a75a94e21eD14d54591933B9B7546';
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
      data = packV3ValidatorParams(query);
      requestId = calculateRequestId(data, await signer.getAddress());
      query.requestId = requestId;
      break;
    default:
      throw new Error(`Unsupported circuit name: ${circuitName}`);
  }

  const invokeRequestMetadata = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    from: DID.parseFromId(verifierId).string(),
    body: {
      reason: 'for testing',
      transaction_data: {
        contract_address: await erc20instance.getAddress(),
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

  const requestIdExists = await erc20instance.requestIdExists(requestId);
  if (requestIdExists) {
    throw new Error(`Request ID: ${requestId} already exists`);
  } else {
    console.log(`Request ID to create: ${requestId}`);
  }

  try {
    const tx = await erc20instance.setRequests([
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
    const txSetTransferRequestId = await erc20instance.setTransferRequestId(requestId.toString());
    await txSetTransferRequestId.wait();
    console.log(`Transfer Request ID is set in tx: ${txSetTransferRequestId.hash}`);
  } catch (e) {
    console.log('error: ', e);
  }

  console.log('Verifying contracts...');
  await verifyContract(hre, await verifierLib.getAddress(), {
    constructorArgsImplementation: [],
    libraries: {}
  });
  await verifyContract(hre, await erc20instance.getAddress(), {
    constructorArgsImplementation: [],
    constructorArgsProxy: [],
    constructorArgsProxyAdmin: [await signer.getAddress()],
    libraries: {
      'contracts/lib/VerifierLib.sol:VerifierLib': ''
    }
  });
  await verifyContract(
    hre,
    await getImplementationAddress(signer.provider, await erc20instance.getAddress()),
    {
      constructorArgsImplementation: [],
      libraries: {}
    }
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
