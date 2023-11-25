import { ethers, upgrades } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployClaimBuilder, deployIdentityLib } from '../utils/deploy-utils';

export class BalanceCredentialIssuerDeployHelper {
  constructor(
    private signers: SignerWithAddress[],
    private readonly enableLogging: boolean = false
  ) {}

  static async initialize(
    signers: SignerWithAddress[] | null = null,
    enableLogging = false
  ): Promise<BalanceCredentialIssuerDeployHelper> {
    let sgrs;
    if (signers === null) {
      sgrs = await ethers.getSigners();
    } else {
      sgrs = signers;
    }
    return new BalanceCredentialIssuerDeployHelper(sgrs, enableLogging);
  }

  async deployBalanceCredentialIssuer(
    smtLib: Contract,
    poseidon3: Contract,
    poseidon4: Contract,
    stateContractAddress: string
  ): Promise<{
    balanceCredentialIssuer: Contract;
  }> {
    const owner = this.signers[0];

    this.log('======== Balance credential issuer: deploy started ========');

    const cb = await deployClaimBuilder(true);
    const il = await deployIdentityLib(smtLib.address, poseidon3.address, poseidon4.address, true);

    const balanceCredentialIssuerFactory = await ethers.getContractFactory(
      'BalanceCredentialIssuer',
      {
        libraries: {
          ClaimBuilder: cb.address,
          IdentityLib: il.address
        }
      }
    );
    const balanceCredentialIssuer = await upgrades.deployProxy(
      balanceCredentialIssuerFactory,
      [stateContractAddress],
      {
        unsafeAllow: ['external-library-linking', 'struct-definition', 'state-variable-assignment']
      }
    );
    await balanceCredentialIssuer.deployed();
    this.log(
      `BalanceCredentialIssuer contract deployed to address ${balanceCredentialIssuer.address} from ${owner.address}`
    );

    this.log('======== Balance credential issuer: deploy completed ========');

    return {
      balanceCredentialIssuer
    };
  }

  private log(...args): void {
    this.enableLogging && console.log(args);
  }
}
