import type { P2Pr } from "../p2pr";

export class PrMulTransform implements P2Pr.IPrTransform {
    transform(symbol: P2Pr.Symbol): P2Pr.Symbol {
        return this.flattenMul(symbol);
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