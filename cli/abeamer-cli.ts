#!/usr/bin/env node
"use strict";
// uuid: b88b17e7-5918-44f7-82f7-f0e80c242a82

// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------

// @TODO: implement inject plugins

import * as sysFs from "fs";
import * as sysPath from "path";
import * as sysProcess from "process";
import { spawn as sysSpawn } from "child_process";

import { OptsParser } from "../shared/opts-parser.js";
import { fsix } from "../shared/vendor/fsix.js";
import { VERSION } from "../shared/version.js";
import { Consts } from "../shared/lib/consts.js";
import { RelConsts } from "../shared/rel-consts.js";
import { HttpServerEx } from "../shared/vendor/http-server-ex.js";

// @doc-name Command Line
/** @module end-user | The lines bellow convey information for the end-user */

/**
 * ## Description
 *
 * **ABeamer** command line utility is used to:
 *
 * 1. create projects: `abeamer create`.
 * 2. launch a live server: `abeamer serve`.
 * 3. render the project to disk: `abeamer render`.
 * 4. create gifs: `abeamer gif`.
 * 5. create movies: `abeamer movie`.
 *
 * ## Examples
 *
 * Creates a TypeScript/JavaScript project.
 * `abeamer create foo --width 720 --height 480 --fps 20`.
 *
 * Creates a TypeScript project.
 * `abeamer create foo-js --width 384 --height 288 --fps 30 --no-typescript`.
 *
 *  Starts the live server.
 * `abeamer serve`.
 *
 *  Starts the live server with list directory option if search part of url is `?dir`.
 * `abeamer serve --list-dir`.
 *
 *  Generate the animations in file image sequences and deletes the previous images.
 * `abeamer render --dp foo`.
 *
 * `abeamer render --ll 3 --dp foo`.
 */
namespace Cli {
  // ------------------------------------------------------------------------
  //                               Global Vars
  // ------------------------------------------------------------------------

  const DO_PRINT_USAGE = 0;
  const DO_RUN_COMMAND = 1;
  const DO_EXIT = 2;
  const DEFAULT_PORT = 9000;

  const CMD_CREATE = 'create';
  const CMD_SERVE = 'serve';
  const CMD_RENDER = 'render';
  const CMD_GIF = 'gif';
  const CMD_MOVIE = 'movie';

  const DEFAULT_GIF_NAME = 'story.gif';
  const DEFAULT_MOVIE_NAME = 'movie.mp4';

  let logLevel = Consts.LL_ERROR;
  let isVerbose = false;
  let cmdName = '';
  let cmdParam = '';
  const outArgs: string[] = [];

  const argOpts = OptsParser.argOpts;

  argOpts['port'] = {
    param: 'int', desc:
      `port for serve command. default is ${DEFAULT_PORT}`,
  };

  argOpts['gif'] = {
    param: 'string', desc:
      `output gif name. default is ${DEFAULT_GIF_NAME}`,
  };

  argOpts['movie'] = {
    param: 'string', desc:
      `output movie name. default is ${DEFAULT_MOVIE_NAME}`,
  };

  argOpts['noPlugins'] = {
    desc:
      `creates a project without plugins`,
  };

  argOpts['noTypescript'] = {
    desc:
      `creates a project without TypeScript files`,
  };

  argOpts['listDir'] = {
    desc:
      `serve command supports list directory, if the seach path is ?dir`,
  };


  // ------------------------------------------------------------------------
  //                               Print Usage
  // ------------------------------------------------------------------------

  function printUsage() {
    console.log(`abeamer [command] [options] [project-name|report-name]
The commands are:
    ${CMD_CREATE} creates a project with project-name
    ${CMD_SERVE}  starts a live server. Use it in case you need to load the config from JSON file
    ${CMD_RENDER} runs your project in the context of the headless browser.
    ${CMD_GIF}    creates an animated gif from the project-name or report-name
    ${CMD_MOVIE}  creates a movie from the project-name or report-name

    e.g.
      echo "create folder foo and copy necessary files"
      abeamer ${CMD_CREATE} --width 640 --height 480 --fps 25 foo

      cd foo

      echo "start a live server"
      echo "only required if you need to load your configuration from json file"
      abeamer ${CMD_SERVE}

      echo "generates the png files and a report on story-frames folder"
      abeamer ${CMD_RENDER}

      echo "creates story.gif file on story-frames folder"
      abeamer ${CMD_GIF}

      echo "creates story.mp4 file on story-frames folder"
      abeamer ${CMD_MOVIE}

`);
    OptsParser.printUsage();
  }

