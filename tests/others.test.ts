import { defineSympyExprDumpFunc } from "@sympy-worker/python-code";
import { expect } from "chai";
import { testHelper as th } from "./test-helper";

/** Test from: https://github.com/sympy/sympy/blob/master/sympy/printing/tests/test_latex.py */
describe("3: Others", () => {
    before(async () => {
        await th.prepare(`
x_star = Symbol('x^*')
f = Function('f')
`);


        await th.prepare(defineSympyExprDumpFunc);
    });

    beforeEach(async () => {
        await th.prepare(`
x, y, z, t, w, a, b, c, s, p = symbols('x y z t w a b c s p')
k, m, n = symbols('k m n', integer=True)
`)
    })

    it("symbol with multiple characters", async () => {
        expect(await th.run("x_star**2")).equal(`([x][💪,[*]])[💪,[2]]`);
        expect(await th.run("Derivative(f(x_star), x_star,2)")).equal(`[frac,[d][💪,[2]],[d]([x][💪,[*]])[💪,[2]]][f]([x][💪,[*]])`);

        expect(await th.run("2*Integral(x, x)/3")).equal(`[frac,[2][int,][x dx],[3]]`);
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

        expect(await th.run("~x")).equal(`[¬x]`);
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
        expect(await th.run("True")).equal(`[📜,[True]]`);
        expect(await th.run("False")).equal(`[📜,[False]]`);
        expect(await th.run("None")).equal(`[📜,[None]]`);
        expect(await th.run("true")).equal(`[📜,[True]]`);
        expect(await th.run("false")).equal(`[📜,[False]]`);
    });

    it("SingularityFunction", async () => {
        expect(await th.run("SingularityFunction(x, 4, 5)")).equal(`<[-4+x]>[💪,[5]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)")).equal(`<[3+x]>[💪,[4]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)")).equal(`<[x]>[💪,[4]]`);
        expect(await th.run("SingularityFunction(x, a, n)")).equal(`<[x-a]>[💪,[n]]`);
        expect(await th.run("SingularityFunction(x, 4, -2)")).equal(`[frac,[1],<[-4+x]>[💪,[2]]]`);
        expect(await th.run("SingularityFunction(x, 4, -1)")).equal(`[frac,[1],<[-4+x]>]`);
        expect(await th.run("SingularityFunction(x, 4, 5)**3")).equal(`(<[-4+x]>[💪,[5]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)**3")).equal(`(<[3+x]>[💪,[4]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)**3")).equal(`(<[x]>[💪,[4]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, a, n)**3")).equal(`(<[x-a]>[💪,[n]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, 4, -2)**3")).equal(`([frac,[1],<[-4+x]>[💪,[2]]])[💪,[3]]`);
        expect(await th.run("(SingularityFunction(x, 4, -1)**3)**3")).equal(`([frac,[1],<[-4+x]>])[💪,[9]]`);
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

        expect(await th.run("Cross(x*A.i, A.j)")).equal(`[-]([🎩,[j],bf][⛏️,[A,bf]][×]([x][🎩,[i],bf][⛏️,[A,bf]]))`);//

        expect(await th.run("Curl(3*A.x*A.j)")).equal(`[∇×]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Curl(3*A.x*A.j+A.i)")).equal(`[∇×]([🎩,[i],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Curl(3*x*A.x*A.j)")).equal(`[∇×]([3x][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Curl(3*A.x*A.j)")).equal(`[x]([∇×]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]]))`);

        expect(await th.run("Divergence(3*A.x*A.j+A.i)")).equal(`[∇⋅]([🎩,[i],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Divergence(3*A.x*A.j)")).equal(`[∇⋅]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);//
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

    it("functions", async () => {
        await th.prepare(`from sympy import beta`)
        expect(await th.run("exp(x)")).equal(`[e][💪,[x]]`);
        expect(await th.run("exp(1) + exp(2)")).equal(`[e+e][💪,[2]]`);

        await th.prepare(`f = Function('f')`);

        expect(await th.run("f(x)")).equal(`[f]([x])`);
        expect(await th.run("f")).equal(`[f]`);

        await th.prepare(`g = Function('g')`);
        expect(await th.run("g(x, y)")).equal(`[g]([x,y])`);
        expect(await th.run("g")).equal(`[g]`);

        await th.prepare(`  h = Function('h')`);
        expect(await th.run("h(x, y, z)")).equal(`[h]([x,y,z])`);

        await th.prepare(` Li = Function('Li')`);
        expect(await th.run("Li")).equal(`[⚙️,[Li]]`);
        expect(await th.run("Li(x)")).equal(`[⚙️,[Li]]([x])`);

        await th.prepare(` mybeta = Function('beta')`);
        expect(await th.run("mybeta(x, y, z)")).equal(`[𝛽]([x,y,z])`);
        expect(await th.run("beta(x, y)")).equal(`[⚙️,[B]]([x,y])`);
        expect(await th.run("beta(x, y)**2")).equal(`[⚙️,[B]][💪,[2]]([x,y])`);
        expect(await th.run("mybeta(x)")).equal(`[𝛽]([x])`);
        expect(await th.run("mybeta")).equal(`[𝛽]`);

        await th.prepare(`g = Function('gamma')`);
        expect(await th.run("g(x, y, z)")).equal(`[𝛾]([x,y,z])`);
        expect(await th.run("g(x)")).equal(`[𝛾]([x])`);
        expect(await th.run("g")).equal(`[𝛾]`);

        await th.prepare(`a1 = Function('a_1')`);
        expect(await th.run("a1")).equal(`[a][⛏️,[1]]`);
        expect(await th.run("a1(x)")).equal(`[a][⛏️,[1]]([x])`);
        await th.prepare(`omega1 = Function('omega1')`);
        expect(await th.run("omega1")).equal(`[𝜔][⛏️,[1]]`);
        expect(await th.run("omega1(x)")).equal(`[𝜔][⛏️,[1]]([x])`);

        expect(await th.run("sin(x)")).equal(`[sin,]([x])`);
        expect(await th.run("sin(2*x**2)")).equal(`[sin,]([2x][💪,[2]])`);
        expect(await th.run("sin(x**2)")).equal(`[sin,]([x][💪,[2]])`);

        expect(await th.run("asin(x)**2")).equal(`[asin,][💪,[2]]([x])`);
        expect(await th.run("acsc(x)")).equal(`[acsc,]([x])`);
        expect(await th.run("asinh(x)")).equal(`[asinh,]([x])`);

        expect(await th.run("factorial(k)")).equal(`[k!]`);
        expect(await th.run("factorial(-k)")).equal(`([-k])[!]`);
        expect(await th.run("factorial(k)**2")).equal(`[k!][💪,[2]]`);

        expect(await th.run("subfactorial(k)")).equal(`[!k]`);
        expect(await th.run("subfactorial(-k)")).equal(`[!]([-k])`);
        expect(await th.run("subfactorial(k)**2")).equal(`([!k])[💪,[2]]`);

        expect(await th.run("factorial2(k)")).equal(`[k!!]`);
        expect(await th.run("factorial2(-k)")).equal(`([-k])[!!]`);
        expect(await th.run("factorial2(k)**2")).equal(`[k!!][💪,[2]]`);

        expect(await th.run("binomial(2, k)")).equal(`[(🏓)binom,[2],[k]]`);
        expect(await th.run("binomial(2, k)**2")).equal(`[(🏓)binom,[2],[k]][💪,[2]]`);

        expect(await th.run("FallingFactorial(3, k)")).equal(`([3])[⛏️,[k]]`);
        expect(await th.run("RisingFactorial(3, k)")).equal(`[3][💪,([k])]`);

        expect(await th.run("floor(x)")).equal(`⌊[x]⌋`);
        expect(await th.run("ceiling(x)")).equal(`⌈[x]⌉`);
        expect(await th.run("frac(x)")).equal(`[⚙️,[frac]]([x])`);
        expect(await th.run("floor(x)**2")).equal(`⌊[x]⌋[💪,[2]]`);
        expect(await th.run("ceiling(x)**2")).equal(`⌈[x]⌉[💪,[2]]`);
        expect(await th.run("frac(x)**2")).equal(`[⚙️,[frac]][💪,[2]]([x])`);

        expect(await th.run("Min(x, 2, x**3)")).equal(`[min,]([2,x,x][💪,[3]])`);
        expect(await th.run("Min(x, y)**2")).equal(`[min,]([x,y])[💪,[2]]`);
        expect(await th.run("Max(x, 2, x**3)")).equal(`[max,]([2,x,x][💪,[3]])`);
        expect(await th.run("Max(x, y)**2")).equal(`[max,]([x,y])[💪,[2]]`);
        expect(await th.run("Abs(x)")).equal(`|[x]|`);
        expect(await th.run("Abs(x)**2")).equal(`|[x]|[💪,[2]]`);
        expect(await th.run("re(x)")).equal(`[⚙️,[re]]([x])`);
        expect(await th.run("re(x + y)")).equal(`[⚙️,[re]]([x])[+][⚙️,[re]]([y])`);
        expect(await th.run("im(x)")).equal(`[⚙️,[im]]([x])`);
        expect(await th.run("conjugate(x)")).equal(`[overline,[x]]`);
        expect(await th.run("conjugate(x)**2")).equal(`[overline,[x]][💪,[2]]`);
        expect(await th.run("gamma(x)")).equal(`[𝛤]([x])`);
        await th.prepare(`w = Wild('w')`);
        expect(await th.run("gamma(w)")).equal(`[𝛤]([w])`);
        expect(await th.run("Order(x)")).equal(`[O]([x])`);
        expect(await th.run("Order(x)")).equal(`[O]([x])`);
        expect(await th.run("Order(x, (x, 0))")).equal(`[O]([x])`);
        expect(await th.run("Order(x, (x, oo))")).equal(`[O]([x;x][rightarrow,][∞])`);
        expect(await th.run("Order(x - y, (x, y))")).equal(`[O]([x-y;x][rightarrow,][y])`);
        expect(await th.run("Order(x, x, y)")).equal(`[O]([x;]([x,y])[rightarrow,]([0,0]))`);
        expect(await th.run("Order(x, (x, oo), (y, oo))")).equal(`[O]([x;]([x,y])[rightarrow,]([∞,∞]))`);
        expect(await th.run("lowergamma(x, y)")).equal(`[𝛾]([x,y])`);
        expect(await th.run("lowergamma(x, y)**2")).equal(`[𝛾][💪,[2]]([x,y])`);
        expect(await th.run("uppergamma(x, y)")).equal(`[𝛤]([x,y])`);
        expect(await th.run("uppergamma(x, y)**2")).equal(`[𝛤][💪,[2]]([x,y])`);

        expect(await th.run("cot(x)")).equal(`[cot,]([x])`);
        expect(await th.run("coth(x)")).equal(`[coth,]([x])`);
        expect(await th.run("re(x)")).equal(`[⚙️,[re]]([x])`);
        expect(await th.run("im(x)")).equal(`[⚙️,[im]]([x])`);
        expect(await th.run("root(x, y)")).equal(`[x][💪,[frac,[1],[y]]]`);
        expect(await th.run("arg(x)")).equal(`[arg,]([x])`);

        expect(await th.run("zeta(x)")).equal(`[𝜁]([x])`);
        expect(await th.run("zeta(x)**2")).equal(`[𝜁][💪,[2]]([x])`);
        expect(await th.run("zeta(x, y)")).equal(`[𝜁]([x,y])`);
        expect(await th.run("zeta(x, y)**2")).equal(`[𝜁][💪,[2]]([x,y])`);
        expect(await th.run("dirichlet_eta(x)")).equal(`[𝜂]([x])`);
        expect(await th.run("dirichlet_eta(x)**2")).equal(`[𝜂][💪,[2]]([x])`);
        expect(await th.run("polylog(x, y)")).equal(`[⚙️,[Li]][⛏️,[x]]([y])`);
        expect(await th.run("polylog(x, y)**2")).equal(`[⚙️,[Li]][💪,[2],[x]]([y])`);
        expect(await th.run("lerchphi(x, y, n)")).equal(`[𝛷]([x,y,n])`);
        expect(await th.run("lerchphi(x, y, n)**2")).equal(`[𝛷][💪,[2]]([x,y,n])`);
        expect(await th.run("stieltjes(x)")).equal(`[𝛾][⛏️,[x]]`);
        expect(await th.run("stieltjes(x)**2")).equal(`[𝛾][💪,[2],[x]]`);
        expect(await th.run("stieltjes(x, y)")).equal(`[𝛾][⛏️,[x]]([y])`);
        expect(await th.run("stieltjes(x, y)**2")).equal(`[𝛾][⛏️,[x]]([y])[💪,[2]]`);

        expect(await th.run("elliptic_k(z)")).equal(`[K]([z])`);
        expect(await th.run("elliptic_k(z)**2")).equal(`[K][💪,[2]]([z])`);
        expect(await th.run("elliptic_f(x, y)")).equal(`[F]([x][middle|,][y])`);
        expect(await th.run("elliptic_f(x, y)**2")).equal(`[F][💪,[2]]([x][middle|,][y])`);
        expect(await th.run("elliptic_e(x, y)")).equal(`[E]([x][middle|,][y])`);
        expect(await th.run("elliptic_e(x, y)**2")).equal(`[E][💪,[2]]([x][middle|,][y])`);
        expect(await th.run("elliptic_e(z)")).equal(`[E]([z])`);
        expect(await th.run("elliptic_e(z)**2")).equal(`[E][💪,[2]]([z])`);
        expect(await th.run("elliptic_pi(x, y, z)")).equal(`[𝛱]([x;y][middle|,][z])`);
        expect(await th.run("elliptic_pi(x, y, z)**2")).equal(`[𝛱][💪,[2]]([x;y][middle|,][z])`);
        expect(await th.run("elliptic_pi(x, y)")).equal(`[𝛱]([x][middle|,][y])`);
        expect(await th.run("elliptic_pi(x, y)**2")).equal(`[𝛱][💪,[2]]([x][middle|,][y])`);

        expect(await th.run("Ei(x)")).equal(`[⚙️,[Ei]]([x])`);
        expect(await th.run("Ei(x)**2")).equal(`[⚙️,[Ei]][💪,[2]]([x])`);
        expect(await th.run("expint(x, y)")).equal(`[E][⛏️,[x]]([y])`);
        expect(await th.run("expint(x, y)**2")).equal(`[E][💪,[2],[x]]([y])`);
        expect(await th.run("Shi(x)**2")).equal(`[⚙️,[Shi]][💪,[2]]([x])`);
        expect(await th.run("Si(x)**2")).equal(`[⚙️,[Si]][💪,[2]]([x])`);
        expect(await th.run("Ci(x)**2")).equal(`[⚙️,[Ci]][💪,[2]]([x])`);
        expect(await th.run("Chi(x)**2")).equal(`[⚙️,[Chi]][💪,[2]]([x])`);
        expect(await th.run("Chi(x)")).equal(`[⚙️,[Chi]]([x])`);
        expect(await th.run("jacobi(n, a, b, x)")).equal(`[P][💪,([a,b]),[n]]([x])`);
        expect(await th.run("jacobi(n, a, b, x)**2")).equal(`[P][💪,([a,b]),[n]]([x])[💪,[2]]`);
        expect(await th.run("gegenbauer(n, a, x)")).equal(`[C][💪,([a]),[n]]([x])`);
        expect(await th.run("gegenbauer(n, a, x)**2")).equal(`[C][💪,([a]),[n]]([x])[💪,[2]]`);
        expect(await th.run("chebyshevt(n, x)")).equal(`[T][⛏️,[n]]([x])`);
        expect(await th.run("chebyshevt(n, x)**2")).equal(`([T][⛏️,[n]]([x]))[💪,[2]]`);
        expect(await th.run("chebyshevu(n, x)")).equal(`[U][⛏️,[n]]([x])`);
        expect(await th.run("chebyshevu(n, x)**2")).equal(`([U][⛏️,[n]]([x]))[💪,[2]]`);
        expect(await th.run("legendre(n, x)")).equal(`[P][⛏️,[n]]([x])`);
        expect(await th.run("legendre(n, x)**2")).equal(`([P][⛏️,[n]]([x]))[💪,[2]]`);
        expect(await th.run("assoc_legendre(n, a, x)")).equal(`[P][💪,([a]),[n]]([x])`);
        expect(await th.run("assoc_legendre(n, a, x)**2")).equal(`([P][💪,([a]),[n]]([x]))[💪,[2]]`);
        expect(await th.run("laguerre(n, x)")).equal(`[L][⛏️,[n]]([x])`);
        expect(await th.run("laguerre(n, x)**2")).equal(`([L][⛏️,[n]]([x]))[💪,[2]]`);
        expect(await th.run("assoc_laguerre(n, a, x)")).equal(`[L][💪,([a]),[n]]([x])`);
        expect(await th.run("assoc_laguerre(n, a, x)**2")).equal(`([L][💪,([a]),[n]]([x]))[💪,[2]]`);
        expect(await th.run("hermite(n, x)")).equal(`[H][⛏️,[n]]([x])`);
        expect(await th.run("hermite(n, x)**2")).equal(`([H][⛏️,[n]]([x]))[💪,[2]]`);

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

        expect(await th.run("LambertW(n)")).equal(`[W]([n])`);
        expect(await th.run("LambertW(n, -1)")).equal(`[W][⛏️,[-1]]([n])`);
        expect(await th.run("LambertW(n, k)")).equal(`[W][⛏️,[k]]([n])`);
        expect(await th.run("LambertW(n) * LambertW(n)")).equal(`[W][💪,[2]]([n])`);
        expect(await th.run("Pow(LambertW(n), 2)")).equal(`[W][💪,[2]]([n])`);
        expect(await th.run("LambertW(n)**k")).equal(`[W][💪,[k]]([n])`);
        expect(await th.run("LambertW(n, k)**p")).equal(`[W][💪,[p],[k]]([n])`);

        expect(await th.run("Mod(x, 7)")).equal(`[x][bmod,][7]`);
        expect(await th.run("Mod(x + 1, 7)")).equal(`([1+x])[bmod,][7]`);
        expect(await th.run("Mod(2 * x, 7)")).equal(`[2x][bmod,][7]`);
        expect(await th.run("Mod(x, 7) + 1")).equal(`[1+]([x][bmod,][7])`);
        expect(await th.run("2 * Mod(x, 7)")).equal(`[2]([x][bmod,][7])`);
        expect(await th.run("Mod(Mul(2,1/2,evaluate=False), 7,evaluate=False)")).equal(`([2×0.5])[bmod,][7]`);

        await th.prepare(`fjlkd = Function('fjlkd')`);
        expect(await th.run("fjlkd(x)")).equal(`[⚙️,[fjlkd]]([x])`);
        expect(await th.run("fjlkd")).equal(`[⚙️,[fjlkd]]`);


    })

    it("subclass different name", async () => {
        await th.prepare(`    
class mygamma(gamma):
    pass`);

        expect(await th.run("mygamma")).equal(`[⚙️,[mygamma]]`);
        expect(await th.run("mygamma(x)")).equal(`[⚙️,[mygamma]]([x])`);
    })

    it("hyper", async () => {
        await th.prepare(`
from sympy import pi
from sympy.abc import x, z`);



        expect(await th.run(`meijerg(Tuple(pi, pi, x), Tuple(1),(0, 1), Tuple(1, 2, 3/pi), z)`)).equal(`[C][💪,[2,3],[4,5]]([🏓matrix,[𝜋,𝜋,x],[1],[0,1],[1,2,][frac,[3],[𝜋]]][middle|,][z])`);

        expect(await th.run(`meijerg(Tuple(), Tuple(1), (0,), Tuple(), z)`)).equal(`[C][💪,[1,0],[1,1]]([🏓matrix,,[1],[0],][middle|,][z])`);
        expect(await th.run(`hyper((x, 2), (3,), z)`)).equal(`[prescript,[2]][F][⛏️,[1]]([🏓matrix,[x,2],[3]][middle|,][z])`);
        expect(await th.run(`hyper(Tuple(), Tuple(1), z)`)).equal(`[prescript,[0]][F][⛏️,[1]]([🏓matrix,,[1]][middle|,][z])`);

    });

    it("bessel", async () => {
        await th.prepare(`from sympy.functions.special.bessel import (besselj, bessely, besseli,
            besselk, hankel1, hankel2,
            jn, yn, hn1, hn2)
from sympy.abc import z`);

        expect(await th.run(`besselj(n, z**2)**k`)).equal(`[J][💪,[k],[n]]([z][💪,[2]])`);
        expect(await th.run(`bessely(n, z)`)).equal(`[Y][⛏️,[n]]([z])`);
        expect(await th.run(`besseli(n, z)`)).equal(`[I][⛏️,[n]]([z])`);
        expect(await th.run(`besselk(n, z)`)).equal(`[K][⛏️,[n]]([z])`);
        expect(await th.run(`hankel1(n, z**2)**2`)).equal(`([H][💪,[(1)],[n]]([z][💪,[2]]))[💪,[2]]`);
        expect(await th.run(`hankel2(n, z)`)).equal(`[H][💪,[(2)],[n]]([z])`);
        expect(await th.run(`jn(n, z)`)).equal(`[j][⛏️,[n]]([z])`);
        expect(await th.run(`yn(n, z)`)).equal(`[y][⛏️,[n]]([z])`);
        expect(await th.run(`hn1(n, z)`)).equal(`[h][💪,[(1)],[n]]([z])`);
        expect(await th.run(`hn2(n, z)`)).equal(`[h][💪,[(2)],[n]]([z])`);
    });

    it("fresnel", async () => {

        await th.prepare(`    
from sympy.functions.special.error_functions import (fresnels, fresnelc)
from sympy.abc import z`);

        expect(await th.run(`fresnels(z)`)).equal(`[S]([z])`);
        expect(await th.run(`fresnelc(z)`)).equal(`[C]([z])`);
        expect(await th.run(`fresnels(z)**2`)).equal(`[S][💪,[2]]([z])`);
        expect(await th.run(`fresnelc(z)**2`)).equal(`[C][💪,[2]]([z])`);
    });

    it("brackets", async () => {
        expect(await th.run(`(-1)**x`)).equal(`([-1])[💪,[x]]`);

    });

    it("indexed", async () => {

        await th.prepare(`  
Psi_symbol = Symbol('Psi_0', complex=True, real=False)
Psi_indexed = IndexedBase(Symbol('Psi', complex=True, real=False))`);

        expect(await th.run(`Psi_symbol * conjugate(Psi_symbol)`)).equal(`[Psi][⛏️,[0]][overline,[Psi][⛏️,[0]]]`);
        expect(await th.run(`Psi_indexed[0] * conjugate(Psi_indexed[0])`)).equal(`[Psi][⛏️,[0]][overline,[Psi][⛏️,[0]]]`);
        expect(await th.run(`Indexed('x1', Symbol('i'))`)).equal(`[x][⛏️,[1]][⛏️,[i]]`);
        expect(await th.run(`IndexedBase('gamma')`)).equal(`[𝛾]`);
        expect(await th.run(`IndexedBase('a b')`)).equal(`[a b]`);
        expect(await th.run(`IndexedBase('a_b')`)).equal(`[a][⛏️,[b]]`);

    })

    it("derivatives", async () => {

        expect(await th.run(`diff(x**3, x, evaluate=False)`)).equal(`[frac,[d],[dx]][x][💪,[3]]`);
        expect(await th.run(`diff(sin(x) + x**2, x, evaluate=False)`)).equal(`[frac,[d],[dx]]([x][💪,[2]][+][sin,]([x]))`);
        expect(await th.run(`diff(diff(sin(x) + x**2, x, evaluate=False), evaluate=False)`)).equal(`[frac,[d][💪,[2]],[dx][💪,[2]]]([x][💪,[2]][+][sin,]([x]))`);
        expect(await th.run(`diff(diff(diff(sin(x) + x**2, x, evaluate=False), evaluate=False), evaluate=False)`))
            .equal(`[frac,[d][💪,[3]],[dx][💪,[3]]]([x][💪,[2]][+][sin,]([x]))`);

        expect(await th.run(`diff(sin(x * y), x, evaluate=False)`)).equal(`[frac,[∂],[∂x]][sin,]([xy])`);
        expect(await th.run(`diff(sin(x * y) + x**2, x, evaluate=False)`)).equal(`[frac,[∂],[∂x]]([x][💪,[2]][+][sin,]([xy]))`);
        expect(await th.run(`diff(diff(sin(x*y) + x**2, x, evaluate=False), x, evaluate=False)`)).equal(`[frac,[∂][💪,[2]],[∂x][💪,[2]]]([x][💪,[2]][+][sin,]([xy]))`);
        expect(await th.run(`diff(diff(diff(sin(x*y) + x**2, x, evaluate=False), x, evaluate=False), x, evaluate=False)`)).equal(`[frac,[∂][💪,[3]],[∂x][💪,[3]]]([x][💪,[2]][+][sin,]([xy]))`);

        await th.prepare(`f = Function("f")`);
        expect(await th.run(`diff(diff(f(x, y), x, evaluate=False), y, evaluate=False)`)).equal(`[frac,[∂][💪,[2]],[∂y∂x]][f]([x,y])`);
        expect(await th.run(`diff(diff(diff(f(x, y), x, evaluate=False), x, evaluate=False), y, evaluate=False)`)).equal(`[frac,[∂][💪,[3]],[∂y∂x][💪,[2]]][f]([x,y])`);

        expect(await th.run(`diff(-diff(y**2,x,evaluate=False),x,evaluate=False)`)).equal(`[frac,[d],[dx]][-][frac,[d],[dx]][y][💪,[2]]`);//

        expect(await th.run(`diff(diff(-diff(diff(y,x,evaluate=False),x,evaluate=False),x,evaluate=False),x,evaluate=False)`)).equal(`[frac,[d][💪,[2]],[dx][💪,[2]]][-][frac,[d][💪,[2]],[dx][💪,[2]]][y]`);

        expect(await th.run(`diff(Integral(exp(-x*y), (x, 0, oo)), y, evaluate=False)`)).equal(`[frac,[d],[dy]][int,[0],[∞]][e][💪,[-xy]][ dx]`);
        expect(await th.run(`diff(x, x, evaluate=False)**2`)).equal(`([frac,[d],[dx]][x])[💪,[2]]`);
        expect(await th.run(`diff(f(x), x)**2`)).equal(`([frac,[d],[dx]][f]([x]))[💪,[2]]`);
        expect(await th.run(`diff(f(x), (x, n))`)).equal(`[frac,[d][💪,[n]],[dx][💪,[n]]][f]([x])`);


        await th.prepare(`
x1 = Symbol('x1')
x2 = Symbol('x2')
`);

        expect(await th.run(`diff(f(x1, x2), x1)`)).equal(`[frac,[∂],[∂x][⛏️,[1]]][f]([x][⛏️,[1]][,x][⛏️,[2]])`);

        await th.prepare(` n1 = Symbol('n1')`);
        expect(await th.run(`diff(f(x), (x, n1))`)).equal(`[frac,[d][💪,[n][⛏️,[1]]],[dx][💪,[n][⛏️,[1]]]][f]([x])`);

        await th.prepare(` n2 = Symbol('n2')`);
        expect(await th.run(`diff(f(x), (x, Max(n1, n2)))`)).equal(`[frac,[d][💪,[max,]([n][⛏️,[1]][,n][⛏️,[2]])],[dx][💪,[max,]([n][⛏️,[1]][,n][⛏️,[2]])]][f]([x])`);
    });

    it("subs", async () => {
        expect(await th.run(`Subs(x*y, (x, y), (1, 2))`)).equal(`[b,\\left.][xy]|[⛏️,[x=1]💔[y=2]]`);
    });

    it("integrals", async () => {

        expect(await th.run(`Integral(log(x), x)`)).equal(`[int,][log,]([x])[ dx]`);
        expect(await th.run(`Integral(x**2, (x, 0, 1))`)).equal(`[int,[0],[1]][x][💪,[2]][ dx]`);
        expect(await th.run(`Integral(x**2, (x, 10, 20))`)).equal(`[int,[10],[20]][x][💪,[2]][ dx]`);
        expect(await th.run(`Integral(y*x**2, (x, 0, 1), y)`)).equal(`[int,][int,[0],[1]][yx][💪,[2]][ dx dy]`);
        expect(await th.run(`Integral(x, (x, 0))`)).equal(`[int,[0]][x dx]`);
        expect(await th.run(`Integral(x*y, x, y)`)).equal(`[iint,][xy dx dy]`);
        expect(await th.run(`Integral(x*y*z, x, y, z)`)).equal(`[iiint,][xyz dx dy dz]`);
        expect(await th.run(`Integral(x*y*z*t, x, y, z, t)`)).equal(`[int,][int,][int,][int,][txyz dx dy dz dt]`);
        expect(await th.run(`Integral(x, x, x, x, x, x, x)`)).equal(`[int,][int,][int,][int,][int,][int,][x dx dx dx dx dx dx]`);
        expect(await th.run(`Integral(x, x, y, (z, 0, 1))`)).equal(`[int,[0],[1]][int,][int,][x dx dy dz]`);

        expect(await th.run(`Integral(-Integral(y**2,x),x)`)).equal(`[int,][-][int,][y][💪,[2]][ dx dx]`);
        expect(await th.run(`Integral(-Integral(-Integral(y,x),x),x)`)).equal(`[int,][-][int,][-][int,][y dx dx dx]`);

        expect(await th.run(`Integral(z, z)**2`)).equal(`([int,][z dz])[💪,[2]]`);
        expect(await th.run(`Integral(x + z, z)`)).equal(`[int,]([x+z])[ dz]`);
        expect(await th.run(`Integral(x+z/2, z)`)).equal(`[int,]([x+][frac,[z],[2]])[ dz]`);
        expect(await th.run(`Integral(x**y, z)`)).equal(`[int,][x][💪,[y]][ dz]`);

    })

    it("sets", async () => {

        const possibleCorrects = [`{[x][💪,[2]][,xy]}`, `{[xy,x][💪,[2]]}`]
        expect(await th.run(`set([x*y, x**2])`)).oneOf(possibleCorrects);
        expect(await th.run(`frozenset([x*y, x**2])`)).oneOf(possibleCorrects);
        expect(await th.run(`set(range(1, 6))`)).equal(`{[1,2,3,4,5]}`);

        await th.prepare(`s = FiniteSet`);
        expect(await th.run(`s(*[x*y, x**2])`)).oneOf(possibleCorrects);
        expect(await th.run(`s(*range(1, 6))`)).equal(`{[1,2,3,4,5]}`);
    })

    it("SetExpr", async () => {
        await th.prepare(`
iv = Interval(1, 3)
se = SetExpr(iv)`);

        expect(await th.run(`se`)).equal(`[⚙️,[SetExpr]]([[1,3]])`);
        expect(await th.run(`Interval(1, x)`)).equal(`[[1,x]]`);
        expect(await th.run(`Interval(x, x)`)).equal(`{[x]}`);
    });

    it("Range", async () => {
        expect(await th.run(`Range(1, 51)`)).equal(`{[1,2,…,50]}`);
        expect(await th.run(`Range(1, 4)`)).equal(`{[1,2,3]}`);
        expect(await th.run(`Range(0, 3, 1)`)).equal(`{[0,1,2]}`);
        expect(await th.run(`Range(0, 30, 1)`)).equal(`{[0,1,…,29]}`);
        expect(await th.run(`Range(30, 1, -1)`)).equal(`{[30,29,…,2]}`);
        expect(await th.run(`Range(0, oo, 2)`)).equal(`{[0,2,…]}`);
        expect(await th.run(`Range(oo, -2, -2)`)).equal(`{[…,2,0]}`);
        expect(await th.run(`Range(-2, -oo, -1)`)).equal(`{[-2,-3,…]}`);
        expect(await th.run(`Range(-oo, oo)`)).equal(`{[…,-1,0,1,…]}`);
        expect(await th.run(`Range(oo, -oo, -1)`)).equal(`{[…,1,0,-1,…]}`);

        await th.prepare(`  a, b, c = symbols('a:c')`);
        expect(await th.run(`Range(a, b, c)`)).equal(`[⚙️,[Range]]([a,b,c])`);
        expect(await th.run(`Range(a, 10, 1)`)).equal(`[⚙️,[Range]]([a,10,1])`);
        expect(await th.run(`Range(0, b, 1)`)).equal(`[⚙️,[Range]]([0,b,1])`);
        expect(await th.run(`Range(0, 10, c)`)).equal(`[⚙️,[Range]]([0,10,c])`);


    })

    it("sequences", async () => {
        expect(await th.run(`SeqFormula(a**2, (0, oo))`)).equal(`[[0,1,4,9,…]]`);
        expect(await th.run(`SeqPer((1, 2))`)).equal(`[[1,2,1,2,…]]`);
        expect(await th.run(`SeqFormula(a**2, (0, 2))`)).equal(`[[0,1,4]]`);
        expect(await th.run(`SeqPer((1, 2), (0, 2))`)).equal(`[[1,2,1]]`);
        expect(await th.run(`SeqFormula(a**2, (-oo, 0))`)).equal(`[[…,9,4,1,0]]`);
        expect(await th.run(`SeqPer((1, 2), (-oo, 0))`)).equal(`[[…,2,1,2,1]]`);

        th.prepare(`
s1 = SeqFormula(a**2, (0, oo))
s2 = SeqPer((1, 2))
s3 = SeqFormula(a**2, (0, 2))
s4 = SeqPer((1, 2), (0, 2))
s5 = SeqFormula(a**2, (-oo, 0))
s6 = SeqPer((1, 2), (-oo, 0))
b = Symbol('b')
        `);

        expect(await th.run(`SeqAdd(s1, s2)`)).equal(`[[1,3,5,11,…]]`);
        expect(await th.run(`SeqAdd(s3, s4)`)).equal(`[[1,3,5]]`);
        expect(await th.run(`SeqAdd(s5, s6)`)).equal(`[[…,11,5,3,1]]`);
        expect(await th.run(`SeqMul(s1, s2)`)).equal(`[[0,2,4,18,…]]`);
        expect(await th.run(`SeqMul(s3, s4)`)).equal(`[[0,2,4]]`);
        expect(await th.run(`SeqMul(s5, s6)`)).equal(`[[…,18,4,2,0]]`);
        expect(await th.run(`SeqFormula(a**2, (a, 0, x))`)).equal(`{[a][💪,[2]]}[💪,[x],[a=0]]`);
        expect(await th.run(`SeqFormula(b*a**2, (a, 0, 2))`)).equal(`[[0,b,4b]]`);
    });

    it("FourierSeries", async () => {
        expect(await th.run(`fourier_series(x, (x, -pi, pi))`)).equal(`[-][sin,]([2x])[+2][sin,]([x])[+][frac,[2][sin,]([3x]),[3]][+…]`);

    })

    it("FormalPowerSeries", async () => {
        expect(await th.run(`fps(log(1 + x))`)).equal(`[sum,[k=1],[∞]][-][frac,[x][💪,[k]],([-1])[💪,[k]][k]]`);

    })

    it("intervals", async () => {
        await th.prepare(`a = Symbol('a', real=True)`);
        expect(await th.run(`Interval(0, 0)`)).equal(`{[0]}`);
        expect(await th.run(`Interval(0, a)`)).equal(`[[0,a]]`);
        expect(await th.run(`Interval(0, a, False, False)`)).equal(`[[0,a]]`);
        expect(await th.run(`Interval(0, a, True, False)`)).equal(`([0,a]]`);
        expect(await th.run(`Interval(0, a, False, True)`)).equal(`[[0,a])`);
        expect(await th.run(`Interval(0, a, True, True)`)).equal(`([0,a])`);

    });

    it("AccumuBounds", async () => {
        await th.prepare(`a = Symbol('a', real=True)`);
        expect(await th.run(`AccumBounds(0, 1)`)).equal(`<[0,1]>`);
        expect(await th.run(`AccumBounds(0, a)`)).equal(`<[0,a]>`);
        expect(await th.run(`AccumBounds(a + 1, a + 2)`)).equal(`<[1+a,2+a]>`);
    });

    it("emptyset", async () => {
        expect(await th.run(`S.EmptySet`)).equal(`[∅]`);
    })

    it("universalset", async () => {
        expect(await th.run(`S.UniversalSet`)).equal(`[U,mathbb]`);
    })

    it("commutator", async () => {
        await th.prepare(` 
A = Operator('A')
B = Operator('B')
comm = Commutator(B, A)
`)
        expect(await th.run(`comm.doit()`)).equal(`[-]([AB-BA])`);
    })

    it("union", async () => {
        expect(await th.run(`Union(Interval(0, 1), Interval(2, 3))`)).equal(`[[0,1]][∪][[2,3]]`);
        expect(await th.run(`Union(Interval(1, 1), Interval(2, 2), Interval(3, 4))`)).equal(`{[1,2]}[∪][[3,4]]`);

    });

    it("intersection", async () => {
        expect(await th.run(`Intersection(Interval(0, 1), Interval(x, y))`)).equal(`[[0,1]][∩][[x,y]]`);

    });

    it("symmetric_difference", async () => {
        expect(await th.run(`SymmetricDifference(Interval(2, 5), Interval(4, 7),evaluate=False)`)).equal(`[[2,5]][▵][[4,7]]`);
    })

    it("Complement", async () => {
        expect(await th.run(`Complement(S.Reals, S.Naturals)`)).equal(`[R,mathbb][⧵][N,mathbb]`);
    })
    it("productset", async () => {

        await th.prepare(`
line = Interval(0, 1)
bigline = Interval(0, 10)
fset = FiniteSet(1, 2, 3)
        `)
        expect(await th.run(`line**2`)).equal(`[[0,1]][💪,[2]]`);
        expect(await th.run(`line**10`)).equal(`[[0,1]][💪,[10]]`);
        expect(await th.run(`(line * bigline * fset).flatten()`)).equal(`[[0,1]][×][[0,10]][×]{[1,2,3]}`);
    });

    it("set_operators_parenthesis", async () => {

        await th.prepare(`
a, b, c, d = symbols('a:d')
A = FiniteSet(a)
B = FiniteSet(b)
C = FiniteSet(c)
D = FiniteSet(d)

U1 = Union(A, B, evaluate=False)
U2 = Union(C, D, evaluate=False)
I1 = Intersection(A, B, evaluate=False)
I2 = Intersection(C, D, evaluate=False)
C1 = Complement(A, B, evaluate=False)
C2 = Complement(C, D, evaluate=False)
D1 = SymmetricDifference(A, B, evaluate=False)
D2 = SymmetricDifference(C, D, evaluate=False)
# XXX ProductSet does not support evaluate keyword
P1 = ProductSet(A, B)
P2 = ProductSet(C, D)
        `);
        expect(await th.run(`Intersection(A, U2, evaluate=False)`)).equal(`{[a]}[∩]({[c]}[∪]{[d]})`);
        expect(await th.run(`Intersection(U1, U2, evaluate=False)`)).equal(`({[a]}[∪]{[b]})[∩]({[c]}[∪]{[d]})`);
        expect(await th.run(`Intersection(C1, C2, evaluate=False)`)).equal(`({[a]}[⧵]{[b]})[∩]({[c]}[⧵]{[d]})`);
        expect(await th.run(`Intersection(D1, D2, evaluate=False)`)).equal(`({[a]}[▵]{[b]})[∩]({[c]}[▵]{[d]})`);
        expect(await th.run(`Intersection(P1, P2, evaluate=False)`)).equal(`({[a]}[×]{[b]})[∩]({[c]}[×]{[d]})`);
        expect(await th.run(`Union(A, I2, evaluate=False)`)).equal(`{[a]}[∪]({[c]}[∩]{[d]})`);
        expect(await th.run(`Union(I1, I2, evaluate=False)`)).equal(`({[a]}[∩]{[b]})[∪]({[c]}[∩]{[d]})`);
        expect(await th.run(`Union(C1, C2, evaluate=False)`)).equal(`({[a]}[⧵]{[b]})[∪]({[c]}[⧵]{[d]})`);
        expect(await th.run(`Union(D1, D2, evaluate=False)`)).equal(`({[a]}[▵]{[b]})[∪]({[c]}[▵]{[d]})`);
        expect(await th.run(`Union(P1, P2, evaluate=False)`)).equal(`({[a]}[×]{[b]})[∪]({[c]}[×]{[d]})`);
        expect(await th.run(`Complement(A, C2, evaluate=False)`)).equal(`{[a]}[⧵]({[c]}[⧵]{[d]})`);
        expect(await th.run(`Complement(U1, U2, evaluate=False)`)).equal(`({[a]}[∪]{[b]})[⧵]({[c]}[∪]{[d]})`);
        expect(await th.run(`Complement(I1, I2, evaluate=False)`)).equal(`({[a]}[∩]{[b]})[⧵]({[c]}[∩]{[d]})`);
        expect(await th.run(`Complement(D1, D2, evaluate=False)`)).equal(`({[a]}[▵]{[b]})[⧵]({[c]}[▵]{[d]})`);
        expect(await th.run(`Complement(P1, P2, evaluate=False)`)).equal(`({[a]}[×]{[b]})[⧵]({[c]}[×]{[d]})`);
        expect(await th.run(`SymmetricDifference(A, D2, evaluate=False)`)).equal(`{[a]}[▵]({[c]}[▵]{[d]})`);
        expect(await th.run(`SymmetricDifference(U1, U2, evaluate=False)`)).equal(`({[a]}[∪]{[b]})[▵]({[c]}[∪]{[d]})`);
        expect(await th.run(`SymmetricDifference(I1, I2, evaluate=False)`)).equal(`({[a]}[∩]{[b]})[▵]({[c]}[∩]{[d]})`);
        expect(await th.run(`SymmetricDifference(C1, C2, evaluate=False)`)).equal(`({[a]}[⧵]{[b]})[▵]({[c]}[⧵]{[d]})`);
        expect(await th.run(`SymmetricDifference(P1, P2, evaluate=False)`)).equal(`({[a]}[×]{[b]})[▵]({[c]}[×]{[d]})`);

        expect(await th.run(`ProductSet(A, P2).flatten()`)).equal(`{[a]}[×]{[c]}[×]{[d]}`);
        expect(await th.run(`ProductSet(U1, U2)`)).equal(`({[a]}[∪]{[b]})[×]({[c]}[∪]{[d]})`);
        expect(await th.run(`ProductSet(I1, I2)`)).equal(`({[a]}[∩]{[b]})[×]({[c]}[∩]{[d]})`);
        expect(await th.run(`ProductSet(C1, C2)`)).equal(`({[a]}[⧵]{[b]})[×]({[c]}[⧵]{[d]})`);
        expect(await th.run(`ProductSet(D1, D2)`)).equal(`({[a]}[▵]{[b]})[×]({[c]}[▵]{[d]})`);

    });

    it("Complexes", async () => {
        expect(await th.run(`S.Complexes`)).equal(`[C,mathbb]`);
    });

    it("Naturals", async () => {
        expect(await th.run(`S.Naturals`)).equal(`[N,mathbb]`);
    });
    it("Naturals0", async () => {
        expect(await th.run(`S.Naturals0`)).equal(`[N,mathbb][⛏️,[0]]`);
    });
    it("Integers", async () => {
        expect(await th.run(`S.Integers`)).equal(`[Z,mathbb]`);
    });

    it("ImageSet", async () => {
        await th.prepare(` x = Symbol('x')`)
        expect(await th.run(`ImageSet(Lambda(x, x**2), S.Naturals)`)).equal(`{[x][💪,[2]][ ][middle|,][ x∈][N,mathbb]}`);
        expect(await th.run(`ImageSet(Lambda(((x, y),), x + y), ProductSet({1, 2, 3}, {3, 4}))`)).equal(`{[x+y ][middle|,][ ]([x,y])[∈]{[1,2,3]}[×]{[3,4]}}`);
    });

    it("ConditionSet", async () => {
        await th.prepare(` x = Symbol('x')`)
        expect(await th.run(`ConditionSet(x, Eq(x**2, 1), S.Reals)`)).equal(`{[x ][middle|,][ x∈][R,mathbb][∧x][💪,[2]][=1]}`);
        expect(await th.run(`ConditionSet(x, Eq(x**2, 1), S.UniversalSet)`)).equal(`{[x ][middle|,][ x][💪,[2]][=1]}`);

    })
    it("ComplexRegion", async () => {
        expect(await th.run(`ComplexRegion(Interval(3, 5)*Interval(4, 6))`)).equal(`{[iy+x ][middle|,][ x,y∈][[3,5]][×][[4,6]]}`);
        expect(await th.run(`ComplexRegion(Interval(0, 1)*Interval(0, 2*pi), polar=True)`)).equal(`{([i][sin,]([𝜃])[+][cos,]([𝜃]))[r ][middle|,][ r,𝜃∈][[0,1]][×][[0,2𝜋])}`);

    })

    it("Contains", async () => {
        expect(await th.run(`Contains(x, S.Naturals)`)).equal(`[x∈][N,mathbb]`);
    })

    it("sum", async () => {
        expect(await th.run(`Sum(x*y**2, (x, -2, 2), (y, -5, 5))`)).equal(`[sum,[-2≤x≤2]💔[-5≤y≤5]][xy][💪,[2]]`);
        expect(await th.run(`Sum(x**2, (x, -2, 2))`)).equal(`[sum,[x=-2],[2]][x][💪,[2]]`);
        expect(await th.run(`Sum(x**2 + y, (x, -2, 2))`)).equal(`[sum,[x=-2],[2]]([y+x][💪,[2]])`);
        expect(await th.run(`Sum(x**2 + y, (x, -2, 2))**2`)).equal(`([sum,[x=-2],[2]]([y+x][💪,[2]]))[💪,[2]]`);
    });

    it("product", async () => {
        expect(await th.run(`Product(x*y**2, (x, -2, 2), (y, -5, 5))`)).equal(`[prod,[-2≤x≤2]💔[-5≤y≤5]][xy][💪,[2]]`);
        expect(await th.run(`Product(x**2, (x, -2, 2))`)).equal(`[prod,[x=-2],[2]][x][💪,[2]]`);
        expect(await th.run(`Product(x**2 + y, (x, -2, 2))`)).equal(`[prod,[x=-2],[2]]([y+x][💪,[2]])`);
        expect(await th.run(`Product(x, (x, -2, 2))**2`)).equal(`([prod,[x=-2],[2]][x])[💪,[2]]`);

    });

    it("limits", async () => {
        await th.prepare(`f = Function('f')`);
        expect(await th.run(`Limit(x, x, oo)`)).equal(`[lim,[x][rightarrow,][∞]][x]`);
        expect(await th.run(`Limit(f(x), x, 0)`)).equal(`[lim,[x][rightarrow,][0][💪,[+]]][f]([x])`);
        expect(await th.run(`Limit(f(x), x, 0, "-")`)).equal(`[lim,[x][rightarrow,][0][💪,[-]]][f]([x])`);
        expect(await th.run(`Limit(f(x), x, 0)**2`)).equal(`([lim,[x][rightarrow,][0][💪,[+]]][f]([x]))[💪,[2]]`);
        expect(await th.run(`Limit(f(x), x, 0, dir='+-')`)).equal(`[lim,[x][rightarrow,][0]][f]([x])`);
    });

    it("log", async () => {
        await th.prepare(`y = symbols('y')`);
        expect(await th.run(`log(x)`)).equal(`[log,]([x])`);
        expect(await th.run(`ln(x)`)).equal(`[log,]([x])`);
        expect(await th.run(`log(x)+log(y)`)).equal(`[log,]([x])[+][log,]([y])`);
        expect(await th.run(`pow(log(x), x)`)).equal(`[log,]([x])[💪,[x]]`);

    })
    it("sympy issue 3568", async () => {
        await th.prepare(` 
beta = Symbol(r'\\beta')
y1111 = beta + x
        `);

        expect(await th.run(`y1111`)).equal(`[𝛽+x]`);
    })

    it("Rational", async () => {
        expect(await th.run(`(2*tau)**Rational(7, 2)`)).equal(`[8][sqrt,[2]][𝜏][💪,[frac,[7],[2]]]`);
        expect(await th.run(`[2/x, y]`)).equal(`[[frac,[2],[x]][,y]]`);

    })


    it("dict", async () => {
        expect(await th.run(`{Rational(1): 1, x**2: 2, x: 3, x**3: 4}`)).equal(`{[1:1,x][💪,[2]][:2,x:3,x][💪,[3]][:4]}`);
        expect(await th.run(`Dict({Rational(1): 1, x**2: 2, x: 3, x**3: 4})`)).equal(`{[x:3,x][💪,[3]][:4,1:1,x][💪,[2]][:2]}`);

    })

    it("list", async () => {
        expect(await th.run(`[Symbol('omega1'), Symbol('a'), Symbol('alpha')]`)).equal(`[[𝜔][⛏️,[1]][,a,𝛼]]`);
    })

    it("Rational2", async () => {
        expect(await th.run(`-Rational(1, 2)`)).equal(`[-][frac,[1],[2]]`);
        expect(await th.run(`Rational(-1, 2)`)).equal(`[-][frac,[1],[2]]`);
        expect(await th.run(`Rational(1, -2)`)).equal(`[-][frac,[1],[2]]`);
        expect(await th.run(`-Rational(-1, 2)`)).equal(`[frac,[1],[2]]`);
        expect(await th.run(`-Rational(1, 2)*x`)).equal(`[-][frac,[x],[2]]`);
        expect(await th.run(`-Rational(1, 2)*x + Rational(-2, 3)*y`)).equal(`[-][frac,[2y],[3]][-][frac,[x],[2]]`);

    })

    it("inverse", async () => {
        expect(await th.run(`1/x`)).equal(`[frac,[1],[x]]`);
        expect(await th.run(`1/(x + y)`)).equal(`[frac,[1],[x+y]]`);
    });

    it("DiracDelta", async () => {
        expect(await th.run(`DiracDelta(x)`)).equal(`[𝛿]([x])`);
        expect(await th.run(`DiracDelta(x)**2`)).equal(`[𝛿]([x])[💪,[2]]`);
        expect(await th.run(`DiracDelta(x, 0)`)).equal(`[𝛿]([x])`);
        expect(await th.run(`DiracDelta(x, 5)`)).equal(`[𝛿][💪,([5])]([x])`);
        expect(await th.run(`DiracDelta(x, 5)**2`)).equal(`([𝛿][💪,([5])]([x]))[💪,[2]]`);

    })

    it("Heaviside", async () => {
        expect(await th.run(`Heaviside(x)`)).equal(`[𝜃]([x])`);
        expect(await th.run(`Heaviside(x)**2`)).equal(`([𝜃]([x]))[💪,[2]]`);
    })

    it("KroneckerDelta", async () => {

        expect(await th.run(`KroneckerDelta(x, y)`)).equal(`[𝛿][⛏️,[xy]]`);
        expect(await th.run(`KroneckerDelta(x, y + 1)`)).equal(`[𝛿][⛏️,[x,1+y]]`);
        expect(await th.run(`KroneckerDelta(x + 1, y)`)).equal(`[𝛿][⛏️,[y,1+x]]`);
        expect(await th.run(`Pow(KroneckerDelta(x, y), 2, evaluate=False)`)).equal(`([𝛿][⛏️,[xy]])[💪,[2]]`);
    })

    it("LeviCivita", async () => {
        expect(await th.run(`LeviCivita(x, y, z)`)).equal(`[𝜀][⛏️,[xyz]]`);
        expect(await th.run(`LeviCivita(x, y, z)**2`)).equal(`([𝜀][⛏️,[xyz]])[💪,[2]]`);
        expect(await th.run(`LeviCivita(x, y, z + 1)`)).equal(`[𝜀][⛏️,[x,y,1+z]]`);
        expect(await th.run(`LeviCivita(x, y + 1, z)`)).equal(`[𝜀][⛏️,[x,1+y,z]]`);
        expect(await th.run(`LeviCivita(x + 1, y, z)`)).equal(`[𝜀][⛏️,[1+x,y,z]]`);
    })

    it("mathieu", async () => {
        expect(await th.run(`mathieuc(x, y, z)`)).equal(`[C]([x,y,z])`);
        expect(await th.run(`mathieus(x, y, z)`)).equal(`[S]([x,y,z])`);
        expect(await th.run(`mathieuc(x, y, z)**2`)).equal(`[C]([x,y,z])[💪,[2]]`);
        expect(await th.run(`mathieus(x, y, z)**2`)).equal(`[S]([x,y,z])[💪,[2]]`);
        expect(await th.run(`mathieucprime(x, y, z)`)).equal(`[C][💪,[′]]([x,y,z])`);
        expect(await th.run(`mathieusprime(x, y, z)`)).equal(`[S][💪,[′]]([x,y,z])`);
        expect(await th.run(`mathieucprime(x, y, z)**2`)).equal(`[C][💪,[′]]([x,y,z])[💪,[2]]`);
        expect(await th.run(`mathieusprime(x, y, z)**2`)).equal(`[S][💪,[′]]([x,y,z])[💪,[2]]`);
    })
    it("Piecewise", async () => {
        expect(await th.run(`Piecewise((x, x < 1), (x**2, True))`)).equal(`[🏓cases,[x],[📜,[for]][ x<1],[x][💪,[2]],[📜,[otherwise]][ ]]`);
        expect(await th.run(`Piecewise((x, x < 0), (0, x >= 0))`)).equal(`[🏓cases,[x],[📜,[for]][ x<0],[0],[📜,[otherwise]][ ]]`);

        await th.prepare(`
A, B = symbols("A B", commutative=False)
p = Piecewise((A**2, Eq(A, B)), (A*B, True))
        `);
        expect(await th.run(`p`)).equal(`[🏓cases,[A][💪,[2]],[📜,[for]][ A=B],[AB],[📜,[otherwise]][ ]]`);
        expect(await th.run(`A*p`)).equal(`[A][🏓cases,[A][💪,[2]],[📜,[for]][ A=B],[AB],[📜,[otherwise]][ ]]`);
        expect(await th.run(`p*A`)).equal(`([🏓cases,[A][💪,[2]],[📜,[for]][ A=B],[AB],[📜,[otherwise]][ ]])[A]`);
        expect(await th.run(`Piecewise((x, x < 1), (x**2, x < 2))`)).equal(`[🏓cases,[x],[📜,[for]][ x<1],[x][💪,[2]],[📜,[for]][ x<2]]`);
    })

    it("Matrix", async () => {
        expect(await th.run(`Matrix([[1 + x, y], [y, x - 1]])`)).equal(`[[🏓]matrix,[1+x],[y],[y],[-1+x]]`);
        expect(await th.run(`Matrix(1, 11, range(11))`)).equal(`[[🏓]matrix,[0],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10]]`);

    })
    it("matrix_with_functions", async () => {
        await th.prepare(`
        t = symbols('t')
        theta1 = symbols('theta1', cls=Function)`);

        expect(await th.run(`Matrix([[sin(theta1(t)), cos(theta1(t))],[cos(theta1(t).diff(t)), sin(theta1(t).diff(t))]])`))
            .equal(`[[🏓]matrix,[sin,]([𝜃][⛏️,[1]]([t])),[cos,]([𝜃][⛏️,[1]]([t])),[cos,]([frac,[d],[dt]][𝜃][⛏️,[1]]([t])),[sin,]([frac,[d],[dt]][𝜃][⛏️,[1]]([t]))]`);

    })
    it("NDimArray", async () => {
        await th.prepare(`x, y, z, t, w, a, b, c, s, p = symbols('x y z t w a b c s p')`)
        const arrNames = `ImmutableDenseNDimArray, ImmutableSparseNDimArray,MutableDenseNDimArray, MutableSparseNDimArray`.split(",");
        // const arrNames = `MutableSparseNDimArray`.split(",");
        for (let idx = 0; idx < arrNames.length; idx++) {
            const arrName = arrNames[idx];
            await th.prepare(`M = ${arrName}(x)`);
            expect(await th.run(`M`)).equal(`[x]`);
            await th.prepare(`
M = ${arrName}([[1 / x, y], [z, w]])
M1 = ${arrName}([1 / x, y, z])

M2 = tensorproduct(M1, M)
M3 = tensorproduct(M, M)

`);
            expect(await th.run(`M`)).equal(`[[🏓]matrix,[frac,[1],[x]],[y],[z],[w]]`);
            expect(await th.run(`M1`)).equal(`[[🏓]matrix,[frac,[1],[x]],[y],[z]]`);
            expect(await th.run(`M2`)).equal(`[[🏓]matrix,[[🏓]matrix,[frac,[1],[x][💪,[2]]],[frac,[y],[x]],[frac,[z],[x]],[frac,[w],[x]]],[[🏓]matrix,[frac,[y],[x]],[y][💪,[2]],[yz],[wy]],[[🏓]matrix,[frac,[z],[x]],[yz],[z][💪,[2]],[wz]]]`);
            expect(await th.run(`M3`)).equal(`[[🏓]matrix,[[🏓]matrix,[frac,[1],[x][💪,[2]]],[frac,[y],[x]],[frac,[z],[x]],[frac,[w],[x]]],[[🏓]matrix,[frac,[y],[x]],[y][💪,[2]],[yz],[wy]],[[🏓]matrix,[frac,[z],[x]],[yz],[z][💪,[2]],[wz]],[[🏓]matrix,[frac,[w],[x]],[wy],[wz],[w][💪,[2]]]]`);

            await th.prepare(`
Mrow = ${arrName}([[x, y, 1/z]])
Mcolumn = ${arrName}([[x], [y], [1/z]])
Mcol2 = ${arrName}([Mcolumn.tolist()])
            `)

            expect(await th.run(`Mrow`)).equal(`[[🏓]matrix,[[🏓]matrix,[x],[y],[frac,[1],[z]]]]`);
            expect(await th.run(`Mcolumn`)).equal(`[[🏓]matrix,[x],[y],[frac,[1],[z]]]`);
            expect(await th.run(`Mcol2`)).equal(`[[🏓]matrix,[[🏓]matrix,[x],[y],[frac,[1],[z]]]]`);

        }
    })

    it("mul_symbol", async () => {
        expect(await th.run(`4*4**x`)).equal(`[4×4][💪,[x]]`);
        expect(await th.run(`4*x`)).equal(`[4x]`);
    })
    it("issue_4381", async () => {
        await th.prepare(`y4381 = 4*4**log(2)`)
        expect(await th.run(`y4381`)).equal(`[4×4][💪,[log,]([2])]`);
        expect(await th.run(`1/y4381`)).equal(`[frac,[1],[4×4][💪,[log,]([2])]]`);
    })
    it("issue_4576", async () => {
        expect(await th.run(`Symbol("beta_13_2")`)).equal("[𝛽][⛏️,[13_2]]");
        expect(await th.run(`Symbol("beta_132_20")`)).equal("[𝛽][⛏️,[132_20]]");
        expect(await th.run(`Symbol("beta_13")`)).equal("[𝛽][⛏️,[13]]");
        expect(await th.run(`Symbol("x_a_b")`)).equal("[x][⛏️,[a_b]]");
        expect(await th.run(`Symbol("x_1_2_3")`)).equal("[x][⛏️,[1_2_3]]");
        expect(await th.run(`Symbol("x_a_b1")`)).equal("[x][⛏️,[a_b1]]");
        expect(await th.run(`Symbol("x_a_1")`)).equal("[x][⛏️,[a_1]]");
        expect(await th.run(`Symbol("x_1_a")`)).equal("[x][⛏️,[1_a]]");
        expect(await th.run(`Symbol("x_1^aa")`)).equal("[x][💪,[aa],[1]]");
        expect(await th.run(`Symbol("x_1__aa")`)).equal("[x][⛏️,[1__aa]]");
        expect(await th.run(`Symbol("x_11^a")`)).equal("[x][💪,[a],[11]]");
        expect(await th.run(`Symbol("x_11__a")`)).equal("[x][⛏️,[11__a]]");
        expect(await th.run(`Symbol("x_a_a_a_a")`)).equal("[x][⛏️,[a_a_a_a]]");
        expect(await th.run(`Symbol("x_a_a^a^a")`)).equal("[x][⛏️,[a_a^a^a]]");
        expect(await th.run(`Symbol("x_a_a__a__a")`)).equal("[x][⛏️,[a_a__a__a]]");
        expect(await th.run(`Symbol("alpha_11")`)).equal("[𝛼][⛏️,[11]]");
        expect(await th.run(`Symbol("alpha_11_11")`)).equal("[𝛼][⛏️,[11_11]]");
        expect(await th.run(`Symbol("alpha_alpha")`)).equal("[𝛼][⛏️,[𝛼]]");
        expect(await th.run(`Symbol("alpha^aleph")`)).equal("[𝛼][💪,[aleph]]");
        expect(await th.run(`Symbol("alpha__aleph")`)).equal("[𝛼][⛏️,[_aleph]]");

        /**unicode */
        expect(await th.run(`Symbol("𝜔")`)).equal("[𝜔]");
        expect(await th.run(`Symbol("𝜔2")`)).equal("[𝜔][⛏️,[2]]");
        expect(await th.run(`Symbol("𝜔_𝛽")`)).equal("[𝜔][⛏️,[𝛽]]");
    });

    it("pow_fraction", async () => {
        expect(await th.run(`exp(-x)/2`)).equal("[frac,[1],[2e][💪,[x]]]");
        expect(await th.run(`3**-x/2`)).equal("[frac,[1],[2×3][💪,[x]]]");

    });

    it.skip("noncommutative", async () => {
        await th.prepare(`A, B, C = symbols('A,B,C', commutative=False)`);
        expect(await th.run(`A*B*C**-1`)).equal("[frac,[1],[2×3][💪,[x]]]");
        expect(await th.run(`A*B*C**-1`)).equal("[frac,[1],[2×3][💪,[x]]]");
        expect(await th.run(`C**-1*A*B`)).equal("[frac,[1],[2×3][💪,[x]]]");
        expect(await th.run(`A*C**-1*B`)).equal("[frac,[1],[2×3][💪,[x]]]");

    })
    it.skip("order", async () => {
        expect(await th.run(`x**3 + x**2*y + y**4 + 3*x*y**3`)).equal("[frac,[1],[2×3][💪,[x]]]");
    });

    it("Lambda", async () => {
        expect(await th.run(`Lambda(x, x + 1)`)).equal("[x↦1+x]");
        expect(await th.run(`Lambda((x, y), x + 1)`)).equal("([x,y])[↦1+x]");
        expect(await th.run(`Lambda(x, x)`)).equal("[x↦x]");
        expect(await th.run(`Lambda(x, Lambda(y, z))`)).equal("[x↦]([y↦z])");
    })

    it("PolyElement", async () => {
        await th.prepare(`
Ruv, u, v = ring("u,v", ZZ)
Rxyz, x, y, z = ring("x,y,z", Ruv)
        `);

        expect(await th.run(`x - x`)).equal("[0]");
        expect(await th.run(`x - 1`)).equal("[x-1]");
        expect(await th.run(`x + 1`)).equal("[x+1]");
        expect(await th.run(`(u**2 + 3*u*v + 1)*x**2*y + u + 1`)).equal("([u][💪,[2]][+3uv+1])[x][💪,[2]][y+u+1]");
        expect(await th.run(`(u**2 + 3*u*v + 1)*x**2*y + (u + 1)*x`)).equal("([u][💪,[2]][+3uv+1])[x][💪,[2]][y+]([u+1])[x]");
        expect(await th.run(`(u**2 + 3*u*v + 1)*x**2*y + (u + 1)*x + 1`)).equal("([u][💪,[2]][+3uv+1])[x][💪,[2]][y+]([u+1])[x+1]");
        expect(await th.run(`(-u**2 + 3*u*v - 1)*x**2*y - (u + 1)*x - 1`)).equal("([-u][💪,[2]][+3uv-1])[x][💪,[2]][y+]([-u-1])[x-1]");
        expect(await th.run(`-(v**2 + v + 1)*x + 3*u*v + 1`)).equal("([-v][💪,[2]][-v-1])[x+3uv+1]");
        expect(await th.run(`-(v**2 + v + 1)*x - 3*u*v + 1`)).equal("([-v][💪,[2]][-v-1])[x-3uv+1]");

    })

    it("FracElement", async () => {
        await th.prepare(`
Fuv, u, v = field("u,v", ZZ)
Fxyzt, x, y, z, t = field("x,y,z,t", Fuv)
                `);

        expect(await th.run(`x - x`)).equal("[0]");
        expect(await th.run(`x - 1`)).equal("[x-1]");
        expect(await th.run(`x + 1`)).equal("[x+1]");
        expect(await th.run(`x/3`)).equal("[frac,[x],[3]]");
        expect(await th.run(`x/z`)).equal("[frac,[x],[z]]");
        expect(await th.run(`x*y/z`)).equal("[frac,[xy],[z]]");
        expect(await th.run(`x/(z*t)`)).equal("[frac,[x],[zt]]");
        expect(await th.run(`x*y/(z*t)`)).equal("[frac,[xy],[zt]]");
        expect(await th.run(`(x - 1)/y`)).equal("[frac,[x-1],[y]]");
        expect(await th.run(`(x + 1)/y`)).equal("[frac,[x+1],[y]]");
        expect(await th.run(`(-x - 1)/y`)).equal("[frac,[-x-1],[y]]");
        expect(await th.run(`(x + 1)/(y*z)`)).equal("[frac,[x+1],[yz]]");
        expect(await th.run(`-y/(x + 1)`)).equal("[-][frac,[y],[x+1]]");
        expect(await th.run(`y*z/(x + 1)`)).equal("[frac,[yz],[x+1]]");
        expect(await th.run(`((u + 1)*x*y + 1)/((v - 1)*z - 1)`)).equal("[frac,([u+1])[xy+1],([v-1])[z-1]]");
        expect(await th.run(`((u + 1)*x*y + 1)/((v - 1)*z - t*u*v - 1)`)).equal("[frac,([u+1])[xy+1],([v-1])[z-uvt-1]]");
    });

    it("Poly", async () => {
        expect(await th.run(`Poly(x**2 + 2 * x, x)`)).equal("[⚙️,[Poly]]([x][💪,[2]][+2x,x,][📜,[domain=]][Z,mathbb])");
        expect(await th.run(`Poly(x/y, x)`)).equal("[⚙️,[Poly]]([frac,[x],[y]][,x,][📜,[domain=]][Z,mathbb]([y]))");
        expect(await th.run(`Poly(2.0*x + y)`)).equal("[⚙️,[Poly]]([1.0y+2.0x,x,y,][📜,[domain=]][R,mathbb])");

    })

    it("Poly_order", async () => {
        expect(await th.run(`Poly([a, 1, b, 2, c, 3], x)`)).equal("[⚙️,[Poly]]([3+x][💪,[4]][+2x][💪,[2]][+ax][💪,[5]][+bx][💪,[3]][+cx,x,][📜,[domain=]][Z,mathbb][[a,b,c]])");
        expect(await th.run(`Poly([a, 1, b+c, 2, 3], x)`)).equal("[⚙️,[Poly]]([3+x][💪,[3]][+2x+ax][💪,[4]][+x][💪,[2]]([b+c])[,x,][📜,[domain=]][Z,mathbb][[a,b,c]])");
        expect(await th.run(`Poly(a*x**3 + x**2*y - x*y - c*y**3 - b*x*y**2 + y - a*x + b,(x, y))`))
            .equal("[⚙️,[Poly]]([b+y+ax][💪,[3]][+yx][💪,[2]][-ax-cy][💪,[3]][-xy-bxy][💪,[2]][,x,y,][📜,[domain=]][Z,mathbb][[a,b,c]])");
    })

    it("ComplexRootOf", async () => {
        expect(await th.run(`rootof(x**5 + x + 3, 0)`)).equal("[⚙️,[CRootOf]]([3+x+x][💪,[5]][,0])");
    })

    it("RootSum", async () => {
        expect(await th.run(`RootSum(x**5 + x + 3, sin)`)).equal("[⚙️,[RootSum]]([3+x+x][💪,[5]][,x↦][sin,]([x]))");
    });


    it("numbers", async () => {
        expect(await th.run(`catalan(n)`)).equal("[C][⛏️,[n]]");
        expect(await th.run(`catalan(n)**2`)).equal("[C][💪,[2],[n]]");
        expect(await th.run(`bernoulli(n)`)).equal("[B][⛏️,[n]]");
        expect(await th.run(`bernoulli(n, x)`)).equal("[B][⛏️,[n]]([x])");
        expect(await th.run(`bernoulli(n)**2`)).equal("[B][💪,[2],[n]]");
        expect(await th.run(`bernoulli(n, x)**2`)).equal("[B][💪,[2],[n]]([x])");
        expect(await th.run(`bell(n)`)).equal("[B][⛏️,[n]]");
        expect(await th.run(`bell(n, x)`)).equal("[B][⛏️,[n]]([x])");
        expect(await th.run(`bell(n, m, (x, y))`)).equal("[B][⛏️,[n,m]]([x,y])");
        expect(await th.run(`bell(n)**2`)).equal("[B][💪,[2],[n]]");
        expect(await th.run(`bell(n, x)**2`)).equal("[B][💪,[2],[n]]([x])");
        expect(await th.run(`bell(n, m, (x, y))**2`)).equal("[B][💪,[2],[n,m]]([x,y])");
        expect(await th.run(`fibonacci(n)`)).equal("[F][⛏️,[n]]");
        expect(await th.run(`fibonacci(n, x)`)).equal("[F][⛏️,[n]]([x])");
        expect(await th.run(`fibonacci(n)**2`)).equal("[F][💪,[2],[n]]");
        expect(await th.run(`fibonacci(n, x)**2`)).equal("[F][💪,[2],[n]]([x])");
        expect(await th.run(`lucas(n)`)).equal("[F][⛏️,[n]]");
        expect(await th.run(`lucas(n)**2`)).equal("[F][💪,[2],[n]]");
        expect(await th.run(`tribonacci(n)`)).equal("[T][⛏️,[n]]");
        expect(await th.run(`tribonacci(n, x)`)).equal("[T][⛏️,[n]]([x])");
        expect(await th.run(`tribonacci(n)**2`)).equal("[T][💪,[2],[n]]");
        expect(await th.run(`tribonacci(n, x)**2`)).equal("[T][💪,[2],[n]]([x])");
    });

    it("euler", async () => {
        expect(await th.run(`euler(n)`)).equal("[E][⛏️,[n]]");
        expect(await th.run(`euler(n, x)`)).equal("[E][⛏️,[n]]([x])");
        expect(await th.run(`euler(n, x)**2`)).equal("[E][💪,[2],[n]]([x])");
    });

    it("lamda", async () => {
        expect(await th.run(`Symbol('lamda')`)).equal("[𝜆]");
        expect(await th.run(`Symbol('Lamda')`)).equal("[𝛬]");
    });

    it("symbol_names", async () => {
        expect(await th.run(`x`)).equal("[x]");
        //     assert latex(x, symbol_names={x: "x_i"}) == r"x_i"
        // assert latex(x + y, symbol_names={x: "x_i"}) == r"x_i + y"
        // assert latex(x**2, symbol_names={x: "x_i"}) == r"x_i^{2}"
        // assert latex(x + y, symbol_names={x: "x_i", y: "y_j"}) == r"x_i + y_j"
    });

    it("matAdd", async () => {
        await th.prepare(`
from sympy import MatrixSymbol
from sympy.printing.latex import LatexPrinter
C = MatrixSymbol('C', 5, 5)
B = MatrixSymbol('B', 5, 5)

        `)
        expect(await th.run(`C - 2*B`)).equal("[-2B+C]");
        expect(await th.run(`C + 2*B`)).equal("[2B+C]");
        expect(await th.run(`B - 2*C`)).equal("[-2C+B]");
        expect(await th.run(`B + 2*C`)).equal("[2C+B]");
    });

    it("matMul", async () => {
        await th.prepare(`
from sympy import MatrixSymbol
from sympy.printing.latex import LatexPrinter
A = MatrixSymbol('A', 5, 5)
B = MatrixSymbol('B', 5, 5)
x = Symbol('x')

        `)
        expect(await th.run(`2*A`)).equal("[2A]");
        expect(await th.run(`2*x*A`)).equal("[2xA]");
        expect(await th.run(`-2*A`)).equal("[-2A]");
        expect(await th.run(`1.5*A`)).equal("[1.5A]");
        expect(await th.run(`sqrt(2)*A`)).equal("[sqrt,[2]][A]");
        expect(await th.run(`-sqrt(2)*A`)).equal("[-][sqrt,[2]][A]");
        expect(await th.run(`2*sqrt(2)*x*A`)).equal("[2x][sqrt,[2]][A]");
        expect(await th.run(`-2*A*(A + 2*B)`)).equal("[-2A]([2B+A])");
    });
    it("MatrixSlice", async () => {
        await th.prepare(`
n = Symbol('n', integer=True)
x, y, z, w, t, = symbols('x y z w t')
X = MatrixSymbol('X', n, n)
Y = MatrixSymbol('Y', 10, 10)
Z = MatrixSymbol('Z', 10, 10)

        `)
        expect(await th.run(`MatrixSlice(X, (None, None, None), (None, None, None))`)).equal("[X][[:,:]]");
        expect(await th.run(`X[x:x + 1, y:y + 1]`)).equal("[X][[x:1+x,y:1+y]]");
        expect(await th.run(`X[x:x + 1:2, y:y + 1:2]`)).equal("[X][[x:1+x:2,y:1+y:2]]");
        expect(await th.run(`X[:x, y:]`)).equal("[X][[:x,y:]]");
        expect(await th.run(`X[:x, y:]`)).equal("[X][[:x,y:]]");
        expect(await th.run(`X[x:, :y]`)).equal("[X][[x:,:y]]");
        expect(await th.run(`X[x:y, z:w]`)).equal("[X][[x:y,z:w]]");
        expect(await th.run(`X[x:y:t, w:t:x]`)).equal("[X][[x:y:t,w:t:x]]");
        expect(await th.run(`X[x::y, t::w]`)).equal("[X][[x::y,t::w]]");
        expect(await th.run(`X[:x:y, :t:w]`)).equal("[X][[:x:y,:t:w]]");
        expect(await th.run(`X[::x, ::y]`)).equal("[X][[::x,::y]]");
        expect(await th.run(`MatrixSlice(X, (0, None, None), (0, None, None))`)).equal("[X][[:,:]]");
        expect(await th.run(`MatrixSlice(X, (None, n, None), (None, n, None))`)).equal("[X][[:,:]]");
        expect(await th.run(`MatrixSlice(X, (0, n, None), (0, n, None))`)).equal("[X][[:,:]]");
        expect(await th.run(`MatrixSlice(X, (0, n, 2), (0, n, 2))`)).equal("[X][[::2,::2]]");
        expect(await th.run(`X[1:2:3, 4:5:6]`)).equal("[X][[1:2:3,4:5:6]]");
        expect(await th.run(`X[1:3:5, 4:6:8]`)).equal("[X][[1:3:5,4:6:8]]");
        expect(await th.run(`X[1:10:2]`)).equal("[X][[1:10:2,:]]");
        expect(await th.run(`Y[:5, 1:9:2]`)).equal("[Y][[:5,1:9:2]]");
        expect(await th.run(`Y[:5, 1:10:2]`)).equal("[Y][[:5,1::2]]");
        expect(await th.run(`Y[5, :5:2]`)).equal("[Y][[5:6,:5:2]]");
        expect(await th.run(`X[0:1, 0:1]`)).equal("[X][[:1,:1]]");
        expect(await th.run(`X[0:1:2, 0:1:2]`)).equal("[X][[:1:2,:1:2]]");
        expect(await th.run(`(Y + Z)[2:, 2:]`)).equal("([Y+Z])[[2:,2:]]");
    });

    it("RandomDomain", async () => {
        await th.prepare(`
from sympy.stats import Normal, Die, Exponential, pspace, where
from sympy.stats.rv import RandomDomain

X = Normal('x1', 0, 1)
D = Die('d1', 6)
A = Exponential('a', 1)
B = Exponential('b', 1)
        `);

        expect(await th.run(`where(X > 0)`)).equal("[📜,[Domain: ]]([0<x][⛏️,[1]])[∧]([x][⛏️,[1]][<∞])");
        expect(await th.run(`where(D > 4)`)).equal("[📜,[Domain: ]]([d][⛏️,[1]][=5])[∨]([d][⛏️,[1]][=6])");
        expect(await th.run(` pspace(Tuple(A, B)).domain`)).equal("[📜,[Domain: ]]([0≤a])[∧]([0≤b])[∧]([a<∞])[∧]([b<∞])");
        expect(await th.run(`RandomDomain(FiniteSet(x), FiniteSet(1, 2))`)).equal("[📜,[Domain: ]]{[x]}[📜,[ in ]]{[1,2]}");

    });

    it("PrettyPoly", async () => {
        await th.prepare(`
from sympy.polys.domains import QQ
F = QQ.frac_field(x, y)
R = QQ[x, y]
                `);

        expect(await th.run(`F.convert(x/(x + y))`)).equal("[frac,[x],[x+y]]");
        expect(await th.run(`R.convert(x + y)`)).equal("[x+y]");
    });

    it("integral_transforms", async () => {
        await th.prepare(`
x = Symbol("x")
k = Symbol("k")
f = Function("f")
a = Symbol("a")
b = Symbol("b")    
                `);

        expect(await th.run(`MellinTransform(f(x), x, k)`)).equal("[M,mathcal][⛏️,[x]][[f]([x])]([k])");
        expect(await th.run(`InverseMellinTransform(f(k), k, x, a, b)`)).equal("[M,mathcal][💪,[-1],[k]][[f]([k])]([x])");
        expect(await th.run(`LaplaceTransform(f(x), x, k)`)).equal("[L,mathcal][⛏️,[x]][[f]([x])]([k])");
        expect(await th.run(`InverseLaplaceTransform(f(k), k, x, (a, b))`)).equal("[L,mathcal][💪,[-1],[k]][[f]([k])]([x])");
        expect(await th.run(`FourierTransform(f(x), x, k)`)).equal("[F,mathcal][⛏️,[x]][[f]([x])]([k])");
        expect(await th.run(`InverseFourierTransform(f(k), k, x)`)).equal("[F,mathcal][💪,[-1],[k]][[f]([k])]([x])");
        expect(await th.run(`CosineTransform(f(x), x, k)`)).equal("[COS,mathcal][⛏️,[x]][[f]([x])]([k])");
        expect(await th.run(`InverseCosineTransform(f(k), k, x)`)).equal("[COS,mathcal][💪,[-1],[k]][[f]([k])]([x])");
        expect(await th.run(`SineTransform(f(x), x, k)`)).equal("[SIN,mathcal][⛏️,[x]][[f]([x])]([k])");
        expect(await th.run(`InverseSineTransform(f(k), k, x)`)).equal("[SIN,mathcal][💪,[-1],[k]][[f]([k])]([x])");
    });

    it("PolynomialRingBase", async () => {

        await th.prepare(`
from sympy.polys.domains import QQ
                `);

        expect(await th.run(`QQ.old_poly_ring(x, y)`)).equal("[Q,mathbb][[x,y]]");
        expect(await th.run(`QQ.old_poly_ring(x, y, order="ilex")`)).equal("[S][💪,[-1],[<]][Q,mathbb][[x,y]]");

    })
    it("categories", async () => {
        await th.prepare(`
from sympy.categories import (Object, IdentityMorphism,NamedMorphism, Category, Diagram,DiagramGrid)

A1 = Object("A1")
A2 = Object("A2")
A3 = Object("A3")

f1 = NamedMorphism(A1, A2, "f1")
f2 = NamedMorphism(A2, A3, "f2")
id_A1 = IdentityMorphism(A1)

K1 = Category("K1")
        
                        `);

        expect(await th.run(`A1`)).equal("[A][⛏️,[1]]");
        expect(await th.run(`f1`)).equal("[f][⛏️,[1]][:A][⛏️,[1]][rightarrow,][A][⛏️,[2]]");
        expect(await th.run(`id_A1`)).equal("[id:A][⛏️,[1]][rightarrow,][A][⛏️,[1]]");
        expect(await th.run(`f2*f1`)).equal("[f][⛏️,[2]][∘f][⛏️,[1]][:A][⛏️,[1]][rightarrow,][A][⛏️,[3]]");
        expect(await th.run(`K1`)).equal("[K,bf][⛏️,[1,bf]]");
        expect(await th.run(`Diagram()`)).equal("[∅]");
        expect(await th.run(`Diagram({f1: "unique", f2: S.EmptySet})`)).equal("{[id:A][⛏️,[2]][rightarrow,][A][⛏️,[2]][:∅,f][⛏️,[2]][:A][⛏️,[2]][rightarrow,][A][⛏️,[3]][:∅,id:A][⛏️,[1]][rightarrow,][A][⛏️,[1]][:∅,f][⛏️,[2]][∘f][⛏️,[1]][:A][⛏️,[1]][rightarrow,][A][⛏️,[3]][:∅,f][⛏️,[1]][:A][⛏️,[1]][rightarrow,][A][⛏️,[2]][:]{[unique]}[,id:A][⛏️,[3]][rightarrow,][A][⛏️,[3]][:∅]}");
        expect(await th.run(`Diagram({f1: "unique", f2: S.EmptySet}, {f2 * f1: "unique"})`)).equal("{[id:A][⛏️,[2]][rightarrow,][A][⛏️,[2]][:∅,f][⛏️,[2]][:A][⛏️,[2]][rightarrow,][A][⛏️,[3]][:∅,id:A][⛏️,[1]][rightarrow,][A][⛏️,[1]][:∅,f][⛏️,[2]][∘f][⛏️,[1]][:A][⛏️,[1]][rightarrow,][A][⛏️,[3]][:∅,f][⛏️,[1]][:A][⛏️,[1]][rightarrow,][A][⛏️,[2]][:]{[unique]}[,id:A][⛏️,[3]][rightarrow,][A][⛏️,[3]][:∅]}[⟹]{[f][⛏️,[2]][∘f][⛏️,[1]][:A][⛏️,[1]][rightarrow,][A][⛏️,[3]][:]{[unique]}}");

        await th.prepare(`
# A linear diagram.
A = Object("A")
B = Object("B")
C = Object("C")
f = NamedMorphism(A, B, "f")
g = NamedMorphism(B, C, "g")
d = Diagram([f, g])
grid = DiagramGrid(d)

        `);

        expect(await th.run(`grid`)).equal("[🏓array,[A],[B],[],[C]]");
    })

    it("Modules", async () => {
        await th.prepare(`
from sympy.polys.domains import QQ
from sympy.polys.agca import homomorphism

R = QQ.old_poly_ring(x, y)
F = R.free_module(2)
M = F.submodule([x, y], [1, x**2])
I = R.ideal(x**2, y)
Q = F / M
h = homomorphism(QQ.old_poly_ring(x).free_module(2),QQ.old_poly_ring(x).free_module(2), [0, 0])
        `);

        expect(await th.run(`F`)).equal("[Q,mathbb][[x,y]][💪,[2]]");
        expect(await th.run(`M`)).equal("<[[x,y]][,][[1,x][💪,[2]]]>");
        expect(await th.run(`I`)).equal("<[x][💪,[2]][,y]>");
        expect(await th.run(`Q`)).equal("[frac,[Q,mathbb][[x,y]][💪,[2]],<[[x,y]][,][[1,x][💪,[2]]]>]");
        expect(await th.run(`Q.submodule([1, x**3/2], [2, y])`)).equal("<[[1,][frac,[x][💪,[3]],[2]]][+]<[[x,y]][,][[1,x][💪,[2]]]>[,][[2,y]][+]<[[x,y]][,][[1,x][💪,[2]]]>>");
        expect(await th.run(`h`)).equal("[[🏓]matrix,[0],[0],[0],[0]][:][Q,mathbb][[x]][💪,[2]][rightarrow,][Q,mathbb][[x]][💪,[2]]");
    });

    it("QuotientRing", async () => {
        await th.prepare(`
from sympy.polys.domains import QQ
R = QQ.old_poly_ring(x)/[x**2 + 1]    
        `);

        expect(await th.run(`R`)).equal("[frac,[Q,mathbb][[x]],<[1+x][💪,[2]]>]");
        expect(await th.run(`R.one`)).equal("[1+]<[1+x][💪,[2]]>");

    })
    it("Tr", async () => {
        await th.prepare(`
A, B = symbols('A B', commutative=False)
t = Tr(A*B)
        `);

        expect(await th.run(`t`)).equal("[⚙️,[tr]]([AB])");
    })

    /**TODO: Matrix should not flip power-1 */
    it("Adjoint", async () => {
        await th.prepare(`
from sympy.matrices import MatrixSymbol, Adjoint, Inverse, Transpose
X = MatrixSymbol('X', 2, 2)
Y = MatrixSymbol('Y', 2, 2)
        `);

        expect(await th.run(`Adjoint(X)`)).equal('[X][💪,[†]]');
        expect(await th.run(`Adjoint(X + Y)`)).equal('([X+Y])[💪,[†]]');
        expect(await th.run(`Adjoint(X) + Adjoint(Y)`)).equal('[X][💪,[†]][+Y][💪,[†]]');
        expect(await th.run(`Adjoint(X*Y)`)).equal('([XY])[💪,[†]]');
        expect(await th.run(`Adjoint(Y)*Adjoint(X)`)).equal('[Y][💪,[†]][X][💪,[†]]');
        expect(await th.run(`Adjoint(X**2)`)).equal('([X][💪,[2]])[💪,[†]]');
        expect(await th.run(`Adjoint(X)**2`)).equal('([X][💪,[†]])[💪,[2]]');
        expect(await th.run(`Adjoint(Inverse(X))`)).equal('([frac,[1],[X]])[💪,[†]]');
        expect(await th.run(`Inverse(Adjoint(X))`)).equal('[frac,[1],[X][💪,[†]]]');
        expect(await th.run(`Adjoint(Transpose(X))`)).equal('([X][💪,[T]])[💪,[†]]');
        expect(await th.run(`Transpose(Adjoint(X))`)).equal('([X][💪,[†]])[💪,[T]]');
        expect(await th.run(`Transpose(Adjoint(X) + Y)`)).equal('([X][💪,[†]][+Y])[💪,[T]]');
    });

    it("array_expressions", async () => {
        expect(await th.run(`ArraySymbol("A", 2, 3, 4)`)).equal('[A]');
        expect(await th.run(`ArrayElement("A", (2, 1/(1-x), 0))`)).equal('[A][⛏️,[2,][frac,[1],[1-x]][,0]]');
    });

    it.only("Identity", async () => {
        await th.prepare(`syms = symbols('a:f')`);

        expect(await th.run(`And(*syms)`)).equal('[a∧b∧c∧d∧e∧f]');
        expect(await th.run(`Or(*syms)`)).equal('[a∨b∨c∨d∨e∨f]');
        expect(await th.run(`Equivalent(*syms)`)).equal('[a⇔b⇔c⇔d⇔e⇔f]');
        expect(await th.run(`Xor(*syms)`)).equal('[a⊻b⊻c⊻d⊻e⊻f]');
    })
    it("boolean_args_order", async () => {
        await th.prepare(`syms = symbols('a:f')`);

        expect(await th.run(`And(*syms)`)).equal('[a∧b∧c∧d∧e∧f]');
        expect(await th.run(`Or(*syms)`)).equal('[a∨b∨c∨d∨e∨f]');
        expect(await th.run(`Equivalent(*syms)`)).equal('[a⇔b⇔c⇔d⇔e⇔f]');
        expect(await th.run(`Xor(*syms)`)).equal('[a⊻b⊻c⊻d⊻e⊻f]');
    })
    it("imaginary", async () => {
        expect(await th.run(`sqrt(-1)`)).equal('[i]');
    })
    it("builtins_without_args", async () => {
        expect(await th.run(`sin`)).equal('[sin,]');
        expect(await th.run(`cos`)).equal('[cos,]');
        expect(await th.run(`Ei`)).equal('[⚙️,[Ei]]');
        expect(await th.run(`zeta`)).equal('[𝜁]');

    });

    it("greek_functions", async () => {
        expect(await th.run(`Function('Alpha')`)).equal('[A]');
        expect(await th.run(`Function('Eta')`)).equal('[H]');
        expect(await th.run(`Function('Pi')`)).equal('[𝛱]');
        expect(await th.run(`Function('chi')`)).equal('[⚙️,[chi]]');
    })
    it("other_symbols", async () => {
        const ss = `\\hslash\\wp\\ell\\mho\\gimel\\beth\\aleph\\eth\\daleth\\hbar`;
        const rs = `ℏ℘ℓ℧ℷℶℵðℸℏ`.split("").filter(c=>c);
        const split=ss.split("\\").filter(c=>c);
        for (let idx = 0; idx < split.length; idx++) {
            console.log(split[idx]);
            expect(await th.run(`symbols("${split[idx]}")`)).equal(`[${rs[idx]}]`);
        }
        
    });

    it("modifiers", async () => {
        expect(await th.run(`symbols("xMathring")`)).equal('[ring,[x]]');
        expect(await th.run(`symbols("xCheck")`)).equal('[check,[x]]');
        expect(await th.run(`symbols("xBreve")`)).equal('[breve,[x]]');
        expect(await th.run(`symbols("xAcute")`)).equal('[acute,[x]]');
        expect(await th.run(`symbols("xGrave")`)).equal('[grave,[x]]');
        expect(await th.run(`symbols("xTilde")`)).equal('[small-tilde,[x]]');
        expect(await th.run(`symbols("xPrime")`)).equal("[x']");
        expect(await th.run(`symbols("xddDDot")`)).equal('[ddddot,[x]]');
        expect(await th.run(`symbols("xDdDot")`)).equal('[dddot,[x]]');
        expect(await th.run(`symbols("xDDot")`)).equal('[ddot,[x]]');
        expect(await th.run(`symbols("xBold")`)).equal('[x,bf]');
        expect(await th.run(`symbols("xnOrM")`)).equal('|[x]|');
        expect(await th.run(`symbols("xAVG")`)).equal('<[x]>');
        expect(await th.run(`symbols("xHat")`)).equal('[🎩,[x]]');
        expect(await th.run(`symbols("xDot")`)).equal('[dot,[x]]');
        expect(await th.run(`symbols("xBar")`)).equal('[overline,[x]]');
        expect(await th.run(`symbols("xVec")`)).equal('[overrightarrow,[x]]');
        expect(await th.run(`symbols("xAbs")`)).equal('|[x]|');
        expect(await th.run(`symbols("xMag")`)).equal('|[x]|');
        expect(await th.run(`symbols("xPrM")`)).equal("[x']");
        expect(await th.run(`symbols("xBM")`)).equal('[x,boldsymbol]');

        /**modifer itself  */

        expect(await th.run(`symbols("Mathring")`)).equal('[Mathring]');
        expect(await th.run(`symbols("Check")`)).equal('[Check]');
        expect(await th.run(`symbols("Breve")`)).equal('[Breve]');
        expect(await th.run(`symbols("Acute")`)).equal('[Acute]');
        expect(await th.run(`symbols("ddDDot")`)).equal('[dddot,[d]]');

        /** # Check a few combinations */
        expect(await th.run(`symbols("xvecdot")`)).equal('[dot,[overrightarrow,[x]]]');
        expect(await th.run(`symbols("xDotVec")`)).equal('[overrightarrow,[dot,[x]]]');
        expect(await th.run(`symbols("xHATNorm")`)).equal('|[🎩,[x]]|');
        expect(await th.run(`symbols("xMathringBm_yCheckPRM__zbreveAbs")`)).equal(`[ring,[x,boldsymbol]][💪,|[breve,[z]]|,[check,[y]][']]`);
        expect(await th.run(`symbols("alphadothat_nVECDOT__tTildePrime")`)).equal(`[🎩,[dot,[𝛼]]][💪,[small-tilde,[t]]['],[dot,[overrightarrow,[n]]]]`);

    })
    it("greek_symbols(", async () => {
        expect(await th.run(`Symbol('alpha')`)).equal('[𝛼]');
        expect(await th.run(`Symbol('beta')`)).equal('[𝛽]');

        /**there are more, but no need */
    })
    it("fancyset_symbols", async () => {
        expect(await th.run(`S.Rationals`)).equal('[Q,mathbb]');
        expect(await th.run(`S.Naturals`)).equal('[N,mathbb]');
        expect(await th.run(`S.Naturals0`)).equal('[N,mathbb][⛏️,[0]]');
        expect(await th.run(`S.Integers`)).equal('[Z,mathbb]');
        expect(await th.run(`S.Reals`)).equal('[R,mathbb]');
        expect(await th.run(`S.Complexes`)).equal('[C,mathbb]');
    });
    it("builtin_no_args", async () => {
        await th.prepare(`from sympy import beta`);
        expect(await th.run(`Chi`)).equal('[⚙️,[Chi]]');
        expect(await th.run(`beta`)).equal('[⚙️,[B]]');
        expect(await th.run(`gamma`)).equal('[𝛤]');
        expect(await th.run(`KroneckerDelta`)).equal('[𝛿]');
        expect(await th.run(`DiracDelta`)).equal('[𝛿]');
        expect(await th.run(`lowergamma`)).equal('[𝛾]');
    });
    it("6853", async () => {
        expect(await th.run(`p = Function('Pi')(x)`)).equal('[𝛱]([x])');
    });

    it("Mul", async () => {
        expect(await th.run(`Mul(-2, x + 1, evaluate=False)`)).equal('[-2]([1+x])');
        expect(await th.run(`Mul(2, x + 1, evaluate=False)`)).equal('[2]([1+x])');
        expect(await th.run(`Mul(S.Half, x + 1, evaluate=False)`)).equal('[frac,[1+x],[2]]');
        expect(await th.run(`Mul(y, x + 1, evaluate=False)`)).equal('[y]([1+x])');
        expect(await th.run(`Mul(-y, x + 1, evaluate=False)`)).equal('[-y]([1+x])');
        expect(await th.run(`Mul(-2, x + 1)`)).equal('[-2-2x]');
        expect(await th.run(`Mul(2, x + 1)`)).equal('[2+2x]');

    })
    it("Pow", async () => {
        await th.prepare(`
e = Pow(2, 2, evaluate=False)
x2 = Symbol(r'x^2')
        `);

        expect(await th.run(`e`)).equal('[2][💪,[2]]');
        expect(await th.run(`x**(Rational(-1, 3))`)).equal('[frac,[1],[sqrt,[x],[3]]]');
        expect(await th.run(`x2**2`)).equal('[¬]([x⇔y])');
    })
    it("7180", async () => {
        expect(await th.run(`Equivalent(x, y)`)).equal('[x⇔y]');
        expect(await th.run(`Not(Equivalent(x, y))`)).equal('[¬]([x⇔y])');
        /**TODO: handle not properly */
    })
    it("8409", async () => {
        expect(await th.run(`S.Half**n`)).equal('([frac,[1],[2]])[💪,[n]]');
    })
    it("8470", async () => {
        await th.prepare(`
from sympy.parsing.sympy_parser import parse_expr
e = parse_expr("-B*A", evaluate=False)
        `)
        expect(await th.run(`e`)).equal('[-AB]');
    });
    it("15439", async () => {
        await th.prepare(`
x = MatrixSymbol('x', 2, 2)
y = MatrixSymbol('y', 2, 2)
        `)
        expect(await th.run(`(x * y).subs(y, -y)`)).equal('[-xy]');
        expect(await th.run(`(x * y).subs(y, -2*y)`)).equal('[x]([-2])[y]');
        expect(await th.run(`(x * y).subs(x, -x)`)).equal('[-xy]');
    });

    it.skip("2934", async () => {
        /**
        assert latex(Symbol(r'\frac{a_1}{b_1}')) == r'\frac{a_1}{b_1}'
         */
    });
    it.skip("10489", async () => {
        /**
        latexSymbolWithBrace = r'C_{x_{0}}'
    s = Symbol(latexSymbolWithBrace)
    assert latex(s) == latexSymbolWithBrace
    assert latex(cos(s)) == r'\cos{\left(C_{x_{0}} \right)}'
         */
    });
    it.skip("12886", async () => {
        /**
         *  m__1, l__1 = symbols('m__1, l__1')
    assert latex(m__1**2 + l__1**2) == \
        r'\left(l^{1}\right)^{2} + \left(m^{1}\right)^{2}'
         */
    });

    it("13559", async () => {
        await th.prepare(`
from sympy.parsing.sympy_parser import parse_expr
expr = parse_expr('5/1', evaluate=False)
        `)
        expect(await th.run(`expr`)).equal('[5×1][💪,[-1]]');
    });
    it("13651", async () => {
        expect(await th.run(`c + Mul(-1, a + b, evaluate=False)`)).equal('[c-]([a+b])');
    });

    it("MatrixElement", async () => {
        await th.prepare(`
# test cases for issue #11821
A = MatrixSymbol("A", 1, 3)
B = MatrixSymbol("B", 1, 3)
C = MatrixSymbol("C", 1, 3)
F = C[0, 0].subs(C, A - B)
i, j, k = symbols("i j k")
M = MatrixSymbol("M", k, k)
N = MatrixSymbol("N", k, k)
                                `);
        expect(await th.run(`A[0, 0]`)).equal('[A][⛏️,[0,0]]');
        expect(await th.run(`3 * A[0, 0]`)).equal('[3A][⛏️,[0,0]]');
        expect(await th.run(`F`)).equal('([-B+A])[⛏️,[0,0]]');
        expect(await th.run(`(M*N)[i, j]`)).equal('[sum,[i][⛏️,[1]][=0],[-1+k]][M][⛏️,[i,i][⛏️,[1]]][N][⛏️,[i][⛏️,[1]][,j]]');

    });
    it("MatrixSymbol", async () => {
        await th.prepare(`
A = MatrixSymbol("A", 3, 3)
B = MatrixSymbol("B", 3, 3)
C = MatrixSymbol("C", 3, 3)
    
                                `);
        expect(await th.run(`-A`)).equal('[-A]');
        expect(await th.run(`A - A*B - B`)).equal('[-B-AB+A]');
        expect(await th.run(`-A*B - A*B*C - B`)).equal('[-B-AB-ABC]');

    });
    it("KroneckerProduct", async () => {
        await th.prepare(`
A = MatrixSymbol('A', 3, 3)
B = MatrixSymbol('B', 2, 2)
                                `);
        expect(await th.run(`KroneckerProduct(A, B)`)).equal('A⊗B]');

    });

    it("Series", async () => {
        await th.prepare(`
tf1 = TransferFunction(x*y**2 - z, y**3 - t**3, y)
tf2 = TransferFunction(x - y, x + y, y)
tf3 = TransferFunction(t*x**2 - t**w*x + w, t - y, y)
                                `);

        expect(await th.run(`Series(tf1, tf2)`)).equal('[frac,([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]]),[frac,[1],[1]][+]([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]])]');
        expect(await th.run(`Series(tf1, tf2, tf3)`)).equal('[frac,([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]]),[frac,[1],[1]][+]([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]])]');
        expect(await th.run(`Series(-tf2, tf1)`)).equal('([frac,[-z+xy][💪,[2]],[y][💪,[3]][-t][💪,[3]]])[ ]([frac,[x-y],[x+y]])');

        // TODO new version
        /**
         * 
         * M_1 = Matrix([[5/s], [5/(2*s)]])
    T_1 = TransferFunctionMatrix.from_Matrix(M_1, s)
    M_2 = Matrix([[5, 6*s**3]])
    T_2 = TransferFunctionMatrix.from_Matrix(M_2, s)
    # Brackets
    assert latex(T_1*(T_2 + T_2)) == \
        r'\left[\begin{matrix}\frac{5}{s}\\\frac{5}{2 s}\end{matrix}\right]_\tau\cdot\left(\left[\begin{matrix}\frac{5}{1} &' \
        r' \frac{6 s^{3}}{1}\end{matrix}\right]_\tau + \left[\begin{matrix}\frac{5}{1} & \frac{6 s^{3}}{1}\end{matrix}\right]_\tau\right)' \
            == latex(MIMOSeries(MIMOParallel(T_2, T_2), T_1))
    # No Brackets
    M_3 = Matrix([[5, 6], [6, 5/s]])
    T_3 = TransferFunctionMatrix.from_Matrix(M_3, s)
    assert latex(T_1*T_2 + T_3) == r'\left[\begin{matrix}\frac{5}{s}\\\frac{5}{2 s}\end{matrix}\right]_\tau\cdot\left[\begin{matrix}' \
        r'\frac{5}{1} & \frac{6 s^{3}}{1}\end{matrix}\right]_\tau + \left[\begin{matrix}\frac{5}{1} & \frac{6}{1}\\\frac{6}{1} & ' \
            r'\frac{5}{s}\end{matrix}\right]_\tau' == latex(MIMOParallel(MIMOSeries(T_2, T_1), T_3))

         */
    })

    it.skip("TransferFunctionMatrix", async () => {
        await th.prepare(`
        tf1 = TransferFunction(p, p + x, p)
        tf2 = TransferFunction(-s + p, p + s, p)
        tf3 = TransferFunction(p, y**2 + 2*y + 3, p)
                                `);

        expect(await th.run(`TransferFunctionMatrix([[tf1], [tf2]])`)).equal('([frac,[-z+xy][💪,[2]],[y][💪,[3]][-t][💪,[3]]])[ ]([frac,[x-y],[x+y]])');
    });


    it("Feedback", async () => {
        await th.prepare(`
tf1 = TransferFunction(p, p + x, p)
tf2 = TransferFunction(-s + p, p + s, p)
                        `);

        expect(await th.run(`Feedback(tf1, tf2)`)).equal('[frac,[frac,[p],[p+x]],[frac,[1],[1]][+]([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]])]');
        expect(await th.run(`Feedback(tf1*tf2, TransferFunction(1, 1, p))`)).equal('[frac,([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]]),[frac,[1],[1]][+]([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]])]');
        expect(await th.run(`Feedback(tf1, tf2, 1)`)).equal('[frac,([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]]),[frac,[1],[1]][+]([frac,[p],[p+x]])[ ]([frac,[p-s],[p+s]])]');

        //TODO: new version
        /**
         * # Positive Feedback
    assert latex(Feedback(tf1, tf2, 1)) == \
        r'\frac{\frac{p}{p + x}}{\frac{1}{1} - \left(\frac{p}{p + x}\right) \left(\frac{p - s}{p + s}\right)}'
    assert latex(Feedback(tf1*tf2, sign=1)) == \
        r'\frac{\left(\frac{p}{p + x}\right) \left(\frac{p - s}{p + s}\right)}{\frac{1}{1} - \left(\frac{p}{p + x}\right) \left(\frac{p - s}{p + s}\right)}'

         */
    })

    /** not existed in current version */
    it.skip("MIMOFeedback", async () => {
        await th.prepare(`
tf1 = TransferFunction(1, s, s)
tf2 = TransferFunction(s, s**2 - 1, s)
tf3 = TransferFunction(s, s - 1, s)
tf4 = TransferFunction(s**2, s**2 - 1, s)

tfm_1 = TransferFunctionMatrix([[tf1, tf2], [tf3, tf4]])
tfm_2 = TransferFunctionMatrix([[tf4, tf3], [tf2, tf1]])    
                `);

        expect(await th.run(`MIMOFeedback(tfm_1, tfm_2)`)).equal('[x+yi+zj+tk]');

    });

    it("Quaternion", async () => {
        await th.prepare(`
q1 = Quaternion(x, y, z, t)
q2 = Quaternion(x, y, z, x*t)
q3 = Quaternion(x, y, z, x + t)
        `);

        expect(await th.run(`q1`)).equal('[x+yi+zj+tk]');
        expect(await th.run(`q2`)).equal('[x+yi+zj+txk]');
        expect(await th.run(`q3`)).equal('[x+yi+zj+]([t+x])[k]');

    });
    it("TensorProduct", async () => {
        await th.prepare(`
from sympy.tensor.functions import TensorProduct
A = MatrixSymbol("A", 3, 3)
B = MatrixSymbol("B", 3, 3)
        `);

        expect(await th.run(`TensorProduct(A, B)`)).equal('[A⊗B]');

    });
    it("WedgeProduct", async () => {
        await th.prepare(`
from sympy.diffgeom.rn import R2
from sympy.diffgeom import WedgeProduct
wp = WedgeProduct(R2.dx, R2.dy)
        `);

        expect(await th.run(`wp`)).equal('[⚙️,[d]][x∧][⚙️,[d]][y]');

    });

    it("9216", async () => {
        expect(await th.run(`Pow(1, -1, evaluate=False)`)).equal('[1][💪,[-1]]');
        expect(await th.run(`Pow(1, Pow(1, -1, evaluate=False), evaluate=False)`)).equal('[1][💪,[1][💪,[-1]]]');
        expect(await th.run(`Pow(3, -2, evaluate=False)`)).equal('[frac,[1],[3][💪,[2]]]');
        expect(await th.run(`Pow(1, -2, evaluate=False)`)).equal('[1][💪,[-2]]');
    })
    it("tensor", async () => {
        await th.prepare(`
from sympy.tensor.tensor import TensorIndexType, tensor_indices, TensorHead, tensor_heads
L = TensorIndexType("L")
i, j, k, l = tensor_indices("i j k l", L)
i0 = tensor_indices("i_0", L)
A, B, C, D = tensor_heads("A B C D", [L])
H = TensorHead("H", [L, L])
K = TensorHead("K", [L, L, L, L])
        `);

        expect(await th.run(`i`)).equal('[💪,[i]]');
        expect(await th.run(`-i`)).equal('[⛏️,[i]]');
        expect(await th.run(`A(i)`)).equal('[A][💪,[i]]');
        expect(await th.run(`A(i0)`)).equal('[A][💪,[i][⛏️,[0]]]');
        expect(await th.run(`A(-i)`)).equal('[A][⛏️,[i]]');
        expect(await th.run(`-3*A(i)`)).equal('[-3A][💪,[i]]');
        expect(await th.run(`K(i, j, -k, -i0)`)).equal('[K][💪,[ij]][⛏️,[ki][⛏️,[0]]]');
        expect(await th.run(`K(i, -j, -k, i0)`)).equal('[K][💪,[i]][⛏️,[jk]][💪,[i][⛏️,[0]]]');
        expect(await th.run(`K(i, -j, k, -i0)`)).equal('[K][💪,[i]][⛏️,[j]][💪,[k]][⛏️,[i][⛏️,[0]]]');
        expect(await th.run(`H(i, -j)`)).equal('[H][💪,[i]][⛏️,[j]]');
        expect(await th.run(`H(i, j)`)).equal('[H][💪,[ij]]');
        expect(await th.run(`H(-i, -j)`)).equal('[H][⛏️,[ij]]');
        expect(await th.run(`(1+x)*A(i)`)).equal('([1+x])[A][💪,[i]]');
        expect(await th.run(`H(i, -i)`)).equal('[H][💪,[L][⛏️,[0]]][⛏️,[L][⛏️,[0]]]');
        expect(await th.run(`H(i, -j)*A(j)*B(k)`)).equal('[H][💪,[i]][⛏️,[L][⛏️,[0]]][A][💪,[L][⛏️,[0]]][B][💪,[k]]');
        expect(await th.run(`A(i) + 3*B(i)`)).equal('[3B][💪,[i]][+A][💪,[i]]');

        await th.prepare(` from sympy.tensor.tensor import TensorElement`);

        expect(await th.run(`TensorElement(K(i, j, k, l), {i: 3, k: 2})`)).equal('[K][💪,[i=3,j,k=2,l]]');
        expect(await th.run(`TensorElement(K(i, j, k, l), {i: 3})`)).equal('[K][💪,[i=3,j,k,l]]');
        expect(await th.run(`TensorElement(K(i, -j, k, l), {i: 3, k: 2})`)).equal('[K][💪,[i][=][3]][⛏️,[j]][💪,[k=2,l]]');
        expect(await th.run(`TensorElement(K(i, -j, k, -l), {i: 3, k: 2})`)).equal('[K][💪,[i][=][3]][⛏️,[j]][💪,[k][=][2]][⛏️,[l]]');
        expect(await th.run(`TensorElement(K(i, j, -k, -l), {i: 3, -k: 2})`)).equal('[K][💪,[i=3,j]][⛏️,[k=2,l]]');
        expect(await th.run(`TensorElement(K(i, j, -k, -l), {i: 3})`)).equal('[K][💪,[i=3,j]][⛏️,[k,l]]');

        await th.prepare(`from sympy.tensor.toperators import PartialDerivative`);
        expect(await th.run(`PartialDerivative(A(i), A(i))`)).equal('[frac,[∂],[∂A][💪,[L][⛏️,[0]]]][A][💪,[L][⛏️,[0]]]');
        expect(await th.run(`PartialDerivative(A(-i), A(-j))`)).equal('[frac,[∂],[∂A][⛏️,[j]]][A][⛏️,[i]]');
        expect(await th.run(`PartialDerivative(K(i, j, -k, -l), A(m), A(-n))`)).equal('[frac,[∂][💪,[2]],[∂A][💪,[m]][∂A][⛏️,[n]]][K][💪,[ij]][⛏️,[kl]]');
        expect(await th.run(`PartialDerivative(B(-i) + A(-i), A(-j), A(-n))`)).equal('[frac,[∂][💪,[2]],[∂A][⛏️,[j]][∂A][⛏️,[n]]]([A][⛏️,[i]][+B][⛏️,[i]])');
        expect(await th.run(`PartialDerivative(3*A(-i), A(-j), A(-n))`)).equal('[frac,[∂][💪,[2]],[∂A][⛏️,[j]][∂A][⛏️,[n]]][3A][⛏️,[i]]');
    });

    it("issue_15353", async () => {
        await th.prepare(` 
from sympy import ConditionSet, Tuple, S, sin, cos
a, x = symbols('a x')
sol = ConditionSet(Tuple(x, a), Eq(sin(a*x), 0) & Eq(cos(a*x), 0), S.Complexes**2)

                `);

        expect(await th.run(`sol`)).equal('{([x,a])[ ][middle|,][ ]([x,a])[∈][C,mathbb][💪,[2]][∧][sin,]([ax])[=0∧][cos,]([ax])[=0]}');
    });

    it("trace", async () => {
        await th.prepare(` 
from sympy import trace
A1 = MatrixSymbol("A", 2, 2)

                `);

        expect(await th.run(`trace(A1)`)).equal('[⚙️,[tr]]([A])');
        expect(await th.run(`trace(A1**2)`)).equal('[⚙️,[tr]]([A][💪,[2]])');
    });

    it("MatrixSymbol_bold", async () => {
        await th.prepare(` 
from sympy import trace
A1 = MatrixSymbol("A", 2, 2)

A2 = MatrixSymbol("A", 3, 3)
B2 = MatrixSymbol("B", 3, 3)
C2 = MatrixSymbol("C", 3, 3)

A_k = MatrixSymbol("A_k", 3, 3)
Anbla = MatrixSymbol(r"\\nabla_k", 3, 3)
        `);

        expect(await th.run(`A1`)).equal('[A]');
        expect(await th.run(`A1`, { matrixSymbol: { style: "bold" } })).equal('[A,bf]');
        expect(await th.run(`A1`, { matrixSymbol: { style: "plain" } })).equal('[A]');

        expect(await th.run(`-A2`, { matrixSymbol: { style: "bold" } })).equal('[-][A,bf]');
        expect(await th.run(`A2 - A2*B2 - B2`, { matrixSymbol: { style: "bold" } })).equal('[-][B,bf][-][AB,bf][+][A,bf]');
        expect(await th.run(`-A2*B2 - A2*B2*C2 - B2`, { matrixSymbol: { style: "bold" } })).equal('[-][B,bf][-][AB,bf][-][ABC,bf]');
        expect(await th.run(`A_k`, { matrixSymbol: { style: "bold" } })).equal('[A,bf][⛏️,[k,bf]]');
        expect(await th.run(`Anbla`, { matrixSymbol: { style: "bold" } })).equal('[∇,bf][⛏️,[k,bf]]');


    });

    it("AppliedPermutation", async () => {
        expect(await th.run(`AppliedPermutation(Permutation(0, 1, 2), Symbol('x'))`)).equal('[𝜎][⛏️,([0 1 2])]([x])');

    });

    it("PermutationMatrix", async () => {
        await th.prepare(`
p1 = Permutation(0, 1, 2)
p2 = Permutation(0, 3)(1, 2)
        `)

        expect(await th.run(`PermutationMatrix(p1)`)).equal('[P][⛏️,([0;1;2])]');
        expect(await th.run(`PermutationMatrix(p2)`)).equal('[P][⛏️,([0;3])([1;2])]');
    })
    it("imaginary_unit", async () => {
        await th.prepare(`from sympy import I`)
        expect(await th.run(`1 + I`)).equal('[1+i]');
        expect(await th.run(`1 + I`, { imaginaryUnit: { textStyle: true } })).equal('[1+][📜,[i]]');
    });

    it("re_im", async () => {
        expect(await th.run(`im(x)`)).equal('[ℑ]([x])');
        expect(await th.run(`re(x)`)).equal('[ℜ]([x])');
        expect(await th.run(`im(x)`, { reim: { gothic: false } })).equal('[⚙️,[im]]([x])');
        expect(await th.run(`re(x)`, { reim: { gothic: false } })).equal('[⚙️,[re]]([x])');
    })
    it("diffgeom", async () => {
        await th.prepare(`
from sympy.diffgeom import Manifold, Patch, CoordSystem, BaseScalarField, Differential
from sympy.diffgeom.rn import R2
x,y = symbols('x y', real=True)
m = Manifold('M', 2)
p = Patch('P', m)
rect = CoordSystem('rect', p, [x, y])
b = BaseScalarField(rect, 0)

g = Function('g')
s_field = g(R2.x, R2.y)
        `);

        expect(await th.run(`m`)).equal('[📜,[M]]');
        expect(await th.run(`p`)).equal('[📜,[P]][⛏️,[📜,[M]]]');
        expect(await th.run(`rect`)).equal('[📜,[rect]][💪,[📜,[P]],[📜,[M]]]');
        expect(await th.run(`b`)).equal('[x,bf]');
        expect(await th.run(`Differential(s_field)`)).equal('[⚙️,[d]]([g]([x,bf][,][y,bf]))');
    });

    it("quantity", async () => {
        await th.prepare(`from sympy.physics.units import meter, gibibyte, microgram, second, planck_mass,planck_density, percent, degree, ohm, planck_power`)
        expect(await th.run(`5*meter`)).equal('[5][📜,[m]]');
        expect(await th.run(`3*gibibyte`)).equal('[3][📜,[gibibyte]]');
        expect(await th.run(`4*microgram/second`)).equal('[frac,[4𝜇][📜,[g]],[📜,[s]]]');
        expect(await th.run(`4*planck_mass`)).equal('[4m][⛏️,[P]]');
        expect(await th.run(`4*planck_density`)).equal('[4𝜌][⛏️,[P]]');
        expect(await th.run(`4*percent`)).equal('[4%]');
        expect(await th.run(`4*percent**2`)).equal('[4%][💪,[2]]');
        expect(await th.run(`4*degree`)).equal('[4][💪,[∘]]');
        expect(await th.run(`4*degree**2`)).equal('[4]([💪,[∘]])[💪,[2]]');
        expect(await th.run(`4*ohm`)).equal('[4𝛺]');
        expect(await th.run(`4*planck_power`)).equal('[4P][⛏️,[P]]');
    });

    it("17092", async () => {
        await th.prepare(`x_star = Symbol('x^*')`);
        expect(await th.run(`Derivative(x_star, x_star,2)`)).equal('[frac,[d][💪,[2]],[d]([x][💪,[*]])[💪,[2]]][x][💪,[*]]');
    })

    it("decimal_separator", async () => {
        await th.prepare(`
x, y, z, t = symbols('x y z t')
k, m, n = symbols('k m n', integer=True)
f, g, h = symbols('f g h', cls=Function)
        `);

        expect(await th.run(`[1, 2.3, 4.5]`, { float: { decimalSeprator: "comma" } })).equal('[[1;2,3;4,5]]');
        expect(await th.run(`FiniteSet(1, 2.3, 4.5)`, { float: { decimalSeprator: "comma" } })).equal('{[1;2,3;4,5]}');
        expect(await th.run(`(1, 2.3, 4.6)`, { float: { decimalSeprator: "comma" } })).equal('([1;2,3;4,6])');

        expect(await th.run(`[1, 2.3, 4.5]`, { float: { decimalSeprator: "period" } })).equal('[[1,2.3,4.5]]');
        expect(await th.run(`FiniteSet(1, 2.3, 4.5)`, { float: { decimalSeprator: "period" } })).equal('{[1,2.3,4.5]}');
        expect(await th.run(`(1, 2.3, 4.6)`, { float: { decimalSeprator: "period" } })).equal('([1,2.3,4.6])');

        expect(await th.run(`[1, 2.3, 4.5]`)).equal('[[1,2.3,4.5]]');
        expect(await th.run(`FiniteSet(1, 2.3, 4.5)`)).equal('{[1,2.3,4.5]}');
        expect(await th.run(`(1, 2.3, 4.6)`)).equal('([1,2.3,4.6])');

        expect(await th.run(`Mul(3.4,5.3)`, { float: { decimalSeprator: "comma" } })).equal('[18,02]');
        expect(await th.run(`3.4*5.3`, { float: { decimalSeprator: "comma" } })).equal('[18,02]');
        expect(await th.run(`x*5.3 + 2**y**3.4 + 4.5 + z`, { float: { decimalSeprator: "comma" } })).equal('[4,5+z+2][💪,[y][💪,[3,4]]][+5,3x]');
        expect(await th.run(`5.8*10**(-7)`, { float: { decimalSeprator: "comma" } })).equal('[5,8×10][💪,[-7]]');
    });

    it("str", async () => {
        await th.prepare(` from sympy.core.symbol import Str`);
        expect(await th.run(`str(Str('x'))`)).equal('[x]');
    })
});