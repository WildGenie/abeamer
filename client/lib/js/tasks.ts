"use strict";
// uuid: a54e855a-464d-4624-a7ce-fc39cb72a0f3

// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------

// Implementation of Tasks

/** @module end-user | The lines bellow convey information for the end-user */

/**
 * ## Description
 *
 * A **task** is a function executed at the beginning of `addAnimations`,
 * before selector and properties information is processed,
 * and has the following goals:
 *
 * - *Setup*: A setup allows to prepare elements for further processing.
 *     An example is text splitting. text splitting prepares DOM for individual
 *     character manipulation.
 *     Setup tasks can stop the processing of a `addAnimations`, and might not
 *     require a selector..
 *
 * - *Wrapping*: Only `addAnimations` can be stored in a JSON file or sent
 *     for remote rendering. In this case, methods such as `addStills` and scene transitions
 *     need to be wrapped in a task.
 *     Wrapping tasks can stop the processing of a `addAnimations`, and might not
 *     require a selector.
 *
 * - *Asset creation*: A task can create an asset avoiding the need of loading external
 *     assets such as svg shape files.
 *
 * - *Complex animations*: A task can simplify the creation of a complex animation.
 *
 * ## F/X
 *
 * If you just want to do a single-shot animation, use `scene.addAnimations`,
 * but if you want to reuse the animation or want to break down the complexity
 * into multiple parts, the best is to create a task.
 *
 * A task implementation is a function with the following syntax:
 * ```typescript
 * function myTaskFunc(anime: Animation, wkTask: WorkTask,
 *   params: FactoryTaskParams, stage?: uint, args?: ABeamerArgs): TaskResult;
 * ```
 * And add this task to ABeamer using `ABeamer.pluginManager.addTasks([['my-task', myTaskFunc]]);`.
 *
 * If the task just uses plain DOM, the simplest is to:
 * - inject DOM by using the animation `selector`, and then
 * ```typescript
 *     switch (stage) {
 *        case TS_INIT:
 *          const adapters = args.scene.getElementAdapters(anime.selector);
 *          elAdapters.forEach((elAdapter, elIndex) => {
 *            const html = elAdapter.getProp('html', args);
 *            const myPiece = '<div>Hello</div>';
 *            elAdapter.setProp('html', html + myPiece, args);
 *          });
 *     }
 * ```
 *
 * - inject animation properties into the pipeline by:
 * ```typescript
 *     switch (stage) {
 *        case TS_INIT:
 *          anime.props.push({ prop: 'text', value: ['hello'] });
 *     }
 * ```
 */
namespace ABeamer {

  // #generate-group-section
  // ------------------------------------------------------------------------
  //                               Tasks
  // ------------------------------------------------------------------------

  // The following section contains data for the end-user
  // generated by `gulp build-definition-files`
  // -------------------------------
  // #export-section-start: release


  // ------------------------------------------------------------------------
  //                               Task Results
  // ------------------------------------------------------------------------

  export const TR_EXIT = 0;
  export const TR_DONE = 1;
  export const TR_INTERACTIVE = 2;

  export type TaskResult = 0 | 1 | 2;

  // ------------------------------------------------------------------------
  //                               Task Stage
  // ------------------------------------------------------------------------

  export const TS_INIT = 0;
  export const TS_ANIME_LOOP = 1;
  export const TS_TELEPORT = 2;

  // ------------------------------------------------------------------------
  //                               Task Interface
  // ------------------------------------------------------------------------

  export type TaskFunc = (anime: Animation, wkTask: WorkTask,
    params?: AnyParams, stage?: uint, args?: ABeamerArgs) => TaskResult;


  export type TaskHandler = TaskName | TaskFunc;

  export type TaskName = string
    | GeneralTaskName
    | TextTaskName
    | ShapeTaskName
    | AttackTaskName
    ;


  export type TaskParams = AnyParams
    | GeneralTaskParams
    | TextTaskParams
    | ShapeTaskParams
    | AttackTaskParams
    ;


  /**
   * Parameters provided by the user during an `addAnimation`.
   */
  export interface Task {
    /** Task Name, Expression or Input Function defined by the user. */
    handler: TaskHandler;
    /** Parameters passed to the task function */
    params?: TaskParams;
  }


  /**
   * Parameters passed to a task during the execution.
   */
  export interface WorkTask {
    name: string;
    params: TaskParams;
    animeIndex: uint;
  }


  export type GeneralTaskName =
    /** @see TaskFactoryParams */
    | 'factory'
    ;


  export type GeneralTaskParams =
    | FactoryTaskParams
    ;


  export type FactoryTaskAttr = string | ExprString | number | string[] | number[];


