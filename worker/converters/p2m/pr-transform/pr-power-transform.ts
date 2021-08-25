import type { P2Pr } from "../p2pr";
import { prCreator } from "../pr/pr-creator";
import { prTh } from "./pr-transform-helper";

export class PrPowerTransform implements P2Pr.IPrTransform {
    transform(symbol: P2Pr.Symbol): P2Pr.Symbol {
        symbol = this.transformSpecialPower(symbol);
        symbol = this.transformPositiveNumberPower(symbol);
        return symbol
    }

    private transformPositiveNumberPower(symbol: P2Pr.Symbol): P2Pr.Symbol {
        if (symbol.type == "Pow" && symbol.symbols[0].type == "Integer" && prTh.isRationalFrac(symbol.symbols[1])) {
            return this.powerRationalToSqrt(symbol.symbols[0], symbol.symbols[1], symbol);
        }
        if (symbol.type == "Pow" && symbol.symbols[1].type == "Integer" && symbol.symbols[1].value == 1) {
            return this.transformPositiveNumberPower(symbol.symbols[0]);
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.transformPositiveNumberPower(s)) }
        }

        return symbol;
    }

    private transformSpecialPower(symbol: Symbol): Symbol {
        if (symbol.type == "Pow") {
            const root = symbol.symbols[1];
            if (root.type == "NegativeOne") {
                return {
                    type: "Frac",
                    kind: "Container",
                    symbols: [{ type: "One", kind: "Leaf" }, this.transformSpecialPower(symbol.symbols[0])]
                }
            }
            if (root.type == "Integer" && root.value < 0) {
                return {
                    type: "Frac",
                    kind: "Container",
                    symbols: [{ type: "One", kind: "Leaf" }, this.transformSpecialPower({
                        type: "Pow",
                        kind: "Container",
                        symbols: [symbol.symbols[0], { type: "Integer", kind: "Leaf", value: -root.value }],
                        indexJson: undefined,
                    })]
                }
            }
            if (root.type == "Half") {
                return {
                    type: "Sqrt",
                    kind: "Container",
                    symbols: [this.transformSpecialPower(symbol.symbols[0])]
                }
            }


            if (prTh.matchRationalFrac(root, 1, 2)) {
                return this.powerRationalToSqrt(this.transformSpecialPower(symbol.symbols[0]), root, symbol);

            }
            if (prTh.matchRationalFrac(root, 1)) {
                return this.powerRationalToSqrt(this.transformSpecialPower(symbol.symbols[0]), root, symbol);
            }

            if (symbol.symbols[0].type == "Var" && symbol.symbols[0].indexJson) {
                symbol.indexJson = symbol.symbols[0].indexJson;
                symbol.symbols[0].indexJson = undefined;
            }

            if ((symbol.symbols[0].type == "BaseVector" || symbol.symbols[0].type == "BaseScalar") && !!symbol.symbols[0].systemName && !symbol.symbols[2]) {
                symbol.symbols.push({ type: "Var", kind: "Leaf", name: symbol.symbols[0].systemName, indexJson: undefined, bold: true });
                symbol.symbols[0].systemName = undefined;
            }

            return { ...symbol, symbols: symbol.symbols.map(s => this.transformSpecialPower(s)) }
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
                symbols: [base, prCreator.integer(denominator)]
            }
        }

        if (base.type == "Integer" && base.value > 0) {
            return {
                type: "Sqrt",
                kind: "Container",
                symbols: [prCreator.power(base, enumerator), prCreator.integer(denominator)]
            }
        }

        return defaultSymbol;
    }
}

type Symbol = P2Pr.Symbol;