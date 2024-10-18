import { expect } from 'chai';
import {
  deployERC20ZKPVerifierToken,
  deployValidatorContracts,
  prepareInputs,
  publishState
} from '../utils/deploy-utils';
import { packV3ValidatorParams, unpackV3ValidatorParams } from '../utils/pack-utils';
import { Blockchain, buildDIDType, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { StateDeployHelper } from '../helpers/StateDeployHelper';

const tenYears = 315360000;
describe('ERC 20 Selective Disclosure (V3) test', function () {
  let state: any, validator: any;

  beforeEach(async () => {
    const typ0 = buildDIDType(DidMethod.Iden3, Blockchain.ReadOnly, NetworkId.NoNetwork);
    const typ1 = buildDIDType(DidMethod.PolygonId, Blockchain.Polygon, NetworkId.Mumbai);
    const stateDeployHelper = await StateDeployHelper.initialize();
    ({ state } = await stateDeployHelper.deployState([typ0, typ1]));
    const stateAddress = await state.getAddress();

    const contractValidator = await deployValidatorContracts(
      'VerifierV3Wrapper',
      'CredentialAtomicQueryV3Validator',
      stateAddress
    );
    validator = contractValidator.validator;
  });

  async function erc20SDVerifierFlow(callBack: (q, t, r) => Promise<void>): Promise<void> {
    const token: any = await deployERC20ZKPVerifierToken(
      'zkpVerifierSD',
      'ZKP-SD',
      await state.getAddress(),
      'ERC20SelectiveDisclosureVerifier'
    );
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await publishState(state, require('./common-data/user_state_transition.json'));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await publishState(state, require('./common-data/issuer_genesis_state.json'));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await publishState(
      state,
      require('./common-data/issuer_from_genesis_state_to_first_auth_disabled_transition_v3.json')
    );

    const { inputs, pi_a, pi_b, pi_c } = prepareInputs(require('./common-data/valid_sig_v3.json'));

    const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    expect(token.transfer).not.to.be.undefined;
    expect(token.submitZKPResponse).not.to.be.undefined;

    expect(await token.balanceOf(account)).to.equal(0);

    // must be no queries
    expect(await token.getZKPRequestsCount()).to.be.equal(0);

    // set transfer request id

    const query = {
      schema: BigInt('180410020913331409885634153623124536270'),
      claimPathKey: BigInt(
        '8566939875427719562376598811066985304309117528846759529734201066483458512800'
      ),
      operator: BigInt(1),
      slotIndex: BigInt(0),
      value: ['1420070400000000000', ...new Array(63).fill('0')].map((x) => BigInt(x)),
      circuitIds: ['credentialAtomicQueryV3OnChain-beta.1'],
      queryHash: BigInt(
        '19185468473610285815446195195707572856383167010831244369191309337886545428382'
      ),
      metadata: 'test medatada',
      skipClaimRevocationCheck: false,
      groupID: 1,
      nullifierSessionID: '0',
      verifierID: '21929109382993718606847853573861987353620810345503358891473103689157378049',
      proofType: 1
    };

    const requestId = await token.TRANSFER_REQUEST_ID_V3_VALIDATOR();
    expect(requestId).to.be.equal(3);

    // try transfer without given proof (request does not exist)
    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWith("request id doesn't exist");

    await callBack(query, token, requestId);

    // try transfer without given proof (request exists)
    await expect(
      token.transfer('0x900942Fd967cf176D0c0A1302ee0722e1468f580', 1)
    ).to.be.revertedWith(
      'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
    );

    const requestData = await token.getZKPRequest(requestId);
    const parsed = unpackV3ValidatorParams(requestData.data);

    expect(parsed.queryHash.toString()).to.be.equal(query.queryHash);
    expect(parsed.claimPathKey.toString()).to.be.equal(query.claimPathKey.toString());
    expect(parsed.circuitIds[0].toString()).to.be.equal(query.circuitIds[0].toString());
    expect(parsed.operator.toString()).to.be.equal(query.operator.toString());
    // check that query is assigned
    expect(await token.getZKPRequestsCount()).to.be.equal(1);

    // submit response for non-existing request
    await expect(token.submitZKPResponse(1, inputs, pi_a, pi_b, pi_c)).to.be.revertedWith(
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

    // check operator output
    expect(await token.getOperatorOutput()).to.be.equal(0);
  }

  it('Example ERC20 SD Verifier', async () => {
    await validator.setProofExpirationTimeout(tenYears);
    await erc20SDVerifierFlow(async (query, token, requestId) => {
      await token.setZKPRequest(requestId, {
        metadata: 'metadata',
        validator: await validator.getAddress(),
        data: packV3ValidatorParams(query, [])
      });
    });
  });
});