  export interface FactoryTaskParams extends AnyParams {
    count: uint | ExprString;
    tag?: string;
    content?: FactoryTaskAttr;
    isContentFormatted?: boolean;
    attrs?: {
      name: string;
      value: FactoryTaskAttr;
      isFormatted?: boolean;
    }[];
  }

  // #export-section-end: release
  // -------------------------------

  // ------------------------------------------------------------------------
  //                               Implementation
  // ------------------------------------------------------------------------

  /** Map of the built-in path tasks, plus the ones added via plugins. */
  export const _taskFunctions: { [name: string]: TaskFunc } = {};


  export interface _WorkTask extends WorkTask {
    func: TaskFunc;
  }


  function _buildWorkTask(task: Task, anime: Animation,
    toTeleport: boolean, args: ABeamerArgs): _WorkTask {

    const handler = task.handler;
    let taskFunc: TaskFunc;
    args.user = task.params;

    switch (typeof handler) {
      case 'string':
        taskFunc = _taskFunctions[handler as string];
        break;
      case 'function':
        taskFunc = handler as TaskFunc;
        throwIfI8n(toTeleport, Msgs.NoCode);
        break;
    }

    if (!taskFunc) {
      throwI8n(Msgs.UnknownOf, { type: Msgs.task, p: handler as string });
    }

    const wkTask: _WorkTask = {
      func: taskFunc,
      name: handler as string,
      params: task.params || {},
      animeIndex: -1,
    };

    if (toTeleport) {
      task.handler = handler as string;
      taskFunc(anime, wkTask, wkTask.params, TS_TELEPORT, args);
    }

    return wkTask;
  }


  /**
   * Converts the Handlers into strings, and calls tasks on TELEPORT stage.
   */
  export function _prepareTasksForTeleporting(anime: Animation,
    tasks: Task[], args: ABeamerArgs) {

    tasks.forEach(task => { _buildWorkTask(task, anime, true, args); });
  }


  /**
   * If it returns true, this Animation is full processed
   * and the animation should be bypassed.
   */
  export function _processTasks(tasks: Task[], wkTasks: _WorkTask[],
    anime: Animation, args: ABeamerArgs): boolean {

    let toExit = true;
    tasks.forEach(task => {
      const wkTask = _buildWorkTask(task, anime, false, args);

      const taskResult = wkTask.func(anime, wkTask, wkTask.params, TS_INIT, args);
      switch (taskResult) {
        case TR_EXIT: return;
        case TR_DONE: toExit = false; break;
        case TR_INTERACTIVE:
          toExit = false;
          wkTasks.push(wkTask);
          break;
      }
    });
    return toExit;
  }


  export function _runTasks(wkTasks: _WorkTask[], anime: Animation,
    animeIndex: uint, args: ABeamerArgs) {

    wkTasks.forEach(wkTask => {
      wkTask.animeIndex = animeIndex;
      wkTask.func(anime, wkTask, wkTask.params, TS_ANIME_LOOP, args);
    });
  }

  // ------------------------------------------------------------------------
  //                               factory Task
  // ------------------------------------------------------------------------

  function _formatValue(value: FactoryTaskAttr, isFormatted: boolean | undefined,
    index: uint, args: ABeamerArgs): string {

    if (typeof value === 'object') {
      value = value[index % value.length];
    }
    if (isFormatted === false) {
      return value as string;
    }
    args.vars.i = index;
    const exprValue = ifExprCalc(value as string, args);
    return exprValue !== undefined ? exprValue.toString() :
      sprintf(value as string, index);
  }


  _taskFunctions['factory'] = _factory;

  /** Implements the Factory Task */
  function _factory(anime: Animation, wkTask: WorkTask,
    params: FactoryTaskParams, stage: uint, args: ABeamerArgs): TaskResult {

    switch (stage) {
      case TS_INIT:
        const tag = params.tag || 'div';
        const count = ifExprCalcNum(params.count as string,
          params.count as number, args);
        const needsClosing = ['img'].indexOf(tag) === -1;
        const elAdapters = args.scene.getElementAdapters(anime.selector);

        args.vars.elCount = elAdapters.length;
        elAdapters.forEach((elAdapter, elIndex) => {

          args.vars.elIndex = elIndex;
          const inTextHtml: string[] = [];
          for (let i = 0; i < count; i++) {
            const parts = ['<' + tag];
            (params.attrs || []).forEach(param => {
              const value = _formatValue(param.value, param.isFormatted, i, args);
              parts.push(` ${param.name}="${value}"`);
            });
            parts.push('>');

            parts.push(_formatValue(params.content || '',
              params.isContentFormatted, i, args));

            if (needsClosing) { parts.push(`</${tag}>`); }

            inTextHtml.push(parts.join(''));
          }
          elAdapter.setProp('html', inTextHtml.join('\n'), args);
        });
        return TR_EXIT;
    }
  }
}
