import { defineSympyExprDumpFunc } from "@sympy-worker/python-code";
import { expect } from "chai";
import { testHelper as th } from "./test-helper";

/** Test from: https://github.com/sympy/sympy/blob/master/sympy/printing/tests/test_latex.py */
describe("3: Others", () => {
    before(async () => {
        await th.prepare(`
        x_star = Symbol('x^*')
        f = Function('f')`);

        await th.prepare(defineSympyExprDumpFunc);
    });

    it("symbol with multiple characters", async () => {
        expect(await th.run("x_star**2")).equal(`([x^*])[💪,[2]]`);
        expect(await th.run("Derivative(f(x_star), x_star,2)")).equal(`[frac,[d][💪,[2]],[d]([x^*])[💪,[2]]][f]([x^*])`);

        expect(await th.run("2*Integral(x, x)/3")).equal(`[frac,[2][int,][x dx],[3]]`);
    });

    it("sqrt, rational", async () => {

        expect(await th.run("sqrt(x)")).equal(`[sqrt,[x]]`);
        expect(await th.run("x**Rational(1, 3)")).equal(`[sqrt,[x],[3]]`);
        expect(await th.run("sqrt(x)**3")).equal(`[x][💪,[frac,[3],[2]]]`);
        expect(await th.run("x**Rational(3, 4)")).equal(`[x][💪,[frac,[3],[4]]]`);
        expect(await th.run("(x + 1)**Rational(3, 4)")).equal(`([1+x])[💪,[frac,[3],[4]]]`);
    });

    it("tini float value", async () => {
        expect(await th.run("1.5e20*x")).equal(`[1.5×10][💪,[20]][x]`);
    });

    it("sin", async () => {
        expect(await th.run("1/sin(x)")).equal(`[frac,[1],[sin,]([x])]`);
        expect(await th.run("sin(x)**-1")).equal(`[frac,[1],[sin,]([x])]`);
        expect(await th.run("sin(x)**Rational(3, 2)")).equal(`[sin,][💪,[frac,[3],[2]]]([x])`);
    });

    it("discrete", async () => {

        expect(await th.run("~x")).equal(`[¬][x]`);
        expect(await th.run("x & y")).equal(`[x∧y]`);
        expect(await th.run("x & y & z")).equal(`[x∧y∧z]`);
        expect(await th.run("x | y")).equal(`[x∨y]`);
        expect(await th.run("x | y | z")).equal(`[x∨y∨z]`);
        expect(await th.run("(x & y) | z")).equal(`[z∨]([x∧y])`);
        expect(await th.run("Implies(x, y)")).equal(`[x⇒y]`);
        expect(await th.run("~(x >> ~y)")).equal(`[¬]([x⇒¬y])`);
        expect(await th.run("Implies(Or(x,y), z)")).equal(`([x∨y])[⇒z]`);
        expect(await th.run("Implies(z, Or(x,y))")).equal(`[z⇒]([x∨y])`);
        expect(await th.run("~(x & y)")).equal(`[¬]([x∧y])`);
    })

    it("Pow", async () => {
        expect(await th.run("Pow(Rational(1, 3), -1, evaluate=False)")).equal(`[frac,[1],[frac,[1],[3]]]`);
        expect(await th.run("Pow(Rational(1, 3), -2, evaluate=False)")).equal(`[frac,[1],([frac,[1],[3]])[💪,[2]]]`);
        expect(await th.run("Pow(Integer(1)/100, -1, evaluate=False)")).equal(`[frac,[1],[frac,[1],[100]]]`);
    });

    it("Builtins", async () => {
        expect(await th.run("True")).equal(`[text,[True]]`);
        expect(await th.run("False")).equal(`[text,[False]]`);
        expect(await th.run("None")).equal(`[text,[None]]`);
        expect(await th.run("true")).equal(`[text,[True]]`);
        expect(await th.run("false")).equal(`[text,[False]]`);
    });

    it("SingularityFunction", async () => {
        expect(await th.run("SingularityFunction(x, 4, 5)")).equal(`<[-4+x]>[💪,[5]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)")).equal(`<[3+x]>[💪,[4]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)")).equal(`<[x]>[💪,[4]]`);
        expect(await th.run("SingularityFunction(x, a, n)")).equal(`<[x-a]>[💪,[n]]`);
        expect(await th.run("SingularityFunction(x, 4, -2)")).equal(`<[-4+x]>[💪,[-2]]`);
        expect(await th.run("SingularityFunction(x, 4, -1)")).equal(`<[-4+x]>[💪,[-1]]`);
        expect(await th.run("SingularityFunction(x, 4, 5)**3")).equal(`(<[-4+x]>[💪,[5]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)**3")).equal(`(<[3+x]>[💪,[4]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)**3")).equal(`(<[x]>[💪,[4]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, a, n)**3")).equal(`(<[x-a]>[💪,[n]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, 4, -2)**3")).equal(`(<[-4+x]>[💪,[-2]])[💪,[3]]`);
        expect(await th.run("(SingularityFunction(x, 4, -1)**3)**3")).equal(`(<[-4+x]>[💪,[-1]])[💪,[9]]`);
    })

    it("cycle", async () => {
        expect(await th.run("Cycle(1, 2, 4)")).equal(`([1;2;4])`);
        expect(await th.run("Cycle(1, 2)(4, 5, 6)")).equal(`([1;2])([4;5;6])`);
        expect(await th.run("Cycle()")).equal(`()`);
    });

    it("permutation", async () => {
        expect(await th.run("Permutation(1, 2, 4)")).equal(`([1;2;4])`);
        expect(await th.run("Permutation(1, 2)(4, 5, 6)")).equal(`([1;2])([4;5;6])`);
        expect(await th.run("Permutation()")).equal(`()`);
        expect(await th.run("Permutation(2, 4)*Permutation(5)")).equal(`([2;4])([5])`);
        expect(await th.run("Permutation(5)")).equal(`([5])`);
    });

    it("Float", async () => {
        expect(await th.run("Float(1.0e100)")).equal(`[1.0×10][💪,[100]]`);
        expect(await th.run("Float(1.0e-100)")).equal(`[1.0×10][💪,[-100]]`);
        expect(await th.run("Float('10000.0')")).equal(`[10000.0]`);
        expect(await th.run("Float('0.099999')")).equal(`[0.099999]`);
    });

    it("Vector Expressions", async () => {
        await th.prepare(`A = CoordSys3D('A')`);
        expect(await th.run("Cross(A.i, A.j*A.x*3+A.k)")).equal(`[🎩,[i],bf][⛏️,[A,bf]][×]([🎩,[k],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Cross(A.i, A.j)")).equal(`[🎩,[i],bf][⛏️,[A,bf]][×][🎩,[j],bf][⛏️,[A,bf]]`);
        expect(await th.run("x*Cross(A.i, A.j)")).equal(`[x]([🎩,[i],bf][⛏️,[A,bf]][×][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Cross(x*A.i, A.j)")).equal(`[-]([🎩,[j],bf][⛏️,[A,bf]][×]([x][🎩,[i],bf][⛏️,[A,bf]]))`);

        expect(await th.run("Curl(3*A.x*A.j)")).equal(`[∇×]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Curl(3*A.x*A.j+A.i)")).equal(`[∇×]([🎩,[i],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Curl(3*x*A.x*A.j)")).equal(`[∇×]([3x][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Curl(3*A.x*A.j)")).equal(`[x]([∇×]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]]))`);

        expect(await th.run("Divergence(3*A.x*A.j+A.i)")).equal(`[∇⋅]([🎩,[i],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Divergence(3*A.x*A.j)")).equal(`[∇⋅]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Divergence(3*A.x*A.j)")).equal(`[x]([∇⋅]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]]))`);

        expect(await th.run("Dot(A.i, A.j*A.x*3+A.k)")).equal(`[🎩,[i],bf][⛏️,[A,bf]][⋅]([🎩,[k],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Dot(A.i, A.j)")).equal(`[🎩,[i],bf][⛏️,[A,bf]][⋅][🎩,[j],bf][⛏️,[A,bf]]`);
        expect(await th.run("Dot(x*A.i, A.j)")).equal(`[🎩,[j],bf][⛏️,[A,bf]][⋅]([x][🎩,[i],bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Dot(A.i, A.j)")).equal(`[x]([🎩,[i],bf][⛏️,[A,bf]][⋅][🎩,[j],bf][⛏️,[A,bf]])`);

        expect(await th.run("Gradient(A.x)")).equal(`[∇][x,bf][⛏️,[A,bf]]`);
        expect(await th.run("Gradient(A.x + 3*A.y)")).equal(`[∇]([3][y,bf][⛏️,[A,bf]][+][x,bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Gradient(A.x)")).equal(`[x]([∇][x,bf][⛏️,[A,bf]])`);
        expect(await th.run("Gradient(x*A.x)")).equal(`[∇]([x][x,bf][⛏️,[A,bf]])`);

        expect(await th.run("Laplacian(A.x)")).equal(`[▵][x,bf][⛏️,[A,bf]]`);
        expect(await th.run("Laplacian(A.x + 3*A.y)")).equal(`[▵]([3][y,bf][⛏️,[A,bf]][+][x,bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Laplacian(A.x)")).equal(`[x]([▵][x,bf][⛏️,[A,bf]])`);
        expect(await th.run("Laplacian(x*A.x)")).equal(`[▵]([x][x,bf][⛏️,[A,bf]])`);
    });


    it("Symbols", async () => {
        await th.prepare(`
Gamma, lmbda, rho = symbols('Gamma, lambda, rho')
tau, Tau, TAU, taU = symbols('tau, Tau, TAU, taU')
        `);

        expect(await th.run("tau")).equal(`[𝜏]`);
        expect(await th.run("Tau")).equal(`[T]`);
        expect(await th.run("TAU")).equal(`[𝜏]`);
        expect(await th.run("taU")).equal(`[𝜏]`);

        expect(await th.run("Gamma + lmbda")).equal(`[𝛤+𝜆]`);
        expect(await th.run("Gamma * lmbda")).equal(`[𝛤𝜆]`);
        expect(await th.run("Symbol('q1')")).equal(`[q][⛏️,[1]]`);
        expect(await th.run("Symbol('q21')")).equal(`[q][⛏️,[21]]`);
        expect(await th.run("Symbol('epsilon0')")).equal(`[𝜖][⛏️,[0]]`);
        expect(await th.run("Symbol('omega1')")).equal(`[𝜔][⛏️,[1]]`);
        expect(await th.run("Symbol('91')")).equal(`[91]`);
        expect(await th.run("Symbol('alpha_new')")).equal(`[𝛼][⛏️,[new]]`);
        expect(await th.run("Symbol('C^orig')")).equal(`[C][💪,[orig]]`);
        expect(await th.run("Symbol('x^alpha')")).equal(`[x][💪,[𝛼]]`);
        expect(await th.run("Symbol('beta^alpha')")).equal(`[𝛽][💪,[𝛼]]`);
        expect(await th.run("Symbol('e^Alpha')")).equal(`[e][💪,[𝛢]]`);
        expect(await th.run("Symbol('omega_alpha^beta')")).equal(`[𝜔][💪,[𝛽],[𝛼]]`);
        expect(await th.run("Symbol('omega') ** Symbol('beta')")).equal(`[𝜔][💪,[𝛽]]`);
    })

    it.only("functions", async () => {
        // expect(await th.run("exp(x)")).equal(`[e][💪,[x]]`);
        // expect(await th.run("exp(1) + exp(2)")).equal(`[e+e][💪,[2]]`);

        // await th.prepare(`f = Function('f')`);

        // expect(await th.run("f(x)")).equal(`[f]([x])`);
        // expect(await th.run("f")).equal(`[f]`);

        // await th.prepare(`g = Function('g')`);
        // expect(await th.run("g(x, y)")).equal(`[g]([x,y])`);
        // expect(await th.run("g")).equal(`[g]`);

        // await th.prepare(`  h = Function('h')`);
        // expect(await th.run("h(x, y, z)")).equal(`[h]([x,y,z])`);

        // await th.prepare(` Li = Function('Li')`);
        // expect(await th.run("Li")).equal(`[⚙️,[Li]]`);
        // expect(await th.run("Li(x)")).equal(`[⚙️,[Li]]([x])`);

        // await th.prepare(` mybeta = Function('beta')`);
        // expect(await th.run("mybeta(x, y, z)")).equal(`[𝛽]([x,y,z])`);
        // expect(await th.run("beta(x, y)")).equal(`[⚙️,[B]]([x,y])`);
        // expect(await th.run("beta(x, y)**2")).equal(`[⚙️,[B]][💪,[2]]([x,y])`);
        // expect(await th.run("mybeta(x)")).equal(`[𝛽]([x])`);
        // expect(await th.run("mybeta")).equal(`[𝛽]`);

        // await th.prepare(`g = Function('gamma')`);
        // expect(await th.run("g(x, y, z)")).equal(`[𝛾]([x,y,z])`);
        // expect(await th.run("g(x)")).equal(`[𝛾]([x])`);
        // expect(await th.run("g")).equal(`[𝛾]`);

        // await th.prepare(`a1 = Function('a_1')`);
        // expect(await th.run("a1")).equal(`[a][⛏️,[1]]`);
        // expect(await th.run("a1(x)")).equal(`[a][⛏️,[1]]([x])`);
        // await th.prepare(`omega1 = Function('omega1')`);
        // expect(await th.run("omega1")).equal(`[𝜔][⛏️,[1]]`);
        // expect(await th.run("omega1(x)")).equal(`[𝜔][⛏️,[1]]([x])`);

        // expect(await th.run("sin(x)")).equal(`[sin,]([x])`);
        // expect(await th.run("sin(2*x**2)")).equal(`[sin,]([2x][💪,[2]])`);
        // expect(await th.run("sin(x**2)")).equal(`[sin,]([x][💪,[2]])`);

        // expect(await th.run("asin(x)**2")).equal(`[asin,][💪,[2]]([x])`);
        // expect(await th.run("acsc(x)")).equal(`[acsc,]([x])`);
        // expect(await th.run("asinh(x)")).equal(`[asinh,]([x])`);

        // expect(await th.run("factorial(k)")).equal(`[k!]`);
        // expect(await th.run("factorial(-k)")).equal(`([-k])[!]`);
        // expect(await th.run("factorial(k)**2")).equal(`[k!][💪,[2]]`);

        // expect(await th.run("subfactorial(k)")).equal(`[!k]`);
        // expect(await th.run("subfactorial(-k)")).equal(`[!]([-k])`);
        // expect(await th.run("subfactorial(k)**2")).equal(`([!k])[💪,[2]]`);

        // expect(await th.run("factorial2(k)")).equal(`[k!!]`);
        // expect(await th.run("factorial2(-k)")).equal(`([-k])[!!]`);
        // expect(await th.run("factorial2(k)**2")).equal(`[k!!][💪,[2]]`);

        // expect(await th.run("binomial(2, k)")).equal(`[(🏓)binom,[2],[k]]`);
        // expect(await th.run("binomial(2, k)**2")).equal(`[(🏓)binom,[2],[k]][💪,[2]]`);

        // expect(await th.run("FallingFactorial(3, k)")).equal(`([3])[⛏️,[k]]`);
        // expect(await th.run("RisingFactorial(3, k)")).equal(`[3][💪,([k])]`);

        // expect(await th.run("floor(x)")).equal(`⌊[x]⌋`);
        // expect(await th.run("ceiling(x)")).equal(`⌈[x]⌉`);
        // expect(await th.run("frac(x)")).equal(`[⚙️,[frac]]([x])`);
        // expect(await th.run("floor(x)**2")).equal(`⌊[x]⌋[💪,[2]]`);
        // expect(await th.run("ceiling(x)**2")).equal(`⌈[x]⌉[💪,[2]]`);
        // expect(await th.run("frac(x)**2")).equal(`[⚙️,[frac]][💪,[2]]([x])`);

        // expect(await th.run("Min(x, 2, x**3)")).equal(`[min,]([2,x,x][💪,[3]])`);
        // expect(await th.run("Min(x, y)**2")).equal(`[min,]([x,y])[💪,[2]]`);
        // expect(await th.run("Max(x, 2, x**3)")).equal(`[max,]([2,x,x][💪,[3]])`);
        // expect(await th.run("Max(x, y)**2")).equal(`[max,]([x,y])[💪,[2]]`);
        // expect(await th.run("Abs(x)")).equal(`|[x]|`);
        // expect(await th.run("Abs(x)**2")).equal(`|[x]|[💪,[2]]`);
        // expect(await th.run("re(x)")).equal(`[⚙️,[re]]([x])`);
        // expect(await th.run("re(x + y)")).equal(`[⚙️,[re]]([x])[+][⚙️,[re]]([y])`);
        // expect(await th.run("im(x)")).equal(`[⚙️,[im]]([x])`);
        // expect(await th.run("conjugate(x)")).equal(`[overline,[x]]`);
        // expect(await th.run("conjugate(x)**2")).equal(`[overline,[x]][💪,[2]]`);
        // expect(await th.run("gamma(x)")).equal(`[𝛤]([x])`);
        // await th.prepare(`w = Wild('w')`);
        // expect(await th.run("gamma(w)")).equal(`[𝛤]([w])`);
        // expect(await th.run("Order(x)")).equal(`[O]([x])`);
        // expect(await th.run("Order(x)")).equal(`[O]([x])`);
        // expect(await th.run("Order(x, (x, 0))")).equal(`[O]([x])`);
        // expect(await th.run("Order(x, (x, oo))")).equal(`[O]([x;x][rightarrow,][∞])`);
        // expect(await th.run("Order(x - y, (x, y))")).equal(`[O]([x-y;x][rightarrow,][y])`);
        // expect(await th.run("Order(x, x, y)")).equal(`[O]([x;]([x,y])[rightarrow,]([0,0]))`);
        // expect(await th.run("Order(x, (x, oo), (y, oo))")).equal(`[O]([x;]([x,y])[rightarrow,]([∞,∞]))`);
        // expect(await th.run("lowergamma(x, y)")).equal(`[𝛾]([x,y])`);
        // expect(await th.run("lowergamma(x, y)**2")).equal(`[𝛾][💪,[2]]([x,y])`);
        // expect(await th.run("uppergamma(x, y)")).equal(`[𝛤]([x,y])`);
        // expect(await th.run("uppergamma(x, y)**2")).equal(`[𝛤][💪,[2]]([x,y])`);

        // expect(await th.run("cot(x)")).equal(`[cot,]([x])`);
        // expect(await th.run("coth(x)")).equal(`[coth,]([x])`);
        // expect(await th.run("re(x)")).equal(`[⚙️,[re]]([x])`);
        // expect(await th.run("im(x)")).equal(`[⚙️,[im]]([x])`);
        // expect(await th.run("root(x, y)")).equal(`[x][💪,[frac,[1],[y]]]`);
        // expect(await th.run("arg(x)")).equal(`[arg,]([x])`);

        // expect(await th.run("zeta(x)")).equal(`[𝜁]([x])`);
        // expect(await th.run("zeta(x)**2")).equal(`[𝜁][💪,[2]]([x])`);
        // expect(await th.run("zeta(x, y)")).equal(`[𝜁]([x,y])`);
        // expect(await th.run("zeta(x, y)**2")).equal(`[𝜁][💪,[2]]([x,y])`);
        // expect(await th.run("dirichlet_eta(x)")).equal(`[𝜂]([x])`);
        // expect(await th.run("dirichlet_eta(x)**2")).equal(`[𝜂][💪,[2]]([x])`);
        // expect(await th.run("polylog(x, y)")).equal(`[⚙️,[Li]][⛏️,[x]]([y])`);
        // expect(await th.run("polylog(x, y)**2")).equal(`[⚙️,[Li]][💪,[2],[x]]([y])`);
        // expect(await th.run("lerchphi(x, y, n)")).equal(`[𝛷]([x,y,n])`);
        // expect(await th.run("lerchphi(x, y, n)**2")).equal(`[𝛷][💪,[2]]([x,y,n])`);
        // expect(await th.run("stieltjes(x)")).equal(`[𝛾][⛏️,[x]]`);
        // expect(await th.run("stieltjes(x)**2")).equal(`[𝛾][💪,[2],[x]]`);
        // expect(await th.run("stieltjes(x, y)")).equal(`[𝛾][⛏️,[x]]([y])`);
        // expect(await th.run("stieltjes(x, y)**2")).equal(`[𝛾][⛏️,[x]]([y])[💪,[2]]`);

        // expect(await th.run("elliptic_k(z)")).equal(`[K]([z])`);
        // expect(await th.run("elliptic_k(z)**2")).equal(`[K][💪,[2]]([z])`);
        // expect(await th.run("elliptic_f(x, y)")).equal(`[F]([x][middle|,][y])`);
        // expect(await th.run("elliptic_f(x, y)**2")).equal(`[F][💪,[2]]([x][middle|,][y])`);
        // expect(await th.run("elliptic_e(x, y)")).equal(`[E]([x][middle|,][y])`);
        // expect(await th.run("elliptic_e(x, y)**2")).equal(`[E][💪,[2]]([x][middle|,][y])`);
        // expect(await th.run("elliptic_e(z)")).equal(`[E]([z])`);
        // expect(await th.run("elliptic_e(z)**2")).equal(`[E][💪,[2]]([z])`);
        // expect(await th.run("elliptic_pi(x, y, z)")).equal(`[𝛱]([x;y][middle|,][z])`);
        // expect(await th.run("elliptic_pi(x, y, z)**2")).equal(`[𝛱][💪,[2]]([x;y][middle|,][z])`);
        // expect(await th.run("elliptic_pi(x, y)")).equal(`[𝛱]([x][middle|,][y])`);
        // expect(await th.run("elliptic_pi(x, y)**2")).equal(`[𝛱][💪,[2]]([x][middle|,][y])`);

        // expect(await th.run("Ei(x)")).equal(`[⚙️,[Ei]]([x])`);
        // expect(await th.run("Ei(x)**2")).equal(`[⚙️,[Ei]][💪,[2]]([x])`);
        // expect(await th.run("expint(x, y)")).equal(`[E][⛏️,[x]]([y])`);
        // expect(await th.run("expint(x, y)**2")).equal(`[E][💪,[2],[x]]([y])`);
        // expect(await th.run("Shi(x)**2")).equal(`[⚙️,[Shi]][💪,[2]]([x])`);
        // expect(await th.run("Si(x)**2")).equal(`[⚙️,[Si]][💪,[2]]([x])`);
        // expect(await th.run("Ci(x)**2")).equal(`[⚙️,[Ci]][💪,[2]]([x])`);
        // expect(await th.run("Chi(x)**2")).equal(`[⚙️,[Chi]][💪,[2]]([x])`);
        // expect(await th.run("Chi(x)")).equal(`[⚙️,[Chi]]([x])`);
        // expect(await th.run("jacobi(n, a, b, x)")).equal(`[P][💪,([a,b]),[n]]([x])`);
        // expect(await th.run("jacobi(n, a, b, x)**2")).equal(`[P][💪,([a,b]),[n]]([x])[💪,[2]]`);
        // expect(await th.run("gegenbauer(n, a, x)")).equal(`[C][💪,([a]),[n]]([x])`);
        // expect(await th.run("gegenbauer(n, a, x)**2")).equal(`[C][💪,([a]),[n]]([x])[💪,[2]]`);
        // expect(await th.run("chebyshevt(n, x)")).equal(`[T][⛏️,[n]]([x])`);
        // expect(await th.run("chebyshevt(n, x)**2")).equal(`([T][⛏️,[n]]([x]))[💪,[2]]`);
        // expect(await th.run("chebyshevu(n, x)")).equal(`[U][⛏️,[n]]([x])`);
        // expect(await th.run("chebyshevu(n, x)**2")).equal(`([U][⛏️,[n]]([x]))[💪,[2]]`);
        // expect(await th.run("legendre(n, x)")).equal(`[P][⛏️,[n]]([x])`);
        // expect(await th.run("legendre(n, x)**2")).equal(`([P][⛏️,[n]]([x]))[💪,[2]]`);
        // expect(await th.run("assoc_legendre(n, a, x)")).equal(`[P][💪,([a]),[n]]([x])`);
        // expect(await th.run("assoc_legendre(n, a, x)**2")).equal(`([P][💪,([a]),[n]]([x]))[💪,[2]]`);
        // expect(await th.run("laguerre(n, x)")).equal(`[L][⛏️,[n]]([x])`);
        // expect(await th.run("laguerre(n, x)**2")).equal(`([L][⛏️,[n]]([x]))[💪,[2]]`);
        // expect(await th.run("assoc_laguerre(n, a, x)")).equal(`[L][💪,([a]),[n]]([x])`);
        // expect(await th.run("assoc_laguerre(n, a, x)**2")).equal(`([L][💪,([a]),[n]]([x]))[💪,[2]]`);
        // expect(await th.run("hermite(n, x)")).equal(`[H][⛏️,[n]]([x])`);
        // expect(await th.run("hermite(n, x)**2")).equal(`([H][⛏️,[n]]([x]))[💪,[2]]`);

        await th.prepare(` 
theta = Symbol("theta", real=True)
phi = Symbol("phi", real=True)`)

        expect(await th.run("Ynm(n, m, theta, phi)")).equal(`[Y][💪,[m],[n]]([𝜃,𝜙])`);
        expect(await th.run("Ynm(n, m, theta, phi)**3")).equal(`([Y][💪,[m],[n]]([𝜃,𝜙]))[💪,[3]]`);
        expect(await th.run("Znm(n, m, theta, phi)")).equal(`[Z][💪,[m],[n]]([𝜃,𝜙])`);
        expect(await th.run("Znm(n, m, theta, phi)**3")).equal(`([Z][💪,[m],[n]]([𝜃,𝜙]))[💪,[3]]`);

        expect(await th.run("polar_lift(0)")).equal(`[⚙️,[polar_lift]]([0])`);
        expect(await th.run("polar_lift(0)**3")).equal(`[⚙️,[polar_lift]][💪,[3]]([0])`);
        expect(await th.run("totient(n)")).equal(`[𝜙]([n])`);
        expect(await th.run("totient(n) ** 2")).equal(`([𝜙]([n]))[💪,[2]]`);

        expect(await th.run("reduced_totient(n)")).equal(`[𝜆]([n])`);
        expect(await th.run("reduced_totient(n) ** 2")).equal(`([𝜆]([n]))[💪,[2]]`);

        expect(await th.run("divisor_sigma(x)")).equal(`[𝜎]([x])`);
        expect(await th.run("divisor_sigma(x)**2")).equal(`[𝜎][💪,[2]]([x])`);
        expect(await th.run("divisor_sigma(x, y)")).equal(`[𝜎][⛏️,[y]]([x])`);
        expect(await th.run("divisor_sigma(x, y)**2")).equal(`[𝜎][💪,[2],[y]]([x])`);
        expect(await th.run("udivisor_sigma(x)")).equal(`[𝜎][💪,[*]]([x])`);
        expect(await th.run("udivisor_sigma(x)**2")).equal(`([𝜎][💪,[*]]([x]))[💪,[2]]`);
        expect(await th.run("udivisor_sigma(x, y)")).equal(`[𝜎][💪,[*],[y]]([x])`);
        expect(await th.run("udivisor_sigma(x, y)**2")).equal(`([𝜎][💪,[*],[y]]([x]))[💪,[2]]`);

        expect(await th.run("primenu(n)")).equal(`[𝜈]([n])`);
        expect(await th.run("primenu(n) ** 2")).equal(`([𝜈]([n]))[💪,[2]]`);

        expect(await th.run("primeomega(n)")).equal(`[𝛺]([n])`);
        expect(await th.run("primeomega(n) ** 2")).equal(`([𝛺]([n]))[💪,[2]]`);

    })

});