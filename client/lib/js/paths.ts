"use strict";
// uuid: 3d515a83-c625-4829-bc61-de6eb79b72cd

// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------

/** @module end-user | The lines bellow convey information for the end-user */

/**
 * ## Description
 *
 * A **path** is an interpolator function where the input is the result of the
 * oscillator interpolator after the easing interpolator usually,
 * goes from [0, 1] and the output is an list of numbers,
 * representing the n-dimensions of a path.
 * To reverse the direction path, set `value = -1` and `valueStart = 0`.
 * To follow only a segment of the path, set both `value` and `valueStart`.
 *
 * Multi-dimension paths are mutual exclusive with textual `valueList`.
 *
 * Single-dimensions paths work similar to easings and oscillators.
 * These paths use the easing to define the speed and the path
 * can create post-effects such as steps.
 * The output of the a single-path value isn't stored in the Action Link, unlike
 * the oscillator.
 *
 * A multi-dimension path can be used in the following ways:
 * - via `valueFormat`. Allows to encode that path in a single property.
 *    Used in `text-shadow`, `transform`.
 * - via dual-properties.
 *
 * ABeamer has the following built-in dual-properties:
 *
 * - Interpolate the following CSS properties for DOM Elements:
 *    * `left-top`.
 *    * `right-top`.
 *    * `left-bottom`.
 *    * `right-bottom`.
 *
 * - Interpolate n parameters via `valueFormat`.
 *  example:
 *  ```json
 * { selector: 'text-shadow',
 *   props: [{
 *     valueFormat: '%dpx %dpx 2px black',
 *     path: {
 *       handler: 'circle',
 *       params: {
 *          radius: 6px,
 *       },
 *     }
 *   }]
 * }
 *
 * - Interpolate n-dimension paths for virtual elements.
 *     Virtual Elements such as WebGL can use 3D paths to move their objects.
 *
 * @see gallery/gallery-path
 */
namespace ABeamer {

  // #generate-group-section
  // ------------------------------------------------------------------------
  //                               Paths
  // ------------------------------------------------------------------------

  // The following section contains data for the end-in
  // generated by `gulp build-definition-files`
  // -------------------------------
  // #export-section-start: release

  /**
   * Defines the type of a path function.
   * A path function is an interpolator that usually runs from [0, 1].
   * An path defines a movement in the n-space.
   */
  export type PathFunc = (t: number, params: PathParams, stage: uint,
    args?: ABeamerArgs) => number[];


  /**
   * Defines the path type, which is either string representing a predefined
   * path function or a custom function (see path function).
   * The path function interpolates from [0, 1].
   * **WARNING** At the moment, path only supports uni-dimension expression paths.
   * _Coming soon_ Multi-dimension expression paths.
   */
  export type PathHandler = PathName | string | ExprString | PathFunc;


  /** List of the built-in paths */
  export enum PathName {
    line,
    rect,
    circle,
    ellipse,
  }


  /**
   * Defines the Base parameters for every path function.
   * At the moment no parameter is required, but it can change in the future.
   */
  export type PathParams = AnyParams;


  /** Path parameters defined in an Animation Property. */
  export interface Path {

    /** Defines a Path by Name, Expression or Code Handler */
    handler: PathHandler;

    /** Params passed to the Path. Depends on the Path Type */
    params?: FuncParams
    | LinePathParams
    | RectPathParams
    | CirclePathParams
    | EllipsePathParams
    ;
  }


  export interface CenteredPathParams extends PathParams {
    centerX?: number | ExprString;
    centerY?: number | ExprString;
  }


  export interface LinePathParams extends PathParams {
    x0?: number | ExprString;
    y0?: number | ExprString;
    x1?: number | ExprString;
    y1?: number | ExprString;
  }


  export type RectPathParams = LinePathParams;


  export interface CirclePathParams extends CenteredPathParams {
    radius?: number | ExprString;
  }


  export interface EllipsePathParams extends CenteredPathParams {
    radiusX?: number | ExprString;
    radiusY?: number | ExprString;
  }

  // #export-section-end: release
  // -------------------------------

  // ------------------------------------------------------------------------
  //                               Implementation
  // ------------------------------------------------------------------------

  /** Map of the built-in path functions, plus the ones added via plugins. */
  export const _pathFunctions: { [name: string]: PathFunc } = {};

  export function _pathNumToStr(num: number) {
    return PathName[num];
  }


  export function _expressionPath(t: number, params: PathParams, stage: uint,
    args?: ABeamerArgs): number[] {
    _vars.t = t;
    return [parseFloat(
      _computeExpression((params as _WorkExprMotionParams).__expression, args) as any)];
  }

  // ------------------------------------------------------------------------
  //                               Line Path
  // ------------------------------------------------------------------------

