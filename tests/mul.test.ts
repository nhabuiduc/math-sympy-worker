import { expect } from "chai";
import { testHelper as th } from "./test-helper";

describe("Mul", () => {

    it("should mul", async () => {
        expect(await th.run("x+10")).equal(`[x+10]`);
        expect(await th.run("x**2")).equal(`[x][pow,[2]]`);
        expect(await th.run("x**(1 + x)")).equal(`[x][pow,[x+1]]`);
        expect(await th.run("x**3 + x + 1 + x**2")).equal(`[x][pow,[3]][+x][pow,[2]][+x+1]`);
        expect(await th.run("2*x*y")).equal(`[2xy]`);
        expect(await th.run("3*x**2*y")).equal(`[3x][pow,[2]][y]`);
        expect(await th.run("1.5*3**x")).equal(`[1.5×3][pow,[x]]`);

        expect(await th.run("Mul(0, 1, evaluate=False)")).equal(`[0×1]`);
        expect(await th.run("Mul(1, 0, evaluate=False)")).equal(`[1×0]`);
        expect(await th.run("Mul(1, 1, evaluate=False)")).equal(`[1×1]`);
        expect(await th.run("Mul(-1, 1, evaluate=False)")).equal(`[-1×1]`);
        expect(await th.run("Mul(1, 1, 1, evaluate=False)")).equal(`[1×1×1]`);
        expect(await th.run("Mul(1, 2, evaluate=False)")).equal(`[1×2]`);
        expect(await th.run("Mul(1, S.Half, evaluate=False)")).equal(`[1×][frac,[1],[2]]`);
        expect(await th.run("Mul(1, 1, S.Half, evaluate=False)")).equal(`[1×1×][frac,[1],[2]]`);
        expect(await th.run("Mul(1, 1, 2, 3, x, evaluate=False)")).equal(`[1×1×2×3x]`);
        expect(await th.run("Mul(1, -1, evaluate=False)")).equal(`[1×(-1)]`);
    });
    
})

