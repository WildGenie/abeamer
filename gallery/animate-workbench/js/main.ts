"use strict";
// uuid: a8ed448c-9a89-4963-b08b-d1e82bf03f2d

// ------------------------------------------------------------------------
// Copyright (c) 2018 Alexandre Bento Freire. All rights reserved.
// Licensed under the MIT License+uuid License. See License.txt for details
// ------------------------------------------------------------------------

$(window).on("load", () => {

  const story: ABeamer.Story = ABeamer.createStory(/*FPS:*/10);

  // ------------------------------------------------------------------------
  //                               Scene1
  // ------------------------------------------------------------------------

  const scene1 = story.scenes[0];

  interface Test {
    label: string;
    enabled?: boolean;
    easing?: ABeamer.EasingName | ABeamer.ExprString;
    easingX?: ABeamer.EasingName | ABeamer.ExprString;
    oscillator?: ABeamer.Oscillator;
  }

  const expr = `=iff(t<0.2 or t>0.7, 0, 1)`;

  const tests: Test[] = [{
    enabled: true,
    label: `easing:${expr}`,
    easing: expr,
  }, {
    enabled: true,
    label: 'easeInQuart',
    // easing by Id
    easing: ABeamer.EasingName.easeInQuart,
  }, {
    label: 'Harmonic',
    oscillator: {
      handler: ABeamer.OscillatorName.harmonic,
      params: {
        // shift: 0.25,
      } as ABeamer.OscillatorParams,
    },
  }, {
    enabled: true,
    label: 'Damped',
    oscillator: {
      // oscillator by name
      handler: 'damped',
    },
  }, {
    label: 'Harmonic+easeInQuart(X)',
    easingX: 'easeInQuart',
    oscillator: {
      handler: 'harmonic',
    },
  }, {
    label: 'Harmonic+easeInQuart',
    easing: 'easeInQuart',
    oscillator: {
      handler: 'harmonic',
    },
  }, {
    label: 'Harmonic+easeOutCubic',
    easing: 'easeOutCubic',
    oscillator: {
      handler: 'harmonic',
    },
  }];

  const h = story.height;
  const margin = 10;
  const d = 2; // duration in seconds
  const allowMultiple = true;

  tests.forEach((test, index) => {

    if (index && !allowMultiple) {
      return;
    }
    scene1
      .addAnimations([{
        selector: '#dot',
        duration: `${d}s`,
        enabled: test.enabled,
        props: [{
          prop: 'left',
          easing: test.easingX,
          valueStart: `${margin}px`,
          value: story.width - 2 * margin,
        }, {
          prop: 'top',
          easing: test.easing,
          oscillator: test.oscillator,
          valueStart: `${h / 2}px`,
          value: h / 8,
        }],
      },
      {
        selector: '#label',
        duration: 1,
        props: [{
          prop: 'text',
          valueFormat: test.label,
        }],
      }]);
  });

  story.render(story.bestPlaySpeed());
});
