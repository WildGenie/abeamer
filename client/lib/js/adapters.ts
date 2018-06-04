"use strict";
// uuid: f3413d18-79c1-4c02-92c6-8ecef7f9da79

// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------

// Implementation of ElementAdapters and SceneAdapters in order to
// support DOM Elements/Scenes and virtual Elements/Scenes

/** @module end-user | The lines bellow convey information for the end-user */

/**
 * ## Description
 *
 * An **adapter** allows ABeamer to decouple from DOM by serving as an agent
 * between the ABeamer library and elements and scenes.
 *
 * For DOM adapters, ABeamer uses `jQuery` to query DOM and
 * maps special properties such `text` and `html` to
 * `textContent` and `innerHTML`.
 *
 * DOM adapters map [DOM Properties](DOM Property) into either HtmlElement attributes
 * or CSS properties, depending on the Animation Property name.
 *
 * For HtmlElement attributes, the DOM Adapter uses `element.getAttribute`.
 * For CSS Properties, it uses `element.style`, but if it's empty,
 * it retrieves all the computed CSS properties via `window.getComputedStyle`
 * and caches its content.
 *
 * DOM Adapters use the attribute `data-abeamer-display` to define which
 * value will be used in `display` when visible is set to true.
 * If it's not defined, it will be set to `inline` for `span` tags,
 * and `block` for all the other tags.
 *
 * 'DOM Scenes' are typically a DIV. 'DOM Elements' can be any HtmlElement.
 *
 * 'DOM Scenes' can provide Virtual Elements via ids starting with `%`,
 * and `story.onGetVirtualElement`.
 *
 * For Virtual adapters there is a direct connection to the Virtual Element
 * and Scene property.
 *
 * Unlike DOM elements which only provide textual values, Virtual Elements can
 * get and set numerical values.
 */
namespace ABeamer {

  // #generate-group-section
  // ------------------------------------------------------------------------
  //                               Elements
  // ------------------------------------------------------------------------

  // The following section contains data for the end-user
  // generated by `gulp build-definition-files`
  // -------------------------------
  // #export-section-start: release

  /**
   * Defines the special names for [Adapter properties](#Adapter property) names.
   */
  export type SpecialAdapterPropName =
    // modifies the textContent property.
    'text'
    // same as text. It's preferable to use 'text'.
    | 'textContent'

    // modifies the innerHTML attribute.
    | 'html'
    // same as html. It's preferable to use 'html'.
    | 'innerHTML'
    // modifies outerHTML attribute.
    | 'outerHTML'
    // changes the style.display CSS property for DOM Elements/Scenes.
    // Uses DOM attribute `data-abeamer-display`.
    | 'visible'
    // modifies the attribute `src`.
    | 'src'
    // modifies the `classList` if it has `+` or `-` if has it starts a class.
    // otherwise it sets `className`.
    | 'class'
    ;


  /**
   * Dual properties are properties that map one animation property into 2 [](DOM properties).
   */
  export type DualPropName = 'left-top'
    | 'right-top'
    | 'left-bottom'
    | 'right-bottom';


  /**
   * List of Property Names that a DOM or Virtual Element should support.
   */
  export type ElPropName = string
    | 'id'
    | 'visible'
    | 'uid'
    | 'data-abeamer-display'
    ;


  /**
   * List of Property Names that a DOM or Virtual Scene should support.
   */
  export type ScenePropName = string
    | 'html'
    | 'left'
    | 'top'
    | 'width'
    | 'height'
    /** If this value is set, it will for `Visible=true` */
    | 'data-abeamer-display'
    ;


  /**
   * List of Property Names that a DOM or Virtual Story should support.
   */
  export type StoryPropName = string
    | 'frame-width'
    | 'frame-height'
    /** clip-path is a set only. see CSS clip-story properties  */
    | 'clip-path'
    | 'fps'
    ;


  /**
   * Union of Property Names that a DOM or Virtual Adapter should support.
   */
  export type PropName = string
    | ElPropName
    | ScenePropName
    | StoryPropName
    | SpecialAdapterPropName
    | DualPropName
    ;


