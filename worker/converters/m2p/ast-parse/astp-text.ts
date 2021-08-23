import { M2T } from "../m2t";
import { T2A } from "../t2a";
import { AstpNs } from "./astp-ns";
import stringHelper from "@lib-shared/string-helper";

export class AstpText implements AstpNs.AstpUnit<M2T.TextToken> {
    constructor(private constantTextFuncSet: Set<string>, private astpgenericFunc: AstpNs.AstpUnit<M2T.NameToken>) {

    }

    parse(token: M2T.TextToken, ctx: AstpNs.RunCtx): AstpNs.ParsedUnit {
        if (this.constantTextFuncSet.has(token.text)) {
            return this.astpgenericFunc.parse({ type: "name-token", text: token.text }, ctx);
        }

        const split = this.splitTextIntoMultipleSymbols(token.text);
        return split;
    }

    private splitTextIntoMultipleSymbols(text: string): Symbol[] {
        const rs: Symbol[] = [];
        const uText = stringHelper.getUnistringUncached(text);
        for (let idx = 0; idx < uText.length; idx++) {
            const char = uText.clusterAt(idx);

            if (rs.length > 0) {
                rs.push({ type: "op-symbol", kind: "leaf", op: "*" });
            }
            rs.push({ type: "var-symbol", kind: "leaf", name: char, indexStr: undefined });

        }
        return rs;
    }
}

type Symbol = T2A.Symbol;