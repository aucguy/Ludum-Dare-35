base.registerModule('main', function() {
  var phaserInjector = base.importModule('phaserInjector');
  var gui = base.importModule('gui');
  var util = base.importModule('util');
  var play = base.importModule('play');

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
    },

    getPhaserConfig: function getPhaserConfig() {
      return {
        width: 640,
        height: 480,
        canvasID: 'display',
        parent: 'gameContainer',
        renderer: Phaser.AUTO,
      };
    },

    init: function init() {
      this.state.add('boot', new BootState());
      this.state.add('mainMenu', new gui.Menu('gui/mainMenu'));
      this.state.add('playState', new play.PlayState());
      this.state.start('boot');
    }
  });
  Main.instance = null;

  /**
   * intial state used to inject assets
   */
  var BootState = util.extend(Phaser.State, 'BootState', {
    preload: function preload() {
      phaserInjector.injectIntoPhaser(this.game.load);
      for(var i=0; i<play.Shape.shapes.length; i++) {
        var shape = play.Shape.shapes[i];
        for(var k=0; k<play.Color.colors.length; k++) {
          var color = play.Color.colors[k];
          var name = play.Piece.getTextureName(shape, color);
          util.addGenImg(this.game.cache, name, shape.texture, {
            'shape.style.fill': color.shade
          });
        }
      }
    },
    create: function create() {
      this.game.stage.backgroundColor = '#FFFFFF';
      this.game.state.start('mainMenu');
    }
  });

  return {
    init: init,
    Main: Main
  };
});