  /**
   * Although, DOM only returns string values, a virtual Element can use
   * more rich data types.
   * e.g. DOM adapter maps a boolean `visible` into CSS display.
   * A virtual element can use directly booleans.
   */
  export type PropValue = string | number | int | boolean;


  export enum WaitForWhat {
    Custom,
    ImageLoad,
    MediaSync,
  }


  export interface WaitFor {
    prop: PropName;
    value?: string | number;
    what?: WaitForWhat;
  }


  export type WaitForList = WaitFor[];


  /**
   * Base interface for virtual elements such as WebGL, Canvas or Task animator.
   */
  export interface VirtualElement {

    getProp(name: PropName, args?: ABeamerArgs): PropValue;
    setProp(name: PropName, value: PropValue, args?: ABeamerArgs): void;
    waitFor?(waitFor: WaitFor, onDone: DoneFunc, args?: ABeamerArgs): void;
  }


  export type PElement = HTMLElement | VirtualElement;

  // ------------------------------------------------------------------------
  //                               Scene Selectors
  // ------------------------------------------------------------------------

  /**
   * Base interface for virtual scenes such as WebGL, Canvas.
   */
  export interface VirtualScene {


    /**
     * Must support `id` and `visible` attributes.
     */
    getProp(name: PropName, args?: ABeamerArgs): string;


    /**
     * Must support `visible` and `uid` attributes.
     */
    setProp(name: PropName, value: string, args?: ABeamerArgs): void;


    /**
     * Must call iterator for each element represented on the selector.
     *
     * @param selector CSS style selectors
     */
    query(selector: string,
      iterator: (element: PElement, index: uint) => void);
  }


  /**
   * Scene Selector defined by the user.
   */
  export type SceneSelector = string | JQuery | VirtualScene;

  // ------------------------------------------------------------------------
  //                               Element Selector
  // ------------------------------------------------------------------------

  /**
   * Defines css selectors, JQuery, meta-selectors, and Virtual selectors.
   * Virtual selectors start with `%`.
   */
  export type ElSelector = JQuery
    // (DOM or virtual) selectors
    | string
    // list of (DOM or virtual) elements ids
    | string[]
    // list of html elements
    | HTMLElement[]
    // list of virtual elements
    | VirtualElement[]
    // An pEls containing elements
    | pEls
    ;


  /**
   * User defined function that return an Element Selector.
   * Doesn't supports remote rendering.
   */
  export type ElSelectorFunc = (args?: ABeamerArgs) => ElSelector;


  /**
   * Element Selector defined by the user.
   */
  export type ElSelectorHandler = ElSelector | ElSelectorFunc;


  // ------------------------------------------------------------------------
  //                               Browser
  // ------------------------------------------------------------------------

  export interface Browser {

    vendorPrefix: string;
    prefixedProps: string[];
  }


  export const browser: Browser = {
    vendorPrefix: '',
    prefixedProps: [],
  };

  // #export-section-end: release
  // -------------------------------

  // ------------------------------------------------------------------------
  //                               Implementation
  // ------------------------------------------------------------------------

  /* ---- Animation Property Type ---- */
  export const DPT_ID = 0;
  export const DPT_VISIBLE = 1;
  export const DPT_ATTR = 2;
  export const DPT_ATTR_FUNC = 3;
  export const DPT_STYLE = 4;
  export const DPT_PIXEL = 5;
  export const DPT_DUAL_PIXELS = 6;
  export const DPT_CLASS = 7;
  export const DPT_MEDIA_TIME = 8;
  export const DPT_SRC = 9;

  /**
   * Maps user property names to DOM property names.
   *
   * In general, property names represent style attributes.
   * This map is used to handle the special cases.
   */
  const domPropMapper: { [name: string]: [uint, any] } = {
    'uid': [DPT_ATTR_FUNC, 'data-abeamer'],
    'id': [DPT_ATTR, 'id'],
    'html': [DPT_ATTR, 'innerHTML'],
    'text': [DPT_ATTR, 'textContent'],
    'innerHTML': [DPT_ATTR, 'innerHTML'],
    'outerHML': [DPT_ATTR, 'outerHML'],
    'textContent': [DPT_ATTR, 'textContent'],
    'currentTime': [DPT_MEDIA_TIME, 'currentTime'],
    'src': [DPT_SRC, 'src'],
    'class': [DPT_CLASS, 'className'],
    'visible': [DPT_VISIBLE, ''],
    'left': [DPT_PIXEL, 'left'],
    'right': [DPT_PIXEL, 'right'],
    'bottom': [DPT_PIXEL, 'bottom'],
    'top': [DPT_PIXEL, 'top'],
    'width': [DPT_PIXEL, 'width'],
    'height': [DPT_PIXEL, 'height'],
    'left-top': [DPT_DUAL_PIXELS, ['left', 'top']],
    'right-top': [DPT_DUAL_PIXELS, ['right', 'top']],
    'left-bottom': [DPT_DUAL_PIXELS, ['left', 'bottom']],
    'right-bottom': [DPT_DUAL_PIXELS, ['right', 'bottom']],
  };


