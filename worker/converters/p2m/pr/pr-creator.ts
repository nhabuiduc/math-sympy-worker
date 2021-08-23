import type { P2Pr } from "../p2pr";

class PrCreator {
    integer(vl: number): P2Pr.Integer {
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
        }
    }

    negativeOne(): P2Pr.NegativeOne {
        return { type: "NegativeOne", kind: "Leaf" };
    }
}

export const prCreator = new PrCreator();

type Symbol = P2Pr.Symbol;