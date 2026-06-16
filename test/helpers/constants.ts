// PRODUCTION networks Oracle signing address
const oracleSAProd = '0xf0Ae6D287aF14f180E1FAfe3D2CB62537D7b1A82';

type ChainIdInfo = {
  idType: string;
  networkType: string;
  oracleSigningAddress: string;
};

export const chainIdInfoMap: Map<number, ChainIdInfo> = new Map()
  .set(31337, { idType: '0x0112', networkType: 'test', oracleSigningAddress: oracleSAProd }) // hardhat
  .set(1101, { idType: '0x0114', networkType: 'main', oracleSigningAddress: oracleSAProd }) // polygon zkevm
  .set(2442, { idType: '0x0115', networkType: 'test', oracleSigningAddress: oracleSAProd }) // polygon cardona
  .set(137, { idType: '0x0111', networkType: 'main', oracleSigningAddress: oracleSAProd }) // polygon main
  .set(80001, { idType: '0x0112', networkType: 'test', oracleSigningAddress: oracleSAProd }) // polygon mumbai
  .set(80002, { idType: '0x0113', networkType: 'test', oracleSigningAddress: oracleSAProd }) // polygon amoy
  .set(11155111, { idType: '0x0123', networkType: 'test', oracleSigningAddress: oracleSAProd }) // ethereum sepolia
  .set(21000, { idType: '0x01A1', networkType: 'main', oracleSigningAddress: oracleSAProd }) // privado-main
  .set(21001, { idType: '0x01A2', networkType: 'test', oracleSigningAddress: oracleSAProd }) // privado-test
  .set(59144, { idType: '0x0149', networkType: 'main', oracleSigningAddress: oracleSAProd }) // linea-main
  .set(59141, { idType: '0x0148', networkType: 'test', oracleSigningAddress: oracleSAProd }); // linea-sepolia

export const POLYGON_MAINNET_CHAINID = 137;
export const POLYGON_AMOY_CHAINID = 80002;
export const STATE_ADDRESS_POLYGON_AMOY = '0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124';
export const STATE_ADDRESS_POLYGON_MAINNET = '0x624ce98D2d27b20b8f8d521723Df8fC4db71D79D';

export const contractsInfo = Object.freeze({
  POSEIDON_1: {
    name: 'PoseidonUnit1L',
    unifiedAddress: '0xC72D76D7271924a2AD54a19D216640FeA3d138d9'
  },
  POSEIDON_2: {
    name: 'PoseidonUnit2L',
    unifiedAddress: '0x72F721D9D5f91353B505207C63B56cF3d9447edB'
  },
  POSEIDON_3: {
    name: 'PoseidonUnit3L',
    unifiedAddress: '0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240'
  },
  POSEIDON_4: {
    name: 'PoseidonUnit4L',
    unifiedAddress: '0x0695cF2c6dfc438a4E40508741888198A6ccacC2'
  },
  STATE: {
    name: 'State',
    unifiedAddress: '0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896'
  },
  UNIVERSAL_VERIFIER: {
    name: 'UniversalVerifier',
    unifiedAddress: '0x2B0D3f664A5EbbfBD76E6cbc2cA9A504a68d2F4F'
  },
  SMT_LIB: {
    name: 'SmtLib',
    unifiedAddress: '0x682364078e26C1626abD2B95109D2019E241F0F6'
  },
  VALIDATOR_V3_STABLE: {
    name: 'CredentialAtomicQueryV3StableValidator',
    unifiedAddress: '0x0d78ADDD050a75a94e21eD14d54591933B9B7546'
  },
  VALIDATOR_AUTH_V2: {
    name: 'AuthV2Validator',
    unifiedAddress: '0x535F6a1B30533616CE4bD44081ea7A17CF2042B8'
  },
  VALIDATOR_AUTH_V3: {
    name: 'AuthV3Validator',
    unifiedAddress: '0x0127bb45d6F88bC9eBF418421b1d57aE99a7FA4A'
  },
  VALIDATOR_AUTH_V3_8_32: {
    name: 'AuthV3_8_32Validator',
    unifiedAddress: '0x85808DEce33D4124659C4d450E0e8E497711AB51'
  }
});