  /**
   * Used to map css Properties due the differences between the web browser
   * used to build the animation and the web browser used to render the image.
   */
  const cssPropNameMapper: { [name: string]: string; } = {};


  /**
   * Maps attribute names when server doesn't supports a certain attribute.
   *
   * e.g.
   * Chrome has already the support for transform css attribute,
   * but phantomJS uses Chromium which only supports via webKit prefix.
   *
   * @see server-features
   */
  export function _addServerDOMPropMaps(map: { [name: string]: string }) {
    Object.keys(map).forEach(name => { cssPropNameMapper[name] = map[name]; });
  }

  // ------------------------------------------------------------------------
  //                               _AbstractAdapter
  // ------------------------------------------------------------------------

  /**
   * Base class for all adapters: Element, Scene, Story,
   * and both DOM and virtual.
   */
  export abstract class _AbstractAdapter implements AbstractAdapter {

    isVirtual: boolean;

    abstract getProp(name: PropName, args?: ABeamerArgs): PropValue;
    abstract setProp(name: PropName, value: PropValue, args?: ABeamerArgs): void;
    waitFor?(waitItem: WaitFor, onDone: DoneFunc, args?: ABeamerArgs): void { }
  }

  // ------------------------------------------------------------------------
  //                               _ElementAdapter
  // ------------------------------------------------------------------------

  /**
   * Base class for Element adapters both DOM and virtual.
   */
  export abstract class _ElementAdapter extends _AbstractAdapter implements ElementAdapter {

    constructor(element: PElement) { super(); }
    getId(args?: ABeamerArgs): string { return this.getProp('id', args) as string; }
    _clearComputerData(): void { }
  }

  // ------------------------------------------------------------------------
  //                               _DOMAdapter
  // ------------------------------------------------------------------------

  interface _DOMAdapter {
    htmlElement: HTMLElement;
    compStyle: CSSStyleDeclaration;
    getComputedStyle(): any;
  }

  function _setDOMProp(adapter: _DOMAdapter,
    propName: PropName, value: PropValue, args?: ABeamerArgs): void {

    const [propType, domPropName] = domPropMapper[propName]
      || [DPT_STYLE, propName];
    const element = adapter.htmlElement;

    switch (propType) {
      case DPT_CLASS:
        if (value && (value as string).search(/(?:^| )[\-+]/) !== -1) {
          (value as string).split(/\s+/).forEach(aClass => {
            const first = aClass[0];
            if (first === '-') {
              element.classList.remove(aClass.substr(1));
            } else if (first === '+') {
              element.classList.add(aClass.substr(1));
            } else {
              element.classList.add(aClass);
            }
          });
          break;
        }
      // flows to `DPT_ID`.
      case DPT_ID:
      // flows to `DPT_ATTR`.
      case DPT_ATTR: element[domPropName] = value; break;
      case DPT_MEDIA_TIME:
        _waitForMediaSync(element as HTMLMediaElement, args, value as number);
        break;

      case DPT_VISIBLE:
        const defDisplay = element['data-abeamer-display'];
        const curDisplay = element.style.display || adapter.getComputedStyle()['display'];
        if (value !== false && value !== 'false' && value !== 0) {
          if (curDisplay === 'none') {
            element.style.display =
              defDisplay || (element.tagName === 'SPAN'
                ? 'inline' : 'block');
          }
        } else {
          if (!defDisplay) {
            element['data-abeamer-display'] = curDisplay;
          }
          element.style.display = 'none';
        }
        break;

      case DPT_SRC:
      // flows to DPT_ATTR_FUNC
      case DPT_ATTR_FUNC:
        element.setAttribute(domPropName, value as string);
        if (propType === DPT_SRC && element.tagName === 'IMG') {
          _waitForImageLoad(element as HTMLImageElement, args);
        }
        break;

      case DPT_STYLE:
        const cssPropName = cssPropNameMapper[domPropName] || domPropName;
        element.style[cssPropName] = value as string;
        break;

      case DPT_PIXEL:
        element.style[domPropName] = typeof value === 'number'
          ? value + 'px' : value as string;
        break;

      case DPT_DUAL_PIXELS:
        const values = (value as string).split(',');
        (domPropName as string[]).forEach((propNameXY, index) => {
          element.style[propNameXY] = values[index] + 'px';
        });
        break;
    }
  }


