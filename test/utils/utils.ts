import { core } from '@0xpolygonid/js-sdk';
import { buildDIDType, DID, Id, SchemaHash } from '@iden3/js-iden3-core';
import axios from 'axios';
import hre from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

type Grow<T, A extends Array<T>> = ((x: T, ...xs: A) => void) extends (...a: infer X) => void
  ? X
  : never;

type GrowToSize<T, A extends Array<T>, N extends number> = {
  0: A;
  1: GrowToSize<T, Grow<T, A>, N>;
}[A['length'] extends N ? 0 : 1];

export type FixedArray<T, N extends number> = GrowToSize<T, [], N>;

export type MtpProof = {
  root: string;
  existence: boolean;
  siblings: FixedArray<string, 64>;
  index: number | string;
  value: number | string;
  auxExistence: boolean;
  auxIndex: number | string;
  auxValue: number | string;
};

export function genMaxBinaryNumber(digits: number): bigint {
  return BigInt(2) ** BigInt(digits) - BigInt(1);
}

export async function getChainId() {
  return parseInt(await hre.network.provider.send('eth_chainId'), 16);
}

export const coreSchemaFromStr = (schemaIntString: string) => {
  const schemaInt = BigInt(schemaIntString);
  return SchemaHash.newSchemaHashFromInt(schemaInt);
};

export async function getDidResolution(
  did: string,
  resolverUrl: string,
  opts?: { gist?: string; state?: string }
) {
  console.log(
    'Resolving DID:',
    resolverUrl +
      `/1.0/identifiers/${did}?signature=EthereumEip712Signature2021${
        opts?.gist ? '&gist=' + opts?.gist : ''
      }${opts?.state ? '&state=' + opts?.state : ''}`
  );
  const resp = await axios.get(
    resolverUrl +
      `/1.0/identifiers/${did}?signature=EthereumEip712Signature2021${
        opts?.gist ? '&gist=' + opts?.gist : ''
      }${opts?.state ? '&state=' + opts?.state : ''}`
  );
  const didResolution = resp.data;
  return didResolution;
}

export function getDIDEmptyState(did: core.DID) {
  const profileId = DID.idFromDID(did);
  const didType = buildDIDType(
    DID.methodFromId(profileId),
    DID.blockchainFromId(profileId),
    DID.networkIdFromId(profileId)
  );
  const identifier = Id.idGenesisFromIdenState(didType, 0n);
  const emptyDID = DID.parseFromId(identifier);

  return emptyDID;
}

export async function verifyContract(
  hre: HardhatRuntimeEnvironment,
  contractAddress: any,
  opts: {
    contract?: string;
    constructorArgsProxy?: any[];
    constructorArgsProxyAdmin?: any[];
    constructorArgsImplementation: any[];
    libraries: any;
  }
): Promise<boolean> {
  if (hre.network.name === 'localhost') {
    return true;
  }
  // When verifying if the proxy contract is not verified yet we need to pass the arguments
  // for the proxy contract first, then for proxy admin and finally for the implementation contract
  if (opts.constructorArgsProxy) {
    try {
      await hre.run('verify:verify', {
        address: contractAddress,
        contract: opts.contract,
        constructorArguments: opts.constructorArgsProxy,
        libraries: opts.libraries
      });
    } catch (error) {
      // do nothing
    }
  }

  if (opts.constructorArgsProxyAdmin) {
    try {
      await hre.run('verify:verify', {
        address: contractAddress,
        contract: opts.contract,
        constructorArguments: opts.constructorArgsProxyAdmin,
        libraries: opts.libraries
      });
    } catch (error) {
      // do nothing
    }
  }

  try {
    await hre.run('verify:verify', {
      address: contractAddress,
      contract: opts.contract,
      constructorArguments: opts.constructorArgsImplementation,
      libraries: opts.libraries
    });
    console.log(`Verification successful for ${contractAddress}\n`);
    return true;
  } catch (error) {
    console.error(`Error verifying ${contractAddress}: ${error}\n`);
  }

  return false;
}
