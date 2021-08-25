import { P2Pr } from "../p2pr";

class Float {
    parse(text: string): P2Pr.Float | P2Pr.Mul {
        /**should not starts with e */
        if (text.indexOf("e") <= 0) {
            return { type: "Float", kind: "Leaf", value: text };
        }

        let [mant, exp] = text.split("e");
        if (exp[0] == "+") {
            exp = exp.substr(1);
        }
        return {
            type: "Mul",
            kind: "Container",
            unevaluatedDetected: true,
            symbols: [{
                type: "Float",
                kind: "Leaf",
                value: mant
            }, {
                type: "Pow",
                kind: "Container",
                indexJson: undefined,
                symbols: [{
                    type: "Integer",
                    kind: "Leaf",
                    value: 10,
                }, {
                    type: "Float",
                    kind: "Leaf",
                    value: exp
                }]
            }]
        }
    }
}

export const float = new Float()