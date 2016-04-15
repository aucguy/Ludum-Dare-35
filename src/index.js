var base = base || {};
base.indexFunc = function indexFunc(state) {
  base.loadAssets([
    //libraries
    ['scripts/phaser',      'lib/phaser/dist/phaser.js',    'script'],
    ['scripts/canvg',       'lib/canvg/canvg.js',           'script'],
    ['scripts/rgbcolor',    'lib/canvg/rgbcolor.js',        'script'],
    ['scripts/stackblur',   'lib/canvg/StackBlur.js',       'script'],
    ['scripts/phaserInjector', 'lib/basejs/src/injectors/phaserInjector.js', 'script'],
    ['scripts/stateMachine', 'lib/javascript-state-machine/state-machine.js', 'script'],

    //custom code
    ['scripts/main',        'src/main.js',                  'script'],
    ['scripts/gui',         'src/gui.js',                   'script'],
    ['scripts/util',        'src/util.js',                  'script'],

    //gui
    ['gui/mainMenu',        'assets/gui/mainMenu.svg',      'text'],
    ['gui/playGui',         'assets/gui/playGui.svg',       'text'],]
  ]);
};
