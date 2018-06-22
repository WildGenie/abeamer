"use strict";
// uuid: e8f361d2-c6fe-4649-9fde-fe6f24fa043a

// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------

/** @module end-user | The lines bellow convey information for the end-user */

/**
 * ## Description
 *
 * An **expression** is a textual value that starts with `=`.
 * Expressions unlike Code Handlers can be defined on the `.json`
 * config file and support teleporting.
 *
 * ABeamer supports:
 *
 * - binary operators: `+`, `-`, `*`, `/`, `%` (modulus).
 *      Work both with numbers and arrays.
 *      `+` operator also concatenates textual values.
 *
 * - equality and comparison operators: `==`, `!=`, `<`, `>`, `<=`, `>=`.
 * - logical comparison: `and`, `or`.
 *      These operators transform the 2 numerical values into 0 (false) or 1 (true).
 *
 * - parenthesis: `(`, `)`.
 * - functions: @see functions
 * - textual values: delimited by single quotes.
 *     the following character strings have a special meaning:
 *       - `\'` - defines a single quote
 *       - `\n' - defines new line
 * - numerical values.
 * - numerical arrays: [x,y,z]
 * - variables.
 *
 * ## Built-in Variables
 *
 * ABeamer has the following built-in variables:
 *
 * `e` - mathematical constant 'e'.
 * `pi` - mathematical constant 'pi'.
 * `deg2rad` - `=pi/180`.
 * `rad2deg` - `=180/pi`.
 *
 * `fps` - frames per second.
 * `frameWidth` - frame output width = generated file image width.
 * `frameHeight` - frame output height = generated file image height.
 *
 *  `isTeleporting` - Is True, if it's teleporting.
 *
 *  `v0` - Computed Numerical `valueStart`.
 *  `v1` - Computed Numerical `value`.
 *  `vd` - Computed Numerical difference `value` - `valueStart`.
 *  `vt` - Computed Numerical value injected to the easing function.
 *  `vot` - Computed Numerical value injected to the oscillator function.
 *  `vpt` - Computed Numerical value injected to the path function.
 *  `t` - `t` used to interpolate an easing, oscillator or path via expression.
 * ## Examples
 *
 * `= 'A' + 'Beamer'`.
 * `= round(12.4 + ceil(50.5) / 2 * (60 % 4))`.
 * `= cos(60*deg2rad) * random()`.
 * `= iff(fps < 20, 'too few frames', 'lots of frames')`.
 * `=[2, 3] + [4, 5]`.
 */
namespace ABeamer {

  // #generate-group-section
  // ------------------------------------------------------------------------
  //                               Expressions
  // ------------------------------------------------------------------------

  // The following section contains data for the end-user
  // generated by `gulp build-definition-files`
  // -------------------------------
  // #export-section-start: release


  export interface Vars {
    e: number;
    pi: number;
    /** =pi/180 */
    deg2rad: number;
    /** =180/pi */
    rad2deg: number;

    /** Frames per second. */
    fps?: uint;
    /** Frame output width = generated file image width. */
    frameWidth?: uint;
    /** Frame output height = generated file image height. */
    frameHeight?: uint;

    /** Is True, if it's teleporting. */
    isTeleporting?: boolean;

    /** Element index of the active adapter */
    elIndex?: uint;

    /** Number of elements inside defined by the active adapter */
    elCount?: uint;

    /** Computed Numerical `valueStart`. */
    v0?: number;
    /** Computed Numerical `value`. */
    v1?: number;
    /** Computed Numerical difference `value` - `valueStart`. */
    vd?: number;
    /** Computed Numerical value injected to the easing function. */
    vt?: number;
    /** Computed Numerical value injected to the oscillator function. */
    vot?: number;
    /** Computed Numerical value injected to the path function. */
    vpt?: number;
    /** `t` used to interpolate an easing, oscillator or path via expression. */
    t?: number;
    /** Generic value. Used in Charts. */
    v?: number;
    /** Generic iterator. Used in Factories. */
    i?: int;

    [name: string]: number | string | boolean | number[];
  }


  export const enum ExprType {
    NotExpr,
    CalcOnce,
    CalcMany,
  }


  export type ExprResult = string | number | number[];

  export type ExprString = string;

