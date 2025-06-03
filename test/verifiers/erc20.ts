import { expect } from 'chai';
import {
  deployERC20ZKPVerifierToken,
  deployValidatorContracts,
  prepareInputs,
  publishState
} from '../utils/deploy-utils';
import {
  packCrossChainProofs,
  packGlobalStateUpdate,
  packIdentityStateUpdate,
  packV2ValidatorParams,
  packZKProof,
  prepareProof,
  unpackV2ValidatorParams
} from '../utils/pack-utils';
import { Contract } from 'ethers';
import {
  Blockchain,
  buildDIDType,
  BytesHelper,
  DID,
  DidMethod,
  NetworkId
} from '@iden3/js-iden3-core';
import { StateDeployHelper } from '../helpers/StateDeployHelper';
import { calculateRequestId, getDIDEmptyState, getDidResolution } from '../utils/utils';
import { ethers } from 'hardhat';
import {
  initCircuitStorage,
  initInMemoryDataStorageAndWallets,
  initProofService
} from '../utils/walletSetup';
import {
  AtomicQueryMTPV2OnChainPubSignals,
  AtomicQuerySigV2OnChainPubSignals,
  buildVerifierId,
  byteEncoder,
  calculateQueryHashV2,
  CircuitId,
  core,
  CredentialRequest,
  CredentialStatusType,
  hexToBytes,
  Operators,
  ZeroKnowledgeProofAuthResponse,
  ZeroKnowledgeProofRequest
} from '@0xpolygonid/js-sdk';

const phrase = 'test test test test test test test test test test test junk';
const path = "m/44'/60'/0'/0/0";
const mnemonic = ethers.Mnemonic.fromPhrase(phrase);
const userWalletKey = ethers.HDNodeWallet.fromMnemonic(mnemonic, path).privateKey;
const resolverUrl = 'https://resolver.privado.id';
const verifierRpcUrl = 'http://localhost:8545';
const issuerRpcUrl = 'https://rpc-testnet.privado.id';
const userRpcUrl = 'https://rpc-mainnet.privado.id';
const userContractAddress = '0x0DDd8701C91d8d1Ba35c9DbA98A45fe5bA8A877E';
const issuerContractAddress = '0xE5BfD683F1Ca574B5be881b7DbbcFDCE9DDBAb90';

const tenYears = 315360000;
const rhsUrl = 'https://rhs-staging.polygonid.me';

