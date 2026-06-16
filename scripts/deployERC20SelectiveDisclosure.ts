import hre, { ethers, upgrades } from 'hardhat';
import { Blockchain, DID, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import {
  buildVerifierId,
  calculateQueryHashV3,
  calculateRequestId,
  CircuitId,
  Operators
} from '@0xpolygonid/js-sdk';
import { coreSchemaFromStr, getChainId, verifyContract } from '../test/utils/utils';
import { packV3ValidatorParams } from '../test/utils/pack-utils';
import { deployVerifierLib, getStateContractAddress } from '../test/utils/deploy-utils';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';

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

  const contractName = 'ERC20SelectiveDisclosureVerifier';
  const name = 'ERC20SelectiveDisclosureVerifier';
  const symbol = 'ERCZKP';
  const stateAddress = await getStateContractAddress();

  const [signer] = await ethers.getSigners();
  console.log(`Deployer address: ${await signer.getAddress()}`);

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
  const claimPathDoesntExist = 0; // 0 for inclusion (merklized credentials) - 1 for non-merklized

  await erc20instance.waitForDeployment();
  console.log(contractName, ' deployed to:', await erc20instance.getAddress());

  // set default query
  const circuitIdV3 = CircuitId.AtomicQueryV3OnChain; // TODO put your circuit here.;

  // current v3 validator address
  const validatorAddressV3 = '0xC616963610A5545EF89b373e1fEAE8A1e505FaFF';
  const chainId = await getChainId();
  const network = hre.network.name;

  const verifierId = buildVerifierId(await erc20instance.getAddress(), {
    blockchain: Blockchain.Privado,
    networkId: NetworkId.Main,
    method: DidMethod.Iden3
  });
  const nullifierSessionID = 0;
  console.log('verifier id = ' + verifierId.bigInt().toString());

  const query: any = {
    schema: schema,
    claimPathKey: schemaClaimPathKey,
    operator: Operators.SD,
    slotIndex: slotIndex,
    value: value,
    queryHash: '',
    circuitIds: [circuitIdV3],
    allowedIssuers: [],
    skipClaimRevocationCheck: false,
    claimPathNotExists: claimPathDoesntExist,
    nullifierSessionID: nullifierSessionID,
    verifierID: verifierId.bigInt(),
    groupID: 0,
    proofType: 1
  };

  query.queryHash = calculateQueryHashV3(
    query.value.map((i) => BigInt(i)),
    coreSchemaFromStr(query.schema),
    query.slotIndex,
    query.operator,
    query.claimPathKey,
    actualValueArraySize,
    merklized,
    query.skipClaimRevocationCheck ? 0 : 1,
    query.verifierID.toString(),
    query.nullifierSessionID
  ).toString();

  const data = packV3ValidatorParams(query);
  const requestId = calculateRequestId(data, await signer.getAddress());
  query.requestId = requestId;

  console.log(DID.parseFromId(verifierId).string());
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
        method_id: 'b68967e2',
        chain_id: chainId,
        network: network
      },
      scope: [
        {
          id: requestId.toString(),
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
        validator: validatorAddressV3,
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