  // #export-section-end: release
  // -------------------------------

  // ------------------------------------------------------------------------
  //                               Implementation
  // ------------------------------------------------------------------------

  /** Initializes the default global expression variables */
  export const _vars: Vars = {
    e: Math.E,
    pi: Math.PI,
    deg2rad: Math.PI / 180,
    rad2deg: 180 / Math.PI,
  };


  /**
   * Defines the code range for characters.
   * By default only includes the latin alphabet
   * but if functions are mapped into another characters systems,
   * it must add to this list the extra character code ranges.
   *
   */
  export const CharRanges = [
    ['A'.charCodeAt(0), 'Z'.charCodeAt(0)],
    ['a'.charCodeAt(0), 'z'.charCodeAt(0)],
  ];


  /**
   * Utility function to test if `ch` is a character.
   * It might include non-latin characters. It depends on `CharRanges`.
   * Used by developers and plugin creators.
   *
   */
  export function isCharacter(ch: string): boolean {
    const codePoint = ch.codePointAt(0);
    return CharRanges.findIndex(rg => codePoint >= rg[0] && codePoint <= rg[1]) !== -1;
  }


  /**
   * Utility function to test if it's a digit.
   * Used by developers and plugin creators.
   *
   */
  export function isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }


  /**
   * Utility function to test if it's a digit or character.
   * It might include non-latin characters. It depends on `CharRanges`.
   * Used by developers and plugin creators.
   *
   */
  export function isCharacterOrNum(ch: string): boolean {
    return isDigit(ch) || isCharacter(ch);
  }


  /**
   * Tests if `text` is an expression.
   * Used by developers and plugin creators.
   */
  export function isExpr(text: string): boolean {
    return text !== undefined && text[0] === '=';
  }

  // ------------------------------------------------------------------------
  //                               ExprParser
  // ------------------------------------------------------------------------

  const enum TokenType {
    None,
    Function,
    ArrayOpen,
    ArrayClose,
    Comma,
    ParamOpen,
    ParamClose,
    Value,
    Plus,
    Minus,
    Multiply,
    Divide,
    Mod,
    Equal,
    Different,
    Lesser,
    Greater,
    LessEqual,
    GreaterEqual,
    LogicalAnd,
    LogicalOr,
    LogicalNot,
  }


  const enum TokenClass {
    None,
    Function,
    ArrayOpen,
    ArrayClose,
    Value,
    ParamOpen,
    ParamClose,
    Unary,
    LogicalUnary,
    Binary,
    Comma,
  }


  enum Str2TokenType {
    '[' = TokenType.ArrayOpen,
    ']' = TokenType.ArrayClose,
    '(' = TokenType.ParamOpen,
    ')' = TokenType.ParamClose,
    '+' = TokenType.Plus,
    '-' = TokenType.Minus,
    '*' = TokenType.Multiply,
    '/' = TokenType.Divide,
    '%' = TokenType.Mod,
    ',' = TokenType.Comma,
    '==' = TokenType.Equal,
    '!=' = TokenType.Different,
    '<' = TokenType.Lesser,
    '>' = TokenType.Greater,
    '<=' = TokenType.LessEqual,
    '>=' = TokenType.GreaterEqual,
  }


  interface Token extends ExFuncParam {
    tkType?: TokenType;
    tkClass?: TokenClass;
    canBinOp?: boolean;
    funcParams?: ExprFuncParams;
  }

  /**
   * List of operator precedence.
   * Taken from the JavaScript operator precedence.
   */
  const opPriority: uint[] = [
    0,  // None,
    19, // Function,
    19, // ArrayOpen,
    19, // ArrayClose,
    19, // Comma,
    20, // ParamOpen,
    20, // ParamClose,
    1,  // Value,
    13,  // Plus,
    13,  // Minus,
    14,  // Multiply,
    14,  // Divide,
    14,  // Mod,
    10,  // Equal,
    10,  // Different,
    11,  // Lesser,
    11,  // Greater,
    11,  // LessEqual,
    11,  // GreaterEqual,
    6,   // LogicalAnd
    5,   // LogicalOr
    16,  // LogicalNot
  ];


  const Type2Class: TokenClass[] = [
    TokenClass.None,
    TokenClass.Function,
    TokenClass.ArrayOpen,
    TokenClass.ArrayClose,
    TokenClass.Comma,
    TokenClass.ParamOpen,
    TokenClass.ParamClose,
    TokenClass.Value,
    TokenClass.Unary,
    TokenClass.Unary,
    TokenClass.Binary,
    TokenClass.Binary,
    TokenClass.Binary,
    // equality operators
    TokenClass.Binary,
    TokenClass.Binary,
    // conditional Operators
    TokenClass.Binary,
    TokenClass.Binary,
    TokenClass.Binary,
    TokenClass.Binary,
    // Logical operators
    TokenClass.Binary,
    TokenClass.Binary,
    TokenClass.LogicalUnary,
  ];

  // ------------------------------------------------------------------------
  //                               parser
  // ------------------------------------------------------------------------

  interface ParseParams extends ExFuncReq {
    expr: string;
    pos: uint;
    token?: Token;
  }


  function parser(p: ParseParams, checkSign: boolean): TokenClass {

    let startPos;

    function setToken(aType: TokenType): void {
      p.token.sValue = expr.substring(startPos, pos);
      p.token.tkType = aType;
      p.token.tkClass = Type2Class[aType];
    }

    const expr = p.expr;
    let pos = p.pos;
    p.token.tkClass = TokenClass.None;

    do {
      let ch = expr[pos];

      while (ch === ' ') {
        ch = expr[++pos];
      }
      startPos = pos;

      if (ch === undefined) { break; }

      // vars, functions, named operators
      if (isCharacter(ch)) {
        do {
          const nextCh = expr[++pos];
          if (!nextCh || !isCharacterOrNum(nextCh)) {
            break;
          }
        } while (true);

        if (expr[pos] === '(') {
          setToken(TokenType.Function);
          const funcName = p.token.sValue;

          if (funcName === 'not') {
            p.token.tkType = TokenType.LogicalNot;
            p.token.tkClass = TokenClass.LogicalUnary;
          } else {
            pos++;
          }

        } else {
          setToken(TokenType.Value);
          const varName = p.token.sValue;
          const opNameIndex = ['not', 'and', 'or'].indexOf(varName);

          if (opNameIndex !== -1) {
            // named operators
            p.token.tkType = [TokenType.LogicalNot, TokenType.LogicalAnd,
            /**/ TokenType.LogicalOr][opNameIndex];
            p.token.tkClass = opNameIndex !== 0 ? TokenClass.Binary : TokenClass.LogicalUnary;

          } else {
            // variables
            const varValue = p.args.vars[varName];
            const varTypeOf = typeof varValue;
            if (varValue === undefined) {
              err(p, `Unknown variable ${varName}`);
            }
            if (varTypeOf === 'string') {
              p.token.paType = ExFuncParamType.String;
              p.token.sValue = varValue as string;
            } else if (varTypeOf === 'number') {
              p.token.paType = ExFuncParamType.Number;
              p.token.numValue = varValue as number;
              p.token.sValue = undefined;
              p.token.arrayValue = undefined;
            } else if (varTypeOf === 'object' && Array.isArray(varValue)) {
              p.token.paType = ExFuncParamType.Array;
              p.token.arrayValue = varValue as number[];
              p.token.sValue = undefined;
              p.token.numValue = undefined;
            } else if (varTypeOf === 'boolean') {
              p.token.paType = ExFuncParamType.Number;
              p.token.numValue = (varValue as boolean) ? 1 : 0;
              p.token.sValue = undefined;
              p.token.arrayValue = undefined;
            } else {
              err(p, `Unsupported type of ${varName}`);
            }
          }
        }
        break;
      }

      // number sign
      if (checkSign && ((ch === '-' || ch === '+') && isDigit(expr[pos + 1]))) {
        ch = expr[++pos];
      }

      // numbers
      if (isDigit(ch)) {
        do {
          ch = expr[++pos];
        } while (ch && (isDigit(ch) || ch === '.'));
        setToken(TokenType.Value);
        p.token.paType = ExFuncParamType.Number;
        p.token.numValue = parseFloat(p.token.sValue);
        p.token.sValue = undefined;
        break;
      }

      // strings
      if (ch === "'") {
        let prevCh: string;
        do {
          prevCh = ch;
          ch = expr[++pos];
        } while ((ch !== "'" || prevCh === '\\') && ch !== undefined);
        startPos++;
        setToken(TokenType.Value);
        p.token.sValue = p.token.sValue.replace(/\\([n'])/g, (all, meta) => {
          switch (meta) {
            case 'n': return '\n';
            case "'": return "'";
          }
        });
        p.token.paType = ExFuncParamType.String;
        pos++;
        break;
      }

      // equality and comparison
      if ('=!<>'.indexOf(ch) !== -1 && expr[pos + 1] === '=') {
        ch = ch + '=';
        pos++;
      }

      // symbols
      const type = Str2TokenType[ch] || TokenType.None;
      if (type === TokenType.None) {
        err(p, `Unknown token ${ch} in position ${pos}`, p.token);
      }
      pos++;
      setToken(type);
      break;
    } while (true);

    const tkClass = p.token.tkClass;
    p.pos = pos;
    // @ts-ignore   TypeScript bug :-(
    p.token.canBinOp = tkClass === TokenClass.Unary || tkClass === TokenClass.Binary;
    return tkClass;
  }

  // ------------------------------------------------------------------------
  //                               Execute Expression Function
  // ------------------------------------------------------------------------

  function _execExprFunction(p: ParseParams, funcToken: Token): Token {

    const funcName = funcToken.sValue;
    const func = _exFunctions[funcName];
    if (!func) {
      err(p, `Unknown function: ${funcName}`, funcToken);
    }

    const res: Token = {
      canBinOp: false,
      tkClass: TokenClass.Value,
      tkType: TokenType.Value,
    };

    p.res = res;
    p.token = funcToken;
    func(funcToken.funcParams, p);
    return res;
  }

  // ------------------------------------------------------------------------
  //                               Execute Array
  // ------------------------------------------------------------------------

  function _execArray(p: ParseParams, funcToken: Token): Token {

    const res: Token = {
      paType: ExFuncParamType.Array,
      sValue: undefined,
      numValue: undefined,
      arrayValue: funcToken.funcParams.map(param => {
        return param.numValue;
      }),
      canBinOp: false,
      tkClass: TokenClass.Value,
      tkType: TokenType.Value,
    };
    return res;
  }

  // ------------------------------------------------------------------------
  //                               State Machine
  // ------------------------------------------------------------------------

  // @TODO: Implement logical Not
  function _stateMachine(p: ParseParams): ExprResult {

    const enum States {
      IdAndUnary,
      NoUnary,
      Binary,
    }

    const stack: Token[] = [];
    let state = States.IdAndUnary;
    let token: Token;
    let op: Token;

    /** stack.length - 1 */
    let stackLast = -1;

    /**  startPoints[startPoints.length-1] */
    let startPoint: uint = 0;

    /** list of indexes to the stack element after for each 'func', '(' and ',' */
    const startPoints: uint[] = [];

    p.req = p;

    function push(): void {
      stack.push(token);
      stackLast++;
    }

    function pop(): Token {
      const tk = stack[stackLast];
      stack.length = stackLast;
      stackLast--;
      return tk;
    }

    function calcStackLeft(): void {
      // startPoint = 0;
      while (stackLast > 1 && stackLast > startPoint + 1) {
        op = stack[startPoint + 1];
        if (!op.canBinOp) {
          break;
        }
        const t1 = stack[startPoint];
        const t2 = stack[startPoint + 2];
        _calcBinary(p, op, t1, t2);
        stack.splice(startPoint + 1, 2);
        stackLast -= 2;
      }
    }

    function calcStackRight(): void {
      while (stackLast > 2) {
        op = stack[stackLast - 1];
        if (!op.canBinOp) {
          break;
        }
        const t1 = stack[stackLast - 2];
        const t2 = stack[stackLast];
        const prevOp = stack[stackLast - 3];
        if (_comparePriority(op, prevOp)) {
          _calcBinary(p, op, t1, t2);
          stack.length = stackLast - 1;
          stackLast -= 2;
        } else {
          break;
        }
      }
    }

    function onCloseParamOrArrayOrFunc(): void {
      calcStackLeft();
      if (startPoint !== stackLast) {
        err(p, '', token);
      }
      token = stack.pop();
      stackLast--;
    }


    do {
      p.token = {};

      const thisTkClass = parser(p, state !== States.Binary);
      token = p.token;
      if (thisTkClass === TokenClass.None) {
        break;
      }

      switch (thisTkClass) {
        case TokenClass.Value:

          if (state === States.Binary) {
            err(p, '', token);
          } else if (state === States.NoUnary
            && [TokenClass.Unary, TokenClass.LogicalUnary].indexOf(stack[stackLast].tkClass) !== -1
            && (stackLast === 0 || stack[stackLast - 1].tkClass !== TokenClass.Value)) {
            state = States.IdAndUnary;
            op = pop();
            _calcUnary(p, op, token);
          }

          state = States.Binary;
          push();
          calcStackRight();
          break;

        case TokenClass.ArrayOpen:
        // flows to TokenClass.Function
        case TokenClass.Function:
          token.funcParams = [];
        // flows to TokenClass.ParamOpen
        case TokenClass.ParamOpen:
          if (state === States.Binary) { err(p, '', token); }
          push();
          startPoint = stackLast + 1;
          startPoints.push(startPoint);
          state = States.IdAndUnary;
          break;

        case TokenClass.Comma:
        case TokenClass.ParamClose:
        case TokenClass.ArrayClose:

          if (!startPoint) {
            err(p, `Missing starting parenthesis`, token);
          }

          const funcToken = stack[startPoint - 1];
          const isTokenComma = thisTkClass === TokenClass.Comma;
          const isFunc = funcToken.tkClass === TokenClass.Function;
          const isArray = funcToken.tkClass === TokenClass.ArrayOpen;

          if (isTokenComma && !isFunc && !isArray) {
            err(p, `Missing function`, token);
          }

          if ((isFunc || isArray) && !isTokenComma) {

            // function code
            if (startPoint !== stackLast + 1) { // in case there are 0 parameters
              onCloseParamOrArrayOrFunc();
              funcToken.funcParams.push(token);
            }

            if (isFunc) {
              token = _execExprFunction(p, funcToken);
            } else {
              token = _execArray(p, funcToken);
            }

          } else {

            // not a function
            onCloseParamOrArrayOrFunc();
          }

          if (!isTokenComma) {
            stack[stackLast] = token;
            startPoints.pop();
            startPoint = startPoints[startPoints.length - 1] || 0;
            state = States.Binary;
          } else {
            funcToken.funcParams.push(token);
            state = States.IdAndUnary;
          }
          break;

        case TokenClass.LogicalUnary:
        case TokenClass.Unary:
          if (state === States.IdAndUnary) {
            if (thisTkClass === TokenClass.Unary) {
              state = States.NoUnary;
            }
            push();
            break;
          }
        // it flows to TokenClass.Binary
        case TokenClass.Binary:
          if (state !== States.Binary) {
            err(p, '', token);
          }
          if (stackLast > 0 && stack[stackLast].tkClass === TokenClass.Value) {
            op = stack[stackLast - 1];
            if (op.canBinOp && _comparePriority(op, token)) {
              calcStackLeft();
            }
          }
          state = States.NoUnary;
          push();
          break;
      }
    } while (true);
    calcStackLeft();

    // #debug-start
    if (p.args.isVerbose) {
      token = stack.length > 0 ? stack[0] : { paType: ExFuncParamType.String };
      const v = _valueOfToken(token);
      p.args.story.logFrmt('expression', [
        ['expression', p.expr],
        ['value', v.toString()],
        ['stack.length', stack.length],
        ['stack', JSON.stringify(stack, undefined, 2)]]);
    }
    // #debug-end


    if (stack.length !== 1) {
      err(p, `Stack not empty`);
    }

    token = stack[0];
    if (stack[stackLast].tkClass !== TokenClass.Value) {
      err(p, 'Not a value');
    }

    return _valueOfToken(token);
  }


  function _valueOfToken(token: Token): ExprResult {
    return token.paType === ExFuncParamType.String ? token.sValue
      : token.paType === ExFuncParamType.Array ? token.arrayValue : token.numValue;
  }

  // ------------------------------------------------------------------------
  //                               Error Handling
  // ------------------------------------------------------------------------

  /** Throws a localized error */
  function err(p: ParseParams, msg?: string, value?: Token): void {
    throwI8n(Msgs.ExpHasErrors, { e: p.expr, err: msg || '' });
  }


  /**
   * Checks if the function parameter count matches the parameters expected,
   * and if their types match the expected.
   */
  function _checkFuncParams(req: ParseParams, paramCount: uint,
    paramTypes?: ExFuncParamType[]): void {

    const params = req.token.funcParams;
    if (paramCount >= 0 && params.length !== paramCount) {
      err(req, i8nMsg(Msgs.WrongNrParams, { p: req.token.sValue }));
    }

    if (paramTypes) {
      paramTypes.forEach((paramType, index) => {
        const pi = params[index];
        if (!pi || (pi.paType !== paramType && paramType !== ExFuncParamType.Any)) {
          err(req, i8nMsg(Msgs.WrongParamType, { p: req.token.sValue, i: index }));
        }
      });
    }
  }

  // ------------------------------------------------------------------------
  //                               Tools
  // ------------------------------------------------------------------------

  /** Compares operators priority. */
  function _comparePriority(op1: Token, op2: Token): boolean {
    return opPriority[op1.tkType] >= opPriority[op2.tkType];
  }

  // ------------------------------------------------------------------------
  //                               Compute
  // ------------------------------------------------------------------------

  /** Computes unary operators. */
  function _calcUnary(p: ParseParams, op: Token, value: Token): void {
    if (value.paType !== ExFuncParamType.Number) {
      err(p, Msgs.UnaryErr, op);
    }

    if (op.tkType === TokenType.Minus) {
      value.numValue = -value.numValue;
    } else if (op.tkType === TokenType.LogicalNot) {
      value.numValue = value.numValue ? 0 : 1;
    }
  }


  /** Computes binary operators. */
  function _calcBinary(p: ParseParams, op: Token, value1: Token, value2: Token): void {

    const AnyNotNumber = value1.paType !== ExFuncParamType.Number
      || value2.paType !== ExFuncParamType.Number;
    const is1stArray = value1.paType === ExFuncParamType.Array;
    const is2ndArray = value2.paType === ExFuncParamType.Array;
    const isArray = is1stArray && is2ndArray;

    function NumbersOnly() {
      if (AnyNotNumber) {
        err(p, 'This op only supports numbers', value1);
      }
    }

    let v: number;

    function execOp(f: (a: number, b: number) => number,
      allowOther?: boolean): boolean {

      if (is1stArray || is2ndArray) {

        if (!is1stArray || !is2ndArray) {
          throwErr(`Can only add 2 arrays`);
        }

        if (value1.arrayValue.length !== value2.arrayValue.length) {
          throwErr(`Both arrays must have the same value`);
        }

        value1.arrayValue.forEach((v1, index) => {
          value1.arrayValue[index] = f(v1, value2.arrayValue[index]);
        });
        value1.paType = ExFuncParamType.Array;
        v = undefined;

      } else {

        if (AnyNotNumber) {
          if (allowOther) {
            return false;
          } else { NumbersOnly(); }

        } else {
          v = f(value1.numValue, value2.numValue);
        }
      }
      return true;
    }


    switch (op.tkType) {
      case TokenType.Plus:
        if (!execOp((a, b) => a + b, true)) {
          value1.sValue =
            (value1.paType === ExFuncParamType.Number
              ? value1.numValue.toString() : value1.sValue)
            + (value2.paType === ExFuncParamType.Number
              ? value2.numValue.toString() : value2.sValue);
          value1.paType = ExFuncParamType.String;
          return;
        }
        break;
      case TokenType.Minus:
        execOp((a, b) => a - b);
        break;
      case TokenType.Multiply:
        execOp((a, b) => a * b);
        break;
      case TokenType.Divide:
        execOp((a, b) => a / b);
        break;
      case TokenType.Mod:
        execOp((a, b) => a % b);
        break;
      case TokenType.Equal:
        NumbersOnly();
        v = value1.numValue === value2.numValue ? 1 : 0;
        break;
      case TokenType.Different:
        NumbersOnly();
        v = value1.numValue !== value2.numValue ? 1 : 0;
        break;
      case TokenType.Lesser:
        NumbersOnly();
        v = value1.numValue < value2.numValue ? 1 : 0;
        break;
      case TokenType.Greater:
        NumbersOnly();
        v = value1.numValue > value2.numValue ? 1 : 0;
        break;
      case TokenType.LessEqual:
        NumbersOnly();
        v = value1.numValue <= value2.numValue ? 1 : 0;
        break;
      case TokenType.GreaterEqual:
        NumbersOnly();
        v = value1.numValue >= value2.numValue ? 1 : 0;
        break;
      case TokenType.LogicalAnd:
        NumbersOnly();
        v = value1.numValue && value2.numValue ? 1 : 0;
        break;
      case TokenType.LogicalOr:
        NumbersOnly();
        v = value1.numValue || value2.numValue ? 1 : 0;
        break;
    }
    value1.numValue = v;
  }

  // ------------------------------------------------------------------------
  //                               Public Functions
  // ------------------------------------------------------------------------

  /**
   * Calculates an expression.
   * Expects the input to be an expression.
   * Used mostly by plugin creators and developers.
   */
  export function calcExpr(expr: string, args: ABeamerArgs): ExprResult {

    return _stateMachine({
      args,
      checkParams: _checkFuncParams,
      expr,
      pos: 1,
    });
  }


  /**
   * If it's an expression, it computes its value.
   * Returns undefined if it's not an expression.
   * Used mostly by plugin creators and developers.
   */
  export function ifExprCalc(expr: string,
    args: ABeamerArgs): ExprResult | undefined {

    return isExpr(expr) ? calcExpr(expr, args) : undefined;
  }


  /**
   * If it's an expression, it computes its value and returns its numerical value.
   * Returns `defNumber` if it's not an expression.
   * Used mostly by plugin creators and developers.
   */
  export function ifExprCalcNum(expr: string, defNumber: number | undefined,
    args: ABeamerArgs): number | undefined {

    if (!isExpr(expr)) { return defNumber; }

    const exprValue = calcExpr(expr, args);
    if (args.isStrict && exprValue !== undefined && typeof exprValue !== 'number') {
      throwI8n(Msgs.MustBeANumber, { p: expr });
    }
    return exprValue !== undefined ? parseFloat(exprValue as string) : defNumber;
  }


  /**
   * If it's an expression, it computes its value and returns its numerical value.
   * Returns `defNumber` if it's not an expression.
   * Used mostly by plugin creators and developers.
   */
  export function ifExprCalcStr(expr: string, defString: string | undefined,
    args: ABeamerArgs): string | undefined {

    if (!isExpr(expr)) { return defString; }

    const exprValue = calcExpr(expr, args);
    if (args.isStrict && exprValue !== undefined && typeof exprValue !== 'string') {
      throwI8n(Msgs.MustBeAString, { p: expr });
    }
    return exprValue !== undefined ? exprValue as string : defString;
  }


  /**
   * Checks if it's an expression, if it is, it computes and returns
   * the value as a number. Otherwise, returns the parameter as a number.
   * Used mostly by plugin creators and developers.
   */
  export function ExprOrNumToNum(param: ExprString | number,
    defValue: number | undefined, args: ABeamerArgs): number | undefined {

    if (args.isStrict && param !== undefined) {
      const typeofP = typeof param;
      if (typeofP !== 'string' && typeofP !== 'number') {
        throwI8n(Msgs.MustBeANumberOrExpr, { p: param });
      }
    }

    return ifExprCalcNum(param as string,
      param !== undefined ? param as number : defValue, args);
  }


  /**
   * Checks if it's an expression, if it is, it computes and returns
   * the value as a number. Otherwise, returns the parameter as a number.
   * Used mostly by plugin creators and developers.
   */
  export function ExprOrStrToStr(param: ExprString | string,
    defValue: string | undefined, args: ABeamerArgs): string | undefined {

    if (args.isStrict && param !== undefined) {
      const typeofP = typeof param;
      if (typeofP !== 'string') {
        throwI8n(Msgs.MustBeAStringOrExpr, { p: param });
      }
    }

    return ifExprCalcStr(param as string,
      param !== undefined ? param as string : defValue, args);
  }
}
