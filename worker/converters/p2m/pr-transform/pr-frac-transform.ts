import { _l } from "../../../light-lodash";
import type { P2Pr } from "../p2pr";
import fEqual from "fast-deep-equal";
import { prTh } from "./pr-transform-helper";
import { PrBaseTransform } from "./pr-base-transform";

export class PrFracTransform extends PrBaseTransform<TransformCtx> {
    protected initCtx(): TransformCtx {
        return {};
    }
    override initTransform() {
        return [
            this.makeTransform(this.transformMultipleInverseFrac, op => op.frac?.combineMul),
            this.makeTransform(this.transformMulFrac, op => op.frac?.combineMul),
            this.makeTransform(this.transformFracWithSamePositivePower, op => op.frac?.combineNumAndDenoSamePow),
            this.makeTransform(this.transformAddFracs, op => op.frac?.combineAdd),
            this.makeTransform(this.transformLogFrac, op => op.frac?.combineLogFrac),
            this.makeTransform(this.transformNumOrDenMinus, op => op.frac?.extractMinus),
            this.makeTransform(prTh.normalizeMul, (_op, ctx) => ctx.minusApplied),
        ]
    }

    private transformFracWithSamePositivePower = (symbol: Symbol): Symbol => {
        if (symbol.type == "Frac") {
            const [num, den] = symbol.symbols;
            const foundNumber = this.findSameExactPositivePower(num, den);
            if (foundNumber != "not-found") {
                return prTh.pow(
                    prTh.frac(
                        (num as P2Pr.Pow).symbols[0],
                        (den as P2Pr.Pow).symbols[0]
                    ),
                    prTh.int(foundNumber))
            }
        }

        return symbol;
    }

    private findSameExactPositivePower(num: Symbol, den: Symbol): string | "not-found" {
        if (!(num.type == "Pow" && prTh.isPositiveInt(num.symbols[1]))) {
            return "not-found";
        }
        if (!(den.type == "Pow" && prTh.isPositiveInt(den.symbols[1]))) {
            return "not-found";
        }

        if (num.symbols[1].type == "Var" && den.symbols[1].type == "Var") {
            if (num.symbols[1].name == den.symbols[1].name) {
                return num.symbols[1].name;
            }
        }

        return "not-found";
    }

    private transformLogFrac = (symbol: Symbol): Symbol => {
        if (symbol.type == "Frac") {
            const [num, den] = symbol.symbols;
            if (num.type == "GenericFunc" && num.func == "log" && den.type == "GenericFunc" && den.func == "log") {
                if (den.symbols.length == 1 && prTh.isIntType(den.symbols[0])) {
                    return prTh.index(
                        prTh.genFunc("log", [num.symbols[0]]),
                        den.symbols[0],
                    )
                }
            }

            return symbol;
        }

        return symbol;
    }



    private transformNumOrDenMinus = (symbol: Symbol, ctx: TransformCtx): Symbol => {
        if (symbol.type == "Frac") {
            const [num, den] = symbol.symbols;
            if (this.isFracPartNegative(num) && !this.isFracPartNegative(den)) {
                ctx.minusApplied = true;
                return prTh.mulOf(prTh.negativeOne(), prTh.frac(this.removeNegativePart(num), den));

            } else if (!this.isFracPartNegative(num) && this.isFracPartNegative(den)) {
                ctx.minusApplied = true;
                return prTh.mulOf(prTh.negativeOne(), prTh.frac(num, this.removeNegativePart(den)));
            }

            return symbol;
        }

        return symbol;
    }

    private isFracPartNegative(s: Symbol): s is FracSignReversableSymbol {
        if (prTh.isNegativeInt(s)) {
            return true;
        }


        if (s.type == "Mul" && prTh.isNegativeInt(s.symbols[0])) {
            return true;
        }
    }

    private removeNegativePart(s: FracSignReversableSymbol): Symbol {
        if (s.type == "Var") {
            if (prTh.isNegativeOne(s)) {
                return prTh.one();
            }

            if (prTh.isNegativeInt(s)) {
                return prTh.int(s.name.substr(1))
            }
        }

        else if (s.type == "Mul") {
            if (prTh.isNegativeOne(s.symbols[0])) {
                if (s.symbols.length == 2) {
                    return s.symbols[1];
                }
                return { ...s, symbols: s.symbols.slice(1) }
            }

            if (prTh.isNegativeInt(s.symbols[0])) {
                return {
                    ...s,
                    symbols: [{ ...s.symbols[0], name: s.symbols[0].name.substr(1) } as Symbol].concat(s.symbols.slice(1))
                }
            }
        }


        return s;
    }

