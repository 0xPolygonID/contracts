export default [
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'message',
        type: 'string'
      },
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      },
      {
        internalType: 'uint256',
        name: 'linkID',
        type: 'uint256'
      },
      {
        internalType: 'uint64',
        name: 'requestIdToCompare',
        type: 'uint64'
      },
      {
        internalType: 'uint256',
        name: 'linkIdToCompare',
        type: 'uint256'
      }
    ],
    name: 'LinkedProofError',
    type: 'error'
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'OwnableInvalidOwner',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64'
      }
    ],
    name: 'Initialized',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferStarted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requestOwner',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'metadata',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'validator',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'data',
        type: 'bytes'
      }
    ],
    name: 'ZKPRequestSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'caller',
        type: 'address'
      }
    ],
    name: 'ZKPResponseSubmitted',
    type: 'event'
  },
  {
    inputs: [],
    name: 'REQUESTS_RETURN_LIMIT',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'VERSION',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'contract ICircuitValidator',
        name: 'validator',
        type: 'address'
      }
    ],
    name: 'addValidatorToWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      }
    ],
    name: 'disableZKPRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      }
    ],
    name: 'enableZKPRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address'
      },
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      }
    ],
    name: 'getProofStatus',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'isVerified',
            type: 'bool'
          },
          {
            internalType: 'string',
            name: 'validatorVersion',
            type: 'string'
          },
          {
            internalType: 'uint256',
            name: 'blockNumber',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'blockTimestamp',
            type: 'uint256'
          }
        ],
        internalType: 'struct IZKPVerifier.ProofStatus',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      },
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      },
      {
        internalType: 'string',
        name: 'key',
        type: 'string'
      }
    ],
    name: 'getProofStorageField',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      }
    ],
    name: 'getRequestOwner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getStateAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      }
    ],
    name: 'getZKPRequest',
    outputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'metadata',
            type: 'string'
          },
          {
            internalType: 'contract ICircuitValidator',
            name: 'validator',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes'
          }
        ],
        internalType: 'struct IZKPVerifier.ZKPRequest',
        name: 'zkpRequest',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'startIndex',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256'
      }
    ],
    name: 'getZKPRequests',
    outputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'metadata',
            type: 'string'
          },
          {
            internalType: 'contract ICircuitValidator',
            name: 'validator',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes'
          }
        ],
        internalType: 'struct IZKPVerifier.ZKPRequest[]',
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getZKPRequestsCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'contract IState',
        name: 'state',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address'
      },
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      }
    ],
    name: 'isProofVerified',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'contract ICircuitValidator',
        name: 'validator',
        type: 'address'
      }
    ],
    name: 'isWhitelistedValidator',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      }
    ],
    name: 'isZKPRequestEnabled',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'pendingOwner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'contract ICircuitValidator',
        name: 'validator',
        type: 'address'
      }
    ],
    name: 'removeValidatorFromWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      }
    ],
    name: 'requestIdExists',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      },
      {
        internalType: 'address',
        name: 'requestOwner',
        type: 'address'
      }
    ],
    name: 'setRequestOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'contract IState',
        name: 'state',
        type: 'address'
      }
    ],
    name: 'setState',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'metadata',
            type: 'string'
          },
          {
            internalType: 'contract ICircuitValidator',
            name: 'validator',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes'
          }
        ],
        internalType: 'struct IZKPVerifier.ZKPRequest',
        name: 'request',
        type: 'tuple'
      }
    ],
    name: 'setZKPRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      },
      {
        internalType: 'uint256[]',
        name: 'inputs',
        type: 'uint256[]'
      },
      {
        internalType: 'uint256[2]',
        name: 'a',
        type: 'uint256[2]'
      },
      {
        internalType: 'uint256[2][2]',
        name: 'b',
        type: 'uint256[2][2]'
      },
      {
        internalType: 'uint256[2]',
        name: 'c',
        type: 'uint256[2]'
      }
    ],
    name: 'submitZKPResponse',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint64',
            name: 'requestId',
            type: 'uint64'
          },
          {
            internalType: 'bytes',
            name: 'zkProof',
            type: 'bytes'
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes'
          }
        ],
        internalType: 'struct IZKPVerifier.ZKPResponse[]',
        name: 'responses',
        type: 'tuple[]'
      },
      {
        internalType: 'bytes',
        name: 'crossChainProof',
        type: 'bytes'
      }
    ],
    name: 'submitZKPResponseV2',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address'
      },
      {
        internalType: 'uint64[]',
        name: 'requestIds',
        type: 'uint64[]'
      }
    ],
    name: 'verifyLinkedProofs',
    outputs: [],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'requestId',
        type: 'uint64'
      },
      {
        internalType: 'uint256[]',
        name: 'inputs',
        type: 'uint256[]'
      },
      {
        internalType: 'uint256[2]',
        name: 'a',
        type: 'uint256[2]'
      },
      {
        internalType: 'uint256[2][2]',
        name: 'b',
        type: 'uint256[2][2]'
      },
      {
        internalType: 'uint256[2]',
        name: 'c',
        type: 'uint256[2]'
      },
      {
        internalType: 'address',
        name: 'sender',
        type: 'address'
      }
    ],
    name: 'verifyZKPResponse',
    outputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'key',
            type: 'string'
          },
          {
            internalType: 'uint256',
            name: 'inputIndex',
            type: 'uint256'
          }
        ],
        internalType: 'struct ICircuitValidator.KeyToInputIndex[]',
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'version',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'pure',
    type: 'function'
  }
];
