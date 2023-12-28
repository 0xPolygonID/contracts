import { ethers } from 'hardhat';
import { BalanceCredentialIssuerDeployHelper } from '../helpers/BalanceCredentialIssuerDeployHelper';
import { StateDeployHelper } from '../helpers/StateDeployHelper';

describe.only('Reproduce identity life cycle', function () {
  this.timeout(10000);
  let identity;

  before(async function () {
    const signer = await ethers.getImpersonatedSigner('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

    const stDeployHelper = await StateDeployHelper.initialize([signer]);
    const deployHelper = await BalanceCredentialIssuerDeployHelper.initialize([signer], true);
    const stContracts = await stDeployHelper.deployState();
    const contracts = await deployHelper.deployBalanceCredentialIssuer(
      stContracts.smtLib,
      stContracts.poseidon3,
      stContracts.poseidon4,
      stContracts.state.address
    );
    identity = contracts.balanceCredentialIssuer;
  });

  describe('create identity', function () {
    it("validate identity's id", async function () {
      const tx = await identity.issueCredential(1);
      await tx.wait();
      const vcs = await identity.getCredentials(1);
      console.log('json result:', JSON.stringify(vcs[0]));
    });
  });
});
