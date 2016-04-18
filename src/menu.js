base.registerModule('menu', function() {
  var util = base.importModule('util');
  var gui = base.importModule('gui');
  var play = base.importModule('playUtil');

  var GameMenu = util.extend(gui.Menu, 'GameMenu', {
    constructor: function GameMenu(gui) {
      this.constructor$Menu(gui);
      this.particles = null;
    },
    create: function create() {
      this.particles = new ParticleGroup(this.game);
      this.game.world.add(this.particles);
      this.create$Menu();
    }
  });

  var LoseMenu = util.extend(GameMenu, 'LoseMenu', {
    constructor: function LoseMenu() {
      this.constructor$Menu('gui/loseMenu');
      this.score = null;
    },
    create: function create() {
      this.create$GameMenu();
      this.canvg.Definitions.score.children[0].children[0].text =
          'Score: ' + this.score;
      this.canvg.draw();
      this.context.fade('in', 'down', 'play');
      this.game.playSound('lose');
    }
  });
  LoseMenu.instance = null;

  var PARTICLE_SPACING = 50;
  var EXTRA_SPACE = 100;
  var FALL_TIME = 5000;

  var ParticleGroup = util.extend(Phaser.Group, 'ParticleGroup', {
    constructor: function ParticleGroup(game, parent) {
      this.constructor$Group(game);

      for(var x=-EXTRA_SPACE; x<this.game.scale.width+EXTRA_SPACE; x+=PARTICLE_SPACING) {
        for(var y=-this.game.scale.height-EXTRA_SPACE; y<0; y+=PARTICLE_SPACING) {
          var posx = x + play.rand.integerInRange(-PARTICLE_SPACING, PARTICLE_SPACING);
          var posy = y + play.rand.integerInRange(-PARTICLE_SPACING, PARTICLE_SPACING);
          var texture = util.getTextureFromCache(game,
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

  return {
    GameMenu: GameMenu,
    LoseMenu: LoseMenu,
    ParticleGroup: ParticleGroup
  }
});
