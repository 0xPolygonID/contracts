import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployERC20LinkedUniversalVerifier, deployValidatorStub } from '../utils/deploy-utils';

import { Contract } from 'ethers';
import { Blockchain, buildDIDType, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { StateDeployHelper } from '../helpers/StateDeployHelper';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';

describe('ERC 20 test', function () {
  let validator: Contract, verifierLib: Contract;
  let universalVerifier: Contract, erc20LinkedUniversalVerifier: Contract;
  let signer, request, paramsFromValidator, authResponse, response, crossChainProofs: any;

  async function deployContractsFixture() {
    [signer] = await ethers.getSigners();
    const typ0 = buildDIDType(DidMethod.Iden3, Blockchain.ReadOnly, NetworkId.NoNetwork);
    const stateDeployHelper = await StateDeployHelper.initialize();
    const { state } = await stateDeployHelper.deployState([typ0], 'Groth16VerifierStub');

    const validator = await ethers.deployContract('RequestValidatorStub');

    const authValidator = await deployValidatorStub('AuthValidatorStub');
    await authValidator.stub_setVerifyResults(1);

    const authMethod = {
      authMethod: 'stubAuth',
      validator: await authValidator.getAddress(),
      params: '0x'
    };

    const { universalVerifier, erc20LinkedUniversalVerifier, verifierLib } =
      await deployERC20LinkedUniversalVerifier('zkpVerifier', 'ZKP', await state.getAddress());
    await universalVerifier.setAuthMethod(authMethod);
    await universalVerifier.addValidatorToWhitelist(await validator.getAddress());

    return { universalVerifier, erc20LinkedUniversalVerifier, verifierLib, validator };
  }

  beforeEach(async () => {
    ({
      universalVerifier: universalVerifier,
      verifierLib: verifierLib,
      validator: validator,
      erc20LinkedUniversalVerifier: erc20LinkedUniversalVerifier
    } = await loadFixture(deployContractsFixture));
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

  it('Requests count', async () => {
    await validator.stub_setRequestParams([request.params], [paramsFromValidator]);
    await validator.stub_setInput('userID', 1);
    await universalVerifier.setRequests([request]);
    expect(await universalVerifier.getRequestsCount()).to.be.equal(1);
  });

  it('Example ERC20 Verifier: set zkp request + submit zkp response', async () => {
    await validator.stub_setRequestParams([request.params], [paramsFromValidator]);
    await validator.stub_setInput('userID', 1);

    const account = await signer.getAddress();

    await expect(
      erc20LinkedUniversalVerifier.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).revertedWithCustomError(universalVerifier, 'RequestIdNotFound');

    await expect(universalVerifier.getRequest(request.requestId))
      .revertedWithCustomError(universalVerifier, 'RequestIdNotFound')
      .withArgs(request.requestId); // check that request exists
    await universalVerifier.setRequests([request]);
    await erc20LinkedUniversalVerifier.setTransferRequestId(request.requestId);

    expect((await universalVerifier.getRequest(request.requestId)).requestId).to.be.equal(
      request.requestId
    );

    // try transfer without given proof
    await expect(
      erc20LinkedUniversalVerifier.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWith(
      'only identities who provided proof for transfer requests are allowed to receive tokens'
    );

    const requestId = await erc20LinkedUniversalVerifier.getTransferRequestId();
    const requestData = await universalVerifier.getRequest(requestId);
    expect(requestData.requestId).to.be.equal(request.requestId);

    await universalVerifier.submitResponse(authResponse, [response], crossChainProofs);
    const proofStatus = await universalVerifier.getRequestProofStatus(account, requestId);
    expect(proofStatus.isVerified).to.be.true; // check proof is assigned

    // check that tokens were minted
    const balanceBefore = await erc20LinkedUniversalVerifier.balanceOf(account);
    await erc20LinkedUniversalVerifier.mint(account);
    const balanceAfter = await erc20LinkedUniversalVerifier.balanceOf(account);
    expect(balanceAfter - balanceBefore).to.be.equal(BigInt('5000000000000000000'));

    // if proof is provided second time, we revert and no tokens are minted
    await expect(universalVerifier.submitResponse(authResponse, [response], crossChainProofs))
      .to.be.revertedWithCustomError(universalVerifier, 'ProofAlreadyVerified')
      .withArgs(request.requestId, account);

    await erc20LinkedUniversalVerifier.transfer(account, 1); // we send tokens to ourselves, but no error because we sent proof
  });
});
