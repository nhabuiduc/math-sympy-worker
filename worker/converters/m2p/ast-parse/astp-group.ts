import { AstpNs } from "./astp-ns";
import { astpCommon } from "./astp-common";
import { M2T } from "../m2t";
import { T2A } from "../t2a";

export class AstpGroup implements AstpNs.AstpUnit<M2T.Token> {
    constructor(private astpMain: AstpNs.AstpMain) {

    }
    parse(_token: M2T.Token, ctx: AstpNs.RunCtx): AstpNs.ParsedUnit {
        const groupSymbols = this.runParseGroup(ctx);
        return { type: "group-symbol", kind: "groupable", symbols: groupSymbols }
    }

    private runParseGroup(ctx: AstpNs.RunCtx): Symbol[] {
        let rs: Symbol[] = [];
        let token: Token;
        while (token = ctx.tryAdvanceToken()) {
            if (token.type == "bracket-token" && token.state == "close") {
                return rs;
            }

            rs = astpCommon.mergeSymbols(rs, this.astpMain.parse(token, ctx));
        }

        throw new Error("End input unexpected")
    }

}

type Symbol = T2A.Symbol;

type Token = M2T.Token;