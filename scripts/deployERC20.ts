import { ethers, upgrades } from 'hardhat';
import { packV2ValidatorParams } from '../test/utils/pack-utils';
import { calculateQueryHash } from '../test/utils/utils';

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
  const owner = (await ethers.getSigners())[0];
  const ERC20ContractFactory = await ethers.getContractFactory(contractName);
  const erc20instance = await upgrades.deployProxy(
    ERC20ContractFactory,
    [name, symbol, owner.address],
    {
      initializer: 'init'
    }
  );
  const claimPathDoesntExist = 0; // 0 for inclusion (merklized credentials) - 1 for non-merklized

  await erc20instance.deployed();
  console.log(contractName, ' deployed to:', erc20instance.address);

  // set default query
  const circuitIdSig = 'credentialAtomicQuerySigV2OnChain';
  const circuitIdMTP = 'credentialAtomicQueryMTPV2OnChain';

  // current sig validator address on mumbai
  const validatorAddressSig = '0x1E4a22540E293C0e5E8c33DAfd6f523889cFd878';

  // current mtp validator address on mumbai
  const validatorAddressMTP = '0x0682fbaA2E4C478aD5d24d992069dba409766121';

  const chainId = 80001;

  const network = 'polygon-mumbai';

  // current sig validator address on polygon main
  // const validatorAddressSig = '0x35178273C828E08298EcB0C6F1b97B3aFf14C4cb';
  //
  // // current mtp validator address on polygon main
  // const validatorAddressMTP = '0x8c99F13dc5083b1E4c16f269735EaD4cFbc4970d';
  //
  // const network = 'polygon-main';
  //
  // const chainId = 137;
  const query = {
    schema: schema,
    claimPathKey: schemaClaimPathKey,
    operator: Operators.LT,
    slotIndex: slotIndex,
    value: value,
    queryHash: calculateQueryHash(
      value,
      schema,
      slotIndex,
      Operators.LT,
      schemaClaimPathKey,
      claimPathDoesntExist
    ).toString(),
    circuitIds: [circuitIdSig],
    allowedIssuers: [],
    skipClaimRevocationCheck: false,
    claimPathNotExists: claimPathDoesntExist
  };

  const requestIdSig = await erc20instance.TRANSFER_REQUEST_ID_SIG_VALIDATOR();
  const requestIdMtp = await erc20instance.TRANSFER_REQUEST_ID_MTP_VALIDATOR();

  const invokeRequestMetadata = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    body: {
      reason: 'for testing',
      transaction_data: {
        contract_address: erc20instance.address,
        method_id: 'b68967e2',
        chain_id: chainId,
        network: network
      },
      scope: [
        {
          id: requestIdSig,
          circuitId: circuitIdSig,
          query: {
            allowedIssuers: ['*'],
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

  try {
    // sig request set
    const txSig = await erc20instance.setZKPRequest(requestIdSig, {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: validatorAddressSig,
      data: packV2ValidatorParams(query)
    });
    await txSig.wait();
    console.log(txSig.hash);

    // mtp request set
    query.circuitIds = [circuitIdMTP];
    invokeRequestMetadata.body.scope[0].circuitId = circuitIdMTP;
    invokeRequestMetadata.body.scope[0].id = requestIdMtp;
    const txMtp = await erc20instance.setZKPRequest(requestIdMtp, {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: validatorAddressMTP,
      data: packV2ValidatorParams(query)
    });

    console.log(txMtp.hash);
    await txMtp.wait();
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
