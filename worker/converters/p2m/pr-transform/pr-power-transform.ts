import type { P2Pr } from "../p2pr";
import { prTh } from "./pr-transform-helper";

export class PrPowerTransform implements P2Pr.IPrTransform {
    transform(symbol: P2Pr.Symbol): P2Pr.Symbol {
        symbol = this.transformSpecialPower(symbol);
        symbol = this.transformPositiveNumberPower(symbol);
        symbol = this.transformMergeIndex(symbol);
        return symbol
    }

    private isAllow(s: P2Pr.Symbol): s is P2Pr.Pow {
        return (s.type == "Pow" && !s.preventTransform);
    }

    private mergedWithRemaningIdx(rs: Symbol, pow: P2Pr.Pow): Symbol {
        if (!pow.symbols[2]) {
            return rs;
        }
        return prTh.index(rs, pow.symbols[2]);
    }


    private transformPositiveNumberPower(symbol: P2Pr.Symbol): P2Pr.Symbol {
        if (this.isAllow(symbol)) {
            const ss = symbol.symbols.map(s => this.transformPositiveNumberPower(s))
            if (prTh.isIntType(ss[0]) && prTh.isRationalFrac(ss[1])) {
                return this.powerRationalToSqrt(ss[0], ss[1], symbol);
            }

            if (prTh.isOne(ss[1])) {
                return this.mergedWithRemaningIdx(ss[0], symbol);
            }
        }


        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformPositiveNumberPower(s)) }
        }

        return symbol;
    }

    private transformMergeIndex(symbol: Symbol) {
        if (this.isAllow(symbol)) {
            const ss = symbol.symbols.map(s => this.transformMergeIndex(s))

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
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformMergeIndex(s)) }
        }

        return symbol;
    }

    private transformSpecialPower(symbol: Symbol): Symbol {
        if (this.isAllow(symbol)) {
            const ss = symbol.symbols.map(s => this.transformSpecialPower(s))

            const root = ss[1];
            if (prTh.isNegativeOne(root)) {
                return prTh.frac(prTh.one(), this.mergedWithRemaningIdx(ss[0], symbol));
            }
            if (prTh.isNegativeInt(root) || prTh.isMulNegativeOf(root)) {
                return prTh.frac(
                    prTh.one(),
                    prTh.pow(ss[0], prTh.removeNegativeSign(root), ss[2])
                )
            }

            if (prTh.matchRationalFrac(root, 1, 2)) {
                return this.powerRationalToSqrt(this.mergedWithRemaningIdx(ss[0], symbol), root, { ...symbol, symbols: ss });

            }
            if (prTh.matchRationalFrac(root, 1)) {
                return this.powerRationalToSqrt(this.mergedWithRemaningIdx(ss[0], symbol), root, { ...symbol, symbols: ss });
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