  function _NullToUnd(v: any): any {
    return v === null ? undefined : v;
  }


  function _getDOMProp(adapter: _DOMAdapter,
    propName: PropName, args?: ABeamerArgs): PropValue {

    const [propType, domPropName] = domPropMapper[propName]
      || [DPT_STYLE, propName];

    switch (propType) {
      case DPT_MEDIA_TIME:
      // flows to `DPT_CLASS`.
      case DPT_CLASS:
      // flows to `DPT_ID`.
      case DPT_ID:
      // flows to `DPT_ATTR`.
      case DPT_ATTR: return _NullToUnd(adapter.htmlElement[domPropName]);

      case DPT_VISIBLE:
        const value = adapter.htmlElement.style.display || adapter.getComputedStyle()['display'];
        return (value === '' || value !== 'none') ? true : false;

      case DPT_SRC:
      // flows to DPT_ATTR_FUNC
      case DPT_ATTR_FUNC: return _NullToUnd(adapter.htmlElement.getAttribute(domPropName));
      case DPT_PIXEL:
      case DPT_STYLE:
        const cssPropName = cssPropNameMapper[domPropName] || domPropName;
        return adapter.htmlElement.style[cssPropName]
          || adapter.getComputedStyle()[cssPropName];
    }
  }

  // ------------------------------------------------------------------------
  //                               _DOMElementAdapter
  // ------------------------------------------------------------------------

  /**
   * DOM Element adapter.
   * Gets and sets attributes from HTMLElements.
   * Maps the ABeamer animation property names into DOM attributes.
   */
  export class _DOMElementAdapter extends _ElementAdapter implements _DOMAdapter {

    htmlElement: HTMLElement;
    compStyle: CSSStyleDeclaration;

    constructor(element: PElement) {
      super(element);
      this.isVirtual = false;
      this.htmlElement = element as HTMLElement;
    }


    /**
     * Requests the DOM engine the calculated information for CSS property.
     */
    getComputedStyle(): any {
      let compStyle = this['__compStyle'];
      if (!compStyle) {
        compStyle = window.getComputedStyle(this.htmlElement);
        this['__compStyle'] = compStyle;
      }
      return compStyle;
    }


    getProp(propName: PropName, args?: ABeamerArgs): PropValue {
      return _getDOMProp(this, propName, args);
    }


    setProp(propName: PropName, value: PropValue, args?: ABeamerArgs): void {
      _setDOMProp(this, propName, value, args);
    }


    _clearComputerData(): void {
      // @TODO: Discover to clear data when is no longer used
      // this.compStyle = undefined;
    }

    waitFor?(waitFor: WaitFor, onDone: DoneFunc, args?: ABeamerArgs): void {
      switch (waitFor.what) {
        case WaitForWhat.ImageLoad:
          _waitForImageLoad(this.htmlElement as HTMLImageElement, args);
          break;
        case WaitForWhat.MediaSync:
          _waitForMediaSync(this.htmlElement as HTMLMediaElement, args,
            waitFor.value as number);
          break;
      }
    }
  }

  // ------------------------------------------------------------------------
  //                               _SVGElementAdapter
  // ------------------------------------------------------------------------

  /** This feature is not implemented yet..._Coming soon_ . */
  class _SVGElementAdapter extends _ElementAdapter {

  }

