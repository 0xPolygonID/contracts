import hre, { ethers, upgrades } from 'hardhat';
import {
  buildDIDType,
  genesisFromEthAddress,
  Id,
  Blockchain,
  DidMethod,
  NetworkId,
  SchemaHash,
  DID
} from '@iden3/js-iden3-core';
import { Hex } from '@iden3/js-crypto';
import { Merklizer } from '@iden3/js-jsonld-merklization';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
import { calculateQueryHashV3 } from '@0xpolygonid/js-sdk';
import { packV3ValidatorParams } from '../test/utils/pack-utils';

async function main() {
  const deployHelper = await StateDeployHelper.initialize(null, true);

  const chainId = hre.network.config.chainId;
  const network = hre.network.name;
  // ##################### StateCrossChain deploy #####################

  const { state } = await deployHelper.deployState();

  // ##################### V3 Validator deploy #####################

  const verifierContractWrapperName = 'VerifierV3Wrapper';
  const validatorContractName = 'CredentialAtomicQueryV3Validator';
  const VerifierSigWrapper = await ethers.getContractFactory(verifierContractWrapperName);
  const verifierWrapper = await VerifierSigWrapper.deploy();

  await verifierWrapper.waitForDeployment();
  console.log(verifierContractWrapperName, ' deployed to:', await verifierWrapper.getAddress());

  const CredentialAtomicQueryValidator = await ethers.getContractFactory(validatorContractName);

  const validatorV3 = await upgrades.deployProxy(
    CredentialAtomicQueryValidator,
    [await verifierWrapper.getAddress(), await state.getAddress()] // current state address on mumbai
  );

  await validatorV3.waitForDeployment();
  console.log(validatorContractName, ' deployed to:', await validatorV3.getAddress());

  // // ##################### Verifier deploy #####################

  const universlVerifierFactory = await ethers.getContractFactory('UniversalVerifier');
  const universalVerifier = await upgrades.deployProxy(universlVerifierFactory);
  await universalVerifier.waitForDeployment();
  console.log('UniversalVerifier deployed to:', await universalVerifier.getAddress());

  const addToWhiteList = await universalVerifier.addValidatorToWhitelist(
    await validatorV3.getAddress()
  );
  await addToWhiteList.wait();

  // ##################### SetZKPRequest #####################

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

  const methodId = 'b68967e2';

  console.log(
    '================= setZKPRequest V3 SIG Transak `email-verified` $eq true ==================='
  );

  const schemaHashIndividualKYC = '83588135147751541079133521251473709708';
  const coreSchemaIndividualKYC = coreSchemaFromStr(schemaHashIndividualKYC);

  const verifierId = buildVerifierId(await universalVerifier.getAddress(), {
    blockchain: Blockchain.Polygon,
    networkId: NetworkId.Amoy,
    method: DidMethod.Iden3
  });

  console.log(DID.parseFromId(verifierId).string());

  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaClaimPathKeyEmailVerified =
    '6690925644799482311359070256240649323225600882434741819138192893258972267385';

  const requestIdEmailVerified = 1;

  const queryV3EmailVerified = {
    requestId: requestIdEmailVerified,
    schema: schemaHashIndividualKYC,
    claimPathKey: schemaClaimPathKeyEmailVerified,
    operator: Operators.EQ,
    value: [await Merklizer.hashValue('http://www.w3.org/2001/XMLSchema#boolean', true)],
    slotIndex: 0,
    queryHash: '',
    circuitIds: ['credentialAtomicQueryV3OnChain-beta.1'],
    allowedIssuers: [],
    skipClaimRevocationCheck: false,
    verifierID: verifierId.bigInt(),
    nullifierSessionID: 1,
    groupID: 0,
    proofType: 0
  };

  queryV3EmailVerified.queryHash = calculateQueryHashV3(
    queryV3EmailVerified.value.map((i) => BigInt(i)),
    coreSchemaIndividualKYC,
    queryV3EmailVerified.slotIndex,
    queryV3EmailVerified.operator,
    queryV3EmailVerified.claimPathKey,
    queryV3EmailVerified.value.length,
    1, // merklized
    queryV3EmailVerified.skipClaimRevocationCheck ? 0 : 1,
    queryV3EmailVerified.verifierID.toString(),
    queryV3EmailVerified.nullifierSessionID
  ).toString();

  const dataV3EmailVerified = packV3ValidatorParams(queryV3EmailVerified);

  const invokeRequestMetadataEmailVerified = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    from: DID.parseFromId(verifierId).string(),
    body: {
      reason: 'reason',
      transaction_data: {
        contract_address: await universalVerifier.getAddress(),
        method_id: methodId,
        chain_id: chainId,
        network: network
      },
      scope: [
        {
          id: queryV3EmailVerified.requestId,
          circuitId: queryV3EmailVerified.circuitIds[0],
          query: {
            allowedIssuers: !queryV3EmailVerified.allowedIssuers.length
              ? ['*']
              : queryV3EmailVerified.allowedIssuers,
            context: 'ipfs://Qmdhuf9fhqzweDa1TgoajDEj7Te7p28eeeZVfiioAjUC15',
            credentialSubject: {
              'email-verified': {
                $eq: true
              }
            },
            type: 'IndividualKYC'
          }
        }
      ]
    }
  };

  await universalVerifier.setZKPRequest(requestIdEmailVerified, {
    metadata: JSON.stringify(invokeRequestMetadataEmailVerified),
    validator: validatorV3,
    data: dataV3EmailVerified
  });

  console.log(JSON.stringify(invokeRequestMetadataEmailVerified, null, '\t'));

  console.log(`Request ID: ${requestIdEmailVerified} is set`);

  console.log('================= setZKPRequest V3 SIG Transak `email` SD ===================');

  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaClaimPathKeyEmail =
    '45494603366705166835171894278075990839428579528180465081820758291950364182';

  const requestIdEmail = 2;

  const queryV3EmailSD = {
    requestId: requestIdEmail,
    schema: schemaHashIndividualKYC,
    claimPathKey: schemaClaimPathKeyEmail,
    operator: Operators.SD,
    value: [],
    slotIndex: 0,
    queryHash: '',
    circuitIds: ['credentialAtomicQueryV3OnChain-beta.1'],
    allowedIssuers: [],
    skipClaimRevocationCheck: false,
    verifierID: verifierId.bigInt(),
    nullifierSessionID: 2,
    groupID: 0,
    proofType: 0
  };

  queryV3EmailSD.queryHash = calculateQueryHashV3(
    queryV3EmailSD.value.map((i) => BigInt(i)),
    coreSchemaIndividualKYC,
    queryV3EmailSD.slotIndex,
    queryV3EmailSD.operator,
    queryV3EmailSD.claimPathKey,
    queryV3EmailSD.value.length,
    1, // merklized
    queryV3EmailSD.skipClaimRevocationCheck ? 0 : 1,
    queryV3EmailSD.verifierID.toString(),
    queryV3EmailSD.nullifierSessionID
  ).toString();

  const dataV3EmailSD = packV3ValidatorParams(queryV3EmailSD);

  const invokeRequestMetadataEmailSd = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b543',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b543',
    from: DID.parseFromId(verifierId).string(),
    body: {
      reason: 'for testing submitZKPResponseV2',
      transaction_data: {
        contract_address: await universalVerifier.getAddress(),
        method_id: methodId,
        chain_id: chainId,
        network: network
      },
      scope: [
        {
          id: queryV3EmailSD.requestId,
          circuitId: queryV3EmailSD.circuitIds[0],
          query: {
            allowedIssuers: !queryV3EmailSD.allowedIssuers.length
              ? ['*']
              : queryV3EmailSD.allowedIssuers,
            context: 'ipfs://Qmdhuf9fhqzweDa1TgoajDEj7Te7p28eeeZVfiioAjUC15',
            credentialSubject: {
              email: {}
            },
            type: 'IndividualKYC'
          }
        }
      ]
    }
  };

  await universalVerifier.setZKPRequest(requestIdEmail, {
    metadata: JSON.stringify(invokeRequestMetadataEmailSd),
    validator: validatorV3,
    data: dataV3EmailSD
  });

  console.log(JSON.stringify(invokeRequestMetadataEmailSd, null, '\t'));
  console.log(`Request ID: ${requestIdEmail} is set`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export function buildVerifierId(
  address: string,
  info: { method: string; blockchain: string; networkId: string }
): Id {
  address = address.replace('0x', '');
  const ethAddrBytes = Hex.decodeString(address);
  const ethAddr = ethAddrBytes.slice(0, 20);
  const genesis = genesisFromEthAddress(ethAddr);

  const tp = buildDIDType(info.method, info.blockchain, info.networkId);

  return new Id(tp, genesis);
}

export const coreSchemaFromStr = (schemaIntString: string) => {
  const schemaInt = BigInt(schemaIntString);
  return SchemaHash.newSchemaHashFromInt(schemaInt);
};
