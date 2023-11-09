import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployERC20ZKPVerifierToken,
  deployValidatorContracts,
  prepareInputs,
  publishState,
} from "../../utils/deploy-utils";
import { packValidatorParams } from "../../utils/pack-utils";

const tenYears = 315360000;
const testCases: any[] = [
   {
    name: "Validate Genesis User State. Issuer Claim IdenState is in Chain. Revocation State is in Chain",
    stateTransitions: [require("../common-data/issuer_genesis_state.json")],
    proofJson: require("./data/valid_mtp_user_genesis.json"),
    setProofExpiration: tenYears,
  },
  {
    name: "Validation of proof failed",
    stateTransitions: [require("../common-data/issuer_genesis_state.json")],
    proofJson: require("./data/invalid_mtp_user_genesis.json"),
    errorMessage: "",
    setProofExpiration: tenYears,
  },
  {
    name: "User state is not genesis but latest",
    stateTransitions: [
      require("../common-data/issuer_genesis_state.json"),
      require("../common-data/user_state_transition.json"),
    ],
    proofJson: require("./data/valid_mtp_user_non_genesis.json"),
    setProofExpiration: tenYears,
  },
  {
    name: "The non-revocation issuer state is not expired",
    stateTransitions: [
      require("../common-data/issuer_genesis_state.json"),
      require("../common-data/user_state_transition.json"),
      require("../common-data/issuer_next_state_transition.json"),
    ],
    proofJson: require("./data/valid_mtp_user_non_genesis.json"),
    setProofExpiration: tenYears,
  },
  {
    name: "The non-revocation issuer state is expired",
    stateTransitions: [
      require("../common-data/issuer_genesis_state.json"),
      require("../common-data/user_state_transition.json"), // proof was generated after this state transition
      require("../common-data/issuer_next_state_transition.json"),
      require("../common-data/user_next_state_transition.json"),
    ],
    stateTransitionDelayMs: 2000, // [1....][2....][3....][4....] - each block is 2 seconds long
    proofJson: require("./data/valid_mtp_user_non_genesis.json"),
    setRevStateExpiration: 3, // [1....][2....][3..*.][4....] <-- (*) - marks where the expiration threshold is
    errorMessage: "Non-Revocation state of Issuer expired",
    setProofExpiration: tenYears,
  },
  {
    name: "GIST root expired, Issuer revocation state is not expired",
    stateTransitions: [
      require("../common-data/issuer_genesis_state.json"),
      require("../common-data/user_state_transition.json"), // proof was generated after this state transition
      require("../common-data/user_next_state_transition.json"),
      require("../common-data/issuer_next_state_transition.json"),
    ],
    stateTransitionDelayMs: 2000, // [1....][2....][3....][4....] - each block is 2 seconds long
    proofJson: require("./data/valid_mtp_user_non_genesis.json"), // generated on step 2
    setGISTRootExpiration: 3, // [1....][2....][3..*.][4....] <-- (*) - marks where the expiration threshold is
    errorMessage: "Gist root is expired",
    setProofExpiration: tenYears,
  },
  {
    name: "The generated proof is expired",
    stateTransitions: [
      require("../common-data/issuer_genesis_state.json"),
      require("../common-data/user_state_transition.json"),
      require("../common-data/issuer_next_state_transition.json"),
    ],
    proofJson: require("./data/valid_mtp_user_non_genesis.json"),
    errorMessage: "Generated proof is outdated",
  },
  {
    name: "Validate Genesis User State. Issuer Claim IdenState is in Chain. Revocation State is in Chain",
    stateTransitions: [require("../common-data/issuer_genesis_state.json")],
    proofJson: require("./data/valid_mtp_user_genesis.json"),
    setProofExpiration: tenYears,
    allowedIssuers: [ethers.BigNumber.from(123)],
    errorMessage: 'Issuer is not on the Allowed Issuers list'
  },
];

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


