import { ethers } from 'hardhat';
import { packValidatorParams } from '../test/utils/pack-utils';

async function main() {
  const validatorAddressSig = '0x9ee6a2682Caa2E0AC99dA46afb88Ad7e6A58Cd1b';
  const validatorAddressMtp = '0x5f24dD9FbEa358B9dD96daA281e82160fdefD3CD';

  // const erc20verifierAddress = "0xa3Bc012FCf034bee8d16161730CE4eAb34C35100"; //with mtp validatorc
  const erc20verifierAddress = '0x7C14Aa764130852A8B64BA7058bf71E4292d677F'; //with sig    validatorc

  const owner = (await ethers.getSigners())[0];

  const ERC20Verifier = await ethers.getContractFactory('ERC20Verifier');
  const erc20Verifier = await ERC20Verifier.attach(erc20verifierAddress); // current mtp validator address on mumbai

  // await erc20Verifier.deployed();
  console.log(erc20Verifier, ' attached to:', erc20Verifier.address);

  // set default query

  const slotIndex = ethers.BigNumber.from(0);
  const queryHash = ethers.BigNumber.from(
    '1496222740463292783938163206931059379817846775593932664024082849882751356658'
  );
  const circuitIds = ['credentialAtomicQueryMTPV2OnChain'];
  const metadata = 'test medatada';
  const skipClaimRevocationCheck = false;
  const ageQueries = [
    // EQ
    {
      requestId: 100,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 1,
      value: [19960424, ...new Array(63).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    //     // LT
    {
      requestId: 200,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 2,
      value: [20020101, ...new Array(63).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // GT
    {
      requestId: 300,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 3,
      value: [500, ...new Array(63).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // IN
    {
      requestId: 400,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 4,
      value: [...new Array(63).fill(0).map((i) => 0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // NIN
    {
      requestId: 500,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 5,
      value: [...new Array(64).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // NE
    {
      requestId: 600,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 6,
      value: [500, ...new Array(63).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // EQ (corner)

    {
      requestId: 150,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 1,
      value: [...new Array(64).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },

    // LT
    {
      requestId: 250,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 2,
      value: [...new Array(64).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // GT
    {
      requestId: 350,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 3,
      value: [...new Array(64).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // IN corner

    {
      requestId: 450,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 4,
      value: [...new Array(64).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // NIN corner
    {
      requestId: 550,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 5,
      value: [...new Array(63).fill(0).map((i) => 0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    },
    // NE corner
    {
      requestId: 650,
      schema: ethers.BigNumber.from('74977327600848231385663280181476307657'),
      claimPathKey: ethers.BigNumber.from(
        '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      ),
      operator: 6,
      value: [...new Array(64).fill(0).map((i) => 0)],
      slotIndex,
      queryHash,
      circuitIds,
      skipClaimRevocationCheck
    }
  ];

  try {
    for (let i = 0; i < ageQueries.length; i++) {
      console.log(ageQueries[i].requestId);
      let tx = await erc20Verifier.setZKPRequest(ageQueries[i].requestId, {
        metadata: 'metadata',
        validator: validatorAddressSig,
        data: packValidatorParams(ageQueries[i])
      });

      console.log(tx.hash);
      await tx.wait();
    }
  } catch (e) {
    console.log('error: ', e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
