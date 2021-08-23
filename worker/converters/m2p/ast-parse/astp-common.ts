import { T2A } from "../t2a";
import { AstpNs } from "./astp-ns";

class AstpCommon {
    toAst(symbols: Symbol[]): T2A.Expr {
        return { symbols };
    }

    asSymbols(unit: AstpNs.ParsedUnit): Symbol[] {
        if (unit instanceof Array) {
            return unit;
        }

        if (unit.type == "merged-parsed-unit") {
            throw new Error("Not a unit required prev symbols");
        }

        return [unit];
    }

    mergeSymbols(prev: Symbol[], unit: AstpNs.ParsedUnit): Symbol[] {
        if (unit instanceof Array) {
            return prev.concat(unit);
        }

        if (unit.type == "merged-parsed-unit") {
            return unit.merge(prev);
        }

        prev.push(unit);
        return prev;
    }

    private hashCode(s: string): number {
        var h = 0, l = s.length, i = 0;
        if (l > 0)
            while (i < l)
                h = (h << 5) - h + s.charCodeAt(i++) | 0;
        return h > 0 ? h : -h;
    };

    symbolName(symbol: T2A.VarSymbol): string {
        if (symbol.indexStr) {
            return `${symbol.name}_${this.hashCode(symbol.indexStr)}`
        }
        return symbol.name;
    }


}

export const astpCommon = new AstpCommon();

type Symbol = T2A.Symbol;