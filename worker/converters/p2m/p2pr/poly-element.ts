import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { P2PrItemBase } from "./p2pr-item-base";

export class PolyElement extends P2PrItemBase {
    convert(obj: P2Pr.PF<"PolyElement"> | P2Pr.PF<"FracElement">): Symbol {
        if (obj.func == "PolyElement") {
            return this.hdlPolyElement(obj)
        }

        return this.hdlFracElement(obj);

    }

    private hdlFracElement(obj: P2Pr.PF<"FracElement">): Symbol {
        const ss = this.m(obj.args);
        if (prTh.isOne(ss[1])) {
            return ss[0];
        }
        return prTh.frac(ss[0], ss[1]);
    }

    private hdlPolyElement(obj: P2Pr.PF<"PolyElement">) {
        const [ring, terms] = obj.args as P2Pr.PPFuncArgs[];
        const [_domain, rawSymbols, rawNgens, rawZeroMonom] = (ring as P2Pr.PF<"PolyRing">).args;
        const symbols = (this.c(rawSymbols) as P2Pr.VarList).symbols;
        const ngens = prTh.extractIntegerValue(this.c(rawNgens));
        const zeroMonom = this.c(rawZeroMonom);

        if (terms.args.length <= 0) {
            return prTh.zero();
        }

        const addSs: Symbol[] = (terms as P2Pr.PF<"List">).args.map((tuple: P2Pr.PF<"Tuple">) => {
            const [expv, coeff] = this.m(tuple.args);
            if (prTh.isZero(coeff)) {
                return;
            }

            if (prTh.symbolEquals(zeroMonom, expv)) {
                return coeff;
            }
            const expvs = (expv as P2Pr.VarList).symbols;

            const resolvedSymbol = this.expOf(ngens, expvs, symbols);
            if (prTh.isZero(resolvedSymbol)) {
                return;
            }
            if (prTh.isOne(coeff)) {
                return resolvedSymbol;
            }
            return prTh.mulOf(coeff, resolvedSymbol);

        }).filter(c => c);

        return prTh.zeroOrSingleOr(addSs, "add");
    }

    private expOf(ngens: number, expvs: Symbol[], symbols: Symbol[]): Symbol {
        const arr: Symbol[] = [];
        for (let idx = 0; idx < ngens; idx++) {
            if (prTh.isZero(expvs[idx])) {
                continue;
            }

            if (prTh.isOne(expvs[idx])) {
                arr.push(symbols[idx]);
                continue;
            }

            arr.push(prTh.pow(symbols[idx], expvs[idx]));
        }
        return prTh.zeroOrSingleOr(arr, "mul");
    }
}

type Symbol = P2Pr.Symbol;