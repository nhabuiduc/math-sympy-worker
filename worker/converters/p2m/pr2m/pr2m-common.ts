import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Pr2MCommon extends Pr2MItemBase {

    // private ifOpPowDeprecate = (item: Pr2M.CResult): boolean => {
    //     return item.prUnit == "op";
    // }
    // private ifOpExcludeMulShortcutDeprecate = (item: Pr2M.CResult): boolean => {
    //     if (item.prUnit != "op") {
    //         return false;
    //     }

    //     if (item.prOp == "mul" && item.prMul?.allInShortcutForm) {
    //         return false;
    //     }

    //     return true;
    // }

    // private alwaysFalse = () => {
    //     return false;
    // }

    // private getDeprecate(type: Pr2MCommon.JoinOptions["wrapBracket"]): (item: Pr2M.CResult) => boolean {
    //     if (!type) {
    //         return this.alwaysFalse;
    //     }
    //     if (type == "if-op-exclude-mul-shortcut") {
    //         return this.ifOpExcludeMulShortcutDeprecate;
    //     }
    //     return this.ifOpPowDeprecate;
    // }

    equals(s1: Symbol, s2: Symbol): Pr2M.CResult {
        return { blocks: blockBd.joinBlocks([this.main.convert(s1).blocks, this.main.convert(s2).blocks], "=") }
    }

    leqleq(s1: Symbol, s2: Symbol, s3: Symbol): Pr2M.CResult {
        return {
            blocks: blockBd.joinBlocks([
                this.main.convert(s1).blocks,
                this.main.convert(s2).blocks,
                this.main.convert(s3).blocks,
            ], "≤")
        }
    }

    opJoin(args: P2Pr.Symbol[], textOrBlock?: string | (() => BlockModel), wrapBehavior?: "wrapEvenShortHand" | ((s: Symbol, rs: Pr2M.CResult, idx: number) => boolean)): Pr2M.CResult {
        let items = args.map(a => this.main.convert(a));

        let blocks: BlockModel[] = [];
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            let shouldWrap = false;
            if (!wrapBehavior || wrapBehavior == "wrapEvenShortHand") {
                shouldWrap = prTh.considerPresentAsSingleUnitInOpCtx(args[idx], item, { wrapEvenShortHand: wrapBehavior == "wrapEvenShortHand", excludeSign: idx == 0 })
            } else {
                shouldWrap = wrapBehavior(args[idx], item, idx);
            }
            // let curBlocks = blockBd.wrapBracketIfNotUnitInOpCtx(args[idx], item, { wrapEvenShortHand, excludeSign: idx == 0 }).blocks;
            let curBlocks = shouldWrap ? blockBd.wrapBetweenBrackets(item.blocks).blocks : item.blocks;

            if (idx == 0 || !textOrBlock) {
                blocks = blockBd.combine2Blockss(blocks, curBlocks);
                continue;
            }

            blocks = blockBd.combineMultipleBlocks(blocks, typeof textOrBlock == "string" ? [blockBd.textBlock(textOrBlock)] : [textOrBlock()], curBlocks);
        }

        return { blocks };
    }
}


export namespace Pr2MCommon {
    export interface JoinOptions {
        wrapBracket: "if-op" | "if-op-exclude-mul-shortcut";
    }
}


type Symbol = P2Pr.Symbol;