base.registerModule('menu', function() {
  var util = base.importModule('util');
  var gui = base.importModule('gui');

  var LoseMenu = util.extend(gui.Menu, 'LoseMenu', {
    constructor: function LoseMenu() {
      this.constructor$Menu('gui/loseMenu');
      this.score = null;
    },
    create: function create() {
      this.create$Menu();
      this.canvg.Definitions.score.children[0].children[0].text =
          'Score: ' + this.score;
      this.canvg.draw();
      this.context.fade('in', 'down', 'play');
      this.game.playSound('lose');
    }
  });
  LoseMenu.instance = null;

  return {
    LoseMenu: LoseMenu
  }
});
