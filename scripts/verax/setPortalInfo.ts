import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x1571fA0f7CCb065Fc8F27c221C0a4ad4ea8c2A46';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const portalAddress = '0x215c556049354F6217d85936f9986B5368621FEb';
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
