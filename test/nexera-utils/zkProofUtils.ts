import { OnChainZKP } from "@nexeraprotocol/nexera-id-schemas";

export function prepareInputs(json: {
  proof: {
    pi_a: string[];
    pi_b: string[][]; //[[string, string], [string, string]];
    pi_c: string[];
  };
  pub_signals: string[];
}): {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  inputs: string[];
} {
  const { proof, pub_signals } = json;
  const { pi_a, pi_b, pi_c } = proof;
  const [[p1, p2], [p3, p4]] = pi_b;
  const preparedProof = {
    pi_a: pi_a.slice(0, 2) as [string, string],
    pi_b: [
      [p2, p1],
      [p4, p3],
    ] as [[string, string], [string, string]],
    pi_c: pi_c.slice(0, 2) as [string, string],
  };

  return { inputs: pub_signals, ...preparedProof };
}
export function prepareInputsForWhitelist(
  json: {
    proof: {
      pi_a: string[];
      pi_b: string[][];
      pi_c: string[];
    };
    pub_signals: string[];
  },
  requestId: number,
) {
  const preparedInputs = prepareInputs(json);
  const zkpOnChain: OnChainZKP = {
    requestId: requestId,
    inputs: preparedInputs.inputs,
    a: preparedInputs.pi_a,
    b: preparedInputs.pi_b,
    c: preparedInputs.pi_c,
  };

  return zkpOnChain;
}
