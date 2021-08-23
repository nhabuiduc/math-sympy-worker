import { _l } from "../../../light-lodash";
import type { P2Pr } from "../p2pr";
import { prTransformHelper } from "./pr-transform-helper";

export class PrAddTransform implements P2Pr.IPrTransform {
    transform(symbol: Symbol): Symbol {
        return this.orderTransform(symbol);
    }

    private orderTransform(symbol: Symbol): P2Pr.Symbol {
        if (symbol.type == "Add") {
            const children = symbol.symbols.map(s => this.orderTransform(s));
            return { ...symbol, symbols: this.orderSymbols(children) };
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.orderTransform(s)) }
        }

        return symbol;
    }

    private orderSymbols(symbols: Symbol[]): Symbol[] {
        /**ok if we only have 2 symbols, we priority minus sign */
        if (symbols.length == 2 && symbols.some(c => prTransformHelper.symbolStartWithMinus(c)) && symbols.some(c => !prTransformHelper.symbolStartWithMinus(c))) {
            return this.order2Symbols(symbols);
        }
        const pair = symbols.map(c => ({ s: c, weight: prTransformHelper.positionWeight(c) }));
        pair.sort((c1, c2) => c1.weight - c2.weight);
        return pair.map(c => c.s);
    }

    private order2Symbols(symbols: Symbol[]): Symbol[] {
        if (prTransformHelper.symbolStartWithMinus(symbols[0])) {
            return [symbols[1], symbols[0]]
        }

        return symbols;
    }
}

type Symbol = P2Pr.Symbol;


