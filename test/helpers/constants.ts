// HARDHAT network Oracle signing address
const oracleSAHardhat = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
// TEST networks Oracle signing address
const oracleSATest = '0x3e1cFE1b83E7C1CdB0c9558236c1f6C7B203C34e';
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