    private transformAddFracs = (symbol: Symbol): Symbol => {
        if (symbol.type == "Add") {
            return {
                ...symbol, symbols: symbol.symbols.reduce((prev, c) => this.combine2FracSameDenominator(prev, c), [] as Symbol[]),
            }
        }

        return symbol;
    }

    private combine2FracSameDenominator(prev: Symbol[], cur: Symbol): Symbol[] {
        if (prev.length <= 0) {
            return prev.concat(cur);
        }

        const last = _l.last(prev);
        if (last.type != "Frac" || cur.type != "Frac") {
            return prev.concat(cur);
        }

        if (!this.symbolEquals(last.symbols[1], cur.symbols[1])) {
            return prev.concat(cur);
        }

        const lastFrac = (last as P2Pr.Frac);
        if (lastFrac.symbols[0].type == "Add") {
            lastFrac.symbols[0].symbols.push(cur.symbols[0]);
            return prev;
        }

        lastFrac.symbols[0] = { type: "Add", kind: "Container", symbols: [lastFrac.symbols[0], cur.symbols[0]] };
        return prev;
    }

    private symbolEquals(s1: Symbol, s2: Symbol): boolean {
        if (s1 == s2) {
            return true;
        }
        if (!!s1 != !!s2) {
            return false;
        }

        if (s1.type != s2.type) {
            return false;
        }

        return fEqual(s1, s2);
    }

    private transformMultipleInverseFrac = (symbol: Symbol): Symbol => {
        if (symbol.type == "Mul" && !prTh.detectUnevaluatedMul(symbol)) {
            const children = this.combineInverseFrac(symbol.symbols);
            if (children.length <= 1) {
                return children[0];
            }

            return { ...symbol, symbols: children };
        }

        return symbol;
    }

    private combineInverseFrac(symbols: Symbol[]): Symbol[] {
        if (symbols.length <= 1) {
            return symbols;
        }


        const rs: Symbol[] = [];
        for (let idx = 0; idx < symbols.length; idx++) {
            const symbol = symbols[idx];
            this.tryCombineInverseFracBy2(rs, symbol)
        }

        // console.dir(rs, { depth: 10 });
        return rs;
    }

    private tryCombineInverseFracBy2(symbols: Symbol[], next: Symbol): void {
        const prev = symbols[symbols.length - 1];
        if (!prev || !next) {
            symbols.push(next);
            return;
        }


        if (this.isInverseFrac(prev) && next.type != "Frac") {
            prev.symbols[0] = next;
            return;
        }

        if (this.isInverseFrac(next) && prev.type != "Frac") {
            next.symbols[0] = prev;
            symbols[symbols.length - 1] = next;
            return;
        }

        symbols.push(next);
    }


    private isInverseFrac(symbol: Symbol): symbol is P2Pr.Frac {
        return symbol.type == "Frac" && prTh.isOne(symbol.symbols[0])
    }

    private transformMulFrac = (symbol: Symbol): Symbol => {
        if (symbol.type == "Mul") {
            const { symbols: children } = symbol;
            if (children.length == 1) {
                return children[0];
            }

            const orderedChildren = prTh.detectUnevaluatedMul(symbol) ? children : this.combineMulFracs(children);
            if (orderedChildren.length == 1) {
                return orderedChildren[0];
            }

            return { ...symbol, symbols: orderedChildren };
        }

        return symbol;
    }

    private combineMulFracs(symbols: Symbol[]): Symbol[] {
        if (symbols.length <= 1) {
            return symbols;
        }

        const enumerator: Symbol[] = [];
        const denominator: Symbol[] = [];
        for (let idx = 0; idx < symbols.length; idx++) {
            const symbol = symbols[idx];
            if (symbol.type == "Frac") {
                enumerator.push(symbol.symbols[0]);
                denominator.push(symbol.symbols[1]);
            }
            else {
                enumerator.push(symbol);
            }
        }

        if (denominator.length <= 0) {
            return symbols;
        }

        return [{
            type: "Frac", kind: "Container", symbols: [
                this.wrapMulIfRequire(this.filterOutOneSymbol(enumerator)),
                this.wrapMulIfRequire(this.filterOutOneSymbol(denominator))]
        }];
    }

    private filterOutOneSymbol(symbols: Symbol[]): Symbol[] {
        const rs = symbols.filter(c => !prTh.isOne(c));
        return rs.length <= 0 ? [prTh.one()] : rs;
    }

    private wrapMulIfRequire(symbols: Symbol[]): Symbol {
        if (symbols.length <= 1) {
            return symbols[0];
        }

        return { type: "Mul", kind: "Container", symbols }
    }
}

type Symbol = P2Pr.Symbol;


type FracSignReversableSymbol = P2Pr.Var | P2Pr.Mul;

interface TransformCtx {
    minusApplied?: boolean;
}