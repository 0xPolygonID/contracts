import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x60fd74e29e38453CDc04890a6E318735D7657f18';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const portalAddress = '0xe8acF827a91b9B4996Cad687f4d9cd0f6b3B9eA9';
  const tx = await verax.setPortalInfo(
    portalAddress,
    '0x59a0acecb3a782c9035cb1d0e8d5661f6848ebcb4d44c212c891d0fbc06c081e'
  );
  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
