"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// uuid: 39a65561-5c80-4732-a181-ced25c411e52
// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------
// Checks if plugins are valid and inject their css and js into the index.html
/** @module internal | This module is to be read only by developers */
// @WARN: Don't import any nodejs modules nor
// any other modules depending on node modules since it can be called by phantomjs
var PluginInjector;
(function (PluginInjector) {
    PluginInjector.plugins = [];
    var allowedPlugins = [];
    function loadAllowedPlugins(fileName, existsSync, readUtf8Sync) {
        if (!existsSync(fileName)) {
            throw fileName + " doesn't exists";
        }
        allowedPlugins = JSON.parse(readUtf8Sync(fileName)).plugins;
    }
    PluginInjector.loadAllowedPlugins = loadAllowedPlugins;
    function processUrl(url) {
        return url.search(/^http/) !== -1 ? url : "../../client/lib/" + url;
    }
    PluginInjector.processUrl = processUrl;
    function inject(existsSync, readUtf8Sync, writeFileSync) {
        // check if allowedPlugins was defined.
        if (!allowedPlugins.length) {
            return;
        }
        if (!PluginInjector.injectPage || !existsSync(PluginInjector.injectPage)) {
            throw PluginInjector.injectPage + " doesn't exists";
        }
        // check if the plugins are allowed and replace the urls with safe urls.
        PluginInjector.plugins.forEach(function (plugin) {
            if (!plugin.uuid || !plugin.author) {
                throw "Invalid plugin uuid: " + plugin.uuid + " author: " + plugin.author;
            }
            var match = allowedPlugins.find(function (allowedPlugin) { return allowedPlugin.uuid === plugin.uuid; });
            if (!match) {
                throw "Forbidden plugin uuid: " + plugin.uuid + " author: " + plugin.author;
            }
            plugin.jsUrls = match.jsUrls;
            plugin.cssUrls = match.cssUrls;
        });
        var content = readUtf8Sync(PluginInjector.injectPage);
        writeFileSync(PluginInjector.injectPage + '.bak.html', content);
        // inject js scripts
        content = content.replace(/(#plugins-js-block-start.*\n)((?:.|\n)*)(\n.*#plugins-js-block-end)/, function (all, before, replaceArea, after) {
            var output = [];
            PluginInjector.plugins.forEach(function (plugin) {
                (plugin.jsUrls || []).forEach(function (url) {
                    output.push("    <script src=\"" + processUrl(url) + "\"></script>");
                });
            });
            return before + '\n' + output.join('\n') + '\n' + after;
        });
        // inject css links
        content = content.replace(/(#plugins-css-block-start.*\n)((?:.|\n)*)(\n.*#plugins-css-block-end)/, function (all, before, replaceArea, after) {
            console.log("before: " + before);
            var output = [];
            PluginInjector.plugins.forEach(function (plugin) {
                (plugin.cssUrls || []).forEach(function (url) {
                    output.push("    <link href=\"" + processUrl(url) + "\" rel=\"stylesheet\">");
                });
            });
            return before + '\n' + output.join('\n') + '\n' + after;
        });
        writeFileSync(PluginInjector.injectPage, content);
    }
    PluginInjector.inject = inject;
})(PluginInjector = exports.PluginInjector || (exports.PluginInjector = {}));
//# sourceMappingURL=plugin-injector.js.map