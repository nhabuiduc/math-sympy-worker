import { expect } from "chai";
import { testHelper as th } from "./test-helper";

describe("Mul", () => {

    it("should mul", async () => {
        expect(await th.run("x+10")).equal(`[x+10]`);
        expect(await th.run("x**2")).equal(`[x][pow,[2]]`);
        expect(await th.run("x**(1 + x)")).equal(`[x][pow,[x+1]]`);
        expect(await th.run("x**3 + x + 1 + x**2")).equal(`[x][pow,[3]][+x][pow,[2]][+x+1]`);
        expect(await th.run("2*x*y")).equal(`[2xy]`);
        expect(await th.run("3*x**2*y")).equal(`[3yx][pow,[2]]`);
    });
    
})

