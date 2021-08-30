import { P2Pr } from "../p2pr";

class BloackBoardBold {
    map(text: string): P2Pr.Var {
        const found = this.funcMap[text];
        if (!found) {
            throw new Error("Unsupported Blackboard bold map")
        }
        return { type: "Var", kind: "Leaf", name: found, bold: "blackboard" };
    }

    private funcMap: { [k: string]: string } = {
        "Naturals": "N",
        "UniversalSet": "U",
        "Reals": "R",
        "Integers": "Z",
        "Rationals": "Q",
        "Complexes": "C",
    }
}

export const bloackBoardBold = new BloackBoardBold();