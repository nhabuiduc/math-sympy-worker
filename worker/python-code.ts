export const defineSympyExprDumpFunc = `

class __McHdl:
    def hdl_str(self, expr):
        return {'func': 'Str','text': expr}

    def hdl_tuple(self, expr):
        return {'func': 'Tuple', 'args':  self.argsMap(expr) }

    def hdl_Tuple(self, expr):
        return {'func': 'Tuple', 'args':  self.argsMap(expr) }

    def hdl_list(self, expr):
        return {'func': 'List', 'args': self.argsMap(expr), 'separator':','}

    def hdl_UndefinedFunction(self, expr):
        return {'func': 'UndefinedFunction', 'name': str(expr), 'args': []}

    def hdl_PolynomialRing(self, expr):
        return {'func': 'PolynomialRing', 'domain': self.hdlAll(expr.domain), 'args': self.argsMap(expr.symbols) }
    
    def hdl_MatrixBase(self, expr):
        l = []
        for i in range(expr.rows):
            for j in range(expr.cols):
                l.append(self.hdlAll(expr[i, j]))

        return {'func':'Matrix','args':l, 'row':expr.rows, 'col':expr.cols}
    
    def hdl_Max(self, expr):
        return self.hdlGenericFunc('max',expr.args)

    def hdl_Min(self, expr):
        return self.hdlGenericFunc('min',expr.args)
    
    def hdl_Symbol(self, expr):
        return {'func':'Symbol', 'name':expr.name }
    
    def hdl_Poly(self, expr):
        return {'func': 'Poly', 'domain': self.hdlAll(expr.domain), 'args': self.argsMap(expr.args) }

    def hdl_Integer(self, expr):
        return {'func':'Integer', 'value':expr.p }
        
    
    def hdl_Dummy(self, expr):
        return {'func':'Dummy', 'name':expr.name }

    def hdl_Str(self, expr):
        return {'func':'Str', 'text':expr.name }

    def hdl_NumberSymbol(self, expr):
        return {'func':'NumberSymbol', 'name':str(expr) }

    def hdl_Rational(self, expr):
        return {'func':'Rational', 'p':expr.p, 'q': expr.q}

    def hdl_Float(self, expr):
        return {'func':'Float', 'value':sstr(expr,full_prec=False) }

    def hdl_CoordSys3D(self, expr):
        return {'func':'CoordSys3D', 'variableNames':expr._variable_names, 'vectorNames':expr._vector_names, 'args':  self.argsMap(expr.args) }

    def hdl_Derivative(self, expr):
        from sympy.printing.conventions import requires_partial
        return {'func':'Derivative', 'partial':requires_partial(expr), 'args':  self.argsMap(expr.args) }

    def hdl_Relational(self, expr):
        return {'func': 'Relational', 'relOp': expr.rel_op, 'args':  self.argsMap(expr.args)  } 

    def hdl_FiniteField(self, expr):
        return {'func': 'FiniteField', 'mod': self.hdlAll(expr.mod) } 

    def hdl_IntegerRing(self, expr):
        return {'func': 'DisplayedDomain', 'name': 'Z' } 

    def hdl_RationalField(self, expr):
        return {'func': 'DisplayedDomain', 'name': 'Q' } 

    def hdl_RealField(self, expr):
        return {'func': 'DisplayedDomain', 'name': 'R' } 

    def hdl_ComplexField(self, expr):
        return {'func': 'DisplayedDomain', 'name': 'C' } 

    def hdl_bool(self, expr):    
        if expr:
            return {'func': 'BooleanTrue' } 
        else: 
            return {'func': 'BooleanFalse' } 

    def hdl_SingularityFunction(self, expr):
        return {'func': 'SingularityFunction', 'args': [self.hdlAll(expr.args[0] - expr.args[1]), self.hdlAll(expr.args[2])] }     

    def hdl_Cycle(self, expr):
        from sympy.combinatorics.permutations import Permutation
        if expr.size == 0:
            return { 'func': 'Cycle', 'perm' : [] }

        expr = Permutation(expr)
        expr_perm = expr.cyclic_form
        siz = expr.size
        if expr.array_form[-1] == siz - 1:
            expr_perm = expr_perm + [[siz - 1]]

        return { 'func': 'Cycle', 'perm' : expr_perm }

    def hdl_Permutation(self, expr):
        return self.hdl_Cycle(expr)

    def hdl_Exp1(self, expr):
        return { 'func': 'Exp1' }

    def hdlFunctionClass(self, expr, name):
        return { 'func': 'FunctionClass', 'name': name, 'args': self.argsMap(expr.args) }

    def hdlGenericFunc(name, args):
        dic['func'] = 'GenericFunc' 
        dic['name'] = name
        dic['args']=self.argsMap(args)
        return dic    


    def hdlOthers(self, expr):
        dic = { 'args':[] }
        dic['func']='GenericFunc'

        if hasattr(expr.__class__, '__class__') and expr.__class__.__class__.__name__ == 'FunctionClass':
            funcName = expr.__class__.__name__
            if funcName in ['KroneckerDelta','gamma','lowergamma','beta','DiracDelta','Chi']:
                return { 'func': 'SpecialFuncClass', 'name': funcName, 'args': self.argsMap(expr.args) }
        
        if hasattr(expr, 'func'):
            funcName = expr.func.__name__
            if funcName[0].islower():
                dic['name']= funcName
            else:
                dic['func']= funcName
        else:
            dic['name']= expr.__class__.__name__
        
        if hasattr(expr, 'args'):
            dic['args'] = self.argsMap(expr.args)

        return dic

    def hdlAll(self, expr):
        result = self.callIfExistsInHierarchy(expr)
        if result == None:
            return self.hdlOthers(expr)
        else:
            return result

    def callIfExistsInHierarchy(self, expr):
        import inspect
        found = None
        #print(expr.__class__.__name__)

        if hasattr(self, 'hdl_' + expr.__class__.__name__) :
            found = getattr(self, 'hdl_' + expr.__class__.__name__)(expr)
        else:
            for base_class in inspect.getmro(expr.__class__):
            
                bclassname = base_class.__name__
                #print(bclassname)
                if hasattr(self, 'hdl_' + bclassname) :                
                    found = getattr(self, 'hdl_' + bclassname)(expr)
                    break

        return found

    def argsMap(self, args):
        return list(map(self.hdlAll,args))
    
def ___mcSympyExprDump(expr):
    # print(expr.func)
    # print()
    # print(expr.args)

    dic = __McHdl().hdlAll(expr)
    
            
    #print(dic)
    return dic
`

export const defineAllSetupFuncs = `
from sympy import *
from sympy import core
from sympy.functions.elementary import trigonometric 
from sympy.functions.elementary import hyperbolic 
from sympy.functions.elementary import exponential 
from sympy.functions.elementary import miscellaneous
from sympy import S

from sympy.printing.str import sstr
import json
import math

${defineSympyExprDumpFunc}
`;

