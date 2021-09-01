import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { P2PrItemBase } from "./p2pr-item-base"


export class GenericFunc extends P2PrItemBase {
    convert(obj: Omit<P2Pr.PGenericFunc, "func">): Symbol {
        if (obj.name == "dict") {
            return prTh.varList(this.m(obj.args).map(s => {
                const ss = prTh.extractIfVarList(s);
                return prTh.varList(ss, ":")
            }), ",", "{")
        }
        if (obj.name == "meijerg") {
            return prTh.varList([prTh.pow(
                prTh.var("C"),
                prTh.varList(this.m(obj.args.slice(2, 4)), ","),
                prTh.varList(this.m(obj.args.slice(0, 2)), ","),
            ), prTh.varList([
                prTh.matrix([
                    this.m(obj.args.slice(4, 6)).map(c => prTh.removeVarListBracket(c)),
                    this.m(obj.args.slice(6, 8)).map(c => prTh.removeVarListBracket(c)),
                ]),
                this.c(obj.args[8]),
            ], "|", "(")])
        }
        if (obj.name == "hyper") {
            return prTh.varList([prTh.prescriptIdx(this.c(obj.args[0])),
            prTh.index(prTh.var("F"), this.c(obj.args[1])), , prTh.varList([
                prTh.matrix([
                    this.m(obj.args.slice(2, 3)).map(c => prTh.removeVarListBracket(c)),
                    this.m(obj.args.slice(3, 4)).map(c => prTh.removeVarListBracket(c)),
                ]),
                this.c(obj.args[4]),
            ], "|", "(")])
        }

        if (obj.name == "exp") {
            return prTh.pow(prTh.var("e"), this.c(obj.args[0]))
        }
        if (obj.name == "binomial") {
            return { type: "Binomial", kind: "Container", symbols: this.m(obj.args) }
        }
        if (obj.name == "NoneType") {
            return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "None" }
        }

        if (obj.name == "factorial") {
            return prTh.unary(this.c(obj.args[0]), "!");
        }
        if (obj.name == "subfactorial") {
            return prTh.unary(this.c(obj.args[0]), "!", "before");
        }
        if (obj.name == "factorial2") {
            return prTh.unary(this.c(obj.args[0]), "!!");
        }
        if (obj.name == "floor") {
            return prTh.brackets(this.m(obj.args), "floor");
        }
        if (obj.name == "ceiling") {
            return prTh.brackets(this.m(obj.args), "ceil");
        }

        if (obj.name == "min" || obj.name == "max") {
            return { type: "GenericFunc", kind: "Container", func: obj.name, powerIndexPos: "all-after", symbols: this.m(obj.args) }
        }
        if (obj.name == "conjugate") {
            return prTh.over("overline", this.c(obj.args[0]));
            // return { type: "Conjugate", kind: "Container", symbols: this.m(obj.args) };
        }
        if (obj.name == "log") {
            return { type: "GenericFunc", kind: "Container", func: obj.name, powerIndexPos: "power-after", symbols: this.m(obj.args) }
        }


        if (obj.name == "polylog") {
            obj.name = "Li";
            return this.firstIndexOfGenericFunc(obj);
        }
        if (obj.name == "besselj") {
            obj.name = "J";
            return this.firstIndexOfGenericFunc(obj);
        }
        if (obj.name == "bessely") {
            obj.name = "Y";
            return this.firstIndexOfGenericFunc(obj);
        }
        if (obj.name == "besseli") {
            obj.name = "I";
            return this.firstIndexOfGenericFunc(obj);
        }
        if (obj.name == "besselk") {
            obj.name = "K";
            return this.firstIndexOfGenericFunc(obj);
        }
        if (obj.name == "hankel1") {
            obj.name = "H";
            return this.firstIndexOfGenericFuncWithPow(obj, "(1)");
        }
        if (obj.name == "hankel2") {
            obj.name = "H";
            return this.firstIndexOfGenericFuncWithPow(obj, "(2)");
        }

        if (obj.name == "jn") {
            obj.name = "j";
            return this.firstIndexOfGenericFunc(obj);
        }
        if (obj.name == "yn") {
            obj.name = "y";
            return this.firstIndexOfGenericFunc(obj);
        }

        if (obj.name == "hn1") {
            obj.name = "h";
            return this.firstIndexOfGenericFuncWithPow(obj, "(1)");
        }
        if (obj.name == "hn2") {
            obj.name = "h";
            return this.firstIndexOfGenericFuncWithPow(obj, "(2)");
        }

