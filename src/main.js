base.registerModule('main', function() {
  var phaserInjector = base.importModule('phaserInjector');
  var gui = base.importModule('gui');
  var util = base.importModule('util');
  var play = base.importModule('play');
  var menu = base.importModule('menu');

  /**
   * entry point
   */
  function init() {
    Main.instance = new Main();
    Main.instance.init();
  }

  /**
   * big thing that controls everything
   */
  var Main = util.extend(Phaser.Game, 'Main', {
    constructor: function Main() {
      var display = document.getElementById('display');
      display.parentElement.removeChild(display);
      this.constructor$Game(this.getPhaserConfig());
      this.sounds = null;
      this.soundsReady = false;
    },

    getPhaserConfig: function getPhaserConfig() {
      return {
        width: 600,
        height: 400,
        canvasID: 'display',
        parent: 'gameContainer',
        renderer: Phaser.AUTO,
      };
    },

    init: function init() {
      this.state.add('boot', new BootState());
      this.state.add('mainMenu', new menu.GameMenu('gui/mainMenu'));
      menu.LoseMenu.instance = new menu.LoseMenu();
      this.state.add('loseMenu', menu.LoseMenu.instance);
      this.state.add('playState', new play.PlayState());
      this.state.start('boot');
    },
    playSound: function playSound(name) {
      if(this.soundsReady) this.sounds[name].play();
    }
  });
  Main.instance = null;

  /**
   * intial state used to inject assets
   */
  var BootState = util.extend(Phaser.State, 'BootState', {
    preload: function preload() {
      phaserInjector.injectIntoPhaser(this.game.load);
      var i, name;
      for(i=0; i<play.Shape.shapes.length; i++) {
        var shape = play.Shape.shapes[i];
        for(var k=0; k<play.Color.colors.length; k++) {
          var color = play.Color.colors[k];
          name = play.Piece.getTextureName(shape, color);
          util.addGenImg(this.game.cache, name, shape.texture, {
            'shape.style.fill': color.shade
          });
        }
      }
      this.game.sounds = {
        fail: this.game.add.audio('sounds/fail'),
        success: this.game.add.audio('sounds/success'),
        lose: this.game.add.audio('sounds/lose')
      };
      var names = Object.getOwnPropertyNames(this.game.sounds);
      var sounds = []
      for(i=0; i<names.length; i++) {
        sounds.push(this.game.sounds[names[i]]);
      }
      this.game.sound.setDecodedCallback(sounds, function() {
        this.game.soundsReady = true;
      }.bind(this));
    },
    create: function create() {
      this.game.stage.backgroundColor = '#FFFFFF';
      this.game.state.start('mainMenu');
      var arrowKeys = [
        Phaser.KeyCode.LEFT,
        Phaser.KeyCode.RIGHT,
        Phaser.KeyCode.UP,
        Phaser.KeyCode.DOWN
      ];
      base.addEventListener(window, "keydown", function(event) {
        if(arrowKeys.indexOf(event.keyCode) != -1) {
          event.preventDefault();
        }
      });
    }
  });

  return {
    init: init,
    Main: Main
  };
});
