import { ethers, upgrades } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployClaimBuilder, deployIdentityLib } from '../utils/deploy-utils';

export class DeployHelper {
  constructor(
    private signers: SignerWithAddress[],
    private readonly enableLogging: boolean = false
  ) {}

  static async initialize(
    signers: SignerWithAddress[] | null = null,
    enableLogging = false
  ): Promise<DeployHelper> {
    let sgrs;
    if (signers === null) {
      sgrs = await ethers.getSigners();
    } else {
      sgrs = signers;
    }
    return new DeployHelper(sgrs, enableLogging);
  }

  async deployVerifierLib(): Promise<Contract> {
    const contractName = 'VerifierLib';

    const verifierLib = await ethers.deployContract(contractName);
    await verifierLib.waitForDeployment();

    console.log(`${contractName} deployed to:  ${await verifierLib.getAddress()}`);

    return verifierLib;
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
    const il = await deployIdentityLib(
      await smtLib.getAddress(),
      await poseidon3.getAddress(),
      await poseidon4.getAddress(),
      true
    );

    const balanceCredentialIssuerFactory = await ethers.getContractFactory(
      'BalanceCredentialIssuer',
      {
        libraries: {
          ClaimBuilder: await cb.getAddress(),
          IdentityLib: await il.getAddress(),
          PoseidonUnit4L: await poseidon4.getAddress()
        }
      }
    );
    const balanceCredentialIssuer = await upgrades.deployProxy(
      balanceCredentialIssuerFactory,
      [stateContractAddress],
      {
        initializer: 'initialize(address)',
        unsafeAllow: ['external-library-linking', 'struct-definition', 'state-variable-assignment']
      }
    );
    await balanceCredentialIssuer.waitForDeployment();
    this.log(
      `BalanceCredentialIssuer contract deployed to address ${await balanceCredentialIssuer.getAddress()} from ${await owner.getAddress()}`
    );

    this.log('======== Balance credential issuer: deploy completed ========');

    return {
      balanceCredentialIssuer
    };
  }

  async deployAddressOwnershipCredentialIssuer(
    smtLib: Contract,
    poseidon3: Contract,
    poseidon4: Contract,
    stateContractAddress: string
  ): Promise<{
    addressOwnershipCredentialIssuer: Contract;
  }> {
    const owner = this.signers[0];

    this.log('======== Address ownership credential issuer: deploy started ========');

    const cb = await deployClaimBuilder(true);
    const il = await deployIdentityLib(
      await smtLib.getAddress(),
      await poseidon3.getAddress(),
      await poseidon4.getAddress(),
      true
    );

    const verifierLib = await this.deployVerifierLib();

    const AddressOwnershipCredentialIssuerFactory = await ethers.getContractFactory(
      'AddressOwnershipCredentialIssuer',
      {
        libraries: {
          ClaimBuilder: await cb.getAddress(),
          IdentityLib: await il.getAddress(),
          PoseidonUnit4L: await poseidon4.getAddress(),
          VerifierLib: await verifierLib.getAddress()
        }
      }
    );
    const addressOwnershipCredentialIssuer = await upgrades.deployProxy(
      AddressOwnershipCredentialIssuerFactory,
      [stateContractAddress],
      {
        initializer: 'initialize(address)',
        unsafeAllow: ['external-library-linking', 'struct-definition', 'state-variable-assignment']
      }
    );
    await addressOwnershipCredentialIssuer.waitForDeployment();
    this.log(
      `AddressOwnershipCredentialIssuer contract deployed to address ${await addressOwnershipCredentialIssuer.getAddress()} from ${await owner.getAddress()}`
    );

    this.log('======== Address ownership credential issuer: deploy completed ========');

    return {
      addressOwnershipCredentialIssuer
    };
  }

  async deployERC20Verifier(
    stateContractAddress: string,
    name = 'ERC20ZKPVerifier',
    symbol = 'ERCZKP'
  ): Promise<{
    erc20Verifier: Contract;
  }> {
    const owner = this.signers[0];

    this.log('======== ERC20 Verifier: deploy started ========');

    const verifierLib = await this.deployVerifierLib();

    const erc20VerifierFactory = await ethers.getContractFactory('ERC20Verifier', {
      libraries: {
        VerifierLib: await verifierLib.getAddress()
      }
    });
    const erc20Verifier = await upgrades.deployProxy(
      erc20VerifierFactory,
      [name, symbol, stateContractAddress],
      {
        initializer: 'initialize(string, string, address)',
        unsafeAllow: ['external-library-linking', 'struct-definition', 'state-variable-assignment']
      }
    );
    await erc20Verifier.waitForDeployment();
    this.log(
      `erc20Verifier contract deployed to address ${await erc20Verifier.getAddress()} from ${await owner.getAddress()}`
    );

    this.log('======== erc20Verifier: deploy completed ========');

    return {
      erc20Verifier
    };
  }

  private log(...args): void {
    this.enableLogging && console.log(args);
  }
}
