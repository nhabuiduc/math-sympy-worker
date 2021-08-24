import type { P2Pr } from "../p2pr";

class PrCreator {
    integer(vl: number): P2Pr.Integer {
        return { type: "Integer", kind: "Leaf", value: vl };
    }

    integerOrSpecial(vl: number): P2Pr.Symbol {
        if (vl == 0) {
            return { type: "Zero", kind: "Leaf" }
        }
        if (vl == 1) {
            return { type: "One", kind: "Leaf" }
        }
        if (vl == -1) {
            return { type: "NegativeOne", kind: "Leaf" }
        }

        return { type: "Integer", kind: "Leaf", value: vl };
    }

    power(base: Symbol, vl: number): P2Pr.Pow {
        return { type: "Pow", kind: "Container", symbols: [base, this.integer(vl)], indexJson: undefined };
    }

    frac(num: Symbol, den: Symbol): P2Pr.Frac {
        return {
            type: "Frac",
            kind: "Container",
            symbols: [num, den]
        }
    }
    mul(...symbols: Symbol[]): P2Pr.Mul {
        return {
            type: "Mul",
            kind: "Container",
            symbols: symbols,
            unevaluatedDetected: false,
        }
    }

    negativeOne(): P2Pr.NegativeOne {
        return { type: "NegativeOne", kind: "Leaf" };
    }
}

export const prCreator = new PrCreator();

type Symbol = P2Pr.Symbol;