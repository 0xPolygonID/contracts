import { deployValidators } from "../../lib/deploy/deployValidatorsLib";
import { setRequestForScenario } from "../../lib/setRequest/setRequestScenario";
import { ScenarioWhitelist } from "../../types";

export const setupScenario2Rules = async (
  scenarioWhitelist: ScenarioWhitelist,
) => {
  const validatorAddress = await deployValidators();
  // Set Request for Rule 1: ProofOfResidence
  validatorAddress &&
    (await setRequestForScenario(
      1,
      await scenarioWhitelist.getAddress(),
      validatorAddress,
      "ProofOfResidence",
    ));
  // Set Request for Rule 2: IDScan
  validatorAddress &&
    (await setRequestForScenario(
      2,
      await scenarioWhitelist.getAddress(),
      validatorAddress,
      "IDScan",
    ));
};