  // ------------------------------------------------------------------------
  //                               _VirtualElementAdapter
  // ------------------------------------------------------------------------

  /**
   * Virtual Element adapter.
   * Allows ABeamer to decouple from the details of any virtual element.
   */
  class _VirtualElementAdapter extends _ElementAdapter {

    vElement: VirtualElement;

    constructor(element: PElement) {
      super(element);
      this.isVirtual = true;
      this.vElement = element as VirtualElement;
    }


    getProp(propName: PropName, args?: ABeamerArgs): PropValue {
      return this.vElement.getProp(propName, args);
    }


    setProp(propName: PropName, value: PropValue, args?: ABeamerArgs): void {
      this.vElement.setProp(propName, value, args);
    }

    waitFor?(waitItem: WaitFor, onDone: DoneFunc, args?: ABeamerArgs): void {
      this.vElement.waitFor(waitItem, onDone, args);
    }
  }

  // ------------------------------------------------------------------------
  //                               Global Utility Functions
  // ------------------------------------------------------------------------

  /**
   * Returns true if the element is Virtual.
   */
  export const _isElementVirtual = (element: PElement): boolean =>
    (element as VirtualElement).getProp !== undefined;


  /**
   * Returns true if the id is Virtual.
   */
  export const _isIdVirtual = (id: string): boolean => id[0] === '%';


  /**
   * Safely retrieves the Virtual Element from `story.onGetVirtualElement`.
   */
  export function _getVirtualElement(story: _StoryImpl,
    fullId: string): PElement {

    if (!story.onGetVirtualElement) {
      throwErr(`Story must have onGetVirtualElement to support virtual elements mapping`);
    }
    return story.onGetVirtualElement(fullId.substr(1), story._args);
  }

  // ------------------------------------------------------------------------
  //                               SceneAdapter
  // ------------------------------------------------------------------------

  /**
   * Returns true if the Scene is Virtual.
   */
  export const _isVirtualScene = (sceneSelector: SceneSelector) =>
    typeof sceneSelector === 'object' &&
    (sceneSelector as VirtualScene).query !== undefined;


  /**
   * Virtual Scene adapter.
   * Allows ABeamer to decouple from the details of any virtual scene.
   */
  export abstract class _SceneAdapter extends _AbstractAdapter implements SceneAdapter {

    constructor(sceneSelector: SceneSelector) { super(); }
    abstract query(selector: string,
      iterator: (element: PElement, index: uint) => void);
  }

  // ------------------------------------------------------------------------
  //                               _DOMSceneAdapter
  // ------------------------------------------------------------------------

  /**
   * DOM Scene and Story adapter.
   * Both of them are similar. No need for 2 separated classes.
   * Gets and sets attributes from HTMLElements.
   * Maps the animation property names into DOM attributes.
   */
  export class _DOMSceneAdapter extends _SceneAdapter implements _DOMAdapter {

    // JQuery is used to query
    $scene: JQuery;
    // HTMLElement is used to get/set attributes
    htmlElement: HTMLElement;
    compStyle: CSSStyleDeclaration;

    constructor(sceneSelector: SceneSelector) {
      super(sceneSelector);
      this.$scene = typeof sceneSelector === 'string' ? $(sceneSelector)
        : sceneSelector as JQuery;

      throwIfI8n(!this.$scene.length, Msgs.NoEmptySelector, { p: sceneSelector as string });
      this.htmlElement = this.$scene.get(0);
      this.isVirtual = false;
    }


    /**
     * Requests the DOM engine the calculated information for CSS property.
     */
    getComputedStyle(): any {
      let compStyle = this['__compStyle'];
      if (!compStyle) {
        compStyle = window.getComputedStyle(this.htmlElement);
        this['__compStyle'] = compStyle;
      }
      return compStyle;
    }

    getProp(propName: PropName, args?: ABeamerArgs): PropValue {

      switch (propName) {
        // story attributes
        case 'fps':
          return parseInt(document.body.getAttribute('data-fps'));

        case 'frame-width':
          return document.body.clientWidth;

        case 'frame-height':
          return document.body.clientHeight;

        // scene attributes
        case 'id': return this.htmlElement.id;
        // case 'html': return this.htmlElement.innerHTML;
        // case 'left':
        // case 'top':
        // case 'width':
        // case 'height':
        //   let value = this.htmlElement.style[propName];
        //   if (!value) {
        //     if (!this.compStyle) {
        //       this.compStyle = window.getComputedStyle(this.htmlElement);
        //     }
        //     value = this.compStyle[propName];
        //   }
        //   return value;
        default:
          return _getDOMProp(this, propName);
      }
    }


