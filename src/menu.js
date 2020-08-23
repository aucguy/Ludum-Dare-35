import * as util from '/lib/util.js';
import * as gui from '/lib/gui.js';
import * as play from './playUtil.js';
import * as extraUtil from './extraUtil.js';

var GameMenu = util.extend(Phaser.State, 'GameMenu', {
  constructor: function GameMenu(name) {
    this.onUpdate = new Phaser.Signal();
    this.particles = null;
    this.name = name;
  },
  create: function create() {
    this.particles = new ParticleGroup(this.game);
    this.menu = new gui.Menu(this.name, this.game, this.onUpdate, 0, 0);
    this.game.world.add(this.particles);
  },
  update() {
    this.onUpdate.dispatch();
  }
});

var LoseMenu = util.extend(Phaser.State, 'LoseMenu', {
  constructor: function LoseMenu(game) {
    this.game = game;
    this.onUpdate = new Phaser.Signal();
    this.menu = null;
    this.context = null;
    this.score = null;
  },
  create: function create() {
    this.menu = new gui.Menu('gui/loseMenu', this.game, this.onUpdate, 0, 0);
    this.context = new gui.GuiContext(this.menu);
    this.menu.canvg.Definitions.score.children[0].children[0].text =
      'Score: ' + this.score;
    this.menu.canvg.draw();
    this.context.fade('in', 'down', 'play');
    this.game.sound.play('sounds/lose');
  },
  update() {
    this.onUpdate.dispatch();
  }
});
LoseMenu.instance = null;

var PARTICLE_SPACING = 50;
var EXTRA_SPACE = 100;
var FALL_TIME = 5000;

var ParticleGroup = util.extend(Phaser.Group, 'ParticleGroup', {
  constructor: function ParticleGroup(game, parent) {
    this.constructor$Group(game);

    for(var x = -EXTRA_SPACE; x < this.game.scale.width + EXTRA_SPACE; x += PARTICLE_SPACING) {
      for(var y = -this.game.scale.height - EXTRA_SPACE; y < 0; y += PARTICLE_SPACING) {
        var posx = x + play.rand.integerInRange(-PARTICLE_SPACING, PARTICLE_SPACING);
        var posy = y + play.rand.integerInRange(-PARTICLE_SPACING, PARTICLE_SPACING);
        var texture = extraUtil.getTextureFromCache(game,
          play.getTextureName(play.Shape.randomShape(), play.Color.randomColor()));
        var sprite = game.add.sprite(posx, posy, texture, null, this);
        sprite.alpha = 0.25;
        this.resetSprite(sprite);
      }
    }
  },
  resetSprite: function resetSprite(sprite) {
    var tween = this.game.add.tween(sprite.position);
    var target = this.game.scale.height + EXTRA_SPACE;
    tween.to({
      y: target
    }, FALL_TIME * (target - sprite.position.y) / target);
    tween.onComplete.add(function() {
      sprite.position.y = -EXTRA_SPACE;
      this.resetSprite(sprite);
    }.bind(this));
    tween.start();
  }
});

export {
  GameMenu,
  LoseMenu,
  ParticleGroup
};