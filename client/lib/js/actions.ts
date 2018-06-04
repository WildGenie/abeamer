"use strict";
// uuid: 81ec129f-b642-498a-8b8b-f719c1d3bf21

// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------

/** @module internal | This module is to be read only by developers */

/**
 * ## Description
 *
 * An **action** is an internal representation of how a property value
 * of an element will change in a specific frame.
 * Actions are the resulting tree of the `scene.addAnimations`,
 * which transform user defined animations into frames.
 * Each frame which contain `_ElActions` and each `_ElActions` contain
 * a list of `_Actions`.
 *
 * **ActionRg** is used to monitor what was the previous value of a property,
 * and each frames it can bypassed.
 */
namespace ABeamer {

  // ------------------------------------------------------------------------
  //                               Actions
  // ------------------------------------------------------------------------

  /** Data Type supported by an action numerical parameter */
  export type ActionNumValue = number | int;


  /** Data Type supported by an action */
  export type ActionValue = string | ActionNumValue;


  /**
   * Defines which value should be set for an element in a frame.
   * `toBypass` is used in case of moving into a render frame without rending.
   */
  export interface _Action {
    realPropName: string;
    propType: int;
    value: ActionValue;
    numValue: ActionNumValue;
    toBypassForward: boolean;
    toBypassBackward: boolean;
    actRg: _ActionRg;
  }


  /**
   * Defines the list of actions to be set for an element in a frame.
   */
  export interface _ElActions {
    elementAdpt: _ElementAdapter;
    actions: _Action[];
  }


  /**
   * A frame contains 0, in case of a still, or more actions to be executed
   * during rendering.
   * Each action belongs to an element.
   */
  export interface _Frame {
    elActions: _ElActions[];
  }

  // ------------------------------------------------------------------------
  //                               ActionRg
  // ------------------------------------------------------------------------

  /**
   * Defines the range of operation of an action.
   * Its main purpose is to allow an a new `addAnimation`.
   * To know the value of the previous `addAnimation` and to byPass actions.
   *
   * Two `_ActionRg` for the same property and element can't overlap each other
   */
  export interface _ActionRg {
    startFrame: uint;
    endFrame: uint;
    initialValue?: ActionNumValue;
    endValue?: ActionNumValue;
    waitFor?: WaitForList;
  }


  /**
   * List of `_ActionRg` sorted by frame.
   * This sorting is fundamental since property off-sync isn't supported.
   */
  export type _ActionRgs = _ActionRg[];


  /**
   * Defines the list of `_ActionRg` of an Element both as propName map
   * as well as indexed list.
   */
  export interface _ElActionRg {
    actionRgMap: _ActionRgMap;
    actionRgList: _ActionRgs;
    actionRg: _ActionRg;
    linkIndex: int;
  }


  /**
   * Map of `_ActionRgs` by property name.
   */
  export interface _ActionRgMap { [propName: string]: _ActionRgs; }


  /**
   * List of `_ActionRgMap`, one per element.
   *
   * `elementAdpt.getProp('uid', args)` contains the index to this list.
   */
  export type _ActionRgMaps = _ActionRgMap[];


  /**
   * Finds the previous `actionRg`, generated by a previous `addAnimation`.
   * If it exists, it links to the previous `actionRg` to a newly created `actionRg`,
   * If doesn't exist just creates a `actionRg`.
   *
   * `_findActionRg` uses `elementAdpt.getProp('uid', args)` to determine if has already
   * an ActionRg.
   */
  export function _findActionRg(
    actionRgMaps: _ActionRgMaps,
    elementAdpt: _ElementAdapter,
    propName: string,
    startFrame: uint,
    endFrame: uint,
    args: ABeamerArgs): _ElActionRg {

    const propValue = elementAdpt.getProp('uid', args) as string;
    let index = propValue !== undefined ? parseInt(propValue) : -1;
    const found = index >= 0;
    let actionRgMap: _ActionRgMap;

    if (!found) {
      index = actionRgMaps.length;
      elementAdpt.setProp('uid', index.toString(), args);
      actionRgMap = {};
      actionRgMaps.push(actionRgMap);
    } else {
      actionRgMap = actionRgMaps[index];
    }

    let actionRgList: _ActionRgs = actionRgMap[propName];

    if (!actionRgList) {
      actionRgList = [];
      actionRgMap[propName] = actionRgList;
    }

    const actionRg: _ActionRg = {
      startFrame,
      endFrame,
    };

    actionRgList.push(actionRg);

    const res: _ElActionRg = {
      actionRgMap,
      actionRgList,
      actionRg,
      linkIndex: actionRgList.length - 2,
    };

    if (res.linkIndex >= 0) {
      const lastActionRg = actionRgList[res.linkIndex];
      if (lastActionRg.endFrame >= startFrame) {
        throwErr(`overlapping property animations is not supported.` +
          `${lastActionRg.endFrame} must be higher than ${startFrame}`);
      }
    }
    return res;
  }
}
