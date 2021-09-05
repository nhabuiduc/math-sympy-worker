import type { P2Pr } from "../p2pr";
import { PrBaseTransform } from "./pr-base-transform";
import { prTh } from "./pr-transform-helper";

export class PrMulTransform extends PrBaseTransform {
    protected initCtx(): {} {
        return {};
    }
    override initTransform() {
        return [
            this.makeTransform(this.flattenMul, op => op.mul?.flatten),
            this.makeTransform(this.orderTransform, op => op.mul?.order),
            this.makeTransform(this.specialCasesTransform, () => true),
        ]
    }

    private specialCasesTransform = (s: Symbol): P2Pr.Symbol => {
        /**special case: */
        if (s.type == "Mul" && s.symbols.length == 2 && prTh.isOne(s.symbols[0]) && prTh.isOnePowerNegativeOne(s.symbols[1])) {
            return s.symbols[1];
        }
        return s;
    }
    
    private orderTransform = (symbol: Symbol): P2Pr.Symbol => {
        if (symbol.type == "Mul" && !symbol.unevaluatedDetected) {
            return { ...symbol, symbols: this.orderSymbols(symbol.symbols) };
        }
        return symbol;
    }

    private orderSymbols(symbols: Symbol[]): Symbol[] {
        if (symbols.length <= 0) {
            return symbols;
        }
        /**we don't order if symbol start MinusOne */
        if (prTh.isNegativeOne(symbols[0])) {
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

    private flattenMul = (symbol: Symbol): Symbol => {
        if (symbol.type == "Mul") {
            return { ...symbol, symbols: this.flattenMulWith(symbol.symbols) }
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