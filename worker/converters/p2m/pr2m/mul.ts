import { _l } from "@sympy-worker/light-lodash";
import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prSymbolVisuallyInfo } from "../pr-transform/pr-symbol-visually-info";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Mul extends Pr2MItemBase {

    convert(obj: P2Pr.Mul): Pr2M.CResult {
        const { symbols } = obj;
        const items = symbols.map(a => this.main.convert(a));
        let isNegative = false;

        let prevAdjacentArg: Symbol;
        let allInShortcutForm = true;
        const blockss: BlockModel[][] = [];
        let lastBracketChecked: boolean | "wrap-if-shortcut-after" = false;
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            const curArg = symbols[idx];

            if (idx == 0 && prTh.isNegativeOne(curArg) && !obj.unevaluatedDetected) {
                isNegative = true;
                continue;
            }

            const shouldSepratedByMul = this.shouldSeparateByMulSymbol(prevAdjacentArg, symbols[idx]);
            let shouldWrap: boolean = false;
            if (lastBracketChecked == "wrap-if-shortcut-after") {
                blockss[blockss.length - 1] = blockBd.wrapBetweenBrackets(blockss[blockss.length - 1]).blocks;
                lastBracketChecked = this.shouldWrapBrackets(curArg, item, idx == 0, !shouldSepratedByMul);
                shouldWrap = lastBracketChecked === true;
            } else {
                lastBracketChecked = this.shouldWrapBrackets(curArg, item, idx == 0, !shouldSepratedByMul);
                shouldWrap = lastBracketChecked === true;
            }

            const blocksToAdd = shouldWrap ? blockBd.wrapBetweenBrackets(item.blocks).blocks : item.blocks;

            if (idx > 0 && shouldSepratedByMul) {
                blockss.push([blockBd.textBlock("×")]);
                blockss.push(blocksToAdd);
                allInShortcutForm = false;
            } else {
                blockss.push(blocksToAdd);
            }

            prevAdjacentArg = symbols[idx];
        }

        if (isNegative) {
            blockss.unshift([blockBd.textBlock("-")]);

        }

        return this.makeRs(false, allInShortcutForm, blockBd.joinBlocks(blockss), obj);
    }

    private makeRs(isNegative: boolean, allInShortcutForm: boolean, blocks: BlockModel[], obj: P2Pr.Mul): Pr2M.CResult {
        let prMulInfo: Pr2M.CResult["prMul"] = { allInShortcutForm };
        if (isNegative && obj.symbols.length <= 2) {
            prMulInfo = undefined;

        } else if (obj.symbols.length <= 1) {
            prMulInfo = { allInShortcutForm: true };
        }

        return { blocks, prMul: prMulInfo }
    }

    private shouldSeparateByMulSymbol(prev: Symbol, cur: Symbol) {
        if (!prev || !cur) {
            return false;
        }

        if (prev.type == "Frac" && cur.type == "Frac") {
            return false;
        }
        return this.firstShouldPosfixMul(prev) && this.secondShouldPrefixMul(cur);
    }

    private shouldWrapBrackets(s: Symbol, cResult: Pr2M.CResult, isFirst: boolean, isShortcut: boolean): boolean | "wrap-if-shortcut-after" {
        const checked = prSymbolVisuallyInfo.check(s, cResult);
        if (isFirst && checked.prOp == "parts" && checked.prSign && checked.prExcludeSign == "unit") {
            return false;
        }

        if (isShortcut) {
            if (checked.prShorthandMul == "parts") {
                return true;
            }
            if (checked.prShorthandMul == "unit") {
                return false;
            }
            return "wrap-if-shortcut-after";
        }

        return checked.prOp == "parts";
    }

    private secondShouldPrefixMul(s: Symbol): boolean {
        if (prTh.isConstant(s)) {
            return true;
        }

        if (s.type == "Frac") {
            return true;
        }

        if (s.type == "Mul" || s.type == "Pow") {
            return this.secondShouldPrefixMul(_l.first(s.symbols));
        }
    }

    private firstShouldPosfixMul(s: Symbol): boolean {
        if (prTh.isConstant(s)) {
            return true;
        }

        if (s.type == "Frac") {
            return true;
        }

        if (s.type == "Mul") {
            return this.firstShouldPosfixMul(_l.last(s.symbols));
        }
    }
}

type Symbol = P2Pr.Symbol;