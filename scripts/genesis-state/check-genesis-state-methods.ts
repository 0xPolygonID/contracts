import { ethers } from 'hardhat';

async function main() {
  const stateAddress = '0x9c905B15D6EAd043cfce50Bb93eeF36279153d03';
  const stateFactory = await ethers.getContractFactory('GenesisState', {
    libraries: {
        StateLib: '0x723bA76845aC96955657b3c8d76292cBc72B5f0A',
        SmtLib: '0xc3Af1587389691373f5dAbE27109c938576607e6',
        PoseidonUnit1L: '0x3262eeEcbcA5C29650C385D6DB0c0146Bc7c0273'
      }
  });
  const state = await stateFactory.attach(stateAddress);

  const revocation = await state.getRevocationStatusByIdAndState(0, 0);
  console.log('revocation', revocation);

  const gistRoot = await state.getGISTRoot();
  console.log('gistRoot', gistRoot);

  const rootInfo = await state.getGISTRootInfo(0);
  console.log('getGISTRootInfo', rootInfo);

  const proof = await state.getGISTProofByRoot(0, 0);
  console.log('getGISTProofByRoot', proof);

  const historyLength = await state.getGISTRootHistoryLength();
  console.log('getGISTRootHistoryLength', historyLength);

//   const info = await state.getStateInfoByIdAndState('', ''); // State does not exist
//   console.log(info);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
