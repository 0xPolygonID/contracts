import { expect } from 'chai';
import {
  deployERC20ZKPVerifierToken,
  deployValidatorContracts,
  prepareInputs,
  publishState
} from '../utils/deploy-utils';
import { packV2ValidatorParams, unpackV2ValidatorParams } from '../utils/pack-utils';
import { Contract } from 'ethers';
import { Blockchain, buildDIDType, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { StateDeployHelper } from '../helpers/StateDeployHelper';

const tenYears = 315360000;
describe('ERC 20 test', function () {
  const REQUEST_ID_SIG_VALIDATOR = 1;
  const REQUEST_ID_MTP_VALIDATOR = 2;
  const SIG_INPUTS = prepareInputs(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./common-data/valid_sig_user_non_genesis_challenge_address.json')
  );
  const MTP_INPUTS = prepareInputs(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./common-data/valid_mtp_user_non_genesis_challenge_address.json')
  );
  let state: Contract, sig: Contract, mtp: Contract, token: Contract;

  async function setZKPRequests() {
    async function checkRequest(validatorId: number) {
      const requestData = await token.getZKPRequest(validatorId);
      const parsed = unpackV2ValidatorParams(requestData.data);
      expect(parsed.queryHash.toString()).to.be.equal(query.queryHash);
      expect(parsed.claimPathKey.toString()).to.be.equal(query.claimPathKey.toString());
      expect(parsed.circuitIds[0].toString()).to.be.equal(query.circuitIds[0].toString());
      expect(parsed.operator.toString()).to.be.equal(query.operator.toString());
      expect(parsed.claimPathNotExists.toString()).to.be.equal(query.claimPathNotExists.toString());
    }

    // #################### Set SIG V2 Validator ####################
    const query = {
      schema: BigInt('180410020913331409885634153623124536270'),
      claimPathKey: BigInt(
        '8566939875427719562376598811066985304309117528846759529734201066483458512800'
      ),
      operator: BigInt(1),
      slotIndex: BigInt(0),
      value: ['1420070400000000000', ...new Array(63).fill('0')].map((x) => BigInt(x)),
      circuitIds: ['credentialAtomicQuerySigV2OnChain'],
      queryHash: BigInt(
        '1496222740463292783938163206931059379817846775593932664024082849882751356658'
      ),
      claimPathNotExists: 0,
      metadata: 'test medatada',
      skipClaimRevocationCheck: false
    };

    await token.setZKPRequest(REQUEST_ID_SIG_VALIDATOR, {
      metadata: 'metadata',
      validator: await sig.getAddress(),
      data: packV2ValidatorParams(query)
    });

    await checkRequest(REQUEST_ID_SIG_VALIDATOR);

    // #################### Set MTP V2 Validator ####################
    query.circuitIds = ['credentialAtomicQueryMTPV2OnChain'];
    query.skipClaimRevocationCheck = true;

    await token.setZKPRequest(REQUEST_ID_MTP_VALIDATOR, {
      metadata: 'metadata',
      validator: await mtp.getAddress(),
      data: packV2ValidatorParams(query)
    });

    await checkRequest(REQUEST_ID_MTP_VALIDATOR);
  }

  async function erc20VerifierFlow(
    validator: 'SIG' | 'MTP'
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await publishState(state, require('./common-data/user_state_transition.json'));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await publishState(state, require('./common-data/issuer_genesis_state.json'));

    const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    expect(token.transfer).not.to.be.undefined;
    expect(token.submitZKPResponse).not.to.be.undefined;

    expect(await token.balanceOf(account)).to.equal(0);
    expect(await token.getZKPRequestsCount()).to.be.equal(0);

    let requestId, inputs, pi_a, pi_b, pi_c;
    if (validator === 'SIG') {
      requestId = await token.TRANSFER_REQUEST_ID_SIG_VALIDATOR();
      expect(requestId).to.be.equal(REQUEST_ID_SIG_VALIDATOR);
      ({ inputs, pi_a, pi_b, pi_c } = SIG_INPUTS);
    } else {
      requestId = await token.TRANSFER_REQUEST_ID_MTP_VALIDATOR();
      expect(requestId).to.be.equal(REQUEST_ID_MTP_VALIDATOR);
      ({ inputs, pi_a, pi_b, pi_c } = MTP_INPUTS);
    }

    // try transfer without given proof (request does not exist)
    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWith("request id doesn't exist");

    await setZKPRequests();

    // try transfer without given proof (request exists)
    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWith(
      'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
    );

    // check that query is assigned
    expect(await token.getZKPRequestsCount()).to.be.equal(2);

    // submit response for non-existing request
    await expect(token.submitZKPResponse(3, inputs, pi_a, pi_b, pi_c)).to.be.revertedWith(
      "request id doesn't exist"
    );

    await token.submitZKPResponse(requestId, inputs, pi_a, pi_b, pi_c);
    expect(await token.isProofVerified(account, requestId)).to.be.true; // check proof is assigned

    // check that tokens were minted
    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    // if proof is provided second time, address is not receiving airdrop tokens, but no revert
    await token.submitZKPResponse(requestId, inputs, pi_a, pi_b, pi_c);

    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    await token.transfer(account, 1); // we send tokens to ourselves, but no error because we sent proof
    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));
  }

  beforeEach(async () => {
    const typ0 = buildDIDType(DidMethod.Iden3, Blockchain.ReadOnly, NetworkId.NoNetwork);
    const typ1 = buildDIDType(DidMethod.Iden3, Blockchain.Polygon, NetworkId.Mumbai);
    const stateDeployHelper = await StateDeployHelper.initialize();
    ({ state } = await stateDeployHelper.deployState([typ0, typ1]));
    const stateAddress = await state.getAddress();

    const contractsSig = await deployValidatorContracts(
      'VerifierSigWrapper',
      'CredentialAtomicQuerySigV2Validator',
      stateAddress
    );
    sig = contractsSig.validator;

    const contractsMTP = await deployValidatorContracts(
      'VerifierMTPWrapper',
      'CredentialAtomicQueryMTPV2Validator',
      stateAddress
    );
    mtp = contractsMTP.validator;

    token = await deployERC20ZKPVerifierToken('zkpVerifier', 'ZKP', stateAddress);
    await sig.setProofExpirationTimeout(tenYears);
    await mtp.setProofExpirationTimeout(tenYears);
  });

  it('Example ERC20 Verifier: set zkp request Sig validator + submit zkp response', async () => {
    await erc20VerifierFlow('SIG');
  });

  it('Example ERC20 Verifier: set zkp request Mtp validator + submit zkp response', async () => {
    await erc20VerifierFlow('MTP');
  });
});
