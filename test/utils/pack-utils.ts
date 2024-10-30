import Web3 from 'web3';
import { DID } from '@iden3/js-iden3-core';
import { ethers } from 'hardhat';

const abiCoder = new ethers.AbiCoder();

const domain = {
  name: 'StateInfo',
  version: '1',
  chainId: 0,
  verifyingContract: ethers.ZeroAddress
};

export type GlobalStateMessage = {
  timestamp: bigint;
  idType: string;
  root: bigint;
  replacedAtTimestamp: bigint;
};

export type IdentityStateMessage = {
  timestamp: bigint;
  id: bigint;
  state: bigint;
  replacedAtTimestamp: bigint;
};

export type StateUpdate = {
  idStateMsg: IdentityStateMessage;
  signature: string;
};

export type GlobalStateUpdate = {
  globalStateMsg: GlobalStateMessage;
  signature: string;
};

export type Metadata = {
  key: string;
  value: string;
};

export type CrossChainProof = {
  proofType: string;
  proof: string;
};

export function packV2ValidatorParams(query: any) {
  const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');
  return web3.eth.abi.encodeParameter(
    {
      CredentialAtomicQuery: {
        schema: 'uint256',
        claimPathKey: 'uint256',
        operator: 'uint256',
        slotIndex: 'uint256',
        value: 'uint256[]',
        queryHash: 'uint256',
        allowedIssuers: 'uint256[]',
        circuitIds: 'string[]',
        skipClaimRevocationCheck: 'bool',
        claimPathNotExists: 'uint256'
      }
    },
    {
      schema: query.schema,
      claimPathKey: query.claimPathKey,
      operator: query.operator,
      slotIndex: query.slotIndex,
      value: query.value,
      queryHash: query.queryHash,
      allowedIssuers: query.allowedIssuers.map((issuer) => didToIdString(issuer)),
      circuitIds: query.circuitIds,
      skipClaimRevocationCheck: query.skipClaimRevocationCheck,
      claimPathNotExists: query.claimPathNotExists
    }
  );
}

export function packV3ValidatorParams(query: any) {
  const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');
  return web3.eth.abi.encodeParameter(
    {
      CredentialAtomicQueryV3: {
        schema: 'uint256',
        claimPathKey: 'uint256',
        operator: 'uint256',
        slotIndex: 'uint256',
        value: 'uint256[]',
        queryHash: 'uint256',
        allowedIssuers: 'uint256[]',
        circuitIds: 'string[]',
        skipClaimRevocationCheck: 'bool',
        groupID: 'uint256',
        nullifierSessionID: 'uint256',
        proofType: 'uint256',
        verifierID: 'uint256'
      }
    },
    {
      schema: query.schema,
      claimPathKey: query.claimPathKey,
      operator: query.operator,
      slotIndex: query.slotIndex,
      value: query.value,
      queryHash: query.queryHash,
      allowedIssuers: query.allowedIssuers.map((issuer) => didToIdString(issuer)),
      circuitIds: query.circuitIds,
      skipClaimRevocationCheck: query.skipClaimRevocationCheck,
      groupID: query.groupID,
      nullifierSessionID: query.nullifierSessionID,
      proofType: query.proofType,
      verifierID: query.verifierID
    }
  );
}

export function unpackV3ValidatorParams(hex: string) {
  const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');
  return web3.eth.abi.decodeParameter(
    {
      CredentialAtomicQueryV3: {
        schema: 'uint256',
        claimPathKey: 'uint256',
        operator: 'uint256',
        slotIndex: 'uint256',
        value: 'uint256[]',
        queryHash: 'uint256',
        allowedIssuers: 'uint256[]',
        circuitIds: 'string[]',
        skipClaimRevocationCheck: 'bool',
        groupID: 'uint256',
        nullifierSessionID: 'uint256',
        proofType: 'uint256',
        verifierID: 'uint256'
      }
    },
    hex
  );
}

