import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x07D5A8d32A3B42536c3019fD10F62A893aCc9021';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const requestId = 100001;
  const schemaId = '0xe3a3e680fe5fbfbddff981752989e660514e1fc49fdee922f26d345cc10b1be4';
  // const schemaId = '0x59a0acecb3a782c9035cb1d0e8d5661f6848ebcb4d44c212c891d0fbc06c081e'; sepolia
  const schemaType = 1; // PoL

  const portalAddress = '0x5C426a0387fAa8Bac13C371dF44494FBd19B141c';
  // const portalAddress = '0xE72bcb4f7065DB683BC16BEf9A01C059309DFe4a'; sepolia

  
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
