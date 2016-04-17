base.registerModule('gui', function() {
  var util = base.importModule('util');

  var Menu = util.extend(Phaser.State, 'Menu', {
    constructor: function Menu(gui) {
      this.constructor$State(this);
      this.context = new GuiContext(this);
      this.gui = gui;
      this.targetCanvas = null;
      this.sprite = null;
      this.canvg = null;
    },

    create: function create() {
      this.loadMenu(this.gui);
      var ms = util.getGame().input.mousePointer;
      this.game.input.onDown.add(function() {
        var event = new MouseEvent('click', {
          clientX: ms.clientX,
          clientY: ms.clientY,
          button: ms.button
        });
        this.targetCanvas.dispatchEvent(event);
      }, this);
    },

    update: function update() {
      this.canvg.update();
      this.sprite.setTexture(PIXI.Texture.fromCanvas(this.targetCanvas));
    },

    loadMenu: function loadMenu(newMenu) {
      if(this.canvg) return;
      var svg = util.xmlParser.parseFromString(base.getAsset(newMenu), 'text/xml');
      var width = svg.width;
      var height = svg.height;
      this.targetCanvas = util.createCanvas(width, height);
      this.loadCallbacks(svg);
      this.sprite = this.game.add.sprite(0, 0, null);
      this.canvg = canvg(this.targetCanvas, svg, {
        eventCallback: function(event, element) {
          var id = element.attribute('id').value;
          if(this.callbacks.hasOwnProperty(id)) {
            this.callbacks[id]();
          }
        }.bind(this)
      });
    },

    loadCallbacks: function loadCallbacks(svg) {
      var treeWalker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
      this.callbacks = {};
      while(treeWalker.nextNode()) {
        var element = treeWalker.currentNode;
        if(element.hasAttribute('onclick') && element.hasAttribute('id')) {
          var onclick = this.parseCallback(element.getAttribute('onclick'));
          var id = element.getAttribute('id');
          if(onclick) this.callbacks[id] = onclick;
        }
      }
    },

    parseCallback: function parseCallback(callback) {
      var tmp = callback.split(' ');
      var parts = [];
      for(var i=0; i<tmp.length; i++) { //filter empty
        if(tmp[i]) parts.push(tmp[i]);
      }

      if(!parts[0]) return null;

      if(!(parts[0] in this.context))
        throw(new Error("invalid callback '" + callback + "'"));

      return function() {
        if(this.context[parts[0]] instanceof Function) {
          this.context[parts[0]].apply(this.context, parts.slice(1));
        }
      }.bind(this);
    }
  });

  var FADE_MOVE = 50;
  var FADE_TIME = 500;

  var GuiContext = util.extend(Object, 'GuiContext', {
    constructor: function GuiContext(menu) {
      this.menu = menu;
    },
    changeState: function changeState(newState) {
      this.menu.game.state.start(newState);
    },
    fade: function fadeOut(isOut, isUp, newState) {
      var direction = isUp[0] == 'u' || isUp[0] == 'U' ? -1 : 1;
      var out = isOut[0] == 'o' || isOut[0] == 'O';
      var tween = this.menu.game.add.tween(this.menu.sprite);
      this.menu.sprite.alpha = out ? 1 : 0;
      tween.to({
        y: out ? this.menu.sprite.y + direction * FADE_MOVE : 0,
        alpha: out ? 0 : 1
      }, FADE_TIME);
      this.menu.sprite.position.y -= out ? 0 : direction * FADE_MOVE;
      tween.onComplete.add(this.changeState.bind(this, newState));
      tween.start();
    }
  });

  return {
    Menu: Menu
  };
});
