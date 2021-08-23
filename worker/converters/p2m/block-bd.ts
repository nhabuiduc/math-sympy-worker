import { generator } from "@lib-shared/id-generator";
import objectHelper from "@lib-shared/object-helper";
import { tabularKeyInfoHelper } from "@lib-shared/tabular-key-info-helper";
import { sympyToMcConstantFuncs } from "../mapping/generic-func-map";

class BlockBd {

    fracBlock(num: BlockModel[], den: BlockModel[]) {
        return this.compositeBlock("\\frac", ["value", "sub1"], [num, den]);
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
        name: "\\power-index" | "\\frac" | "\\sqrt" | "\\matrix" | "\\text" | "\\small-tilde" | "\\small-hat" | "\\middle|" | "\\operatorname",
        elementNames: ("powerValue" | "indexValue" | "value" | "sub1" | "textValue")[],
        innerBlocks: BlockModel[][],
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

    textBlock(text: string, style?: BlockStyle) {
        return {
            id: generator.nextId(),
            text: text,
            style,
        }
    }

    combineMultipleBlocks(...blocks: BlockModel[][]): BlockModel[] {
        return blocks.reduce((prev, cur) => this.combine2Blocks(prev, cur), [] as BlockModel[])
    }
    combine2Blocks(b1: BlockModel[], b2: BlockModel[]): BlockModel[] {
        if (b1.length <= 0) {
            return b2;
        }
        if (b2.length <= 0) {
            return b1;
        }

        const all = b1.concat(b2);

        let last: Writeable<BlockModel> = b1[0];
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

    argumentBlocks(blockss: BlockModel[][], join: string, bracketType: "(" | "[" = "("): BlockModel[] {
        return this.wrapBetweenBrackets(this.joinBlocks(blockss, join), bracketType);
    }

    joinBlocks(blockss: BlockModel[][], text: string) {
        let rs: BlockModel[] = [];
        for (let idx = 0; idx < blockss.length; idx++) {
            const blocks = blockss[idx];
            if (idx <= 0) {
                rs = this.combine2Blocks(rs, blocks);
            } else {
                rs = this.combineMultipleBlocks(rs, [this.textBlock(text)], blocks);
            }

        }

        return rs;
    }

    wrapBetweenBrackets(blocks: BlockModel[], bracketType: "(" | "[" = "("): BlockModel[] {
        const right = bracketType == "(" ? ")" : "]"
        return [blockBd.bracketBlock(bracketType)].concat(blocks).concat([blockBd.bracketBlock(right)])
    }
}

export const blockBd = new BlockBd();