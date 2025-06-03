// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L, PoseidonUnit4L, PoseidonUnit5L, PoseidonUnit6L, SpongePoseidon, PoseidonFacade} from '@iden3/contracts/lib/Poseidon.sol';
import {EmbeddedVerifier} from '@iden3/contracts/verifiers/EmbeddedVerifier.sol';
import {State} from '@iden3/contracts/state/State.sol';
import {IdentityTreeStore} from '@iden3/contracts/identitytreestore/IdentityTreeStore.sol';
import {CredentialAtomicQueryMTPV2Validator} from '@iden3/contracts/validators/request/CredentialAtomicQueryMTPV2Validator.sol';
import {CredentialAtomicQuerySigV2Validator} from '@iden3/contracts/validators/request/CredentialAtomicQuerySigV2Validator.sol';
import {CredentialAtomicQueryV3Validator} from '@iden3/contracts/validators/request/CredentialAtomicQueryV3Validator.sol';
import {AuthV2Validator} from '@iden3/contracts/validators/auth/AuthV2Validator.sol';
import {Groth16VerifierStateTransition} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierStateTransition.sol';
import {Groth16VerifierMTP} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierMTP.sol';
import {Groth16VerifierMTPWrapper} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierMTPWrapper.sol';
import {Groth16VerifierSig} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierSig.sol';
import {Groth16VerifierSigWrapper} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierSigWrapper.sol';
import {Groth16VerifierV3} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierV3.sol';
import {Groth16VerifierV3Wrapper} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierV3Wrapper.sol';
import {Groth16VerifierAuthV2} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierAuthV2.sol';
import {Groth16VerifierAuthV2Wrapper} from '@iden3/contracts/lib/groth16-verifiers/Groth16VerifierAuthV2Wrapper.sol';
import {CrossChainProofValidator} from '@iden3/contracts/cross-chain/CrossChainProofValidator.sol';
