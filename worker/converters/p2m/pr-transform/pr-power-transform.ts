import type { P2Pr } from "../p2pr";
import { prTh } from "./pr-transform-helper";

export class PrPowerTransform implements P2Pr.IPrTransform {
    transform(symbol: P2Pr.Symbol): P2Pr.Symbol {
        symbol = this.transformSpecialPower(symbol);
        symbol = this.transformPositiveNumberPower(symbol);
        return symbol
    }

    private transformPositiveNumberPower(symbol: P2Pr.Symbol): P2Pr.Symbol {
        if (symbol.type == "Pow" && prTh.isIntType(symbol.symbols[0]) && prTh.isRationalFrac(symbol.symbols[1])) {
            return this.powerRationalToSqrt(symbol.symbols[0], symbol.symbols[1], symbol);
        }
        if (symbol.type == "Pow" && prTh.isOne(symbol.symbols[1])) {
            return this.transformPositiveNumberPower(symbol.symbols[0]);
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformPositiveNumberPower(s)) }
        }

        return symbol;
    }

    private transformSpecialPower(symbol: Symbol): Symbol {
        if (symbol.type == "Pow") {
            const ss = symbol.symbols.map(s => this.transformSpecialPower(s))
            const root = ss[1];
            if (prTh.isNegativeOne(root)) {
                return prTh.frac(prTh.one(), ss[0]);
            }
            if (prTh.isNegativeInt(root) || prTh.isMulNegativeOf(root)) {
                return prTh.frac(
                    prTh.one(),
                    prTh.pow(ss[0], prTh.removeNegativeSign(root))
                )
            }

            if (prTh.matchRationalFrac(root, 1, 2)) {
                return this.powerRationalToSqrt(ss[0], root, { ...symbol, symbols: ss });

            }
            if (prTh.matchRationalFrac(root, 1)) {
                return this.powerRationalToSqrt(ss[0], root, { ...symbol, symbols: ss });
            }

            let allowMergeIdx = true;
            if (ss[0].type == "Index" && ss[0].noPowMerge) {
                allowMergeIdx = false;
            }
            if (ss[0].type == "Index" && ss[0].symbols[0].type == "GenericFunc" && ss[0].symbols[0].powerIndexPos == "wrap-all") {
                allowMergeIdx = false;
            }
            if (ss[0].type == "Index" && !ss[2] && allowMergeIdx) {
                ss.push(ss[0].symbols[1]);
                ss[0] = ss[0].symbols[0];
            }

            return { ...symbol, symbols: ss }
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformSpecialPower(s)) }
        }

        return symbol;
    }

    private powerRationalToSqrt(base: Symbol, rational: P2Pr.Frac, defaultSymbol: Symbol): Symbol {
        const [enumerator, denominator] = prTh.extractRationalFrac(rational);
        if (enumerator == 1 && denominator == 2) {
            return {
                type: "Sqrt",
                kind: "Container",
                symbols: [base]
            }
        }

        if (enumerator == 1) {
            return {
                type: "Sqrt",
                kind: "Container",
                symbols: [base, prTh.int(denominator)]
            }
        }

        if (prTh.isPositiveInt(base)) {
            return {
                type: "Sqrt",
                kind: "Container",
                symbols: [prTh.pow(base, prTh.int(enumerator)), prTh.int(denominator)]
            }
        }

        return defaultSymbol;
    }
}

type Symbol = P2Pr.Symbol;