describe('ERC 20 test', function () {
  let requestIdSigValidator;
  let requestIdMtpValidator;
  let state: Contract,
    sig: Contract,
    mtp: Contract,
    authV2: Contract,
    token: Contract,
    verifierLib: Contract;
  let stateAddress: string;
  const TEN_YEARS = 315360000;

  function createKYCAgeCredential(did: core.DID, birthday: number) {
    const credentialRequest: CredentialRequest = {
      credentialSchema:
        'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential-v3.json',
      type: 'KYCAgeCredential',
      credentialSubject: {
        id: did.string(),
        birthday: birthday,
        documentType: 99
      },
      expiration: 12345678888,
      revocationOpts: {
        type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        id: rhsUrl
      }
    };
    return credentialRequest;
  }

  async function setRequests() {
    async function checkRequest(requestId: bigint) {
      const requestData = await token.getRequest(requestId);
      expect(requestData.requestId).to.be.equal(requestId);
      const parsed = unpackV2ValidatorParams(requestData.params);
      expect(parsed.queryHash.toString()).to.be.equal(query.queryHash);
      expect(parsed.claimPathKey.toString()).to.be.equal(query.claimPathKey.toString());
      expect(parsed.circuitIds[0].toString()).to.be.equal(query.circuitIds[0].toString());
      expect(parsed.operator.toString()).to.be.equal(query.operator.toString());
      expect(parsed.claimPathNotExists.toString()).to.be.equal(query.claimPathNotExists.toString());
    }

    // #################### Set SIG V2 Validator ####################

    // you can run https://go.dev/play/p/oB_oOW7kBEw to get schema hash and claimPathKey using YOUR schema
    const schemaBigInt = '74977327600848231385663280181476307657';

    // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
    const schemaClaimPathKey =
      '20376033832371109177683048456014525905119173674985843915445634726167450989630';

    const query: any = {
      schema: schemaBigInt,
      claimPathKey: schemaClaimPathKey,
      operator: Operators.LT,
      slotIndex: 0,
      queryHash: '',
      value: [20020101, ...new Array(63).fill(0)], // for operators 1-3 only first value matters
      circuitIds: [CircuitId.AtomicQuerySigV2OnChain],
      skipClaimRevocationCheck: false,
      claimPathNotExists: 0,
      allowedIssuers: []
    };

    query.queryHash = calculateQueryHashV2(
      query.value,
      core.SchemaHash.newSchemaHashFromInt(BigInt(query.schema)),
      query.slotIndex,
      query.operator,
      query.claimPathKey,
      query.claimPathNotExists
    ).toString();

    const [signer] = await ethers.getSigners();
    let data = packV2ValidatorParams(query);
    requestIdSigValidator = calculateRequestId(data, await signer.getAddress());
    await token.setRequests([
      {
        requestId: requestIdSigValidator,
        metadata: 'metadata',
        validator: await sig.getAddress(),
        params: data,
        creator: await signer.getAddress()
      }
    ]);
    await token.setTransferRequestIdSigValidator(requestIdSigValidator);

    await checkRequest(requestIdSigValidator);

    // #################### Set MTP V2 Validator ####################
    query.circuitIds = [CircuitId.AtomicQueryMTPV2OnChain];
    query.skipClaimRevocationCheck = true;

    data = packV2ValidatorParams(query);
    requestIdMtpValidator = calculateRequestId(data, await signer.getAddress());
    await token.setRequests([
      {
        requestId: requestIdMtpValidator,
        metadata: 'metadata',
        validator: await mtp.getAddress(),
        params: packV2ValidatorParams(query),
        creator: await signer.getAddress()
      }
    ]);
    await token.setTransferRequestIdMtpValidator(requestIdMtpValidator);

    await checkRequest(requestIdMtpValidator);
  }

  async function erc20VerifierFlow(validator: 'SIG' | 'MTP') {
    const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    expect(token.transfer).not.to.be.undefined;
    expect(token.submitResponse).not.to.be.undefined;

    expect(await token.balanceOf(account)).to.equal(0);
    expect(await token.getRequestsCount()).to.be.equal(0);

    const issuerChainId = 21001;
    const userChainId = 21000;

    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWithCustomError(token, 'RequestIdNotFound');

    await setRequests();

    const { dataStorage: issuerDataStorage, identityWallet: issuerIdentityWallet } =
      await initInMemoryDataStorageAndWallets([
        {
          rpcUrl: issuerRpcUrl,
          contractAddress: issuerContractAddress,
          chainId: issuerChainId
        }
      ]);

    const {
      dataStorage: userDataStorage,
      credentialWallet: userCredentialWallet,
      identityWallet: userIdentityWallet
    } = await initInMemoryDataStorageAndWallets([
      {
        rpcUrl: userRpcUrl,
        contractAddress: userContractAddress,
        chainId: userChainId
      },
      {
        rpcUrl: issuerRpcUrl,
        contractAddress: issuerContractAddress,
        chainId: issuerChainId
      }
    ]);

    const circuitStorage = await initCircuitStorage();
    const userProofService = await initProofService(
      userIdentityWallet,
      userCredentialWallet,
      userDataStorage.states,
      circuitStorage
    );

    console.log('=============== user did ===============');
    const { did: userDID } = await userIdentityWallet.createIdentity({
      method: core.DidMethod.Iden3,
      blockchain: core.Blockchain.Privado,
      networkId: core.NetworkId.Main,
      revocationOpts: {
        type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        id: rhsUrl
      }
    });

    console.log(userDID.string(), DID.idFromDID(userDID).bigInt());

    console.log('=============== issuer did ===============');
    const { did: issuerDID } = await issuerIdentityWallet.createIdentity({
      method: core.DidMethod.Iden3,
      blockchain: core.Blockchain.Privado,
      networkId: core.NetworkId.Test,
      revocationOpts: {
        type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        id: rhsUrl
      }
    });
    console.log(issuerDID.string());

    // Verifier Id in the verifier network
    const verifierId = buildVerifierId(await token.getAddress(), {
      blockchain: Blockchain.Privado,
      networkId: NetworkId.Main,
      method: DidMethod.Iden3
    });
    const verifierDID = DID.parseFromId(verifierId);

    console.log('=============== issue kyc credential ===============');
    // credential is issued on the profile!
    const profileDID = await userIdentityWallet.createProfile(userDID, 50, verifierDID.string());
    const credentialRequest = createKYCAgeCredential(profileDID, 19960424);
    const credential = await issuerIdentityWallet.issueCredential(issuerDID, credentialRequest);

    await issuerDataStorage.credential.saveCredential(credential);
    await userDataStorage.credential.saveCredential(credential);

    const provider = new ethers.JsonRpcProvider(verifierRpcUrl);
    const userEthSignerInVerifierNetwork = new ethers.Wallet(userWalletKey, provider);

    let requestId;
    switch (validator) {
      case 'SIG':
        requestId = requestIdSigValidator;
        break;
      case 'MTP':
        requestId = requestIdMtpValidator;
        break;
      default:
        throw new Error(`Unknown validator type: ${validator}`);
    }

    const circuitId: CircuitId =
      validator === 'SIG' ? CircuitId.AtomicQuerySigV2OnChain : CircuitId.AtomicQueryMTPV2OnChain;
    const proofReq: ZeroKnowledgeProofRequest = {
      id: requestId.toString(),
      circuitId,
      optional: false,
      query: {
        allowedIssuers: ['*'],
        type: credentialRequest.type,
        context:
          'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
        credentialSubject: {
          birthday: {
            $lt: 20020101
          }
        }
      }
    };

    const metadatas = '0x';

    console.log('================= generate response proof ===================');
    const challenge = BytesHelper.bytesToInt(
      hexToBytes(await userEthSignerInVerifierNetwork.getAddress())
    );

    const { proof, pub_signals } = await userProofService.generateProof(proofReq, profileDID, {
      challenge: BigInt(challenge),
      skipRevocation: false
    });

    const preparedProof = prepareProof(proof);

    const zkProof = packZKProof(
      pub_signals,
      preparedProof.pi_a,
      preparedProof.pi_b,
      preparedProof.pi_c
    );

    const responses = [
      {
        requestId,
        proof: zkProof,
        metadata: metadatas
      }
    ];

    console.log('================= generate AuthV2 proof ===================');
    const authMethod = 'authV2';
    const abiCoder = new ethers.AbiCoder();
    const challengeAuth =
      BigInt(
        ethers.keccak256(
          abiCoder.encode(
            ['address', '(uint256 requestId,bytes proof,bytes metadata)[]'],
            [await userEthSignerInVerifierNetwork.getAddress(), responses]
          )
        )
      ) & BigInt('0x0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

    // Auth proof
    const authProof: ZeroKnowledgeProofAuthResponse = await userProofService.generateAuthProof(
      CircuitId.AuthV2,
      profileDID, // userDID, //profileDID,
      { challenge: BigInt(challengeAuth) }
    );

    const preparedAuthProof = prepareProof(authProof.proof);
    const packedAuthProof = packZKProof(
      authProof.pub_signals,
      preparedAuthProof.pi_a,
      preparedAuthProof.pi_b,
      preparedAuthProof.pi_c
    );

    const gasPrice = 50000000000;
    const initialBaseFeePerGas = 25000000000;
    const gasLimit = 10000000;
    let issuerStateAfter;

    //const crossChainProofs = '0x';

    console.log('================= get did resolution issuer latest state ================');
    const didResolutionIssuer = await getDidResolution(issuerDID.string(), resolverUrl);
    const issuerProofMessage = didResolutionIssuer.didResolutionMetadata.proof[0].eip712.message;
    const issuerProofSignature = didResolutionIssuer.didResolutionMetadata.proof[0].proofValue;

    console.log(
      '================= get did resolution issuer after adding credential state ================'
    );

    switch (validator) {
      case 'SIG':
        {
          const inputsSig = new AtomicQuerySigV2OnChainPubSignals();
          inputsSig.pubSignalsUnmarshal(byteEncoder.encode(JSON.stringify(pub_signals)));
          issuerStateAfter = inputsSig.issuerAuthState.hex();
        }
        break;
      case 'MTP':
        {
          const inputsMtp = new AtomicQueryMTPV2OnChainPubSignals();
          inputsMtp.pubSignalsUnmarshal(byteEncoder.encode(JSON.stringify(pub_signals)));
          issuerStateAfter = inputsMtp.issuerClaimIdenState.hex();
        }
        break;
      default:
        throw new Error(`Unknown validator type: ${validator}`);
    }

    const didResolutionIssuerAfterAddingCredentialSate = await getDidResolution(
      issuerDID.string(),
      resolverUrl,
      {
        state: issuerStateAfter
      }
    );
    const issuerProofMessageAfterAddingCredentialSate =
      didResolutionIssuerAfterAddingCredentialSate.didResolutionMetadata.proof[0].eip712.message;
    const issuerProofSignatureAfterAddingCredentialSate =
      didResolutionIssuerAfterAddingCredentialSate.didResolutionMetadata.proof[0].proofValue;

    console.log('================= get did resolution user gist ================');

    // privado.main now has gistRoot 0
    const didResolutionUser = await getDidResolution(
      getDIDEmptyState(profileDID).string(),
      resolverUrl,
      {
        gist: '0000000000000000000000000000000000000000000000000000000000000000'
      }
    );
    const userProofMessage = didResolutionUser.didResolutionMetadata.proof[0].eip712.message;
    const userProofSignature = didResolutionUser.didResolutionMetadata.proof[0].proofValue;

    const crossChainProofs = packCrossChainProofs([
      {
        proofType: 'globalStateProof',
        proof: packGlobalStateUpdate({
          globalStateMsg: {
            timestamp: userProofMessage.timestamp,
            idType: userProofMessage.idType,
            root: userProofMessage.root,
            replacedAtTimestamp: userProofMessage.replacedAtTimestamp
          },
          signature: userProofSignature
        })
      },
      {
        proofType: 'stateProof',
        proof: packIdentityStateUpdate({
          idStateMsg: {
            timestamp: issuerProofMessage.timestamp,
            id: issuerProofMessage.id,
            state: issuerProofMessage.state,
            replacedAtTimestamp: issuerProofMessage.replacedAtTimestamp
          },
          signature: issuerProofSignature
        })
      },
      {
        proofType: 'stateProof',
        proof: packIdentityStateUpdate({
          idStateMsg: {
            timestamp: issuerProofMessageAfterAddingCredentialSate.timestamp,
            id: issuerProofMessageAfterAddingCredentialSate.id,
            state: issuerProofMessageAfterAddingCredentialSate.state,
            replacedAtTimestamp: issuerProofMessageAfterAddingCredentialSate.replacedAtTimestamp
          },
          signature: issuerProofSignatureAfterAddingCredentialSate
        })
      }
    ]);

    // try transfer without given proof (request exists)
    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWith(
      'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
    );

    // check that query is assigned
    expect(await token.getRequestsCount()).to.be.equal(2);

    const txSubmitResponse = await token.submitResponse(
      {
        authMethod: authMethod,
        proof: packedAuthProof
      },
      responses,
      crossChainProofs,
      { gasPrice, initialBaseFeePerGas, gasLimit }
    );

    const receipt = await txSubmitResponse.wait();

    console.log(`submitResponse gas consumed: `, receipt.gasUsed);

    expect(await token.isRequestProofVerified(account, requestId)).to.be.true; // check proof is assigned

    // check that tokens were minted
    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    // if proof is provided second time, revert because it's already verified
    await expect(
      token.submitResponse(
        {
          authMethod: authMethod,
          proof: packedAuthProof
        },
        responses,
        crossChainProofs,
        { gasPrice, initialBaseFeePerGas, gasLimit }
      )
    )
      .revertedWithCustomError(verifierLib, 'ProofAlreadyVerified')
      .withArgs(requestId, account);

    const nonExistingRequestId = 4;
    // submit response for non-existing request
    await expect(
      token.submitResponse(
        {
          authMethod: authMethod,
          proof: packedAuthProof
        },
        [
          {
            requestId: nonExistingRequestId,
            proof: zkProof,
            metadata: metadatas
          }
        ],
        crossChainProofs
      )
    )
      .to.be.revertedWithCustomError(token, 'RequestIdNotFound')
      .withArgs(nonExistingRequestId);

    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    await token.transfer(account, 1); // we send tokens to ourselves, but no error because we sent proof
    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));
  }

  beforeEach(async () => {
    const typ0 = buildDIDType(DidMethod.Iden3, Blockchain.ReadOnly, NetworkId.NoNetwork);
    const stateDeployHelper = await StateDeployHelper.initialize(null, false);
    ({ state } = await stateDeployHelper.deployState([typ0]));
    stateAddress = await state.getAddress();

    const contractsSig = await deployValidatorContracts(
      'Groth16VerifierSigWrapper',
      'CredentialAtomicQuerySigV2Validator',
      stateAddress
    );
    sig = contractsSig.validator;

    const contractsMTP = await deployValidatorContracts(
      'Groth16VerifierMTPWrapper',
      'CredentialAtomicQueryMTPV2Validator',
      stateAddress
    );
    mtp = contractsMTP.validator;

    const contractsAuthV2 = await deployValidatorContracts(
      'Groth16VerifierAuthV2Wrapper',
      'AuthV2Validator',
      stateAddress
    );
    authV2 = contractsAuthV2.validator;
    await authV2.setProofExpirationTimeout(TEN_YEARS);
    await authV2.setGISTRootExpirationTimeout(TEN_YEARS);

    ({ erc20Verifier: token, verifierLib: verifierLib } = await deployERC20ZKPVerifierToken(
      'zkpVerifier',
      'ZKP',
      stateAddress
    ));
    await sig.setProofExpirationTimeout(tenYears);
    await mtp.setProofExpirationTimeout(tenYears);
    const authMethod = {
      authMethod: 'authV2',
      validator: await authV2.getAddress(),
      params: '0x'
    };
    await token.setAuthMethod(authMethod);
  });

  it('Example ERC20 Verifier: set zkp request Sig validator + submit zkp response', async () => {
    await erc20VerifierFlow('SIG');
  });

  it('Example ERC20 Verifier: set zkp request Mtp validator + submit zkp response', async () => {
    //await erc20VerifierFlow('MTP');
  });
});