  // ------------------------------------------------------------------------
  //                               Parse Arguments
  // ------------------------------------------------------------------------

  function parseArguments() {
    const args: string[] = sysProcess.argv;
    let argI = 1;
    // @TODO: Improve this code
    while (args[argI - 1].search(/abeamer/) === -1) { argI++; }

    cmdName = args[argI++];
    if (!cmdName) {
      return DO_PRINT_USAGE;
    } else if (cmdName === '--version') {
      console.log(VERSION);
      return DO_EXIT;
    }

    return OptsParser.iterateArgOpts(true, () => args[argI++],
      (option, value) => {

        switch (option) {
          case '@param':
            cmdParam = value as string;
            outArgs.push(cmdParam);
            return;

          case 'version':
            console.log(VERSION);
            return DO_EXIT;

          case 'll':
            logLevel = value as int;
            isVerbose = logLevel >= Consts.LL_VERBOSE;
            if (isVerbose) {
              console.log(`Args: [${args.join('],[')}]`);
              console.log(`Current Path: ${sysProcess.cwd()}`);
            }
            break;
        }

        switch (cmdName) {
          case CMD_RENDER:
            outArgs.push('--' + option);
            if (value) {
              /* if (OptsParser.argOpts[option].param === 'string') {
                value = `"${value}"`;
              } */
              outArgs.push(value as string);
            }
            break;
        }

      },
    ) || DO_RUN_COMMAND;
  }

  // ------------------------------------------------------------------------
  //                               Runs External Commands
  // ------------------------------------------------------------------------

  function runSpawn(cmdLine: string, args: string[], callback?) {

    if (isVerbose) {
      console.log(`spawn cmdLine: ${cmdLine}`);
      console.log(`args: ${args}`);
    }

    const ls = sysSpawn(cmdLine, args);

    ls.stdout.on('data', (data) => {
      if (logLevel >= Consts.LL_SILENT) { console.log(data.toString()); }
    });

    ls.stderr.on('data', (data) => {
      if (logLevel >= Consts.LL_SILENT) { console.error(data.toString()); }
    });

    ls.on('close', (code) => {
      callback();
    });
  }

  // ------------------------------------------------------------------------
  //                                Command: Create
  // ------------------------------------------------------------------------

  function commandCreate() {

    const projName = cmdParam;
    if (projName === '' || projName[0] === '-'
      || projName.search(/[^\w\-_]/) !== -1) {
      throw `Project name ${projName} is not valid`;
    }

    const ROOT_PATH = fsix.toPosixSlash(__dirname) + '/..';
    const TEMPLATE_PATH = ROOT_PATH + '/gallery/hello-world';
    const LIB_PATH = ROOT_PATH + '/client/lib';
    const width = argOpts.width.value || RelConsts.DEFAULT_WIDTH;
    const height = argOpts.height.value || RelConsts.DEFAULT_HEIGHT;
    const fps = argOpts.fps.value || RelConsts.DEFAULT_FPS;
    const noPlugins = argOpts['noPlugins'].hasOption;
    const noTypescript = argOpts['noTypescript'].hasOption;

    copyTree(TEMPLATE_PATH, projName, (text, fileName) => {

      const fileBase = sysPath.basename(fileName);
      switch (fileBase) {
        case 'main.js':
        case 'main.ts':
          if (noTypescript) {
            text = text.replace(/^.*sourceMappingURL=.*$/m, '');
          }

          text = text.replace(/createStory\([^)]*\)/, `createStory(/*FPS:*/${fps})`);
          break;

        case 'abeamer.ini':
          text = text.replace(/width:\s*\d+/, `width: ${width}`)
            .replace(/height:\s*\d+/, `height: ${height}`);
          break;

        case 'main.min.css':
          text = text.replace(/.abeamer-scene{width:\d+px;height:\d+px}/,
            `.abeamer-scene{width:${width}px;height:${height}px}`);

          break;
        case 'index.html':

          // inserts the plugins.
          if (!noPlugins) {
            const plugins = fsix.loadJsonSync(`${ROOT_PATH}/client/lib/plugins/plugins-list.json`);
            let pre = '';
            let post = '';
            text.replace(/^(.*)js\/abeamer\.min\.js(.*)$/m, (app, _pre, _post) => {
              pre = _pre;
              post = _post;
              return '';
            });

            text = text.replace(/^(.*js\/main\.js.*)$/m, (all) => {
              return plugins
                .map(plugin => `${pre}plugins/${plugin}/${plugin}.js${post}`).join('\n')
                + '\n' + all;
            });
          }

          // readjusts file paths
          text = text.replace(/\.\.\/\.\.\/client\/lib/g, 'abeamer');
          break;
      }

      return text;
    },
      (fileBase: string) => {
        if (noTypescript && fileBase.match(/(?:js\.map|\.ts|tsconfig\.json)$/)) { return false; }
        return true;
      });

