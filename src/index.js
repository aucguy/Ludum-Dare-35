var base = base || {};
base.indexFunc = function indexFunc(state) {
  var assets = [
    ['test',                'assets/test.txt',              'text']
  ];
  //#mode dev
  base.loadAssets(assets.concat([
    ['scripts/phaser',      'lib/phaser/dist/phaser.js',    'script'],
    ['scripts/canvg',       'lib/canvg/canvg.js',           'script'],
    ['scripts/rgbcolor',    'lib/canvg/rgbcolor.js',        'script'],
    ['scripts/stackblur',   'lib/canvg/StackBlur.js',       'script'],
    ['scripts/phaserInjector', 'lib/basejs/src/injectors/phaserInjector.js', 'script'],
    ['scripts/stateMachine', 'lib/javascript-state-machine/state-machine.js', 'script'],

    ['scripts/main',        'src/main.js',                  'script'],
    ['scripts/gui',         'src/gui.js',                   'script'],
    ['scripts/util',        'src/util.js',                  'script'],
  ]));
  //#mode none
  //#mode rel
  //base.loadAssets(assets.concat([
  // ['scripts/app',        'app.min.js',                   'script']
  //]));
  //#mode none
};
