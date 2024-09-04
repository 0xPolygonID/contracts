import { ethers, upgrades } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployClaimBuilder, deployIdentityLib } from '../utils/deploy-utils';

export class OnchainIdentityDeployHelper {
  constructor(
    private signers: SignerWithAddress[],
    private readonly enableLogging: boolean = false
  ) {}

  static async initialize(
    signers: SignerWithAddress[] | null = null,
    enableLogging = false
  ): Promise<OnchainIdentityDeployHelper> {
    let sgrs;
    if (signers === null) {
      sgrs = await ethers.getSigners();
    } else {
      sgrs = signers;
    }
    return new OnchainIdentityDeployHelper(sgrs, enableLogging);
  }

  async deployIdentity(
    stateAddress: string,
    smtLib: Contract,
    poseidon3: Contract,
    poseidon4: Contract
  ): Promise<{
    identity: Contract;
  }> {
    const owner = this.signers[0];

    this.log('======== Identity: deploy started ========');

    const cb = await deployClaimBuilder();
    const il = await deployIdentityLib(
      await smtLib.getAddress(),
      await poseidon3.getAddress(),
      await poseidon4.getAddress()
    );

    this.log('deploying Identity...');
    const IdentityFactory = await ethers.getContractFactory('IdentityExample', {
      libraries: {
        ClaimBuilder: await cb.getAddress(),
        IdentityLib: await il.getAddress()
      }
    });
    const Identity = await upgrades.deployProxy(IdentityFactory, [stateAddress], {
      initializer: 'initialize(address)',
      unsafeAllowLinkedLibraries: true
      }
    );
    await Identity.waitForDeployment();
    this.log(
      `Identity contract deployed to address ${await Identity.getAddress()} from ${await owner.getAddress()}`
    );

    this.log('======== Identity: deploy completed ========');

    return {
      identity: Identity
    };
  }

  private log(...args): void {
    this.enableLogging && console.log(args);
  }
}
