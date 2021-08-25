import type { P2Pr } from "../p2pr";
import { prTh } from "./pr-transform-helper";

export class PrMulTransform implements P2Pr.IPrTransform {
    transform(symbol: P2Pr.Symbol): P2Pr.Symbol {
        symbol = this.flattenMul(symbol);
        symbol = this.orderTransform(symbol);
        return symbol;
    }

    private orderTransform(symbol: Symbol): P2Pr.Symbol {
        if (symbol.type == "Mul") {
            const children = symbol.symbols.map(s => this.orderTransform(s));
            return { ...symbol, symbols: symbol.unevaluatedDetected ? children : this.orderSymbols(children) };
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
        /**we don't order if symbol start MinusOne */
        if (symbols[0].type == "NegativeOne") {
            return symbols;
        }
        
        /**we keep order if unevalated mul */

        /**ok if we only have 2 symbols, we priority minus sign */
        if (symbols.length == 2 && symbols.some(c => prTh.startWithMinus(c)) && symbols.some(c => !prTh.startWithMinus(c))) {
            return this.order2Symbols(symbols);
        }
        const pair = symbols.map(c => ({ s: c, weight: prTh.positionWeight(c, "mul") }));
        pair.sort((c1, c2) => c1.weight - c2.weight);
        return pair.map(c => c.s);
    }

    private order2Symbols(symbols: Symbol[]): Symbol[] {
        if (prTh.startWithMinus(symbols[0])) {
            return [symbols[1], symbols[0]]
        }

        return symbols;
    }

    private flattenMul(symbol: Symbol): Symbol {
        if (symbol.type == "Mul") {
            return { ...symbol, symbols: this.flattenMulWith(symbol.symbols.map(s => this.flattenMul(s))) }
        }

        if (symbol.kind == "Container") {
            return { ...symbol, symbols: symbol.symbols.map(s => this.flattenMul(s)) }
        }

        return symbol;
    }

    private flattenMulWith(symbols: Symbol[]): Symbol[] {
        let rs: Symbol[] = [];
        for (const s of symbols) {
            if (s.type == "Mul") {
                rs = rs.concat(s.symbols);
            } else {
                rs = rs.concat([s]);
            }
        }
        return rs;
    }

}


type Symbol = P2Pr.Symbol;