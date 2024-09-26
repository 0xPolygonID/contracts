import { ethers, upgrades, network } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployPoseidons } from '../utils/deploy-poseidons.util';
import { chainIdDefaultIdTypeMap } from './ChainIdDefTypeMap';
import { chainIdInfoMap } from './constants';

const SMT_MAX_DEPTH = 64;

export class StateDeployHelper {
  constructor(
    private signers: SignerWithAddress[],
    private readonly enableLogging: boolean = false
  ) {}

  static async initialize(
    signers: SignerWithAddress[] | null = null,
    enableLogging = false
  ): Promise<StateDeployHelper> {
    let sgrs;
    if (signers === null) {
      sgrs = await ethers.getSigners();
    } else {
      sgrs = signers;
    }
    return new StateDeployHelper(sgrs, enableLogging);
  }

  async deployCrossChainProofValidator(
    contractName = 'CrossChainProofValidator',
    domainName = 'StateInfo',
    signatureVersion = '1'
  ): Promise<Contract> {
    const chainId = parseInt(await network.provider.send('eth_chainId'), 16);
    const oracleSigningAddress = chainIdInfoMap.get(chainId)?.oracleSigningAddress;

    const crossChainProofValidator = await ethers.deployContract(contractName, [
      domainName,
      signatureVersion,
      oracleSigningAddress
    ]);
    await crossChainProofValidator.waitForDeployment();
    this.log(`${contractName} deployed to:`, await crossChainProofValidator.getAddress());
    return crossChainProofValidator;
  }

  async deployStateCrossChainLib(StateCrossChainLibName = 'StateCrossChainLib'): Promise<Contract> {
    const stateCrossChainLib = await ethers.deployContract(StateCrossChainLibName);
    await stateCrossChainLib.waitForDeployment();
    this.enableLogging &&
      this.log(`StateCrossChainLib deployed to:  ${await stateCrossChainLib.getAddress()}`);

    return stateCrossChainLib;
  }

  async deployState(
    supportedIdTypes: Uint8Array[] = [],
    g16VerifierContractName:
      | 'Groth16VerifierStateTransition'
      | 'Groth16VerifierStub' = 'Groth16VerifierStateTransition'
  ): Promise<{
    state: Contract;
    groth16verifier: Contract;
    stateLib: Contract;
    smtLib: Contract;
    stateCrossChainLib: Contract;
    crossChainProofValidator: Contract;
    poseidon1: Contract;
    poseidon2: Contract;
    poseidon3: Contract;
    poseidon4: Contract;
    defaultIdType;
  }> {
    this.log('======== State: deploy started ========');
    const { defaultIdType, chainId } = await this.getDefaultIdType();
    this.log(`found defaultIdType ${defaultIdType} for chainId ${chainId}`);

    const owner = this.signers[0];

    this.log('deploying Groth16VerifierStateTransition...');

    if (
      g16VerifierContractName !== 'Groth16VerifierStateTransition' &&
      g16VerifierContractName !== 'Groth16VerifierStub'
    ) {
      throw new Error('invalid verifierContractName');
    }

    const verifierFactory = await ethers.getContractFactory(g16VerifierContractName);
    const g16Verifier = await verifierFactory.deploy();
    await g16Verifier.waitForDeployment();
    this.log(
      `${g16VerifierContractName} contract deployed to address ${await g16Verifier.getAddress()} from ${await owner.getAddress()}`
    );

    this.log('deploying poseidons...');
    const [poseidon1Elements, poseidon2Elements, poseidon3Elements, poseidon4Elements] =
      await deployPoseidons(owner, [1, 2, 3, 4]);

    this.log('deploying SmtLib...');
    const smtLib = await this.deploySmtLib(
      await poseidon2Elements.getAddress(),
      await poseidon3Elements.getAddress()
    );

    this.log('deploying StateLib...');
    const stateLib = await this.deployStateLib();

    this.log('deploying StateCrossChainLib...');
    const stateCrossChainLib = await this.deployStateCrossChainLib('StateCrossChainLib');

    this.log('deploying CrossChainProofValidator...');
    const crossChainProofValidator = await this.deployCrossChainProofValidator();

    this.log('deploying state...');
    const StateFactory = await ethers.getContractFactory('State', {
      libraries: {
        StateLib: await stateLib.getAddress(),
        SmtLib: await smtLib.getAddress(),
        PoseidonUnit1L: await poseidon1Elements.getAddress(),
        StateCrossChainLib: await stateCrossChainLib.getAddress()
      }
    });

    const state = await upgrades.deployProxy(
      StateFactory,
      [
        await g16Verifier.getAddress(),
        defaultIdType,
        await owner.getAddress(),
        await crossChainProofValidator.getAddress()
      ],
      {
        unsafeAllowLinkedLibraries: true
      }
    );
    await state.waitForDeployment();
    this.log(
      `State contract deployed to address ${await state.getAddress()} from ${await owner.getAddress()}`
    );

    if (supportedIdTypes.length) {
      for (const idType of supportedIdTypes) {
        const tx = await state.setSupportedIdType(idType, true);
        await tx.wait();
      }
    }

    this.log('======== State: deploy completed ========');

    return {
      state,
      groth16verifier: g16Verifier,
      stateLib,
      smtLib,
      stateCrossChainLib,
      crossChainProofValidator: crossChainProofValidator,
      poseidon1: poseidon1Elements,
      poseidon2: poseidon2Elements,
      poseidon3: poseidon3Elements,
      poseidon4: poseidon4Elements,
      defaultIdType
    };
  }

