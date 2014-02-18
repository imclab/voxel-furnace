// Generated by CoffeeScript 1.7.0
(function() {
  var Furnace, FurnaceDialog, Inventory, InventoryWindow, ItemPile, ModalDialog,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ModalDialog = require('voxel-modal-dialog');

  Inventory = require('inventory');

  InventoryWindow = require('inventory-window');

  ItemPile = require('itempile');

  module.exports = function(game, opts) {
    return new Furnace(game, opts);
  };

  module.exports.pluginInfo = {
    loadAfter: ['voxel-registry', 'voxel-recipes', 'voxel-carry']
  };

  Furnace = (function() {
    function Furnace(game, opts) {
      var _ref, _ref1, _ref2;
      this.game = game;
      if (opts == null) {
        opts = {};
      }
      this.playerInventory = (function() {
        var _ref1, _ref2, _ref3;
        if ((_ref = (_ref1 = (_ref2 = game.plugins) != null ? (_ref3 = _ref2.get('voxel-carry')) != null ? _ref3.inventory : void 0 : void 0) != null ? _ref1 : opts.playerInventory) != null) {
          return _ref;
        } else {
          throw new Error('voxel-furnace requires "voxel-carry" plugin or "playerInventory" set to inventory instance');
        }
      })();
      this.registry = (function() {
        var _ref2;
        if ((_ref1 = (_ref2 = game.plugins) != null ? _ref2.get('voxel-registry') : void 0) != null) {
          return _ref1;
        } else {
          throw new Error('voxel-furnace requires "voxel-registry" plugin');
        }
      })();
      this.recipes = (function() {
        var _ref3;
        if ((_ref2 = (_ref3 = game.plugins) != null ? _ref3.get('voxel-recipes') : void 0) != null) {
          return _ref2;
        } else {
          throw new Error('voxel-furnace requires "voxel-recipes" plugin');
        }
      })();
      if (opts.registerBlock == null) {
        opts.registerBlock = true;
      }
      if (opts.registerRecipe == null) {
        opts.registerRecipe = true;
      }
      if (opts.registerCoal == null) {
        opts.registerCoal = true;
      }
      if (this.game.isClient) {
        this.furnaceDialog = new FurnaceDialog(game, this.playerInventory, this.registry, this.recipes);
      }
      this.opts = opts;
      this.enable();
    }

    Furnace.prototype.enable = function() {
      if (this.opts.registerBlock) {
        this.registry.registerBlock('furnace', {
          texture: ['furnace_top', 'cobblestone', 'furnace_front_on'],
          onInteract: (function(_this) {
            return function() {
              _this.furnaceDialog.open();
              return true;
            };
          })(this)
        });
      }
      if (this.opts.registerRecipe) {
        this.recipes.registerAmorphous(['cobblestone', 'cobblestone', 'cobblestone', 'cobblestone'], ['furnace']);
      }
      if (this.opts.registerCoal) {
        return this.registry.registerItem('coal', {
          itemTexture: 'i/coal'
        });
      }
    };

    Furnace.prototype.disable = function() {};

    return Furnace;

  })();

  FurnaceDialog = (function(_super) {
    __extends(FurnaceDialog, _super);

    function FurnaceDialog(game, playerInventory, registry, recipes) {
      var burnCont, contents, crDiv, fuelCont, resultCont;
      this.game = game;
      this.playerInventory = playerInventory;
      this.registry = registry;
      this.recipes = recipes;
      this.playerIW = new InventoryWindow({
        width: 10,
        registry: this.registry,
        inventory: this.playerInventory
      });
      this.burnInventory = new Inventory(1);
      this.burnInventory.on('changed', (function(_this) {
        return function() {
          return _this.updateSmelting();
        };
      })(this));
      this.burnIW = new InventoryWindow({
        width: 1,
        registry: this.registry,
        inventory: this.burnInventory,
        linkedInventory: this.playerInventory
      });
      this.fuelInventory = new Inventory(1);
      this.fuelInventory.on('changed', (function(_this) {
        return function() {
          return _this.updateSmelting();
        };
      })(this));
      this.fuelIW = new InventoryWindow({
        width: 1,
        registry: this.registry,
        inventory: this.fuelInventory,
        linkedInventory: this.playerInventory
      });
      this.resultInventory = new Inventory(1);
      this.resultIW = new InventoryWindow({
        inventory: this.resultInventory,
        registry: this.registry,
        allowDrop: false,
        linkedInventory: this.playerInventory
      });
      this.resultIW.on('pickup', (function(_this) {
        return function() {
          return _this.updateSmelting();
        };
      })(this));
      crDiv = document.createElement('div');
      crDiv.style.display = 'inline-flex';
      crDiv.style.justifyContent = 'center';
      crDiv.style.width = '100%';
      burnCont = this.burnIW.createContainer();
      fuelCont = this.fuelIW.createContainer();
      resultCont = this.resultIW.createContainer();
      burnCont.style.display = 'flex';
      burnCont.style.flex = '1';
      fuelCont.style.display = 'flex';
      fuelCont.style.flex = '1';
      resultCont.style.display = 'flex';
      crDiv.appendChild(burnCont);
      crDiv.appendChild(fuelCont);
      crDiv.appendChild(resultCont);
      contents = [];
      contents.push(crDiv);
      contents.push(document.createElement('br'));
      contents.push(this.playerIW.createContainer());
      FurnaceDialog.__super__.constructor.call(this, game, {
        contents: contents
      });
    }

    FurnaceDialog.prototype.updateSmelting = function() {
      var burn, fuel;
      if (this.isSmelting) {
        return;
      }
      this.isSmelting = true;
      while (true) {
        if (!this.isFuel(this.fuelInventory.get(0))) {
          break;
        }
        if (!this.isBurnable(this.burnInventory.get(0))) {
          break;
        }
        if (this.resultInventory.get(0) && (this.resultInventory.get(0).item !== 'coal' || this.resultInventory.get(0).count === 64)) {
          break;
        }
        console.log("smelting: " + this.fuelInventory + " + " + this.burnInventory + " = " + this.resultInventory);
        fuel = this.fuelInventory.takeAt(0, 1);
        burn = this.burnInventory.takeAt(0, 1);
        this.resultInventory.give(new ItemPile('coal', 1));
        console.log("smelted: " + this.fuelInventory + " + " + this.burnInventory + " = " + this.resultInventory);
      }
      return this.isSmelting = false;
    };

    FurnaceDialog.prototype.isFuel = function(itemPile) {
      if (!itemPile) {
        return false;
      }
      return itemPile.item === 'stick';
    };

    FurnaceDialog.prototype.isBurnable = function(itemPile) {
      var _ref;
      if (!itemPile) {
        return false;
      }
      return (_ref = itemPile.item) === 'logBirch' || _ref === 'logOak';
    };

    FurnaceDialog.prototype.close = function() {
      return FurnaceDialog.__super__.close.call(this);
    };

    return FurnaceDialog;

  })(ModalDialog);

}).call(this);