    copyTree(LIB_PATH, `${projName}/abeamer`, undefined,
      (fileBase: string) => {
        if (noTypescript && fileBase.match(/(?:typings|\.ts)$/)) { return false; }
        if (noPlugins && fileBase.match(/plugins$/)) { return false; }
        return !fileBase.match(/plugins-list\.json$/);
      });

    if (logLevel > Consts.LL_SILENT) { console.log(`Project ${projName} created`); }
  }


  /**
   * Copies a tree structure from the `src` to `dst`,
   * allowing to modify the content via `onCopyText` callback,
   * and determine if copying a certain file or folder is allowed via `allowCopy`.
   */
  function copyTree(srcPath: string, dstPath: string,
    onCopyText?: (text: string, fileBase: string) => string,
    allowCopy?: (fileBase: string) => boolean) {
    if (isVerbose) {
      console.log(`Copying Directory ${srcPath} to ${dstPath}`);
    }
    fsix.mkdirpSync(dstPath);
    sysFs.readdirSync(srcPath).forEach(fileBase => {
      if (allowCopy && !allowCopy(fileBase)) { return; }

      const srcFileName = `${srcPath}/${fileBase}`;
      const dstFileName = `${dstPath}/${fileBase}`;
      const stats = sysFs.statSync(srcFileName);
      if (stats.isFile()) {
        if (isVerbose) {
          console.log(`Copying ${srcFileName} to ${dstFileName}`);
        }
        let data = fsix.readUtf8Sync(srcFileName);
        if (onCopyText) {
          data = onCopyText(data, fileBase);
        }
        sysFs.writeFileSync(dstFileName, data);
      } else if (stats.isDirectory()) {
        copyTree(srcFileName, dstFileName, onCopyText, allowCopy);
      }
    });
  }

  // ------------------------------------------------------------------------
  //                               Serve
  // ------------------------------------------------------------------------

  function commandServe() {
    const hasMarked = sysFs.existsSync(sysPath.posix.join(__dirname,
      '../node_modules/marked/bin/marked'));
    const hasHighlightJs = sysFs.existsSync(sysPath.posix.join(__dirname,
      '../node_modules/highlight.js/lib/index.js'));

    const port = argOpts['port'].value as int || DEFAULT_PORT;
    new HttpServerEx.ServerEx(port, isVerbose, 'EXIT_SERVER',
      argOpts['listDir'].hasOption,
      hasMarked, hasHighlightJs).start();

    if (logLevel >= Consts.LL_SILENT) {
      if (hasMarked) {
        console.log(`Using markdown compiler`);
      }
      console.log(`Serving on http://localhost:${port}/`);
    }
  }

  // ------------------------------------------------------------------------
  //                                Command: Render
  // ------------------------------------------------------------------------

  function commandRender() {

    const serverName = (OptsParser.argOpts.server.value as string
      || RelConsts.DEFAULT_SERVER).toLowerCase();

    if (RelConsts.SUPPORTED_SERVERS.indexOf(serverName) === -1) {
      throw `Unknown ${serverName}`;
    }

    // if use hasn't provided the folder name nor config file
    if (!cmdParam && !argOpts.config.value) { outArgs.push('.'); }

    outArgs.splice(0, 0, `${fsix.toPosixSlash(__dirname)}/../server/server-agent-${serverName}.js`);

    const cmdLine = RelConsts.NODE_SERVERS.indexOf(serverName) === -1
      ? serverName : 'node';

    runSpawn(cmdLine, outArgs, () => {
      if (logLevel > Consts.LL_SILENT) { console.log(`Server finished`); }
    });
  }

  // ------------------------------------------------------------------------
  //                               getReport
  // ------------------------------------------------------------------------

  interface Report {
    fps: uint;
    width: uint;
    height: uint;
    dirname: string;
    framespattern: string;
  }


  function getReport(): Report {
    let reportFileName = fsix.toPosixSlash(cmdParam || '.');
    const realReportFileName =
      sysPath.posix.join(reportFileName, 'story-frames/frame-report.json');
    // in case the user param is the project folder
    if (sysFs.existsSync(realReportFileName)) {
      reportFileName = realReportFileName;
    }

    if (isVerbose) {
      console.log(`reportFileName: ${reportFileName}`);
      console.log(`realReportFileName: ${realReportFileName}`);
    }

    if (!sysFs.existsSync(reportFileName)) {
      throw `Report file ${reportFileName} doesn't exist`;
    }

    const report: Report = fsix.loadJsonSync(reportFileName);
    report.dirname = sysPath.dirname(reportFileName);

    if (isVerbose) { console.log(`report path: ${report.dirname}`); }

    // handle relative paths
    if (report.framespattern.substr(0, 2) === './') {
      report.framespattern = report.dirname + '/' + report.framespattern.substr(2);
    }
    return report;
  }

  // ------------------------------------------------------------------------
  //                                Command: Gif
  // ------------------------------------------------------------------------

  function commandGif() {
    const report = getReport();
    const gifFileName = argOpts['gif'].value as string
      || `${report.dirname}/${DEFAULT_GIF_NAME}`;
    const toOptimize = true;

    const cmdLine = 'convert';

    const args = ['-loop', '0', '-delay', `1x${report.fps}`];
    if (toOptimize) { args.push('-strip', '-layers', 'optimize', '-alpha', 'deactivate'); }

    args.push(report.framespattern.replace(/\%\d*d/, '*'), gifFileName);

    runSpawn(cmdLine, args, () => {
      if (logLevel > Consts.LL_SILENT) { console.log(`Created gif ${gifFileName}`); }
    });
  }

  // ------------------------------------------------------------------------
  //                                Command: Movie
  // ------------------------------------------------------------------------

  function commandMovie() {
    const report = getReport();
    const movieFileName = argOpts['movie'].value as string
      || `${report.dirname}/${DEFAULT_MOVIE_NAME}`;
    const cmdLine = 'ffmpeg';
    const args = ['-r', report.fps.toString(), '-f', 'image2',
      '-s', `${report.width}x${report.height}`,
      '-i', report.framespattern,
      /* spell-checker: disable */
      '-vcodec', 'libx264', movieFileName];

    runSpawn(cmdLine, args, () => {
      if (logLevel > Consts.LL_SILENT) { console.log(`Created movie ${movieFileName}`); }
    });
  }

  // ------------------------------------------------------------------------
  //                               Main Body
  // ------------------------------------------------------------------------

  switch (parseArguments()) {

    case DO_PRINT_USAGE:
      printUsage();
      break;

    case DO_RUN_COMMAND:

      if (isVerbose) {
        console.log(`Run Command: ${cmdName}`);
      }

      switch (cmdName) {
        case CMD_CREATE:
          commandCreate();
          break;

        case CMD_SERVE:
          commandServe();
          break;

        case CMD_RENDER:
          commandRender();
          break;

        case CMD_GIF:
          commandGif();
          break;

        case CMD_MOVIE:
          commandMovie();
          break;

        default:
          throw `Unknown command ${cmdName}`;
      }
      break;
  }
}