describe("Atomic MTP Validator", function () {
  let state: any, mtpValidator: any;

  beforeEach(async () => {
    const contracts = await deployValidatorContracts(
      "VerifierMTPWrapper",
      "CredentialAtomicQueryMTPValidator"
    );
    state = contracts.state;
    mtpValidator = contracts.validator;
  });

  for (const test of testCases) {
    it(test.name, async function () {
      this.timeout(50000);
      for (let i = 0; i < test.stateTransitions.length; i++) {
        if (test.stateTransitionDelayMs) {
          await Promise.all([publishState(state, test.stateTransitions[i]), delay(test.stateTransitionDelayMs)]);
        } else {
          await publishState(state, test.stateTransitions[i]);
        }
      }

      const query = {
        schema: ethers.BigNumber.from("180410020913331409885634153623124536270"),
        claimPathKey: ethers.BigNumber.from(
          "8566939875427719562376598811066985304309117528846759529734201066483458512800"
        ),
        operator: ethers.BigNumber.from(1),
        slotIndex: ethers.BigNumber.from(0),
        value: [
          ethers.BigNumber.from("1420070400000000000"),
          ...new Array(63).fill("0").map((x) => ethers.BigNumber.from(x)),
        ],
        queryHash: ethers.BigNumber.from(
          "1496222740463292783938163206931059379817846775593932664024082849882751356658"
        ),
        circuitIds: ["credentialAtomicQueryMTPV2OnChain"],
        metadata: "test medatada",
        skipClaimRevocationCheck: false,
      };

      const { inputs, pi_a, pi_b, pi_c } = prepareInputs(test.proofJson);
      if (test.setProofExpiration) {
        await mtpValidator.setProofExpirationTimeout(test.setProofExpiration);
      }
      if (test.setRevStateExpiration) {
        await mtpValidator.setRevocationStateExpirationTimeout(test.setRevStateExpiration);
      }
      if (test.setGISTRootExpiration) {
        await mtpValidator.setGISTRootExpirationTimeout(test.setGISTRootExpiration);
      }
      if (test.errorMessage) {
        await expect(mtpValidator.verify(inputs, pi_a, pi_b, pi_c, packValidatorParams(query, test.allowedIssuers))).to.be.revertedWith(
          test.errorMessage
        );
      } else if (test.errorMessage === "") {
        await expect(mtpValidator.verify(inputs, pi_a, pi_b, pi_c, packValidatorParams(query, test.allowedIssuers))).to.be.reverted;
      } else {
        await mtpValidator.verify(inputs, pi_a, pi_b, pi_c, packValidatorParams(query, test.allowedIssuers));
      }
    });
  }

  async function erc20VerifierFlow(callBack: (q, t, r) => Promise<void>): Promise<void> {
    const token: any = await deployERC20ZKPVerifierToken("zkpVerifer", "ZKPVR");
    await publishState(state, require("../common-data/user_state_transition.json"));
    await publishState(state, require("../common-data/issuer_genesis_state.json"));

    const { inputs, pi_a, pi_b, pi_c } = prepareInputs(
      require("./data/valid_mtp_user_non_genesis_challenge_address.json")
    );

    const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    expect(token.transfer).not.to.be.undefined;
    expect(token.submitZKPResponse).not.to.be.undefined;

    // try transfer without given proof

    await expect(
      token.transfer("0x900942Fd967cf176D0c0A1302ee0722e1468f580", 1)
    ).to.be.revertedWith("only identities who provided proof are allowed to receive tokens");
    expect(await token.balanceOf(account)).to.equal(0);

    // must be no queries
    console.log("supported requests - zero");

    expect((await token.getSupportedRequests()).length).to.be.equal(0);

    // set transfer request id

    const query = {
      schema: ethers.BigNumber.from("180410020913331409885634153623124536270"),
      claimPathKey: ethers.BigNumber.from(
        "8566939875427719562376598811066985304309117528846759529734201066483458512800"
      ),
      operator: ethers.BigNumber.from(1),
      value: [
        "1420070400000000000",
        ...new Array(63).fill("0").map((x) => ethers.BigNumber.from(x)),
      ],
      circuitId: "credentialAtomicQueryMTPV2OnChain",
    };

    const requestId = await token.TRANSFER_REQUEST_ID();
    expect(requestId).to.be.equal(1);

    await callBack(query, token, requestId);

    expect((await token.requestQueries(requestId)).queryHash.toString()).to.be.equal(
      "1496222740463292783938163206931059379817846775593932664024082849882751356658"
    ); // check that query is assigned
    expect((await token.getSupportedRequests()).length).to.be.equal(1);

    // submit response for non-existing request
    await expect(token.submitZKPResponse(2, inputs, pi_a, pi_b, pi_c)).to.be.revertedWith(
      "validator is not set for this request id"
    );

    await token.submitZKPResponse(requestId, inputs, pi_a, pi_b, pi_c);

    expect(await token.proofs(account, requestId)).to.be.true; // check proof is assigned

    // сheck that tokens were minted

    expect(await token.balanceOf(account)).to.equal(ethers.BigNumber.from("5000000000000000000"));

    // if proof is provided second time, address is not receiving airdrop tokens
    await expect(token.submitZKPResponse(requestId, inputs, pi_a, pi_b, pi_c)).to.be.revertedWith(
      "proof can not be submitted more than once'"
    );

    await token.transfer(account, 1); // we send tokens to ourselves, but no error.
    expect(await token.balanceOf(account)).to.equal(ethers.BigNumber.from("5000000000000000000"));
  }

  // it("Example ERC20 Verifier: set zkp request", async () => {
  //   await mtpValidator.setProofExpirationTimeout(tenYears);
  //   await erc20VerifierFlow(async (query, token, requestId) => {
  //     await token.setZKPRequest(
  //       requestId,
  //       mtpValidator.address,
  //       query.schema,
  //       query.claimPathKey,
  //       query.operator,
  //       query.value
  //     );
  //   });
  // });

  // it("Example ERC20 Verifier: set zkp request raw", async () => {
  //   await mtpValidator.setProofExpirationTimeout(tenYears);
  //   await erc20VerifierFlow(async (query, token, requestId) => {
  //     await token.setZKPRequestRaw(
  //       requestId,
  //       mtpValidator.address,
  //       query.schema,
  //       query.claimPathKey,
  //       query.operator,
  //       query.value,
  //       ethers.BigNumber.from(
  //         "1496222740463292783938163206931059379817846775593932664024082849882751356658"
  //       )
  //     );
  //   });
  // });
});
