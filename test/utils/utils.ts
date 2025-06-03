import { core } from '@0xpolygonid/js-sdk';
import { Hex, poseidon } from '@iden3/js-crypto';
import { buildDIDType, DID, genesisFromEthAddress, Id, SchemaHash } from '@iden3/js-iden3-core';
import axios from 'axios';
import { ethers } from 'hardhat';

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

export function calculateQueryHashV2(
  values: bigint[],
  schema: string,
  slotIndex: string | number,
  operator: string | number,
  claimPathKey: string | number,
  claimPathNotExists: string | number
): bigint {
  const expValue = prepareCircuitArrayValues(values, 64);
  const valueHash = poseidon.spongeHashX(expValue, 6);
  const schemaHash = coreSchemaFromStr(schema);
  const queryHash = poseidon.hash([
    schemaHash.bigInt(),
    BigInt(slotIndex),
    BigInt(operator),
    BigInt(claimPathKey),
    BigInt(claimPathNotExists),
    valueHash
  ]);
  return queryHash;
}

export function calculateQueryHashV3(
  values: bigint[],
  schema: SchemaHash,
  slotIndex: string | number,
  operator: string | number,
  claimPathKey: string | number,
  valueArraySize: string | number,
  merklized: string | number,
  isRevocationChecked: string | number,
  verifierID: string | number,
  nullifierSessionID: string | number
): bigint {
  const expValue = prepareCircuitArrayValues(values, 64);
  const valueHash = poseidon.spongeHashX(expValue, 6);
  const firstPartQueryHash = poseidon.hash([
    schema.bigInt(),
    BigInt(slotIndex),
    BigInt(operator),
    BigInt(claimPathKey),
    BigInt(merklized),
    valueHash
  ]);

  const queryHash = poseidon.hash([
    firstPartQueryHash,
    BigInt(valueArraySize),
    BigInt(isRevocationChecked),
    BigInt(verifierID),
    BigInt(nullifierSessionID),
    BigInt(0)
  ]);
  return queryHash;
}

const prepareCircuitArrayValues = (arr: bigint[], size: number): bigint[] => {
  if (!arr) {
    arr = [];
  }
  if (arr.length > size) {
    throw new Error(`array size ${arr.length} is bigger max expected size ${size}`);
  }

  // Add the empty values
  for (let i = arr.length; i < size; i++) {
    arr.push(BigInt(0));
  }

  return arr;
};

export const coreSchemaFromStr = (schemaIntString: string) => {
  const schemaInt = BigInt(schemaIntString);
  return SchemaHash.newSchemaHashFromInt(schemaInt);
};

export function buildVerifierId(
  address: string,
  info: { method: string; blockchain: string; networkId: string }
): Id {
  address = address.replace('0x', '');
  const ethAddrBytes = Hex.decodeString(address);
  const ethAddr = ethAddrBytes.slice(0, 20);
  const genesis = genesisFromEthAddress(ethAddr);

  const tp = buildDIDType(info.method, info.blockchain, info.networkId);

  return new Id(tp, genesis);
}

export function calculateRequestId(params: string, address: string): bigint {
  const requestId =
    (BigInt(ethers.keccak256(ethers.solidityPacked(['bytes', 'address'], [params, address]))) &
      BigInt('0x0000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')) +
    BigInt('0x0001000000000000000000000000000000000000000000000000000000000000');
  return requestId;
}

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
