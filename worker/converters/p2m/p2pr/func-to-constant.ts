import stringHelper from "@lib-shared/string-helper";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";

class FuncToConstant {
    map(name: string, ops: P2Pr.TransformOptions): P2Pr.Var {
        const resolved = this.funcMap[name] || name;

        if (stringHelper.length(resolved) > 1) {
            return prTh.numberSymbol(resolved, { normalText: true })
        }

        if (ops.imaginaryUnit?.textStyle && name == "ImaginaryUnit") {
            return prTh.numberSymbol(resolved, { normalText: true })
        }

        return prTh.numberSymbol(resolved)
    }

    private funcMap: { [key: string]: string } = {
        "Infinity": "∞",
        "NegativeInfinity": "-∞",
        "ComplexInfinity": "∞̃",
        "Exp1": "e",
        "ImaginaryUnit": "i",
        "Pi": "𝜋",
        "EulerGamma": "𝛾",
        "Catalan": "Catalan",
        "GoldenRatio": "𝜙",
        "Zero": "0",
        "HBar": "ℏ",
        "TribonacciConstant": "TribonacciConstant",
    }
}

export const funcToConstant = new FuncToConstant();