import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { P2PrItemBase } from "./p2pr-item-base";

export class Quantity extends P2PrItemBase {
    convert(obj: P2Pr.PQuantity, symbolLatexNames: { [key: string]: string }): P2Pr.Quantity {
        if (obj.latex) {
            const rs = this.tryParseLatex(obj.latex, symbolLatexNames);
            if (rs) {
                return rs;
            }
        }
        const ss = this.m(obj.args);
        const targetSymbol = ss.length >= 2 ? ss[1] : ss[0];
        const varName = prTh.tryExtactVarName(targetSymbol)
        return varName ? prTh.quantity(prTh.var(varName, { normalText: true })) : prTh.quantity(targetSymbol);
    }

    private tryParseLatex(latex: string, symbolLatexNames: { [key: string]: string }) {
        if (latex == "^\\circ") {
            return prTh.quantity(prTh.pow(prTh.empty(), prTh.var("∘")));
        }

        if (latex[0] == "\\" && latex.length == 2) {
            return prTh.quantity(prTh.var(latex[1]));
        }
        /** example: \mu  */
        let result = latex.match(/^\\([a-z]+)$/i);
        if (result) {
            const parsedName = this.latexNameMap(result[1], symbolLatexNames);
            return parsedName ? prTh.quantity(prTh.var(parsedName)) : undefined;
        }

        /** example: Z_{0} */
        result = latex.match(/^([a-z]+)\_\{(0-9a-z)+\}$/i)
        if (result) {
            return prTh.quantity(prTh.index(prTh.var(result[1]), prTh.var(result[2])))
        }

        /** example: \mu\text{g}  */
        result = latex.match(/^\\([a-z]+)\\text\{([a-z0-9]+)\}$/);
        if (result) {
            const parsedName = this.latexNameMap(result[1], symbolLatexNames);
            return parsedName ? prTh.quantity(prTh.varList([prTh.var(parsedName), prTh.var(result[2], { normalText: true })])) : undefined;
        }

        /** example: m_\text{P}  */
        result = latex.match(/^([a-z]+)\_\\text\{([a-z0-9]+)\}$/);
        if (result) {
            return prTh.quantity(prTh.index(prTh.var(result[1]), prTh.var(result[2], { normalText: true })))
        }

        /** example: \rho_\text{g}  */
        result = latex.match(/^\\([a-z]+)\_\\text\{([a-z0-9]+)\}$/);
        if (result) {
            const parsedName = this.latexNameMap(result[1], symbolLatexNames);
            return parsedName ? prTh.quantity(prTh.index(prTh.var(parsedName), prTh.var(result[2], { normalText: true }))) : undefined;
        }
    }

    private latexNameMap(name: string, symbolLatexNames: { [key: string]: string }): string {
        if (name == "%") {
            return "%"
        }

        return symbolLatexNames[name];
    }
}
