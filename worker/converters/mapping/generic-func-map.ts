export const mcFuncToSympyMap: MapStrValue<string> = {
    "cos": "trigonometric.cos",
    "sin": "trigonometric.sin",
    "tan": "trigonometric.tan",
    "cot": "trigonometric.cot",
    "sec": "trigonometric.sec",
    "csc": "trigonometric.csc",
    "sinc": "trigonometric.sinc",

    "asin": "trigonometric.asin",
    "arcsin": "trigonometric.asin",

    "acos": "trigonometric.acos",
    "arccos": "trigonometric.acos",

    "atan": "trigonometric.atan",
    "arctan": "trigonometric.atan",

    "acot": "trigonometric.acot",
    "arccot": "trigonometric.acot",

    "asec": "trigonometric.asec",
    "arcsec": "trigonometric.asec",

    "acsc": "trigonometric.acsc",
    "arccsc": "trigonometric.acsc",

    "atan2": "trigonometric.atan2",

    "sinh": "hyperbolic.sinh",
    "cosh": "hyperbolic.cosh",
    "tanh": "hyperbolic.tanh",
    "coth": "hyperbolic.coth",
    "sech": "hyperbolic.sech",
    "csch": "hyperbolic.csch",

    "asinh": "hyperbolic.asinh",
    "arcsinh": "hyperbolic.asinh",

    "acosh": "hyperbolic.acosh",
    "arccosh": "hyperbolic.acosh",

    "atanh": "hyperbolic.atanh",
    "arctanh": "hyperbolic.atanh",

    "acoth": "hyperbolic.acoth",
    "arccoth": "hyperbolic.acoth",

    "asech": "hyperbolic.asech",
    "arcsech": "hyperbolic.asech",

    "acsch": "hyperbolic.acsch",
    "arccsch": "hyperbolic.acsch",

    "exp": "exponential.exp",
    "log": "exponential.log",

    "max": "miscellaneous.Max",
    "min": "miscellaneous.Min",
}

export const sympyToMcConstantFuncs: MapStrValue<string> = {
    "cos": "cos",
    "sin": "sin",
    "tan": "tan",
    "cot": "cot",
    "sec": "sec",
    "csc": "csc",
    "sinc": "sinc",
    "asin": "asin",
    "arcsin": "arcsin",
    "acos": "acos",
    "arccos": "arccos",
    "atan": "atan",
    "arctan": "arctan",
    "arccot": "arccot",
    "acot": "arccot",
    "asec": "arcsec",
    "acsc": "arccsc",
    "sinh": "sinh",
    "cosh": "cosh",
    "tanh": "tanh",
    "coth": "coth",
    "sech": "sech",
    "csch": "csch",
    "asinh": "arcsinh",
    "acosh": "arccosh",
    "atanh": "arctanh",
    "acoth": "arccoth",
    "asech": "arcsech",
    "acsch": "arccsch",
    "exp": "exp",
    "log": "log",
    "max": "max",
    "min": "min",
}

/*
0: "sin" -> [Done]
1: "dim"
2: "cos" -> [Done]
3: "tan" -> [Done]
4: "sec" -> [Done]
5: "cot" -> [Done]
6: "csc" -> [Done]
7: "arccos" -> [Done]
8: "arccot" -> [Done]
9: "arccsc" -> [Done]
10: "arcsec" -> [Done]
11: "arcsin" -> [Done]
12: "arctan" -> [Done]
13: "sinh" -> [Done]
14: "cosh" -> [Done]
15: "tanh" -> [Done]
16: "sech" -> [Done]
17: "coth" -> [Done]
18: "csch" -> [Done]
19: "arccosh" -> [Done]
20: "arccoth" -> [Done]
21: "arccsch" -> [Done]
22: "arcsech" -> [Done]
23: "arcsinh" -> [Done]
24: "arctanh" -> [Done]
25: "exp" -> [Done]
26: "ln"
27: "log"
28: "min" -> [Done]
29: "max" -> [Done]
30: "sgn"
31: "inf"
32: "deg"
33: "det"
34: "ker"
35: "hom"
36: "arg"
37: "Pr"
38: "gcd"
39: "lg"
40: "mod"
41: "bmod"
42: "acos" -> [Done]
43: "asin" -> [Done]
44: "atan" -> [Done]
*/