export const chainIdDefaultIdTypeMap = new Map()
  .set(31337, '0x0212') // hardhat
  .set(80001, '0x0212') // polygon mumbai
  .set(1101, '0x0231') // zkEVM
  .set(1442, '0x0232') // zkEVM testnet
  .set(137, '0x0211') // polygon main
  .set(59141, "0x0148") // linea-sepolia: iden3 0b0100_0000 | 0b0000_1000
  .set(59144, "0x0149"); // linea: iden3 0b0100_0000 | 0b0000_1001
