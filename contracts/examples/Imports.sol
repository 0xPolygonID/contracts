// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L, PoseidonUnit4L, PoseidonUnit5L, PoseidonUnit6L, SpongePoseidon, PoseidonFacade} from '@iden3/contracts/lib/Poseidon.sol';
import {EmbeddedZKPVerifier} from '@iden3/contracts/verifiers/EmbeddedZKPVerifier.sol';
import {State} from '@iden3/contracts/state/State.sol';
import {IdentityTreeStore} from '@iden3/contracts/identitytreestore/IdentityTreeStore.sol';
import {CredentialAtomicQueryMTPV2Validator} from '@iden3/contracts/validators/CredentialAtomicQueryMTPV2Validator.sol';
import {CredentialAtomicQuerySigV2Validator} from '@iden3/contracts/validators/CredentialAtomicQuerySigV2Validator.sol';
import {CredentialAtomicQueryV3Validator} from '@iden3/contracts/validators/CredentialAtomicQueryV3Validator.sol';
import {VerifierStateTransition} from '@iden3/contracts/lib/VerifierStateTransition.sol';
import {VerifierMTP} from '@iden3/contracts/lib/VerifierMTP.sol';
import {VerifierMTPWrapper} from '@iden3/contracts/lib/VerifierMTPWrapper.sol';
import {VerifierSig} from '@iden3/contracts/lib/VerifierSig.sol';
import {VerifierSigWrapper} from '@iden3/contracts/lib/VerifierSigWrapper.sol';
import {VerifierV3} from '@iden3/contracts/lib/VerifierV3.sol';
import {VerifierV3Wrapper} from '@iden3/contracts/lib/VerifierV3Wrapper.sol';