  async deploySmtLib(
    poseidon2Address: string,
    poseidon3Address: string,
    contractName = 'SmtLib'
  ): Promise<Contract> {
    const SmtLib = await ethers.getContractFactory(contractName, {
      libraries: {
        PoseidonUnit2L: poseidon2Address,
        PoseidonUnit3L: poseidon3Address
      }
    });
    const smtLib = await SmtLib.deploy();
    await smtLib.waitForDeployment();
    this.enableLogging && this.log(`${contractName} deployed to:  ${await smtLib.getAddress()}`);

    return smtLib;
  }

  async deployStateLib(stateLibName = 'StateLib'): Promise<Contract> {
    const StateLib = await ethers.getContractFactory(stateLibName);
    const stateLib = await StateLib.deploy();
    await stateLib.waitForDeployment();
    this.enableLogging && this.log(`StateLib deployed to:  ${await stateLib.getAddress()}`);

    return stateLib;
  }

  async upgradeValidator(
    validatorAddress: string,
    validatorContractName: string
  ): Promise<{
    validator: Contract;
  }> {
    console.log('======== validator: upgrade started ========');

    const owner = this.signers[0];

    const ValidatorFactory = await ethers.getContractFactory(validatorContractName);
    const validator = await upgrades.upgradeProxy(validatorAddress, ValidatorFactory);
    await validator.waitForDeployment();
    const s = await validator.getSupportedCircuitIds();
    console.log('======== validator: ', s);

    console.log(
      `Validator contract upgraded at address ${await validator.getAddress()} from ${await owner.getAddress()}`
    );

    console.log('======== validator: upgrade completed ========');

    return {
      validator
    };
  }

  async getDefaultIdType(): Promise<{ defaultIdType: number; chainId: number }> {
    const chainId = parseInt(await network.provider.send('eth_chainId'), 16);
    const defaultIdType = chainIdDefaultIdTypeMap.get(chainId);
    if (!defaultIdType) {
      throw new Error(`Failed to find defaultIdType in Map for chainId ${chainId}`);
    }
    return { defaultIdType, chainId };
  }

  private log(...args): void {
    this.enableLogging && console.log(args);
  }
}
