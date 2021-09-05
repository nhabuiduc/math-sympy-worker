import { _l } from "@sympy-worker/light-lodash";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { P2PrItemBase } from "./p2pr-item-base";

export class Set extends P2PrItemBase {
    convert(obj: P2Pr.PBasic): Symbol {
        switch (obj.func) {
            case "ImageSet": {
                const lambda = obj.args[0] as P2Pr.PF<"Lambda">;
                if (lambda.func != "Lambda") {
                    throw new Error("must be lambda in ImageSet");
                }

                const baseSets = obj.args.slice(1);
                const lambdaSig = lambda.args[0] as P2Pr.PF<"Tuple">;
                const pairs = _l.zip(this.main.m(lambdaSig.args), this.main.m(baseSets));

                const rs = prTh.varList([
                    this.main.c(lambda.args[1]),
                    prTh.varList(pairs.map(p => {
                        return prTh.varList([p[0], prTh.var("∈"), p[1]])
                    }), ",")
                ], { bracket: "{", separator: "|", separatorSpacing: "around" })

                return rs;
            }
            case "ConditionSet": {
                const ss = this.main.m(obj.args);
                const vars = prTh.extractIfVarList(ss[0]);
                if (obj.args[2].func == "UniversalSet") {
                    return prTh.varList([
                        prTh.singleOrBrackets(vars),
                        ss[1],
                    ], { bracket: "{", separator: "|", separatorSpacing: "around" })
                }
                return prTh.varList([
                    prTh.singleOrBrackets(vars),
                    prTh.varList([
                        prTh.singleOrBrackets(vars),
                        prTh.var("∈"),
                        ss[2],
                        prTh.var("∧"),
                        ss[1],
                    ])

                ], { bracket: "{", separator: "|", separatorSpacing: "around" })
            }
            case "ComplexRegion": {
                const ss = this.main.m(obj.args);
                return prTh.varList([
                    ss[0],
                    prTh.varList([
                        prTh.varList(prTh.extractIfVarList(ss[1]), ","),
                        prTh.var("∈"),
                        ss[2],
                    ])
                ], { bracket: "{", separator: "|", separatorSpacing: "around" })
            }
        }
    }
}

type Symbol = P2Pr.Symbol;