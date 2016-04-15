base.registerModule('main', function() {
  var phaserInjector = base.importModule('phaserInjector');
  var play = base.importModule('play');
  var gui = base.importModule('gui');
  var util = base.importModule('util');

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
    },
    create: function create() {
      this.game.state.start('mainMenu');
    }
  });

  return {
    init: init,
    Main: Main
  };
});
