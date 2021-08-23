import { generator } from "@lib-shared/id-generator";

class SymbolIndexSerialize {
    toJson(obj: { lines: LineModel[] }): string {
        return JSON.stringify(obj, (key, vl) => {
            if (key == "id" && vl[0] == "n") {
                return undefined;
            }

            if (key.length > 3 && key[0] == "_" && key[1] == "_" && key[2] == "_") {
                return undefined;
            }

            return vl;
        })
    }

    parseJson(vl: string): { lines: LineModel[] } {
        return JSON.parse(vl, (key, vl) => {
            if (key == "lines" || key == "blocks") {
                if (vl instanceof Array) {
                    vl.forEach((i: any) => i.id = generator.nextId())
                }

            }

            if (key == "elements") {
                Object.keys(vl).map(k=>vl[k]).forEach((i: any) => {
                    /**only generate id of editor if it's not existed */
                    if (!i.id) {
                        i.id = generator.nextId()
                    }
                })
            }

            return vl;
        })
    }
}

export const symbolIndexSerialize = new SymbolIndexSerialize();