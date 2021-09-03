import { _l } from "../../../light-lodash";
import type { P2Pr } from "../p2pr";
import fEqual from "fast-deep-equal";
import { prTh } from "./pr-transform-helper";

export class PrSqrtTransform implements P2Pr.IPrTransform {
    transform(symbol: Symbol): Symbol {
        return this.transformMulSameSqrt(symbol);
    }

    private transformMulSameSqrt(symbol: Symbol): Symbol {
        if (symbol.type == "Mul") {
            const children = symbol.symbols.map(s => this.transformMulSameSqrt(s));
            return { ...symbol, symbols: children.reduce((prev, c) => this.combineMulSameSqrt(prev, c), [] as Symbol[]) }
        }
        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformMulSameSqrt(s)) }
        }

        return symbol;
    }


    private combineMulSameSqrt(prev: Symbol[], cur: Symbol): Symbol[] {
        if (prev.length <= 0) {
            return prev.concat([cur]);
        }

        const last = _l.last(prev);
        if (this.isSameSqrt(last, cur)) {
            const sqrt: P2Pr.Sqrt = {
                type: "Sqrt",
                kind: "Container",
                symbols: [prTh.mulOf(last.symbols[0], (cur as P2Pr.Sqrt).symbols[0])]
            };
            if (last.symbols[1]) {
                sqrt.symbols.push(last.symbols[1]);
            }
            prev[prev.length - 1] = sqrt;
            return prev;
        }
        return prev.concat([cur]);
    }

    private isSameSqrt(s1: Symbol, s2: Symbol): s1 is P2Pr.Sqrt {
        if (s1.type != "Sqrt" || s2.type != "Sqrt") {
            return false;
        }

        if (s1.symbols.length != s2.symbols.length) {
            return false;
        }

        return fEqual(s1.symbols[1], s2.symbols[1]);
    }

}

type Symbol = P2Pr.Symbol;