  /** Params defined inside the props.path.params, when `props.path = 'line'` */
  export interface _WorkLinePathParams extends LinePathParams {
    _x0?: number;
    _y0?: number;
    _sx?: number;
    _sy?: number;
  }


  _pathFunctions['line'] = _linePath;

  /** Implements the Line Path */
  function _linePath(t: number, params: _WorkLinePathParams,
    stage: uint, args?: ABeamerArgs): number[] {

    if (!params._isPrepared) {
      params._x0 = ExprOrNumToNum(params.x0, 0, args);
      params._y0 = ExprOrNumToNum(params.y0, 0, args);
      params._sx = ExprOrNumToNum(params.x1, 1, args) - params._x0;
      params._sy = ExprOrNumToNum(params.y1, 1, args) - params._y0;
    }
    return [params._sx * t + params._x0, params._sy * t + params._y0];
  }

  // ------------------------------------------------------------------------
  //                               Rect Path
  // ------------------------------------------------------------------------

  /** Params defined inside the props.path.params, when `props.path = 'rect'` */
  interface _WorkRectPathParams extends RectPathParams {
    _isPrepared: boolean;
    _x0: number;
    _y0: number;
    _x1: number;
    _y1: number;
    _dx: number;
    _dy: number;
    _xSlot: number;
    _ySlot: number;
  }

  _pathFunctions['rect'] = _rectPath;

  /** Implements the Rect Path */
  function _rectPath(t: number, params: _WorkRectPathParams,
    stage: uint, args?: ABeamerArgs): number[] {

    if (!params._isPrepared) {
      params._isPrepared = true;
      params._x0 = ExprOrNumToNum(params.x0, 0, args);
      params._y0 = ExprOrNumToNum(params.y0, 0, args);
      params._x1 = ExprOrNumToNum(params.x1, 1, args);
      params._y1 = ExprOrNumToNum(params.y1, 1, args);
      params._dx = params._x1 - params._x0;
      params._dy = params._y1 - params._y0;
      const divider = 1 / (2 * (params._dx + params._dy));
      params._xSlot = params._dx * divider;
      params._ySlot = params._dy * divider;
    }

    if (t < 0) { return [params._x0, params._y0]; }
    if (t <= params._xSlot) { return [params._x0 + params._dx * t / params._xSlot, params._y0]; }
    t -= params._xSlot;
    if (t <= params._ySlot) { return [params._x1, params._y0 + params._dy * t / params._ySlot]; }
    t -= params._ySlot;
    if (t <= params._xSlot) { return [params._x1 - params._dx * t / params._xSlot, params._y1]; }
    t -= params._xSlot;
    if (t <= params._ySlot) { return [params._x0, params._y1 - params._dy * t / params._ySlot]; }
    return [params._x1, params._y1];
  }

  // ------------------------------------------------------------------------
  //                               Circle and Ellipse Path
  // ------------------------------------------------------------------------

  /** Params defined inside the props.path.params, when `props.path = 'circle'` or `ellipse` */
  interface _CirclePathParams extends CirclePathParams {
    _isPrepared: boolean;
    _roundFunc: RoundFunc;
    _radiusX: number;
    _radiusY: number;
    _centerX: number;
    _centerY: number;
  }


  /** Common Implementation of the Circle and Ellipse Path */
  function _interpolateEllipse(t: number, params: _CirclePathParams,
    radiusX: number | string, radiusY: number | string, stage: uint,
    args?: ABeamerArgs): number[] {

    if (!params._isPrepared) {
      params._isPrepared = true;
      params._centerX = ExprOrNumToNum(params.centerX, 0, args);
      params._centerY = ExprOrNumToNum(params.centerY, 0, args);
      params._radiusX = ExprOrNumToNum(radiusX, 1, args);
      params._radiusY = ExprOrNumToNum(radiusY, 1, args);
    }

    t = 2 * Math.PI * t;
    return [
      Math.cos(t) * params._radiusX + params._centerX,
      Math.sin(t) * params._radiusY + params._centerY];
  }


  _pathFunctions['circle'] = _circlePath;

  /** Implements the Circle Path */
  function _circlePath(t: number, params: _CirclePathParams,
    stage: uint, args?: ABeamerArgs): number[] {

    return _interpolateEllipse(t, params, params.radius, params.radius, stage, args);
  }


  _pathFunctions['ellipse'] = _ellipsePath;

  /** Implements the Ellipse Path */
  function _ellipsePath(t: number, params: EllipsePathParams,
    stage: uint, args?: ABeamerArgs): number[] {

    return _interpolateEllipse(t, params as _CirclePathParams,
      params.radiusX, params.radiusX, stage, args);
  }
}