    setProp(propName: PropName, value: PropValue, args?: ABeamerArgs): void {
      switch (propName) {
        // story attributes
        case 'clip-path':
          this.htmlElement.style.clipPath = value as string;
          break;

        case 'frame-width':
          document.body.style.width = value + 'px';
          break;

        case 'frame-height':
          document.body.style.height = value + 'px';
          break;

        // // scene attributes
        // case 'visible':
        //   if (value === 'true' || value === true) {
        //     this.$scene.show();
        //   } else {
        //     this.$scene.hide();
        //   }
        //   break;

        // case 'opacity':
        //   this.htmlElement.style.opacity = value.toString();
        //   break;

        // case 'html':
        //   this.htmlElement.innerHTML = value as string;
        //   break;

        // case 'left':
        // case 'top':
        // case 'width':
        // case 'height':
        //   this.htmlElement.style[propName] = typeof value === 'number'
        //     ? value + 'px' : value as string;
        //   break;
        default:
          _setDOMProp(this, propName, value);
      }
    }


    query(selector: string,
      iterator: (element: PElement, index: uint) => void): void {

      this.$scene.find(selector as string).each((index, element) => {
        iterator(element, index);
      });
    }
  }

  // ------------------------------------------------------------------------
  //                               _VirtualSceneAdapter
  // ------------------------------------------------------------------------

  export class _VirtualSceneAdapter extends _SceneAdapter {

    vScene: VirtualScene;

    constructor(sceneSelector: SceneSelector) {
      super(sceneSelector);
      this.vScene = sceneSelector as VirtualScene;
      this.isVirtual = true;
    }


    getProp(propName: PropName, args?: ABeamerArgs): string {
      return this.vScene.getProp(propName, args);
    }


    setProp(propName: PropName, value: string, args?: ABeamerArgs): void {
      this.vScene.setProp(propName, value, args);
    }


    query(selector: string,
      iterator: (element: PElement, index: uint) => void): void {
      this.vScene.query(selector, iterator);
    }
  }

  // ------------------------------------------------------------------------
  //                               Factory
  // ------------------------------------------------------------------------

  /**
   * Creates and Adds an Element Adapter defined by a Element selector
   * to a list of ElementAdapters.
   */
  function _addElementAdapter(story: _StoryImpl,
    elementOrStr: PElement | string,
    elementAdapters: _ElementAdapter[],
    isVirtual?: boolean,
    isString?: boolean): void {

    let element: PElement;

    if ((isString !== false) && (isString || typeof elementOrStr === 'string')) {
      if ((isVirtual === false) ||
        (isVirtual === undefined && !_isIdVirtual(elementOrStr as string))) {
        throwErr(`selector ${elementOrStr} must be virtual`);
      }
      element = _getVirtualElement(story, elementOrStr as string) as PElement;
      isVirtual = true;
    } else {
      element = elementOrStr as PElement;
    }

    isVirtual = isVirtual || _isElementVirtual(element);

    elementAdapters.push(isVirtual ? new _VirtualElementAdapter(element) :
      new _DOMElementAdapter(element));
  }


  /**
   * Parses the user defined Element Selector, returning an Element Adapter
   */
  export function _parseInElSelector(
    story: _StoryImpl,
    elementAdapters: _ElementAdapter[],
    sceneAdpt: _SceneAdapter,
    elSelector: ElSelectorHandler): _ElementAdapter[] {

    // test of _pEls
    if ((elSelector as _pEls).__laserMarker__ !== undefined) {
      return (elSelector as _pEls)._elementAdapters as _ElementAdapter[];
    }

    if (typeof elSelector === 'function') {
      elSelector = (elSelector as ElSelectorFunc)(story._args);
    }

    if (typeof elSelector === 'string') {

      if (_isIdVirtual(elSelector)) {
        _addElementAdapter(story, elSelector, elementAdapters, true, true);

      } else {
        sceneAdpt.query(elSelector as string, (element, index) => {
          _addElementAdapter(story, element, elementAdapters, false, false);
        });
      }

    } else {
      if (typeof elSelector === 'object' && ((elSelector as any).length !== undefined)) {
        if (!(elSelector as any).length) { return; }

        ((elSelector as (PElement | string)[])).forEach(element => {
          _addElementAdapter(story, element, elementAdapters);
        });

      } else {
        throwI8n(Msgs.UnknownType, { p: elSelector.toString() });
      }
    }
    return elementAdapters;
  }

