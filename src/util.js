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

  function ret(x) {
    return function() {
      return x;
    };
  }

  /**
   * sets the texture of a sprite from a canvas
   */
  function getTextureFromCache(game, key) {
    return PIXI.Texture.fromCanvas(game.cache.getCanvas(key));
  }

  var Map = extend(Object, 'Map', {
    constructor: function Map() {
      this.entries = [];
    },
    entry: function entry(key, make) {
      for(var i=0; i<this.entries.length; i++) {
        if(this.entries[i].key == key) {
          return this.entries[i];
        }
      }
      if(make) {
        var entry = {
          key: key,
          value: null
        }
        this.entries.push(entry);
        return entry;
      }
      return null;
    },
    get: function get(key) {
      var entry = this.entry(key, false);
      return entry ? entry.value : entry;
    },
    put: function put(key, value) {
      this.entry(key, true).value = value;
    },
    contains: function contains(key) {
      return this.entry(key, false) != null;
    }
  });

  function addGenImg(cache, key, svg, data) {
    var svg = xmlParser.parseFromString(base.getAsset(svg), 'text/xml');
    var target = createCanvas(svg.width, svg.height);

    var names = Object.getOwnPropertyNames(data);
    for(var i=0; i<names.length; i++) {
      var name = names[i];
      var value = data[name];
      var parts = name.split('.');

      var obj = svg.getElementById(parts[0]);
      if(obj == null) continue

      for(var k=1; k<parts.length-1; k++) {
        obj = obj[parts[k]];
        if(obj == null) break;
      }
      if(obj == null) continue;
      obj[parts[parts.length-1]] = value;
    }
    canvg(target, svg);
    cache.addCanvas(key, target);
  }

  var xmlParser = new DOMParser();

  init();

  return {
    extend: extend,
    createCanvas: createCanvas,
    xmlParser: xmlParser,
    getGame: getGame,
    StateContainer: StateContainer,
    NOP: NOP,
    ret: ret,
    addGenImg: addGenImg,
    getTextureFromCache: getTextureFromCache
  };
});
