import type { P2Pr } from "../p2pr";
import { PrBaseTransform } from "./pr-base-transform";
import { prTh } from "./pr-transform-helper";

export class PrPowerTransform extends PrBaseTransform {

    protected initCtx(): {} {
        return {};
    }
    override initTransform() {
        return [
            this.makeTransform(this.transformPowNegativeOne, op => op.pow?.negativeOneToFrac),
            this.makeTransform(this.transformPowNegativeInt, op => op.pow?.negativeIntegerToFrac),
            this.makeTransform(this.transformPowHalf, op => op.pow?.halfToRootSquare),
            this.makeTransform(this.transformPowOneOfInt, op => op.pow?.oneOfIntegerToPowOfRootSquare),
            this.makeTransform(this.transformPowOfOne, () => true),
            this.makeTransform(this.transformMergeIndex, () => true),
        ]
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


    private transformPowOfOne = (s: P2Pr.Symbol): P2Pr.Symbol => {
        if (this.isAllow(s) && prTh.isOne(s.symbols[1])) {
            return this.mergedWithRemaningIdx(s.symbols[0], s);
        }

        return s;
    }

    private transformMergeIndex = (s: Symbol): Symbol => {
        if (this.isAllow(s)) {
            let allowMergeIdx = true;
            if (s.symbols[0].type == "Index" && s.symbols[0].noPowMerge) {
                allowMergeIdx = false;
            }
            if (s.symbols[0].type == "Index" && s.symbols[0].symbols[0].type == "GenericFunc" && s.symbols[0].symbols[0].powerIndexPos == "wrap-all") {
                allowMergeIdx = false;
            }
            if (s.symbols[0].type == "Index" && !s.symbols[2] && allowMergeIdx) {
                return prTh.pow(s.symbols[0].symbols[0], s.symbols[1], s.symbols[0].symbols[1])
            }
        }

        return s;
    }

    private transformPowNegativeOne = (s: Symbol): Symbol => {
        if (this.isAllow(s) && prTh.isNegativeOne(s.symbols[1])) {
            /**ignore one  */
            if (prTh.isOne(s.symbols[0])) {
                return s;
            }

            return prTh.frac(prTh.one(), this.mergedWithRemaningIdx(s.symbols[0], s));
        }

        return s;
    }
    private transformPowNegativeInt = (s: Symbol): Symbol => {
        if (this.isAllow(s) && (prTh.isNegativeInt(s.symbols[1]) || prTh.isMulNegativeOf(s.symbols[1]))) {
            /**handle by  transformPowNegativeOne already */
            if (prTh.isNegativeOne(s.symbols[1])) {
                return s;
            }

            if (prTh.isOne(s.symbols[0])) {
                return s;
            }

            return prTh.frac(
                prTh.one(),
                prTh.pow(s.symbols[0], prTh.removeNegativeSign(s.symbols[1]), s.symbols[2])
            )
        }

        return s;
    }
    private transformPowHalf = (s: Symbol): Symbol => {
        if (this.isAllow(s) && prTh.matchRationalFrac(s.symbols[1], 1, 2)) {
            
            return this.powerRationalToSqrt(this.mergedWithRemaningIdx(s.symbols[0], s), s.symbols[1], s);
        }

        return s;
    }
    private transformPowOneOfInt = (s: Symbol): Symbol => {
        if (this.isAllow(s) && prTh.matchRationalFrac(s.symbols[1], 1)) {
            
            const [denominator] = prTh.extractRationalFrac(s.symbols[1]);
            /**handle by  transformPowHalf already */
            if (denominator == 2) {
                return s;
            }
            return this.powerRationalToSqrt(this.mergedWithRemaningIdx(s.symbols[0], s), s.symbols[1], s);
        }

        return s;
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