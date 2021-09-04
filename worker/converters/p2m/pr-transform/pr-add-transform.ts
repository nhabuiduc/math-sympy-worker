import { _l } from "../../../light-lodash";
import type { P2Pr } from "../p2pr";
import { prTh } from "./pr-transform-helper";
import { PrBaseTransform } from "./pr-base-transform";

export class PrAddTransform extends PrBaseTransform {
    override initTransform() {
        return [
            this.makeTransform(this.flattenAdd, op => op.add?.flatten),
            this.makeTransform(this.orderTransform, op => op.add?.order),
        ]
    }

    override initCtx() {
        return {};
    }

    private orderTransform = (symbol: Symbol): P2Pr.Symbol => {
        if (symbol.type == "Add") {
            return { ...symbol, symbols: this.orderSymbols(symbol.symbols) };
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

    private flattenAdd = (symbol: Symbol): Symbol => {
        if (symbol.type == "Add") {
            return { ...symbol, symbols: this.flattenAddWith(symbol.symbols) }
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


