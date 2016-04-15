base.registerModule('util', function() {
  /**
   * gives Phaser classes names for extending them
   */
  function init() {
    var names = Object.getOwnPropertyNames(Phaser);
    for(var i=0; i<names.length; i++) {
      var name = names[i];
      var value = Phaser[name];
      if(value instanceof Function && value.prototype)
        value.prototype.__name__ = name;
    }
  }

  /**
   * extends a class. Super methods are called method$Parent
   * @param parents the constructors of the parent classes
   * @param className the name of the class to create
   * @param sub the properties of the extended classes prototype
   */
  function extend(parents, className, sub) {
    if(!(parents instanceof Array)) {
      parents = [parents];
    }
    var proto = Object.create(parents[0].prototype);
    var names, name, value, i;
    // copying parent attributes
    for (i = parents.length-1; i >= 0; i--) {
      var parent = parents[i];
      names = Object.getOwnPropertyNames(parent.prototype);
      for (var k = 0; k<names.length; k++) {
          name = names[k];
          if(name == "__proto__") continue;
          value = Object.getOwnPropertyDescriptor(parent.prototype, name);
          Object.defineProperty(proto, name, value);
          if (parent.prototype.__name__ && name.indexOf("$") == -1) {
            var extName = name + "$" + parent.prototype.__name__;
            Object.defineProperty(proto, extName, value);
          }
      }
    }

    proto.__name__ = className; // needed for child classes

    names = Object.getOwnPropertyNames(sub);
    for (i=0; i<names.length; i++) { // copying new attributes
      name = names[i];
      proto[name] = sub[name];
    }

    if(!proto.hasOwnProperty('constructor'))
      proto.constructor = NOP;

    proto.constructor.prototype = proto; // setting constructor prototype
    return proto.constructor;
  }

  /**
   * creates a canvas with the specified width and height
   */
  function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * returns a reference to the game
   */
  function getGame() {
    return base.importModule('main').Main.instance;
  }

  function collideTilemapLayer(sprite, layer) {
    //get local sprite bounds
    var globalTopleft = sprite.world;
    console.log(globalTopleft.y + ", " + sprite.world.y);
    var globalBottomright = sprite.toGlobal(new Phaser.Point(sprite.width, sprite.height));
    var localTopleft = layer.toLocal(globalTopleft);
    var localBottomright = layer.toLocal(globalBottomright);
    var width = localBottomright.x - localTopleft.x;
    var height = localBottomright.y - localTopleft.y;

    if(globalTopleft.y > layer.map.heightInPixels) {
      console.log('stop...');
    }

    //process tiles
    var tiles = layer.getTiles(globalTopleft.left, globalTopleft.top, width, height, true, false);
    var tileSprite = getGame().make.sprite(0, 0, null);
    getGame().physics.arcade.enable(tileSprite);

    for(var i=0; i<tiles.length; i++) {
      var tile = tiles[i];
      //tileSprite.position.x;
    }
  }

  var StateContainer = extend(Phaser.State, 'StateContainer', {
      constructor: function MenuContainer(main, name) {
        this.constructor$State(main, name);
        this.subStates = [];
      },

      preload: function preload() {
        this.subStates.forEach(function(x) {
          x.preload();
        });
      },

      create: function create() {
        this.subStates.forEach(function(x) {
          x.create();
        });
      },

      update: function update() {
        this.subStates.forEach(function(x) {
          x.update();
        });
      }
  });

  /**
   * does nothing. useful for placeholders
   */
  function NOP() {}

  init();

  return {
    extend: extend,
    createCanvas: createCanvas,
    xmlParser: new DOMParser(),
    getGame: getGame,
    collideTilemapLayer: collideTilemapLayer,
    StateContainer: StateContainer,
    NOP: NOP
  };
});
