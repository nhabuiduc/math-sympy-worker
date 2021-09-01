import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";

class PrSymbolVisuallyInfo {
    check(s: Symbol, c: Pr2M.CResult): CheckResult {
        if (c.prUnit == "bracket") {
            return this.allUnit;
        }

        switch (s.type) {
            case "One":
            case "Zero": {
                return this.allUnit;
            }
            // case ""
        }

        assertUnreachable(s);
    }

    private allUnit: CheckResult = { prOp: "unit", prPowerIndex: "unit", prShorthandMul: "unit" }
}

interface CheckResult {
    prOp: "unit" | "parts";
    prPowerIndex: "unit" | "parts";
    prShorthandMul: "unit" | "parts" | "right-parse-left-unit";
}



export const prSymbolVisuallyInfo = new PrSymbolVisuallyInfo();

type Symbol = P2Pr.Symbol;

function assertUnreachable(_x: never): void {
    /**should not throw exception, as reducer will come here :() or other cases */
    // throw new Error("Didn't expect to get here");
}