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
        return {'func': 'PolynomialRing', 'args':[self.hdlAll(expr.domain)] + self.argsMap(expr.symbols) }
    
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
        return {'func': 'Poly','args': [self.hdlAll(expr.domain)]+ self.argsMap(expr.args) }

    def hdl_Integer(self, expr):
        return {'func':'Integer', 'value':str(expr.p) }

    def hdl_int(self, expr):
        return {'func':'Integer', 'value':str(expr) }
        
    
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

    def hdl_genfunc_meijerg(self,expr):
        return { 
            'func': 'GenericFunc',
            'name': 'meijerg',
            'args':[
                self.hdlAll(len(expr.ap)),
                self.hdlAll(len(expr.bq)),
                self.hdlAll(len(expr.bm)),
                self.hdlAll(len(expr.an)),
                self.hdlAll(expr.an),
                self.hdlAll(expr.aother),
                self.hdlAll(expr.bm),
                self.hdlAll(expr.bother),
                self.hdlAll(expr.argument)

            ]            
         }

    def hdl_genfunc_hyper(self,expr):
        return { 
        'func': 'GenericFunc',
        'name': 'hyper',
        'args':[
            self.hdlAll(len(expr.ap)),
            self.hdlAll(len(expr.bq)),            
            self.hdlAll(expr.ap),
            self.hdlAll(expr.bq),
            self.hdlAll(expr.argument)
        ]            
    }

    def hdl_set(self,expr):
        return { 'func': 'Set', 'args': self.argsMap(expr) }

    hdl_frozenset = hdl_set

    def hdl_Range(self,s):
        dots = Symbol('dots')
        if s.has(Symbol):
            return self.hdlGenericFunc('Range', s.args)

        if s.start.is_infinite and s.stop.is_infinite:
            if s.step.is_positive:
                printset = dots, -1, 0, 1, dots
            else:
                printset = dots, 1, 0, -1, dots
        elif s.start.is_infinite:
            printset = dots, s[-1] - s.step, s[-1]
        elif s.stop.is_infinite:
            it = iter(s)
            printset = next(it), next(it), dots
        elif len(s) > 4:
            it = iter(s)
            printset = next(it), next(it), dots, s[-1]
        else:
            printset = tuple(s)
        
        return {'func':'Range', 'args': self.argsMap(printset)}

    def hdl_SeqFormula(self,s):
        dots = Symbol('dots')
        if len(s.start.free_symbols) > 0 or len(s.stop.free_symbols) > 0:
            return {
                'func':'SeqFormula', 'args': self.argsMap((
                s.formula,
                s.variables[0],
                s.start,
                s.stop
            )), 'freeSymbol': True}

            
        if s.start is S.NegativeInfinity:
            stop = s.stop
            printset = (dots, s.coeff(stop - 3), s.coeff(stop - 2),
                        s.coeff(stop - 1), s.coeff(stop))
        elif s.stop is S.Infinity or s.length > 4:
            printset = s[:4]
            printset.append(dots)
        else:
            printset = tuple(s)

        return {'func':'SeqFormula', 'args': self.argsMap(printset)}

    hdl_SeqPer = hdl_SeqFormula
    hdl_SeqAdd = hdl_SeqFormula
    hdl_SeqMul = hdl_SeqFormula

    def hdl_FourierSeries(self, s):
        return {'func':'FourierSeries', 'args':[self.hdlAll(s.truncate())]}

    def hdl_FormalPowerSeries(self, s):
        return self.hdlAll(s.infinite)

    def hdl_ProductSet(self, p):
        return {'func':'ProductSet', 'hasVariety': has_variety(p.sets), 'args': self.argsMap(p.args)}

    def hdl_ComplexRegion(self, p):
        return {'func':'ComplexRegion',  'args': self.argsMap([p.expr, p.variables, p.sets])}

    def hdl_dict(self, d):
        items = []

        for key in d.keys():
            val = d[key]
            items.append(Tuple(key,val))
        
        return { 'func':'GenericFunc', 'name':'dict',  'args': self.argsMap(items) }
    
    def hdl_Dict(self, d):
        return { 'func':'GenericFunc', 'name':'dict',  'args': self.argsMap(d.args) }

    def hdl_KroneckerDelta(self, d):
        return { 'func':'KroneckerDelta',  'args': self.argsMap(d.args), 'isArgsAtom': d.args[0].is_Atom and d.args[1].is_Atom }

    def hdl_LeviCivita(self, d):
        return { 'func':'LeviCivita',  'args': self.argsMap(d.args), 'isArgsAtom': all(x.is_Atom for x in d.args) }

    def hdlGenericFunc(self, name, args):
        dic = {}
        dic['func'] = 'GenericFunc' 
        dic['name'] = name
        dic['args']=self.argsMap(args)
        return dic    


    def hdlOthers(self, expr):
        dic = { 'func':'GenericFunc', 'args':[] }        

        if hasattr(expr.__class__,'__class__') and expr.__class__.__class__.__name__ == 'UndefinedFunction':
            return { 'func': 'UndefinedFunction', 'name': expr.__class__.__name__, 'args': self.argsMap(expr.args) }
        
        if expr.__class__.__name__ == 'FunctionClass':            
            dic['name']= expr.__name__
        elif hasattr(expr, 'func'):
            funcName = expr.func.__name__
            if funcName[0].islower():
                dic['name']= funcName
            else:
                dic['func']= funcName
        else:
            dic['name']= expr.__class__.__name__

        if 'name' in dic and  hasattr(self, 'hdl_genfunc_' + dic['name']) :                
            found = getattr(self, 'hdl_genfunc_' + dic['name'])(expr)
            return found

        if hasattr(self, 'hdl_' + dic['func']) :                
            found = getattr(self, 'hdl_' + dic['func'])(expr)
            return found
        
        
        if hasattr(expr, 'args') and hasattr(expr.args,'__iter__'):
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

