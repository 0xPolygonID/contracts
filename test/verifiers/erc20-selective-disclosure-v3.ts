import { expect } from 'chai';
import { deployERC20ZKPVerifierToken, deployValidatorStub } from '../utils/deploy-utils';
import { Blockchain, buildDIDType, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { StateDeployHelper } from '../helpers/StateDeployHelper';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';

describe('ERC 20 Selective Disclosure test', function () {
  let validator: Contract, verifierLib: Contract, token: Contract;
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

    const { erc20Verifier: verifier, verifierLib } = await deployERC20ZKPVerifierToken(
      'zkpVerifierSD',
      'ZKP-SD',
      await state.getAddress(),
      'ERC20SelectiveDisclosureVerifier'
    );
    await verifier.setAuthMethod(authMethod);

    return { verifier, verifierLib, validator };
  }

  beforeEach(async () => {
    ({
      verifier: token,
      verifierLib: verifierLib,
      validator: validator
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

  it('Example ERC20 SD Verifier', async () => {
    const account = await signer.getAddress();
    expect(token.transfer).not.to.be.undefined;
    expect(token.submitResponse).not.to.be.undefined;

    expect(await token.balanceOf(account)).to.equal(0);

    // must be no queries
    expect(await token.getRequestsCount()).to.be.equal(0);

    // try transfer without given proof (request does not exist)
    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWithCustomError(token, 'RequestIdNotFound');

    const operatorOutput = 5;
    const userID = 1;
    await validator.stub_setRequestParams([request.params], [paramsFromValidator]);
    await validator.stub_setInput('userID', userID);
    await validator.stub_setVerifyResults([
      {
        name: 'userID',
        value: userID,
        rawValue: '0x'
      },
      {
        name: 'operatorOutput',
        value: operatorOutput,
        rawValue: '0x'
      }
    ]);

    await token.setRequests([request]);
    await token.setTransferRequestId(request.requestId);
    expect(await token.getTransferRequestId()).to.be.equal(request.requestId);

    // try transfer without given proof (request exists)
    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWith(
      'only identities who provided proof for transfer requests are allowed to receive tokens'
    );

    // check that query is assigned
    expect(await token.getRequestsCount()).to.be.equal(1);
    expect(await token.isRequestProofVerified(account, request.requestId)).to.be.false;

    const nonExistingRequestId = 2;
    // submit response for non-existing request
    await expect(
      token.submitResponse(
        authResponse,
        [{ ...response, requestId: nonExistingRequestId }],
        crossChainProofs
      )
    )
      .to.be.revertedWithCustomError(token, 'RequestIdNotFound')
      .withArgs(nonExistingRequestId);

    await token.submitResponse(authResponse, [response], crossChainProofs);
    expect(await token.isRequestProofVerified(account, request.requestId)).to.be.true; // check proof is assigned

    // check that tokens were minted
    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    // if proof is provided second time, we revert and no tokens are minted
    await expect(token.submitResponse(authResponse, [response], crossChainProofs))
      .to.be.revertedWithCustomError(verifierLib, 'ProofAlreadyVerified')
      .withArgs(request.requestId, account);

    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    await token.transfer(account, 1); // we send tokens to ourselves, but no error because we sent proof
    expect(await token.balanceOf(account)).to.equal(BigInt('5000000000000000000'));

    // check operator output
    expect(
      await token.getResponseFieldValue(request.requestId, account, 'operatorOutput')
    ).to.be.equal(operatorOutput);
  });
});
