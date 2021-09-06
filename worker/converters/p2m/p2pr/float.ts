import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";

class Float {
    parse(text: string): P2Pr.Var | P2Pr.Mul {
        if (text == "+inf") {
            return prTh.var("∞");
        }
        if (text == "-inf") {
            return prTh.mul([prTh.negativeOne(), prTh.var("∞")]);
        }

        /**should not starts with e */
        if (text.indexOf("e") <= 0) {
            return prTh.float(text);
        }

        let [mant, exp] = text.split("e");
        if (exp[0] == "+") {
            exp = exp.substr(1);
        }
        return prTh.mul([prTh.float(mant), prTh.pow(prTh.int(10), prTh.float(exp))])
    }
}

export const float = new Float()