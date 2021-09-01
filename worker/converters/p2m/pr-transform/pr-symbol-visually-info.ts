import stringHelper from "@lib-shared/string-helper";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";
import { prTh } from "./pr-transform-helper";

class PrSymbolVisuallyInfo {
    check(s: Symbol, c: Pr2M.CResult | undefined): CheckResult {
        if (c && c.prBracket) {
            return this.allUnit;
        }

        switch (s.type) {
            case "BinaryOp": {
                return this.allParts;
            }
            case "UnaryOp": {
                return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "parts", prSign: false }
            }
            case "Add": {
                return this.allParts;
            }
            case "Var": {
                switch (s.nativeType) {
                    case "Float":
                    case "Integer": {
                        if (s.name[0] != "-") {
                            return this.allUnit;
                        }
                        return { ...this.allPartsSign, prExcludeSign: "unit" };
                    }

                    case "One":
                    case "Zero": {
                        return this.allUnit;
                    }
                    case "NegativeOne": {
                        return { ...this.allPartsSign, prExcludeSign: "unit" };
                    }
                }

                /**try to detect if it's number pattern */
                if (s.name.match(/^[\-]?[\d\.]+$/) && s.name[0] != "." && s.name[s.name.length - 1] != ".") {
                    if (s.name[0] == "-") {
                        return { ...this.allPartsSign, prExcludeSign: "unit" };;
                    }
                    return this.allUnit;
                }

                if (stringHelper.length(s.name) == 1) {
                    return this.allUnit;
                }
                if (s.name[0] == "-") {
                    return this.allPartsSign;
                }
                return this.allParts;
            }
            case "VarList": {
                if (s.bracket) {
                    return this.allUnit;
                }
                if (s.symbols.length == 1) {
                    return this.check(s.symbols[0], undefined);
                }
                return this.allParts;
            }
            case "Mul": {
                if (c?.prMul?.allInShortcutForm) {
                    if (!prTh.isNegativeInt(s.symbols[0])) {
                        return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "parts", prSign: false, isMulShorthand: true }
                    }
                    return { ...this.allPartsSign, prExcludeSign: "unit", isMulShorthand: true }
                }

                return { prOp: "parts", prPowerIndex: "parts", prShorthandMul: "parts", prSign: prTh.isNegativeInt(s.symbols[0]) }
            }
            case "Pow": {
                if (c?.prPow?.powMergedInFunc) {
                    return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "parts", prSign: false, }
                }
                return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "unit", prSign: false, }
            }
            case "Sqrt":
            case "Frac":
            case "Prescript":
            case "PrescriptIdx":
            case "Index": {
                return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "unit", prSign: false, }
            }
            case "JsonData": {
                return this.allParts;
            }
            case "Derivative":
            case "GenericFunc": {
                return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "parts", prSign: false, }
            }
            case "Matrix": {
                if (s.bracket) {
                    return this.allUnit;
                }
                return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "parts", prSign: false, }
            }
            case "OverSymbol": {
                return this.allUnit;
            }
            case "Piecewise":
            case "Product":
            case "Sum":
            case "Limit":
            case "Integral": {
                return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "right-parts-left-unit", prSign: false, }
            }
            case "Binomial": {
                return this.allUnit;
            }
            case "Relational": {
                return this.allParts;
            }
            case "Subs":
            case "Order": {
                return { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "parts", prSign: false, }
            }

        }

        assertUnreachable(s);
    }

    private allUnit: CheckResult = { prOp: "unit", prPowerIndex: "unit", prShorthandMul: "unit", prSign: false }
    private allPartsSign: CheckResult = { prOp: "parts", prPowerIndex: "parts", prShorthandMul: "parts", prSign: true }
    private allParts: CheckResult = { prOp: "parts", prPowerIndex: "parts", prShorthandMul: "parts", prSign: false }
}

interface CheckResult {
    prOp: "unit" | "parts";
    prPowerIndex: "unit" | "parts";
    prShorthandMul: "unit" | "parts" | "right-parts-left-unit";
    prSign: boolean;
    isMulShorthand?: boolean;
    prExcludeSign?: "unit";
}



export const prSymbolVisuallyInfo = new PrSymbolVisuallyInfo();

type Symbol = P2Pr.Symbol;

function assertUnreachable(_x: never): void {
    /**should not throw exception, as reducer will come here :() or other cases */
    // throw new Error("Didn't expect to get here");
}