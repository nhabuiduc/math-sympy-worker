import { AstpNs } from "./astp-ns";
import { astpCommon } from "./astp-common";
import { M2T } from "../m2t";
import { T2A } from "../t2a";

export class AstpGenericFunc implements AstpNs.AstpUnit<M2T.NameToken> {
    constructor(private astpMain: AstpNs.AstpMain) {

    }

    parse(nameToken: M2T.NameToken, ctx: AstpNs.RunCtx): AstpNs.ParsedUnit {
        const nextToken = ctx.advanceToken();
        if (nextToken.type == "container-token" && nextToken.groupType == "power-index") {
            const rs = this.astpMain.parse(nextToken, ctx) as AstpNs.SqrtMergedParsedUnit;
            const { power, index } = rs.info();
            const tokenAfterPowerIndex = ctx.advanceToken();
            let nextArgsAfterPi = this.parseNextArg(tokenAfterPowerIndex, ctx);
            if (nameToken.text == "log" && index && index.symbols.length > 0) {
                nextArgsAfterPi = nextArgsAfterPi.concat([index]);
            }

            if (!power || power.symbols.length <= 0) {
                return { type: "generic-func-symbol", name: nameToken.text, kind: "container", args: nextArgsAfterPi }
            }

            return {
                type: "func-symbol",
                name: "power",
                kind: "container",
                args: [{
                    symbols: [{
                        type: "generic-func-symbol",
                        name: nameToken.text,
                        kind: "container",
                        args: nextArgsAfterPi
                    }]
                }, power],
            }

        }

        const nextArgs = this.parseNextArg(nextToken, ctx);
        return { type: "generic-func-symbol", name: nameToken.text, kind: "container", args: nextArgs }

    }

    private parseNextArg(token: M2T.Token, ctx: AstpNs.RunCtx): T2A.Expr[] {
        if (token.type == "bracket-token" && token.state == "open") {
            return this.parseArguments(ctx);
        }

        return [{
            symbols: astpCommon.asSymbols(this.astpMain.parse(token, ctx))
        }];
    }


    private parseArguments(ctx: AstpNs.RunCtx): Expr[] {
        let exprs: Expr[] = [];
        let argExp: Expr;

        while (argExp = this.parseArgument(ctx)) {
            exprs.push(argExp);

            const current = ctx.current();
            if (current.type == "bracket-token" && current.state == "close") {
                return exprs;
            }
        }

        return exprs;
    }

    private parseArgument(ctx: AstpNs.RunCtx): Expr {
        let token: Token;
        let rs: Symbol[] = [];
        while (token = ctx.tryAdvanceToken()) {
            if (token.type == "bracket-token" && token.state == "close") {
                return { symbols: rs };
            }

            if (token.type == "coma-token") {
                return { symbols: rs };
            }

            rs = astpCommon.mergeSymbols(rs, this.astpMain.parse(token, ctx));
        }

        throw new Error("Unexpected end input for parsing arugments");
    }
}

type Token = M2T.Token;
type Symbol = T2A.Symbol;
type Expr = T2A.Expr;