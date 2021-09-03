import { _l } from "../../../light-lodash";
import type { P2Pr } from "../p2pr";
import { prTh } from "./pr-transform-helper";

export class PrAddTransform implements P2Pr.IPrTransform {
    transform(symbol: Symbol, ops: P2Pr.TransformOptions): Symbol {
        symbol = this.flattenAdd(symbol);
        if (ops.orderAdd) {
            return this.orderTransform(symbol);
        }

        return symbol;
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
        if (symbols.length <= 0) {
            return symbols;
        }

        /**ok if we only have 2 symbols, we priority minus sign */
        if (symbols.length == 2 && symbols.some(c => prTh.startWithMinus(c)) && symbols.some(c => !prTh.startWithMinus(c))) {
            return this.order2Symbols(symbols);
        }
        const pair = symbols.map(c => ({ s: c, weight: prTh.positionWeight(c, "add") }));
        pair.sort((c1, c2) => c1.weight - c2.weight);
        return pair.map(c => c.s);
    }

    private order2Symbols(symbols: Symbol[]): Symbol[] {
        if (prTh.startWithMinus(symbols[0])) {
            return [symbols[1], symbols[0]]
        }

        return symbols;
    }

    private flattenAdd(symbol: Symbol): Symbol {
        if (symbol.type == "Add") {
            return { ...symbol, symbols: this.flattenAddWith(symbol.symbols.map(s => this.flattenAdd(s))) }
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.flattenAdd(s)) }
        }

        return symbol;
    }

    private flattenAddWith(symbols: Symbol[]): Symbol[] {
        let rs: Symbol[] = [];
        for (const s of symbols) {
            if (s.type == "Add") {
                rs = rs.concat(s.symbols);
            } else {
                rs = rs.concat([s]);
            }
        }
        return rs;
    }
}

type Symbol = P2Pr.Symbol;


