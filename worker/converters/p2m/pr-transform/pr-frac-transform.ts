import { _l } from "../../../light-lodash";
import type { P2Pr } from "../p2pr";
import fEqual from "fast-deep-equal";
import { prTh } from "./pr-transform-helper";


export class PrFracTransform implements P2Pr.IPrTransform {
    transform(symbol: P2Pr.Symbol): P2Pr.Symbol {
        symbol = this.transformMultipleInverseFrac(symbol);
        symbol = this.transformMulFrac(symbol);
        symbol = this.transformFracWithSamePositivePower(symbol);
        symbol = this.transformAddFracs(symbol);
        symbol = this.transformLogFrac(symbol);
        const ctx: TransformCtx = { applyFound: false };
        symbol = this.transformNumeratorMinus(symbol, ctx);
        if (ctx.applyFound) {
            symbol = this.normalizeMul(symbol)
        }
        return symbol;
    }

    private transformFracWithSamePositivePower(symbol: Symbol): Symbol {
        if (symbol.type == "Frac") {
            const children = symbol.symbols.map(c => this.transformFracWithSamePositivePower(c));
            const [num, den] = children;

            const foundNumber = this.findSameExactPositivePower(num, den);
            if (foundNumber != "not-found") {
                return {
                    type: "Pow",
                    kind: "Container",
                    symbols: [{
                        type: "Frac",
                        kind: "Container",
                        symbols: [
                            (num as P2Pr.Pow).symbols[0],
                            (den as P2Pr.Pow).symbols[0]
                        ]
                    }, {
                        type: "Integer",
                        kind: "Leaf",
                        value: foundNumber
                    }]

                }
            }

            return { ...symbol, symbols: children };
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformFracWithSamePositivePower(s)) }
        }

        return symbol;
    }

    private findSameExactPositivePower(num: Symbol, den: Symbol): number | "not-found" {
        if (!(num.type == "Pow" && num.symbols[1].type == "Integer" && num.symbols[1].value > 1)) {
            return "not-found";
        }
        if (!(den.type == "Pow" && den.symbols[1].type == "Integer" && den.symbols[1].value > 1)) {
            return "not-found";
        }

        if (num.symbols[1].value == den.symbols[1].value) {
            return num.symbols[1].value;
        }

        return "not-found";
    }

    private transformLogFrac(symbol: Symbol): Symbol {
        if (symbol.type == "Frac") {
            const children = symbol.symbols.map(c => this.transformLogFrac(c));
            const [num, den] = children;
            if (num.type == "GenericFunc" && num.func == "log" && den.type == "GenericFunc" && den.func == "log") {
                if (den.symbols.length == 1 && den.symbols[0].type == "Integer") {
                    return prTh.index(
                        {
                            type: "GenericFunc",
                            kind: "Container",
                            func: "log",
                            symbols: [num.symbols[0]],
                        },
                        den.symbols[0],
                    )
                    // return {
                    //     type: "GenericFunc",
                    //     kind: "Container",
                    //     func: "log",
                    //     symbols: [den.symbols[0], num.symbols[0]],
                    // }
                }
            }

            return { ...symbol, symbols: children };
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformLogFrac(s)) }
        }

        return symbol;
    }

    /** remove multiple One or Negative One, and bring NegativeOne on top */
    private normalizeMul(symbol: Symbol): Symbol {
        if (symbol.type == "Mul") {
            const children = symbol.symbols.map(c => this.normalizeMul(c));
            let rsSymbols: Symbol[] = [];
            let currentSign = 1;
            for (const s of children) {
                if (s.type == "NegativeOne") {
                    currentSign = -currentSign;
                } else if (s.type == "One") {

                } else {
                    rsSymbols.push(s);
                }
            }

            if (currentSign < 0) {
                rsSymbols = [{ type: "NegativeOne", kind: "Leaf" } as Symbol].concat(rsSymbols);
            }

            return { ...symbol, symbols: rsSymbols };
        }
        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.normalizeMul(s)) }
        }

        return symbol;
    }

    private transformNumeratorMinus(symbol: Symbol, ctx: TransformCtx): Symbol {
        if (symbol.type == "Frac") {
            const children = symbol.symbols.map(c => this.transformNumeratorMinus(c, ctx));
            const [num, den] = children;
            if (this.isFracPartNegative(num) && !this.isFracPartNegative(den)) {
                console.log(num, den)
                ctx.applyFound = true;
                return prTh.mul(prTh.negativeOne(), prTh.frac(this.removeNegativePart(num), den));

            } else if (!this.isFracPartNegative(num) && this.isFracPartNegative(den)) {
                ctx.applyFound = true;
                return prTh.mul(prTh.negativeOne(), prTh.frac(num, this.removeNegativePart(den)));
            }

            return { ...symbol, symbols: children }
        }
        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformNumeratorMinus(s, ctx)) }
        }

        return symbol;
    }

    private isFracPartNegative(s: Symbol): s is FracSignReversableSymbol {
        if (s.type == "NegativeOne") {
            return true;
        }

        if (s.type == "Integer" && s.value < 0) {
            return true;
        }

        if (s.type == "Mul" && prTh.isNegativeOne(s.symbols[0])) {
            return true;
        }
        if (s.type == "Mul" && s.symbols[0].type == "Integer" && s.symbols[0].value < 0) {
            return true;
        }
    }

    private removeNegativePart(s: FracSignReversableSymbol): Symbol {
        switch (s.type) {
            case "Integer": return { ...s, value: -s.value }
            case "NegativeOne": return { type: "One", kind: "Leaf" }
            case "Mul": {
                if (prTh.isNegativeOne(s.symbols[0])) {
                    if (s.symbols.length == 2) {
                        return s.symbols[1];
                    }
                    return { ...s, symbols: s.symbols.slice(1) }
                }

                if (s.symbols[0].type == "Integer") {
                    return {
                        ...s,
                        symbols: [{ ...s.symbols[0], value: -s.symbols[0].value } as Symbol].concat(s.symbols.slice(1))
                    }
                }
            }
        }

        return s;
    }

    private transformAddFracs(symbol: Symbol): Symbol {
        if (symbol.type == "Add") {
            const children = symbol.symbols.map(s => this.transformAddFracs(s));
            return {
                ...symbol, symbols: children.reduce((prev, c) => this.combine2FracSameDenominator(prev, c), [] as Symbol[]),
            }
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformAddFracs(s)) }
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

    private transformMultipleInverseFrac(symbol: Symbol): Symbol {
        if (symbol.type == "Mul" && !symbol.unevaluatedDetected) {
            const children = this.combineInverseFrac(symbol.symbols.map(s => this.transformMultipleInverseFrac(s)));
            if (children.length <= 1) {
                return children[0];
            }

            return { ...symbol, symbols: children };
        }
        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformMultipleInverseFrac(s)) }
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
        return symbol.type == "Frac" && prTh.isSymbolValueOne(symbol.symbols[0])
    }

    private transformMulFrac(symbol: Symbol): Symbol {
        if (symbol.type == "Mul") {
            const children = symbol.symbols.map(s => this.transformMulFrac(s));
            if (children.length <= 1) {
                return children[0];
            }

            const orderedChildren = symbol.unevaluatedDetected ? children : this.combineMulFracs(children);

            return { ...symbol, symbols: orderedChildren };
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformMulFrac(s)) }
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
        const rs = symbols.filter(c => !prTh.isSymbolValueOne(c));
        return rs.length <= 0 ? [{ type: "One", kind: "Leaf" }] : rs;
    }

    private wrapMulIfRequire(symbols: Symbol[]): Symbol {
        if (symbols.length <= 1) {
            return symbols[0];
        }

        return { type: "Mul", unevaluatedDetected: false, kind: "Container", symbols }
    }
}

type Symbol = P2Pr.Symbol;


type FracSignReversableSymbol = P2Pr.NegativeOne | P2Pr.Integer | P2Pr.Mul;

interface TransformCtx {
    applyFound: boolean;
}