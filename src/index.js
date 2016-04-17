var base = base || {};
base.indexFunc = function indexFunc(state) {
  var assets = [
    ['gui/mainMenu',        'assets/gui/mainMenu.svg',       'text'],
    ['images/triangle',     'assets/images/triangle.svg',    'text'],
    ['images/square',       'assets/images/square.svg',      'text'],
    ['images/circle',       'assets/images/circle.svg',      'text'],
    ['images/pentagon',     'assets/images/pentagon.svg',    'text'],
    ['images/direction',    'assets/images/direction-up.svg','image']
  ];
  //#mode dev
  base.loadAssets(assets.concat([
    ['scripts/phaser',      'lib/phaser/build/phaser.js',    'script'],
    ['scripts/canvg',       'lib/canvg/canvg.js',           'script'],
    ['scripts/rgbcolor',    'lib/canvg/rgbcolor.js',        'script'],
    ['scripts/stackblur',   'lib/canvg/StackBlur.js',       'script'],
    ['scripts/phaserInjector', 'lib/basejs/src/injectors/phaserInjector.js', 'script'],
    ['scripts/stateMachine', 'lib/javascript-state-machine/state-machine.js', 'script'],

    ['scripts/main',        'src/main.js',                  'script'],
    ['scripts/gui',         'src/gui.js',                   'script'],
    ['scripts/util',        'src/util.js',                  'script'],
    ['scripts/play',        'src/play.js',                  'script']
  ]));
  //#mode none
  //#mode rel
  //base.loadAssets(assets.concat([
  // ['scripts/app',        'app.min.js',                   'script']
  //]));
  //#mode none
};
