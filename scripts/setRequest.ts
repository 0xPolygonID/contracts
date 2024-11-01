import { ethers } from 'hardhat';
import { byteEncoder, CircuitId } from '@0xpolygonid/js-sdk';
import { Hex } from '@iden3/js-crypto';

export function getAuthV2RequestId(): number {
  const circuitHash = ethers.keccak256(byteEncoder.encode(CircuitId.AuthV2));
  const dataView = new DataView(Hex.decodeString(circuitHash.replace('0x', '')).buffer);
  const id = dataView.getUint32(0);
  return id;
}

async function main() {
  //   const chainId = hre.network.config.chainId;
  //   const network = hre.network.name;

  //   const methodId = "ade09fcd";

  const verifier = await ethers.getContractAt(
    'BalanceCredentialIssuer',
    '0x98F122a0CDa16d39F1Fb1D7589e846466ec9e630'
  );

  const requestId = getAuthV2RequestId();

  const requestIdExists = await verifier.requestIdExists(requestId);
  if (requestIdExists) {
    throw new Error(`Request ID: ${requestId} already exists`);
  }

  const tx = await verifier.setZKPRequest(
    requestId,
    {
      metadata: '0x',
      validator: '0x1a593E1aD3843b4363Dfa42585c4bBCA885553c0',
      data: '0x'
    }
    // {
    //   gasPrice: 50000000000,
    //   initialBaseFeePerGas: 25000000000,
    //   gasLimit: 10000000,
    // },
  );

  console.log(`Request ID: ${requestId} is set in tx: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
