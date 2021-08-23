import { T2A } from "../t2a";

class AstpPostProcess {
    insertTimes(expr: Expr): Expr {
        const rs = this.insertTimeForSymbols(expr.symbols);
        return { symbols: rs };
    }

    private mapTimesForSymbol(symbol: Symbol): Symbol {
        if (symbol.type == "group-symbol") {
            return { ...symbol, symbols: this.insertTimeForSymbols(symbol.symbols) };
        }

        if (symbol.type == "func-symbol" || symbol.type == "generic-func-symbol") {
            return { ...symbol, args: symbol.args.map(s => this.insertTimes(s)) };
        }

        return symbol;
    }

    private insertTimeForSymbols(symbols: Symbol[]) {
        symbols = symbols.map(s => this.mapTimesForSymbol(s));
        const rs: Symbol[] = [];
        for (let idx = 0; idx < symbols.length; idx++) {
            const symbol = symbols[idx];

            if (this.isPairInferedMul(symbols[idx - 1], symbol)) {
                rs.push({ type: "op-symbol", kind: "leaf", op: "*" });
            }
            rs.push(symbol);

        }
        return rs;
    }

    private isPairInferedMul(s1: Symbol, s2: Symbol): boolean {
        if (!s1 || !s2) {
            return false;
        }

        if (s1.type == "op-symbol" || s2.type == "op-symbol") {
            return false;
        }

        return true;

        // switch (s1.type) {
        //     case "number-symbol": {
        //         return s2.type == "func-symbol" || s2.type == "var-symbol" || s2.type == "group-symbol";
        //     }
        //     case "var-symbol": {
        //         return s2.type == "func-symbol" || s2.type == "var-symbol" || s2.type == "group-symbol" || s2.type == "number-symbol";
        //     }
        //     case "group-symbol": {
        //         return s2.type == "func-symbol" || s2.type == "var-symbol" || s2.type == "group-symbol" || s2.type == "number-symbol";
        //     }
        // }
    }
}

export const astpPostProcess = new AstpPostProcess();

// type Token = McExprTokens.Token;
type Symbol = T2A.Symbol;
type Expr = T2A.Expr;