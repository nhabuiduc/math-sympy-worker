import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Pow extends Pr2MItemBase {

    convert(obj: P2Pr.Pow): Pr2M.CResult {
        const { symbols: args } = obj;
        if (args.length > 3) {
            throw new Error("Unsupported power with different than 2,3 arguments");
        }

        if (args[0].type == "GenericFunc" && args[0].powerIndexPos != "wrap-all") {
            return this.handlePowToGenericFunc(args);
        }

        let arg0Cr = this.main.c(args[0]);
        let { blocks: base } = arg0Cr;
        const power = this.main.c(args[1]).blocks;

        const prPow: Pr2M.CResult["prPow"] = {};
        let preventWrapBracket = obj.preventBracketWrap;
        if (args[0].type == "Pow" && args[0].symbols[0].type == "GenericFunc" && args[0].symbols[0].allowAncesstorPowerAtEnd) {
            preventWrapBracket = true;
            prPow.powMergedInFunc = true;
        }

        if (!prTh.considerPresentAsSingleUnitForPow(args[0], arg0Cr) && !preventWrapBracket) {
            base = blockBd.wrapBetweenBrackets(base).blocks;
        }

        if (args[2]) {
            const index = this.main.c(args[2]).blocks;
            const cBlock = blockBd.compositeBlock("\\power-index", ["powerValue", "indexValue"], [power, index]);
            return { blocks: base.concat([cBlock]), };

        }
        return { blocks: base.concat([blockBd.compositeBlock("\\power-index", ["powerValue"], [power])]), }
    }

    private handlePowToGenericFunc(powArgs: P2Pr.Symbol[]): Pr2M.CResult {
        const genericFunc = powArgs[0] as P2Pr.GenericFunc;
        const { name, args } = this.main.genericFunc.buildGenericFunc(genericFunc);

        let powerBlock: CompositeBlockModel;

        const power = this.main.c(powArgs[1]).blocks;

        if (powArgs[2] && genericFunc.powerIndexPos == "power-after" && (genericFunc.symbols.length > 0 || genericFunc.symbols.length > 0)) {
            const index = this.main.c(powArgs[2]).blocks;
            powerBlock = blockBd.compositeBlock("\\power-index", ["powerValue"], [power]);
            const indexBlock = blockBd.compositeBlock("\\power-index", ["indexValue"], [index]);
            return { blocks: [...name, indexBlock, ...args, powerBlock], prPow: { powMergedInFunc: true } }
        }

        if (powArgs[2]) {
            const index = this.main.c(powArgs[2]).blocks;
            powerBlock = blockBd.compositeBlock("\\power-index", ["powerValue", "indexValue"], [power, index]);

        } else {
            powerBlock = blockBd.compositeBlock("\\power-index", ["powerValue"], [power]);
        }

        const rsBlocks = genericFunc.powerIndexPos ? [...name, ...args, powerBlock] : [...name, powerBlock, ...args];

        return {
            blocks: rsBlocks,
            prPow: { powMergedInFunc: true }
        }
    }
}