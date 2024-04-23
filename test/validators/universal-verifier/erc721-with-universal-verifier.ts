import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  deployERC721LinkedUniversalVerifier,
  deployValidatorContracts,
  prepareInputs,
  publishState
} from '../../utils/deploy-utils';
import { packV2ValidatorParams, unpackV2ValidatorParams } from '../../utils/pack-utils';
import { Contract } from "ethers";

const tenYears = 315360000;
const query= {
  schema: BigInt('180410020913331409885634153623124536270'),
  claimPathKey: BigInt(
    '8566939875427719562376598811066985304309117528846759529734201066483458512800'
  ),
  operator: BigInt(1),
  slotIndex: BigInt(0),
  value: ['1420070400000000000', ...new Array(63).fill('0')].map((x) =>
    BigInt(x)
  ),
  circuitIds: [''],
  queryHash: BigInt(
    '1496222740463292783938163206931059379817846775593932664024082849882751356658'
  ),
  claimPathNotExists: 0,
  metadata: 'test medatada',
  skipClaimRevocationCheck: false
};

describe('ERC721 test', function () {
  let state: any, sig: any, mtp: any;
  let universalVerifier: Contract, erc721: Contract;

  before(async () => {
    const contractsSig = await deployValidatorContracts(
      'VerifierSigWrapper',
      'CredentialAtomicQuerySigV2Validator'
    );
    state = contractsSig.state;
    sig = contractsSig.validator;

    const contractsMTP = await deployValidatorContracts(
      'VerifierMTPWrapper',
      'CredentialAtomicQueryMTPV2Validator',
      await state.getAddress()
    );
    mtp = contractsMTP.validator;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await publishState(state, require('../common-data/user_state_transition.json'));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await publishState(state, require('../common-data/issuer_genesis_state.json'));

    ({ universalVerifier, erc721LinkedUniversalVerifier: erc721 } = await deployERC721LinkedUniversalVerifier(
      'zkpVerifier',
      'ZKP'
    ));

    await universalVerifier.addWhitelistedValidator(await sig.getAddress());
    await universalVerifier.addWhitelistedValidator(await mtp.getAddress());

    await setZKPRequests();
  });

  it('Requests count', async () => {
    expect(await universalVerifier.getZKPRequestsCount()).to.be.equal(2);
  });

  it('Example ERC721 Verifier: set zkp request Sig validator', async () => {
    await sig.setProofExpirationTimeout(tenYears);
    await verifierFlow('credentialAtomicQuerySigV2OnChain');
  });

  it('Example ERC721 Verifier: set zkp request Mtp validator', async () => {
    await mtp.setProofExpirationTimeout(tenYears);
    await verifierFlow('credentialAtomicQueryMTPV2OnChain');
  });

  async function setZKPRequests() {
    async function setRequest(requestId, query, validatorAddress) {
      const [signer] = await ethers.getSigners();

      await universalVerifier.setZKPRequest(
        requestId, {
          metadata: 'metadata',
          validator: validatorAddress,
          data: packV2ValidatorParams(query),
        }
      );
    }

    const query2 = Object.assign({}, query);
    query2.circuitIds = ['credentialAtomicQuerySigV2OnChain'];
    query2.skipClaimRevocationCheck = false;
    await setRequest(0, query2, await sig.getAddress());

    query2.circuitIds = ['credentialAtomicQueryMTPV2OnChain'];
    query2.skipClaimRevocationCheck = true;
    await setRequest(1, query2, await mtp.getAddress());
  }

  async function verifierFlow(
    validator: 'credentialAtomicQueryMTPV2OnChain' | 'credentialAtomicQuerySigV2OnChain'
  ): Promise<void> {
    const { inputs, pi_a, pi_b, pi_c } = prepareInputs(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      validator === 'credentialAtomicQuerySigV2OnChain'
        ? require('../common-data/valid_sig_user_non_genesis_challenge_address.json')
        : require('../common-data/valid_mtp_user_non_genesis_challenge_address.json')
    );

    const [signer] = await ethers.getSigners();
    const account = await signer.getAddress();
    const tokenId = Math.round(Math.random() * 1000);
    const tokenId2 = Math.round(Math.random() * 1000);

    // try transfer without given proof
    await expect(
      erc721.mint('0x900942Fd967cf176D0c0A1302ee0722e1468f580', tokenId)
    ).to.be.revertedWith(
      'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
    );

    const query2 = Object.assign({}, query);
    query2.circuitIds = [validator];
    query2.skipClaimRevocationCheck =
      validator === 'credentialAtomicQuerySigV2OnChain' ? false : true;

    const requestId =
      validator === 'credentialAtomicQuerySigV2OnChain'
        ? await erc721.TRANSFER_REQUEST_ID_SIG_VALIDATOR()
        : await erc721.TRANSFER_REQUEST_ID_MTP_VALIDATOR();
    expect(requestId).to.be.equal(validator === 'credentialAtomicQuerySigV2OnChain' ? 0 : 1);

    const requestData = await universalVerifier.getZKPRequest(requestId);
    const parsedRD = unpackV2ValidatorParams(requestData.data);

    expect(parsedRD.queryHash.toString()).to.be.equal(query2.queryHash);
    expect(parsedRD.claimPathKey.toString()).to.be.equal(query2.claimPathKey.toString());
    expect(parsedRD.circuitIds[0].toString()).to.be.equal(query2.circuitIds[0].toString());
    expect(parsedRD.operator.toString()).to.be.equal(query2.operator.toString());
    expect(parsedRD.claimPathNotExists.toString()).to.be.equal(
      query2.claimPathNotExists.toString()
    );

    await universalVerifier.submitZKPResponse(requestId, inputs, pi_a, pi_b, pi_c);
    const proofStatus = await universalVerifier.getProofStatus(account, requestId);
    expect(proofStatus.isProved).to.be.true; // check proof is assigned

    // check that tokens were minted
    const balanceBefore = await erc721.balanceOf(account);
    await erc721.mint(account, tokenId2);
    const balanceAfter = await erc721.balanceOf(account);
    expect(balanceAfter - balanceBefore).to.be.equal(
      BigInt('1')
    );
  }
});
