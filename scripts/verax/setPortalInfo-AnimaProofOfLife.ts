import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x91a3a28B401adDeBcb5Cd0b1364474fF6255F00b';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const requestId = 100001;
  const schemaId = '0x59a0acecb3a782c9035cb1d0e8d5661f6848ebcb4d44c212c891d0fbc06c081e';
  const schemaType = 1; // PoL

  const portalAddress = '0xE72bcb4f7065DB683BC16BEf9A01C059309DFe4a';
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
