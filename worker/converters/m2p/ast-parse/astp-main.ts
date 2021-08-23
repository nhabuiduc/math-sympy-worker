import { AstpNs } from "./astp-ns";
import { AstpText } from "./astp-text";
import { AstpGroup } from "./astp-group";
import { astpCommon } from "./astp-common";
import { AstpContainer } from "./astp-container";
import { AstpGenericFunc } from "./astp-generic-func";
import { M2T } from "../m2t";
import { T2A } from "../t2a";

export class AstpMain implements AstpNs.AstpMain {
    private astpText: AstpText;
    private astpGroup = new AstpGroup(this);
    private astContainer = new AstpContainer(this);
    private astGenericFunc = new AstpGenericFunc(this);

    constructor(private constantTextFuncSet: Set<string>) {
        this.astpText = new AstpText(this.constantTextFuncSet, this);
    }

    toAst(tokens: Token[]): Expr {
        const ctx: AstpNs.RunCtx = new MainRunCtx(tokens);
        const symbols = this.runParseCommon(ctx);
        // console.log(symbols);
        return { symbols: symbols };
    }

    private runParseCommon(ctx: AstpNs.RunCtx): Symbol[] {
        let token: Token;
        let rs: Symbol[] = [];
        while (token = ctx.tryAdvanceToken()) {
            rs = astpCommon.mergeSymbols(rs, this.parse(token, ctx));
        }

        return rs;
    }

    parse(token: Token, ctx: AstpNs.RunCtx): AstpNs.ParsedUnit {
        switch (token.type) {
            case "number-token": {
                if (token.text.indexOf(".") >= 0) {
                    return { type: "float-symbol", kind: "leaf", value: token.text }
                }

                return { type: "number-symbol", kind: "leaf", value: token.text }
            }
            case "op-token": {
                switch (token.op) {
                    case "+":
                    case "-":
                    case "*":
                    case "/":
                    case "×": {
                        return { type: "op-symbol", kind: "leaf", op: token.op }
                    }
                    default: {
                        throw new Error("Unsupported operation:" + token.op);
                    }
                }
            }
            case "text-token": {
                return this.astpText.parse(token, ctx);
            }
            case "container-token": {
                return this.astContainer.parse(token, ctx);
            }
            case "bracket-token": {
                if (token.state == "open") {
                    return this.astpGroup.parse(token, ctx);
                }

                throw new Error("Umatched bracket found");
            }
            case "name-token": {
                return this.astGenericFunc.parse(token, ctx);
            }
        }

        throw new Error("Unsupported Token");
    }
}

type Token = M2T.Token;
type Symbol = T2A.Symbol;
type Expr = T2A.Expr;

class MainRunCtx implements AstpNs.RunCtx {
    // tokens: M2T.Token[];
    private idx = -1;
    constructor(private tokens: M2T.Token[]) {

    }

    current(): M2T.Token {
        if (this.idx < 0 || this.idx >= this.tokens.length) {
            throw new Error("Unavailable token to get");
        }

        return this.tokens[this.idx];
    }

    isNextAvailable(): boolean {
        return this.idx < this.tokens.length - 1;
    }

    advanceToken(): M2T.Token {
        if (this.isNextAvailable()) {
            this.idx++;
            return this.current();
        }

        throw new Error("Unexpected end input");
    }

    tryAdvanceToken(): M2T.Token | undefined {
        if (this.isNextAvailable()) {
            this.idx++;
            return this.current();
        }

        return;
    }
}