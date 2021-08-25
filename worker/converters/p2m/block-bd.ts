import { generator } from "@lib-shared/id-generator";
import objectHelper from "@lib-shared/object-helper";
import { tabularKeyInfoHelper } from "@lib-shared/tabular-key-info-helper";
import { sympyToMcConstantFuncs } from "../mapping/generic-func-map";
import type { Pr2M } from "./pr2m";

class BlockBd {

    blocks(...blocks: BlockModel[]): BlockModel[] {
        return this.combineBlocks(blocks);
    }

    fracBlock(num: BlockModel[], den: BlockModel[]) {
        return this.compositeBlock("\\frac", ["value", "sub1"], [num, den]);
    }
    binomBlock(first: BlockModel[], second: BlockModel[]) {
        return this.compositeBlock("\\binom", ["0_0", "1_0"], [first, second]);
    }

    powerBlock(text: string | BlockModel[], style?: BlockStyle): BlockModel {
        if (typeof text == "string") {
            return this.compositeBlock("\\power-index", ["powerValue"], [[this.textBlock(text)]], style);
        }

        return this.compositeBlock("\\power-index", ["powerValue"], [text], style);
    }

    indexBlock(linesOrText: LineModel[] | string, style?: BlockStyle): BlockModel {
        if (typeof linesOrText == "string") {
            return this.compositeBlock("\\power-index", ["indexValue"], [[this.textBlock(linesOrText)]], style);
        }

        const compositeBlock: CompositeBlockModel = {
            id: generator.nextId(),
            type: "composite",
            text: "\\power-index",
            elements: {
                indexValue: {
                    id: generator.nextId(),
                    lines: linesOrText,
                }
            },
            style
        }
        return compositeBlock;
    }
    bracketBlock(bracket: "(" | "[" | ")" | "]"): BlockModel {
        return { id: generator.nextId(), type: "single", text: bracket }
    }
    hat(text: string, style?: BlockStyle) {
        return this.compositeBlock("\\small-hat", ["value"], [[this.textBlock(text)]], style);
    }

    normalText(text: string): BlockModel {
        return this.compositeBlock("\\text", ["textValue"], [[this.textBlock(text)]]);
    }

    operationFuncBlock(name: string, constantTextFuncSet: Set<string>): BlockModel {
        const mappedMcFuncName = sympyToMcConstantFuncs[name] || name;
        if (constantTextFuncSet.has(mappedMcFuncName)) {
            return this.opConstantBlock(name);
        }
        if (mappedMcFuncName.length <= 1) {
            return blockBd.textBlock(mappedMcFuncName);
        }

        return blockBd.operatorNameBlock(mappedMcFuncName)
    }

    private operatorNameBlock(name: string) {
        return this.compositeBlock("\\operatorname", ["value"], [[this.textBlock(name)]]);
    }

    private opConstantBlock(name: string): CompositeBlockModel {
        const block: CompositeBlockModel = {
            id: generator.nextId(),
            type: "composite",
            text: `\\${name}`,
            elements: {
            }
        }
        return block;
    }

    matrixFromTexts(texts: string[][], bracket: "(" | "["): MatrixLikeBlockModel {
        const matrixBlock = this.compositeBlock("\\matrix", [], []) as MatrixLikeBlockModel;
        matrixBlock.bracket = bracket;
        matrixBlock.row = texts.length;
        matrixBlock.column = texts[0].length;

        for (let rIdx = 0; rIdx < matrixBlock.row; rIdx++) {
            for (let cIdx = 0; cIdx < matrixBlock.column; cIdx++) {
                const cellKey = tabularKeyInfoHelper.getKeyFromRowCol(rIdx, cIdx);
                const editor = this.editorFrom([this.textBlock(texts[rIdx][cIdx])]);
                (matrixBlock.elements[cellKey] as EditorModel) = editor;
            }
        }
        return matrixBlock
    }

    compositeBlock(
        name: "\\power-index" | "\\frac" | "\\sqrt" | "\\matrix" | "\\text" | "\\small-tilde" | "\\small-hat" | "\\middle|" |
            "\\operatorname" | "\\binom" | `\\${"i" | "ii" | "iii" | "iii"}nt`,
        elementNames: ("powerValue" | "indexValue" | "value" | "sub1" | "textValue" | `${number}_${number}`)[] = [],
        innerBlocks: BlockModel[][] = [],
        style?: BlockStyle): CompositeBlockModel {
        const block: CompositeBlockModel = {
            id: generator.nextId(),
            type: "composite",
            text: name,
            elements: {
            },
            style
        }

        for (let idx = 0; idx < elementNames.length; idx++) {
            const name = elementNames[idx];
            (block.elements[name] as EditorModel) = this.editorFrom(innerBlocks[idx]);

        }

        return block;
    }

    editorFrom(blocks: BlockModel[]): EditorModel {
        return { id: generator.nextId(), lines: [{ id: generator.nextId(), blocks }] };
    }

    textBlock(text: string, style?: BlockStyle): BlockModel {
        return {
            id: generator.nextId(),
            text: text,
            style,
        }
    }

    flattenBlocks(blocks: BlockModel[][]): BlockModel[] {
        return blocks.reduce((prev, cur) => this.combine2Blockss(prev, cur), [] as BlockModel[])
    }

    combineMultipleBlocks(...blocks: BlockModel[][]): BlockModel[] {
        return blocks.reduce((prev, cur) => this.combine2Blockss(prev, cur), [] as BlockModel[])
    }
    combine2Blockss(b1: BlockModel[], b2: BlockModel[]): BlockModel[] {
        if (b1.length <= 0) {
            return b2;
        }
        if (b2.length <= 0) {
            return b1;
        }

        const all = b1.concat(b2);

        return this.combineBlocks(all);
    }

    combineBlocks(all: BlockModel[]): BlockModel[] {
        let last: Writeable<BlockModel> = all[0];
        const rs: Writeable<BlockModel>[] = [last];
        for (let idx = 1; idx < all.length; idx++) {
            const cur = all[idx];
            if (!last.type && !cur.type && objectHelper.objectMemberEquals(last.style, cur.style)) {
                last.text = last.text + cur.text;
                continue;
            }

            last = cur;
            rs.push(last);
        }

        return rs;
    }

    argumentBlocks(blockss: BlockModel[][], join: string, bracketType: "(" | "[" = "("): Pr2M.CResult {
        return this.wrapBetweenBrackets(this.joinBlocks(blockss, join), bracketType);
    }

    

    joinBlocks(blockss: BlockModel[][], text: string) {
        let rs: BlockModel[] = [];
        for (let idx = 0; idx < blockss.length; idx++) {
            const blocks = blockss[idx];
            if (idx <= 0) {
                rs = this.combine2Blockss(rs, blocks);
            } else {
                rs = this.combineMultipleBlocks(rs, [this.textBlock(text)], blocks);
            }

        }

        return rs;
    }

    wrapBetweenBrackets(blocks: BlockModel[], bracketType: "(" | "[" = "("): Pr2M.CResult {
        const right = bracketType == "(" ? ")" : "]"
        return {
            blocks: [blockBd.bracketBlock(bracketType)].concat(blocks).concat([blockBd.bracketBlock(right)]),
            prUnit: "bracket",
            prBracket: bracketType,
        }
    }
}

export const blockBd = new BlockBd();