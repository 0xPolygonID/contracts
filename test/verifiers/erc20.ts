import { expect } from 'chai';
import { deployERC20ZKPVerifierToken, deployValidatorStub } from '../utils/deploy-utils';
import { Contract } from 'ethers';
import { Blockchain, buildDIDType, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { StateDeployHelper } from '../helpers/StateDeployHelper';
import { ethers } from 'hardhat';

describe('ERC 20 test', function () {
  let validator: Contract, verifierLib: Contract, token: Contract;
  let signer, request, paramsFromValidator, authResponse, response, crossChainProofs: any;

  async function setRequests() {
    await token.setRequests([request]);
    await token.setTransferRequestId(request.requestId);

    const requestData = await token.getRequest(request.requestId);
    expect(requestData.requestId).to.be.equal(request.requestId);
  }

  async function deployContractsFixture() {
    [signer] = await ethers.getSigners();
    const typ0 = buildDIDType(DidMethod.Iden3, Blockchain.ReadOnly, NetworkId.NoNetwork);
    const stateDeployHelper = await StateDeployHelper.initialize(null, false);
    const { state } = await stateDeployHelper.deployState([typ0], 'Groth16VerifierStub');

    const validator = await ethers.deployContract('RequestValidatorStub');

    const authValidator = await deployValidatorStub('AuthValidatorStub');
    await authValidator.stub_setVerifyResults(1);

    const authMethod = {
      authMethod: 'stubAuth',
      validator: await authValidator.getAddress(),
      params: '0x'
    };

    const { erc20Verifier: verifier, verifierLib } = await deployERC20ZKPVerifierToken(
      'zkpVerifier',
      'ZKP',
      await state.getAddress()
    );
    await verifier.setAuthMethod(authMethod);

    return { verifier, verifierLib, validator };
  }

  beforeEach(async () => {
    ({
      verifier: token,
      verifierLib: verifierLib,
      validator: validator
    } = await deployContractsFixture());
    const requestId = 1;
    request = {
      requestId: requestId,
      metadata: '0x',
      validator: await validator.getAddress(),
      creator: signer.address,
      params: '0x'
    };
    paramsFromValidator = [
      { name: 'groupID', value: 0 },
      { name: 'verifierID', value: 0 },
      { name: 'nullifierSessionID', value: 0 }
    ];

    authResponse = {
      authMethod: 'stubAuth',
      proof: '0x'
    };
    response = {
      requestId: requestId,
      proof: '0x',
      metadata: '0x'
    };

    crossChainProofs = '0x';
  });

  it('Example ERC20 Verifier: set request + submit response', async () => {
    const account = await signer.getAddress();
    expect(token.transfer).not.to.be.undefined;
    expect(token.submitResponse).not.to.be.undefined;

    expect(await token.balanceOf(account)).to.equal(0);
    expect(await token.getRequestsCount()).to.be.equal(0);

    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWithCustomError(token, 'RequestIdNotFound');

    await validator.stub_setRequestParams([request.params], [paramsFromValidator]);
    await validator.stub_setInput('userID', 1);
    await setRequests();

    // try transfer without given proof (request exists)
    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWith(
      'only identities who provided proof for transfer requests are allowed to receive tokens'
    );

    // check that query is assigned
    expect(await token.getRequestsCount()).to.be.equal(1);

    expect(await token.isRequestProofVerified(account, request.requestId)).to.be.false;

    const txSubmitResponse = await token.submitResponse(authResponse, [response], crossChainProofs);

    await txSubmitResponse.wait();

    expect(await token.isRequestProofVerified(account, request.requestId)).to.be.true; // check proof is assigned

    // check that tokens were minted
    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    // if proof is provided second time, we don't revert but no tokens are minted
    await expect(token.submitResponse(authResponse, [response], crossChainProofs))
      .to.be.revertedWithCustomError(verifierLib, 'ProofAlreadyVerified')
      .withArgs(request.requestId, account);

    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    await token.transfer(account, 1); // we send tokens to ourselves, but no error because we sent proof
    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));
  });
});
