"use strict";
// uuid: b306bb72-7626-4cf7-b4ae-756f342649ff
// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------
// Implementation of Flyovers
/** @module end-user | The lines bellow convey information for the end-user */
/**
 * ## Description
 *
 * A **flyover** is a function executed for every frame during render process
 * with the main purpose of providing useful information or sync data.
 *
 * A flyover operates outside a scene animation pipeline, and can it
 * modify the content of one or more elements.
 *
 * ABeamer has following built-in flyovers:
 * - `info`
 * - `video-sync`.
 *
 * More flyovers can be added via `pluginManager.addFlyovers`.
 *
 * ## Info flyover
 *
 * A `info` flyover provides information regarding current time position and frame.
 *
 * @see gallery/animate-flyovers
 *
 * ### Example
 * css
 * ```css
 * #flyover {
 *   left: 10px;
 * }
 * ```
 * html
 * ```html
 * <div id="flyover" class="abeamer-flyover"></div>
 * ```
 * js
 * ```js
 * story.addFlyover('info', {
 *    selector: '#flyover',
 *    format: 'story-frame: ${storyFrameNr}\nstory-time: ${storyElapsedS}',
 * });
 * ```
 *
 * ## Video Sync flyover
 *
 * A `video-sync` flyover synchronizes the current render frame with a background video.
 *
 * @see gallery/animate-video-sync
 *
 * ### Example
 * css
 * ```css
 * #flyover {
 *   left: 10px;
 * }
 * ```
 * html
 * ```html
 * <video id=video width="385" height="288" src="assets/video.mp4" type="video/mp4">
 * ```
 *
 * js
 * ```js
 * story.addFlyover('video-sync', {
 *     selector: '#video'
 *   });
 * ```
 */
var ABeamer;
(function (ABeamer) {
    // #generate-group-section
    // ------------------------------------------------------------------------
    //                               Flyovers
    // ------------------------------------------------------------------------
    /**
     * Internal map by name pointing to all flyover functions,
     * both built-in and 3rd party.
     */
    ABeamer._flyoverFunctions = {};
    function _buildWorkFlyover(handler, params, toTeleport, args) {
        var flyoverFunc;
        switch (typeof handler) {
            case 'string':
                flyoverFunc = ABeamer._flyoverFunctions[handler];
                break;
            case 'function':
                flyoverFunc = handler;
                ABeamer.throwIfI8n(toTeleport, ABeamer.Msgs.NoCode);
                break;
        }
        if (!flyoverFunc) {
            ABeamer.throwI8n(ABeamer.Msgs.UnknownOf, { type: ABeamer.Msgs.flyover, p: handler });
        }
        var wkFlyover = {
            func: flyoverFunc,
            name: handler,
            params: params || {},
        };
        if (toTeleport) {
            wkFlyover.func(wkFlyover, wkFlyover.params, ABeamer.TS_TELEPORT, args);
        }
        return wkFlyover;
    }
    ABeamer._buildWorkFlyover = _buildWorkFlyover;
    ABeamer._flyoverFunctions['info'] = _infoFlyover;
    /**
     * Implementation of Info Flyover.
     */
    function _infoFlyover(wkFlyover, params, stage, args) {
        switch (stage) {
            case ABeamer.TS_INIT:
                if (!params._elAdaptors) {
                    params._elAdaptors = args.story.getElementAdapters(params.selector
                        || '.info-flyover');
                }
                break;
            case ABeamer.TS_ANIME_LOOP:
                // rendering
                var format_1 = params.format || '${storyFrameNr}';
                var story_1 = args.story;
                params._elAdaptors.forEach(function (elAdaptor) {
                    var text = format_1.replace(/\$\{(\w+)\}/g, function (p1, macro) {
                        switch (macro) {
                            case 'storyFrameNr':
                                return story_1.renderFramePos.toString();
                            case 'storyElapsedMS':
                                return ABeamer.frame2Time(story_1.renderFramePos, story_1.fps, ABeamer.TimeUnit.ms);
                            case 'storyElapsedS':
                                return ABeamer.frame2Time(story_1.renderFramePos, story_1.fps, ABeamer.TimeUnit.s);
                            case 'storyElapsedM':
                                return ABeamer.frame2Time(story_1.renderFramePos, story_1.fps, ABeamer.TimeUnit.m);
                        }
                        return '';
                    });
                    // #debug-start
                    if (args.isVerbose) {
                        args.story.logFrmt('info-flyover', [['text', text]]);
                    }
                    // #debug-end
                    elAdaptor.setProp('text', text);
                });
                break;
        }
        return undefined;
    }
    /**
     * Implementation of Video Sync Flyover.
     */
    ABeamer._flyoverFunctions['video-sync'] = _videoSyncFlyover;
    function _videoSyncFlyover(wkFlyover, params, stage, args) {
        // setup
        switch (stage) {
            case ABeamer.TS_INIT:
                if (!params._elAdaptors) {
                    params._elAdaptors = args.story.getElementAdapters(params.selector
                        || '#video');
                    break;
                }
            case ABeamer.TS_ANIME_LOOP:
                // rendering
                var storyFps_1 = args.story.fps;
                params._elAdaptors.forEach(function (elAdaptor) {
                    var currentTime = args.story.renderFramePos / storyFps_1;
                    // #debug-start
                    if (args.isVerbose) {
                        args.story.logFrmt('video-sync', [['currentTime', currentTime]]);
                    }
                    // #debug-end
                    elAdaptor.setProp('currentTime', currentTime);
                });
                break;
        }
        return undefined;
    }
})(ABeamer || (ABeamer = {}));
//# sourceMappingURL=flyovers.js.map