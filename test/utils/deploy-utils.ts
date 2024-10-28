import { ethers, upgrades } from 'hardhat';
import { StateDeployHelper } from '../helpers/StateDeployHelper';
import { Contract } from 'ethers';

export async function deploySpongePoseidon(poseidon6ContractAddress: string): Promise<Contract> {
  const SpongePoseidonFactory = await ethers.getContractFactory('SpongePoseidon', {
    libraries: {
      PoseidonUnit6L: poseidon6ContractAddress
    }
  });

  const spongePoseidon = await SpongePoseidonFactory.deploy();
  await spongePoseidon.waitForDeployment();
  console.log('SpongePoseidon deployed to:', await spongePoseidon.getAddress());
  return spongePoseidon;
}

export async function deployValidatorContracts(
  verifierContractWrapperName: string,
  validatorContractName: string,
  stateAddress = ''
): Promise<{
  state: any;
  verifierWrapper: any;
  validator: any;
}> {
  if (!stateAddress) {
    const stateDeployHelper = await StateDeployHelper.initialize();
    const { state } = await stateDeployHelper.deployState();
    stateAddress = await state.getAddress();
  }

  const ValidatorContractVerifierWrapper = await ethers.getContractFactory(
    verifierContractWrapperName
  );
  const validatorContractVerifierWrapper = await ValidatorContractVerifierWrapper.deploy();

  await validatorContractVerifierWrapper.waitForDeployment();
  console.log(
    'Validator Verifier Wrapper deployed to:',
    await validatorContractVerifierWrapper.getAddress()
  );

  const ValidatorContract = await ethers.getContractFactory(validatorContractName);

  const [signer] = await ethers.getSigners();
  const validatorContractProxy = await upgrades.deployProxy(ValidatorContract, [
    await validatorContractVerifierWrapper.getAddress(),
    stateAddress,
    await signer.getAddress()
  ]);

  await validatorContractProxy.waitForDeployment();
  console.log(`${validatorContractName} deployed to: ${await validatorContractProxy.getAddress()}`);
  const signers = await ethers.getSigners();

  const state = await ethers.getContractAt('State', stateAddress, signers[0]);
  return {
    validator: validatorContractProxy,
    verifierWrapper: validatorContractVerifierWrapper,
    state
  };
}

export async function deployVerifierLib(): Promise<Contract> {
  const contractName = 'VerifierLib';
  const VerifierLib = await ethers.getContractFactory(contractName);
  const verifierLib = await VerifierLib.deploy();
  await verifierLib.waitForDeployment();

  console.log(`${contractName} deployed to:  ${await verifierLib.getAddress()}`);

  return verifierLib;
}

export async function deployERC20ZKPVerifierToken(
  name: string,
  symbol: string,
  stateAddress: string,
  contractName = 'ERC20Verifier'
): Promise<Contract> {
  const verifierLib = await deployVerifierLib();
  const signers = await ethers.getSigners();
  const ERC20Verifier = await ethers.getContractFactory(contractName, {
    signer: signers[0],
    libraries: {
      VerifierLib: await verifierLib.getAddress()
    }
  });
  const erc20Verifier = await upgrades.deployProxy(ERC20Verifier, [name, symbol, stateAddress], {
    unsafeAllowLinkedLibraries: true
  });
  console.log(contractName + ' deployed to:', await erc20Verifier.getAddress());
  return erc20Verifier;
}

export interface VerificationInfo {
  inputs: Array<string>;
  pi_a: Array<string>;
  pi_b: Array<Array<string>>;
  pi_c: Array<string>;
}

export function prepareInputs(json: any): VerificationInfo {
  const { proof, pub_signals } = json;
  const { pi_a, pi_b, pi_c } = proof;
  const [[p1, p2], [p3, p4]] = pi_b;
  const preparedProof = {
    pi_a: pi_a.slice(0, 2),
    pi_b: [
      [p2, p1],
      [p4, p3]
    ],
    pi_c: pi_c.slice(0, 2)
  };

  return { inputs: pub_signals, ...preparedProof };
}

export function toBigNumber({ inputs, pi_a, pi_b, pi_c }: VerificationInfo) {
  return {
    inputs: inputs.map((input) => BigInt(input)),
    pi_a: pi_a.map((input) => BigInt(input)),
    pi_b: pi_b.map((arr) => arr.map((input) => BigInt(input))),
    pi_c: pi_c.map((input) => BigInt(input))
  };
}