export function unpackV2ValidatorParams(hex: string) {
  const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');
  return web3.eth.abi.decodeParameter(
    {
      CredentialAtomicQuery: {
        schema: 'uint256',
        claimPathKey: 'uint256',
        operator: 'uint256',
        slotIndex: 'uint256',
        value: 'uint256[]',
        queryHash: 'uint256',
        allowedIssuers: 'uint256[]',
        circuitIds: 'string[]',
        skipClaimRevocationCheck: 'bool',
        claimPathNotExists: 'uint256'
      }
    },
    hex
  );
}

export function didToIdString(did: string): string {
  return DID.idFromDID(DID.parse(did)).bigInt().toString();
}

export function packZKProof(inputs: string[], a: string[], b: string[][], c: string[]): string {
  return abiCoder.encode(
    ['uint256[] inputs', 'uint256[2]', 'uint256[2][2]', 'uint256[2]'],
    [inputs, a, b, c]
  );
}

export function packIdentityStateUpdate(msg: StateUpdate): string {
  return abiCoder.encode(
    [
      'tuple(' +
        'tuple(' +
        'uint256 timestamp,' +
        'uint256 id,' +
        'uint256 state,' +
        'uint256 replacedAtTimestamp' +
        ') idStateMsg,' +
        'bytes signature,' +
        ')'
    ],
    [msg]
  );
}

export function packGlobalStateUpdate(msg: GlobalStateUpdate): string {
  return abiCoder.encode(
    [
      'tuple(' +
        'tuple(' +
        'uint256 timestamp,' +
        'bytes2 idType,' +
        'uint256 root,' +
        'uint256 replacedAtTimestamp' +
        ') globalStateMsg,' +
        'bytes signature,' +
        ')'
    ],
    [msg]
  );
}

export function packCrossChainProofs(proofs: CrossChainProof[]): string {
  return abiCoder.encode(['tuple(' + 'string proofType,' + 'bytes proof' + ')[]'], [proofs]);
}

export async function packIdentityStateUpdateWithSignature(
  ism: IdentityStateMessage,
  signer: any,
  tamperWithMessage: boolean = false,
  invalidSignature: boolean = false
): Promise<string> {
  const types = {
    IdentityState: [
      { name: 'timestamp', type: 'uint256' },
      { name: 'id', type: 'uint256' },
      { name: 'state', type: 'uint256' },
      { name: 'replacedAtTimestamp', type: 'uint256' }
    ]
  };

  const isu: StateUpdate = {
    idStateMsg: ism,
    signature: await signer.signTypedData(domain, types, ism)
  };

  if (tamperWithMessage) {
    isu.idStateMsg.timestamp++;
  }
  if (invalidSignature) {
    isu.signature = isu.signature.slice(0, -5) + '00000';
  }
  return packIdentityStateUpdate(isu);
}

export async function packGlobalStateUpdateWithSignature(
  gsm: GlobalStateMessage,
  signer: any,
  tamperWithMessage: boolean = false,
  invalidSignature: boolean = false
): Promise<string> {
  const types = {
    GlobalState: [
      { name: 'timestamp', type: 'uint256' },
      { name: 'idType', type: 'bytes2' },
      { name: 'root', type: 'uint256' },
      { name: 'replacedAtTimestamp', type: 'uint256' }
    ]
  };

  const gsu: GlobalStateUpdate = {
    globalStateMsg: gsm,
    signature: await signer.signTypedData(domain, types, gsm)
  };

  if (tamperWithMessage) {
    gsu.globalStateMsg.timestamp++;
  }
  if (invalidSignature) {
    gsu.signature = gsu.signature.slice(0, -5) + '00000';
  }
  return packGlobalStateUpdate(gsu);
}

export async function buildCrossChainProofs(
  crossChainProofsMessages: any[],
  signer: any
): Promise<any[]> {
  const map = await Promise.all(
    crossChainProofsMessages.map(async (crossChainProofMessage) => {
      if (crossChainProofMessage.idType) {
        return {
          proofType: 'globalStateProof',
          proof: await packGlobalStateUpdateWithSignature(crossChainProofMessage, signer)
        };
      }
      return {
        proofType: 'stateProof',
        proof: await packIdentityStateUpdateWithSignature(crossChainProofMessage, signer)
      };
    })
  );
  return map;
}
