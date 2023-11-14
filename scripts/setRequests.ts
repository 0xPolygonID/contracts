import { ethers } from 'hardhat';
import { packValidatorParams } from '../test/utils/pack-utils';
import { calculateQueryHash } from '../test/utils/utils';

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

  const slotIndex = 0;
  const queryHash = '';
  const circuitIds = ['credentialAtomicQueryMTPV2OnChain'];
  const metadata = 'test medatada';
  const skipClaimRevocationCheck = false;
  const ageQueries = [
    // EQ
    {
      requestId: 100,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 1,
      value: [19960424, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    //     // LT
    {
      requestId: 200,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 2,
      value: [20020101, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // GT
    {
      requestId: 300,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 3,
      value: [500, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // IN
    {
      requestId: 400,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 4,
      value: [...new Array(63).fill(0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // NIN
    {
      requestId: 500,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 5,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // NE
    {
      requestId: 600,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 6,
      value: [500, ...new Array(63).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // EQ (corner)

    {
      requestId: 150,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 1,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },

    // LT
    {
      requestId: 250,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 2,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // GT
    {
      requestId: 350,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 3,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // IN corner

    {
      requestId: 450,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 4,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // NIN corner
    {
      requestId: 550,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 5,
      value: [...new Array(63).fill(0), 19960424],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    },
    // NE corner
    {
      requestId: 650,
      schema: '74977327600848231385663280181476307657',
      claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630',
      operator: 6,
      value: [...new Array(64).fill(0)],
      slotIndex,
      queryHash,
      circuitIds,
      metadata,
      skipClaimRevocationCheck
    }
  ];

  try {
    for (let i = 0; i < ageQueries.length; i++) {
      const query = ageQueries[i];
      console.log(query.requestId);
      query.queryHash = calculateQueryHash(
        query.value,
        query.schema,
        query.slotIndex,
        query.operator,
        query.claimPathKey,
        1
      ).toString();
      let tx = await erc20Verifier.setZKPRequest(query.requestId, {
        metadata: 'metadata',
        validator: validatorAddressSig,
        data: packValidatorParams(query)
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