  // ------------------------------------------------------------------------
  //                               Wait Events
  // ------------------------------------------------------------------------

  function _waitForImageLoad(elImg: HTMLImageElement,
    args: ABeamerArgs): void {

    if (!elImg.complete) {
      args.waitMan.addWaitFunc((_args, params, onDone) => {
        if (!elImg.complete) {
          elImg.addEventListener('load', () => {
            onDone();
          }, { once: true });
        } else {
          onDone();
        }
      }, {});
    }
  }


  function _waitForMediaSync(elMedia: HTMLMediaElement, args: ABeamerArgs,
    pos: number): void {

    args.waitMan.addWaitFunc((_args, params, onDone) => {

      if (pos !== undefined) { elMedia.currentTime = pos; }
      window.setTimeout(() => {
        onDone();
      }, 1);
    }, {});
  }


  export interface _WorkWaitForParams extends AnyParams {
    waitFor: WaitFor;
    elAdapter: _ElementAdapter;
  }


  export function _handleWaitFor(args: ABeamerArgs, params: _WorkWaitForParams,
    onDone: DoneFunc) {
    params.elAdapter.waitFor(params.waitFor, onDone, args);
  }

  // ------------------------------------------------------------------------
  //                               Browser
  // ------------------------------------------------------------------------

  /**
   * List of CSS properties by vendor prefix that aren't caught by
   * `window.getComputedStyle`
   */
  const FORCED_PROP_REMAPS = {
    '-webkit-': ['background-clip'],
  };


  /**
   * Maps an input CSS property into the current CSS property, adding a prefixed
   * CSS property if necessary.
   */
  export function _propNameToVendorProps(propName: string): string[] {

    const subPropName = propName.replace(/(?:-webkit-|-moz-|-ie-)/, '');
    const mapValue = domPropMapper[subPropName];
    if (mapValue && mapValue[1] && mapValue[1] !== subPropName) {
      return [subPropName, mapValue[1]];
    }
    return [subPropName];
  }


  /**
   * Adds a vendor prefixed CSS properties to the domPropMapper.
   */
  function _addPropToDomPropMapper(subPropName: string, propName: string): void {
    const mapValue = domPropMapper[subPropName];
    const propType = mapValue !== undefined ? mapValue[0] : DPT_STYLE;
    domPropMapper[propName] = [propType, propName];
    domPropMapper[subPropName] = [propType, propName];
  }


  /**
   * Discovers the vendor prefix and vendor prefixed CSS properties
   * by using `window.getComputedStyle`.
   */
  function _initBrowser(): void {
    const cssMap = window.getComputedStyle(document.body);
    const cssMapLen = cssMap.length;
    const regEx = /^(-webkit-|-moz-|-ie-)(.*)/;
    let foundVendorPrefix = false;
    for (let i = 0; i < cssMapLen; i++) {
      const propName = cssMap[i];
      const parts = propName.match(regEx);
      if (parts) {

        if (!foundVendorPrefix) {
          const vendorPrefix = parts[1];
          browser.vendorPrefix = vendorPrefix;
          foundVendorPrefix = true;

          const forcedProps = FORCED_PROP_REMAPS[vendorPrefix] as string[];
          if (forcedProps) {
            forcedProps.forEach(forcedProp => {
              _addPropToDomPropMapper(forcedProp, vendorPrefix + forcedProp);
            });
          }
        }

        const subPropName = parts[2];
        browser.prefixedProps.push(subPropName);
        _addPropToDomPropMapper(subPropName, propName);
      }
    }
  }

  // executed at startup
  _initBrowser();
}