        if (obj.name == "fresnels") {
            obj.name = "S";
        }
        if (obj.name == "fresnelc") {
            obj.name = "C";
        }


        if (obj.name == "stieltjes") {
            obj.name = "𝛾";
            return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "power-after" });
        }
        if (obj.name == "expint") {
            obj.name = "E";
            return this.firstIndexOfGenericFunc(obj);
        }
        if (obj.name == "chebyshevt") {
            obj.name = "T";
            return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
        }
        if (obj.name == "chebyshevu") {
            obj.name = "U";
            return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
        }
        if (obj.name == "legendre") {
            obj.name = "P";
            return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
        }
        if (obj.name == "laguerre") {
            obj.name = "L";
            return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
        }
        if (obj.name == "hermite") {
            obj.name = "H";
            return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
        }

        const genOps: Partial<P2Pr.GenericFunc> = {};
        // let argSeparator: P2Pr.GenericFunc["argSeparator"] = ",";
        if (obj.name == "elliptic_k") {
            obj.name = "K";
        }
        if (obj.name == "elliptic_f") {
            obj.name = "F";
            genOps.argSeparator = "|";
        }
        if (obj.name == "elliptic_e") {
            obj.name = "E";
            genOps.argSeparator = "|";
        }
        if (obj.name == "elliptic_pi") {
            obj.name = "𝛱";
            genOps.argSeparator = obj.args.length <= 2 ? "|" : ";|";
        }
        if (obj.name == "primenu") {
            obj.name = "𝜈";
            genOps.powerIndexPos = "wrap-all";
        }
        if (obj.name == "primeomega") {
            obj.name = "𝛺";
            genOps.powerIndexPos = "wrap-all";
        }

        if (obj.name == "uppergamma") {
            obj.name = "𝛤";
        }
        if (obj.name == "dirichlet_eta") {
            obj.name = "𝜂";
        }
        if (obj.name == "lerchphi") {
            obj.name = "𝛷";
        }
        if (obj.name == "totient") {
            obj.name = "𝜙";
            genOps.powerIndexPos = "wrap-all";
        }
        if (obj.name == "reduced_totient") {
            obj.name = "𝜆";
            genOps.powerIndexPos = "wrap-all";
        }

        if (obj.name == "jacobi") {
            obj.name = "P";
            return this.indexPowerBracketGenericFunc(obj, 2, { allowAncesstorPowerAtEnd: true });
        }
        if (obj.name == "gegenbauer") {
            obj.name = "C";
            return this.indexPowerBracketGenericFunc(obj, 1, { allowAncesstorPowerAtEnd: true });
        }
        if (obj.name == "assoc_legendre") {
            obj.name = "P";
            return this.indexPowerBracketGenericFunc(obj, 1);
        }
        if (obj.name == "assoc_laguerre") {
            obj.name = "L";
            return this.indexPowerBracketGenericFunc(obj, 1);
        }

        if (obj.name == "divisor_sigma") {
            obj.name = "𝜎";

            if (obj.args.length == 2) {
                return this.secondArgAsIndexOfGenericFunc(obj);
            }
        }

        if (obj.name == "udivisor_sigma") {
            obj.name = "𝜎";
            if (obj.args.length == 1) {
                return prTh.pow(prTh.genFunc(obj.name, this.m(obj.args), { allowAncesstorPowerAtEnd: false }), prTh.var("*"));
            }

            if (obj.args.length == 2) {
                return prTh.pow(prTh.genFunc(obj.name, [this.c(obj.args[0])], { allowAncesstorPowerAtEnd: false }), prTh.var("*"), this.c(obj.args[1]));
            }

        }

        let ignoreParseName = false;
        if (obj.name == "polar_lift") {
            ignoreParseName = true;
        }


        if (obj.name == "KroneckerDelta" || obj.name == "DiracDelta") {
            obj.name = "𝛿";
            genOps.powerIndexPos = "power-after";
        }
        if (obj.name == "gamma") {
            obj.name = "𝛤";
        }
        if (obj.name == "lowergamma") {
            obj.name = "𝛾";
        }
        if (obj.name == "beta") {
            obj.name = "B";
            genOps.forceUsingOperatorName = true;
        }
        if (obj.name == "Chi") {
            genOps.forceUsingOperatorName = true;
        }
        if (obj.name == "mathieuc") {
            obj.name = "C";
            genOps.powerIndexPos = "power-after";
        }
        if (obj.name == "mathieus") {
            obj.name = "S";
            genOps.powerIndexPos = "power-after";
        }
        if (obj.name == "mathieucprime") {
            obj.name = "C";
            return prTh.pow({ type: "GenericFunc", kind: "Container", func: obj.name, symbols: this.m(obj.args), allowAncesstorPowerAtEnd: true }, prTh.var("′"),)
        }
        if (obj.name == "mathieusprime") {
            obj.name = "S";
            return prTh.pow({ type: "GenericFunc", kind: "Container", func: obj.name, symbols: this.m(obj.args), allowAncesstorPowerAtEnd: true }, prTh.var("′"))
        }


        if (ignoreParseName) {
            return { type: "GenericFunc", kind: "Container", func: obj.name, symbols: this.m(obj.args), ...genOps }
        }

        return this.main.nameParser.parse(obj.name, (cn) => {
            return { type: "GenericFunc", kind: "Container", func: cn, symbols: this.m(obj.args), ...genOps }
        })

    }

    convertOf(obj: P2Pr.PF<"LambertW"> | P2Pr.PF<"Ynm"> | P2Pr.PF<"Znm">) {
        switch (obj.func) {
            case "LambertW": {
                return this.secondIndexOfGenericFunc({ name: "W", args: obj.args, func: "GenericFunc" });
            }
            case "Ynm": {
                return this.indexPowerGenericFunc({ name: "Y", args: obj.args, func: "GenericFunc" });
            }
            case "Znm": {
                return this.indexPowerGenericFunc({ name: "Z", args: obj.args, func: "GenericFunc" });
            }
        }
    }

    private m(args: P2Pr.PBasic[]): Symbol[] {
        return this.main.m(args);
    }

    private c(obj: P2Pr.PBasic): Symbol {
        return this.main.c(obj);
    }

    private indexPowerBracketGenericFunc(obj: Omit<P2Pr.PGenericFunc, "func">, powConsumeCount: number, options?: Partial<P2Pr.GenericFunc>): P2Pr.Pow {
        if (obj.args.length < powConsumeCount + 1) {
            throw new Error("not enough params");
        }

        return {
            type: "Pow",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.slice(powConsumeCount + 1).map(c => this.c(c)), ...options },
                prTh.brackets(this.m(obj.args.slice(1, powConsumeCount + 1))),
                this.c(obj.args[0]),
            ]
        }
    }

    private secondArgAsIndexOfGenericFunc(obj: Omit<P2Pr.PGenericFunc, "func">, options?: Partial<P2Pr.GenericFunc>): P2Pr.Index {
        if (obj.args.length != 2) {
            throw new Error("args length must be 2")
        }
        return {
            type: "Index",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: [this.c(obj.args[0])], ...options },
                this.c(obj.args[1])
            ]
        }
    }

    private firstIndexOfGenericFuncWithPow(obj: Omit<P2Pr.PGenericFunc, "func">, powText: string, options?: Partial<P2Pr.GenericFunc>): P2Pr.Pow {
        return {
            type: "Pow",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.slice(1).map(c => this.c(c)), ...options },
                prTh.var(powText),
                this.c(obj.args[0])
            ]
        }
    }

    private firstIndexOfGenericFunc(obj: Omit<P2Pr.PGenericFunc, "func">, options?: Partial<P2Pr.GenericFunc>): P2Pr.Index {
        return {
            type: "Index",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.slice(1).map(c => this.c(c)), ...options },
                this.c(obj.args[0])
            ]
        }
    }

    private secondIndexOfGenericFunc(obj: P2Pr.PGenericFunc, options?: Partial<P2Pr.GenericFunc>): P2Pr.Symbol {
        if (obj.args[1]) {
            return {
                type: "Index",
                kind: "Container",
                symbols: [
                    { type: "GenericFunc", kind: "Container", func: obj.name, symbols: [this.c(obj.args[0])], ...options },
                    this.c(obj.args[1])
                ]
            }
        }

        return { type: "GenericFunc", kind: "Container", func: obj.name, symbols: [this.c(obj.args[0])], ...options }
    }

    private indexPowerGenericFunc(obj: P2Pr.PGenericFunc, options?: Partial<P2Pr.GenericFunc>): P2Pr.Pow {
        if (obj.args.length < 2) {
            throw new Error("not enough params");
        }

        return {
            type: "Pow",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.slice(2).map(c => this.c(c)), ...options },
                this.c(obj.args[1]),
                this.c(obj.args[0]),
            ]
        }
    }
}

type Symbol = P2Pr.Symbol;