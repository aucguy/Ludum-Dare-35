import * as util from '/lib/util.js';
import * as play from './play.js';
import * as menu from './menu.js';
import * as playUtil from './playUtil.js';
import * as extraUtil from './extraUtil.js';

/**
 * entry point
 */
function init() {
  var game = new Phaser.Game({
    width: 600,
    height: 400,
    canvasID: 'display',
    parent: 'gameContainer',
    renderer: Phaser.AUTO,
    state: new util.BootState('init')
  });

  game.state.add('init', new InitState());

  return game;
}

var InitState = util.extend(Object, 'InitState', {
  constructor: function() {},
  preload() {
    var i, name;
    for(i = 0; i < play.Shape.shapes.length; i++) {
      var shape = play.Shape.shapes[i];
      for(var k = 0; k < play.Color.colors.length; k++) {
        var color = play.Color.colors[k];
        name = playUtil.getTextureName(shape, color);
        extraUtil.addGenImg(this.game.cache, name, shape.texture, {
          'shape.style.fill': color.shade
        });
      }
    }
  },
  create() {
    this.game.stage.backgroundColor = '#FFFFFF';
    this.game.state.add('mainMenu', new menu.GameMenu('gui/mainMenu'));
    menu.LoseMenu.instance = new menu.LoseMenu(this.game);
    this.game.state.add('loseMenu', menu.LoseMenu.instance);
    this.game.state.add('playState', new play.PlayState());
    this.game.state.start('mainMenu');
  }
});

export {
  init,
};