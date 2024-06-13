import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x07D5A8d32A3B42536c3019fD10F62A893aCc9021';
  // const veraxVerifierAddress = '0x91a3a28B401adDeBcb5Cd0b1364474fF6255F00b';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const requestId = 100002;
  const schemaId = '0x021fa993b2ac55b95340608478282821b89398de6fa14073b4d44a3564a8c79d';
  const schemaType = 0; // PoU

  const portalAddress = '0x3486d714C6e6F7257Fa7f0bB8396161150B9f100';

  //  const portalAddress = '0x5FfDa857bF7c63A70ac1ABAE67a3368f0eE7dC27';

  const tx = await verax.setPortalInfo(
    requestId,
    portalAddress,
    schemaId,
    schemaType
  );
  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
