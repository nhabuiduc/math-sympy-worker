import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";

class Float {
    parse(text: string): P2Pr.Var | P2Pr.Mul {
        /**should not starts with e */
        if (text.indexOf("e") <= 0) {
            return prTh.float(text);
        }

        let [mant, exp] = text.split("e");
        if (exp[0] == "+") {
            exp = exp.substr(1);
        }
        return {
            type: "Mul",
            kind: "Container",
            unevaluatedDetected: true,
            symbols: [prTh.float(mant), {
                type: "Pow",
                kind: "Container",
                symbols: [prTh.int(10), prTh.float(exp)]
            }]
        }
    }
}

export const float = new Float()