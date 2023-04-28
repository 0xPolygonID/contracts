import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployPoseidons } from "../utils/deploy-poseidons.util";

const SMT_MAX_DEPTH = 64;

export class StateDeployHelper {
  constructor(
      private signers: SignerWithAddress[],
      private readonly enableLogging: boolean = false
  ) {}

  static async initialize(
      signers: SignerWithAddress | null = null,
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

  async deployStateV2(verifierContractName = "VerifierV2"): Promise<{
    state: Contract;
    verifier: Contract;
    stateLib: Contract;
    smtLib: Contract;
    poseidon1: Contract;
    poseidon2: Contract;
    poseidon3: Contract;
  }> {
    this.log("======== StateV2: deploy started ========");

    const owner = this.signers[0];

    this.log("deploying verifier...");

    const verifierFactory = await ethers.getContractFactory(verifierContractName);
    const verifier = await verifierFactory.deploy();
    await verifier.deployed();
    this.log(
        `${verifierContractName} contract deployed to address ${verifier.address} from ${owner.address}`
    );

    this.log("deploying poseidons...");
    const [poseidon1Elements, poseidon2Elements, poseidon3Elements] = await deployPoseidons(
        owner,
        [1, 2, 3]
    );

    this.log("deploying SmtLib...");
    const smtLib = await this.deploySmtLib(poseidon2Elements.address, poseidon3Elements.address);

    this.log("deploying StateLib...");
    const stateLib = await this.deployStateLib();

    this.log("deploying stateV2...");
    const StateV2Factory = await ethers.getContractFactory("StateV2", {
      libraries: {
        StateLib: stateLib.address,
        SmtLib: smtLib.address,
        PoseidonUnit1L: poseidon1Elements.address,
      },
    });
    const stateV2 = await upgrades.deployProxy(StateV2Factory, [verifier.address], {
      unsafeAllowLinkedLibraries: true,
    });
    await stateV2.deployed();
    this.log(`StateV2 contract deployed to address ${stateV2.address} from ${owner.address}`);

    this.log("======== StateV2: deploy completed ========");

    return {
      state: stateV2,
      verifier,
      stateLib,
      smtLib,
      poseidon1: poseidon1Elements,
      poseidon2: poseidon2Elements,
      poseidon3: poseidon3Elements,
    };
  }




  async deploySmtLib(
      poseidon2Address: string,
      poseidon3Address: string,
      contractName = "SmtLib"
  ): Promise<Contract> {
    const SmtLib = await ethers.getContractFactory(contractName, {
      libraries: {
        PoseidonUnit2L: poseidon2Address,
        PoseidonUnit3L: poseidon3Address,
      },
    });
    const smtLib = await SmtLib.deploy();
    await smtLib.deployed();
    this.enableLogging && this.log(`${contractName} deployed to:  ${smtLib.address}`);

    return smtLib;
  }

  async deployStateLib(stateLibName = "StateLib"): Promise<Contract> {
    const StateLib = await ethers.getContractFactory(stateLibName);
    const stateLib = await StateLib.deploy();
    await stateLib.deployed();
    this.enableLogging && this.log(`StateLib deployed to:  ${stateLib.address}`);

    return stateLib;
  }

  async upgradeValidator(
      validatorAddress: string,
      validatorContractName: string,

  ): Promise<{
    validator: Contract;
  }> {
    console.log("======== validator: upgrade started ========");

    const owner = this.signers[0];

    const ValidatorFactory = await ethers.getContractFactory(validatorContractName);
    const validator = await upgrades.upgradeProxy(validatorAddress, ValidatorFactory);
    const c = await validator.deployed();
    const s = await validator.getCircuitId()
    console.log("======== validator: " ,s );

    console.log(`Validator contract upgraded at address ${validator.address} from ${owner.address}`);

    console.log("======== validator: upgrade completed ========");

    return {
     validator
    };
  }
  private log(...args): void {
    this.enableLogging && console.log(args);
  }
}