export async function publishState(
  state: Contract,
  json: { [key: string]: string }
): Promise<{
  oldState: string;
  newState: string;
  id: string;
  blockNumber: number;
  timestamp: number;
}> {
  const {
    inputs: [id, oldState, newState, isOldStateGenesis],
    pi_a,
    pi_b,
    pi_c
  } = prepareInputs(json);

  const transitStateTx = await state.transitState(
    id,
    oldState,
    newState,
    isOldStateGenesis === '1',
    pi_a,
    pi_b,
    pi_c
  );

  const { blockNumber } = await transitStateTx.wait();
  const { timestamp } = await ethers.provider.getBlock(transitStateTx.blockNumber);

  return {
    oldState,
    newState,
    id,
    blockNumber,
    timestamp
  };
}

export function toJson(data) {
  return JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)).replace(
    /"(-?\d+)n"/g,
    (_, a) => a
  );
}

export async function deployClaimBuilder(enableLogging = false): Promise<Contract> {
  const ClaimBuilder = await ethers.getContractFactory('ClaimBuilder');
  const cb = await ClaimBuilder.deploy();
  await cb.waitForDeployment();
  enableLogging && console.log(`ClaimBuilder deployed to: ${await cb.getAddress()}`);

  return cb;
}

export async function deployIdentityLib(
  smtpAddress: string,
  poseidonUtil3lAddress: string,
  poseidonUtil4lAddress: string,
  enableLogging = false
): Promise<Contract> {
  const Identity = await ethers.getContractFactory('IdentityLib', {
    libraries: {
      SmtLib: smtpAddress,
      PoseidonUnit3L: poseidonUtil3lAddress,
      PoseidonUnit4L: poseidonUtil4lAddress
    }
  });
  const il = await Identity.deploy();
  await il.waitForDeployment();
  enableLogging && console.log(`IdentityLib deployed to: ${await il.getAddress()}`);

  return il;
}

export async function deployClaimBuilderWrapper(enableLogging = false): Promise<{
  address: string;
}> {
  const cb = await deployClaimBuilder(enableLogging);

  const ClaimBuilderWrapper = await ethers.getContractFactory('ClaimBuilderWrapper', {
    libraries: {
      ClaimBuilder: await cb.getAddress()
    }
  });
  const claimBuilderWrapper = await ClaimBuilderWrapper.deploy();
  enableLogging && console.log('ClaimBuilder deployed to:', await claimBuilderWrapper.getAddress());
  return claimBuilderWrapper;
}

export async function deployERC20LinkedUniversalVerifier(
  name: string,
  symbol: string,
  stateAddress: string
): Promise<{
  universalVerifier: Contract;
  erc20LinkedUniversalVerifier: Contract;
}> {
  const universalVerifier = await deployUniversalVerifier(stateAddress);
  const ERC20LinkedUniversalVerifier = await ethers.getContractFactory(
    'ERC20LinkedUniversalVerifier'
  );
  const erc20LinkedUniversalVerifier = await ERC20LinkedUniversalVerifier.deploy(
    await universalVerifier.getAddress(),
    name,
    symbol
  );
  console.log(
    'ERC20LinkedUniversalVerifier deployed to:',
    await erc20LinkedUniversalVerifier.getAddress()
  );
  return {
    universalVerifier,
    erc20LinkedUniversalVerifier
  };
}

async function deployUniversalVerifier(stateAddress: string): Promise<Contract> {
  const verifierLib = await deployVerifierLib();
  const signers = await ethers.getSigners();
  const UniversalVerifier = await ethers.getContractFactory('UniversalVerifier', {
    signer: signers[0],
    libraries: {
      VerifierLib: await verifierLib.getAddress()
    }
  });

  const signerAddress = await signers[0].getAddress();
  const universalVerifier = await upgrades.deployProxy(
    UniversalVerifier,
    [stateAddress, signerAddress],
    {
      unsafeAllow: ['external-library-linking']
    }
  );
  universalVerifier.waitForDeployment();
  console.log('UniversalVerifier deployed to:', await universalVerifier.getAddress());
  return universalVerifier;
}
