(function() {
  var Camera, Character, Game, Log, Weather, obj_length, rand, randr, root;

  root = typeof global !== "undefined" && global !== null ? global : window;

  obj_length = function(o) {
    var count, n;
    count = 0;
    for (n in o) {
      if (o.hasOwnProperty(n)) {
        count++;
      }
    }
    return count;
  };

  rand = function(value) {
    return Math.ceil(Math.random() * value);
  };

  randr = function(a, b) {
    return Math.ceil(a + Math.random() * (b - a));
  };

  Character = (function() {
    function Character() {
      this.hp = 70;
      this.hp_max = 70;
      this.mp = 5;
      this.mp_max = 5;
      this.atk = 5;
      this.spd = 7;
      this.attr_point = 0;
      this.lazy_point = 5;
      this.lazy_point_max = 5;
      this.effect = {};
    }

    Character.prototype.refresh = function() {
      this.hp = this.hp_max;
      this.mp = this.mp_max;
      return this.lazy_point = this.lazy_point_max;
    };

    Character.prototype.inc = function(key, value) {
      if (this.hasOwnProperty(key)) {
        if (key === 'hp') {
          this[key] += value;
          if (this[key] > this.hp_max) {
            return this[key] = this.hp_max;
          }
        } else if (key === 'mp') {
          this[key] += value;
          if (this[key] > this.mp_max) {
            return this[key] = this.mp_max;
          }
        } else {
          return this[key] += value;
        }
      }
    };

    Character.prototype.get = function(key) {
      var extra;
      if (this.hasOwnProperty(key)) {
        if (this.effect.hasOwnProperty(key)) {
          extra = this.effect[key];
        } else {
          extra = 0;
        }
        return this[key] + extra;
      }
    };

    return Character;

  })();

  Weather = (function() {
    Weather.values = {
      1: {
        txt: '阴',
        effect: {},
        desc: '今天是阴天。'
      },
      2: {
        txt: '晴',
        effect: {
          lazy_point: 1,
          atk: 1
        },
        desc: '今天是晴天，疲劳值+1，攻击力+1'
      },
      3: {
        txt: '雨',
        effect: {
          spd: 1,
          lazy_point: -1,
          atk: -2
        },
        desc: '今天是雨天，速度+1，攻击-2，疲劳值-1'
      }
    };

    function Weather() {
      this.next();
    }

    Weather.prototype.next = function() {
      var cls;
      cls = Weather;
      return this.today = cls.values[rand(obj_length(cls.values))];
    };

    return Weather;

  })();

  Camera = (function() {
    function Camera() {
      this.minx = 0;
      this.miny = 0;
      this.width = 960;
      this.height = 240;
    }

    return Camera;

  })();

  Log = (function() {
    function Log() {
      this.items = [];
    }

    Log.prototype.blank = function() {
      return this.items.push({
        txt: '---',
        color: '#7777aa'
      });
    };

    Log.prototype.print = function(txt, color) {
      if (color == null) {
        color = 'black';
      }
      this.items.push({
        txt: txt,
        color: color
      });
    };

    return Log;

  })();

  Game = (function() {
    function Game() {
      this.day = 1;
      this.weather = new Weather();
      this.camera = new Camera();
      this.log = new Log();
      this.pigfoot = new Character();
      this.focus = null;
      this.path = {
        children: []
      };
      this.path.children.push({
        x: 20,
        y: 120,
        type: "nothing",
        parent: this.path,
        children: []
      });
      this.curpath = this.path.children[0];
      this.path_avail = [];
      this.refresh_arrow_transform();
      this.weather_refresh();
    }

    Game.prototype.path_reset = function() {
      this.path.children = [];
      this.path.children.push({
        x: 20,
        y: 150,
        type: "nothing",
        parent: this.path,
        children: []
      });
      this.curpath = this.path.children[0];
      this.path_avail = [];
      return this.refresh_arrow_transform();
    };

    Game.prototype.refresh_arrow_transform = function() {
      var last, x, y;
      last = this.curpath;
      x = last.x;
      y = last.y - 28;
      return this.arrow_transform = "translate(" + x + ", " + y + ")";
    };

    Game.prototype.last = function() {
      var p;
      p = this.curpath.parent;
      return p.children[p.children.length - 1];
    };

    Game.prototype.dead_or_new_road = function() {
      if (this.path_avail.length) {
        this.add_node("dead_road");
        this.curpath = null;
        this.switch_road();
        return this.log.print('前路被巨大的石块封死了，看来只有换一条路了。');
      } else {
        return this.new_road();
      }
    };

    Game.prototype.new_road = function() {
      var last, new_last;
      last = this.curpath;
      new_last = {
        children: []
      };
      new_last.children = [
        {
          x: last.x + 20,
          y: last.y - 23,
          type: "nothing",
          parent: new_last,
          children: []
        }, {
          x: last.x + 20,
          y: last.y + 23,
          type: "nothing",
          parent: new_last,
          children: []
        }
      ];
      this.curpath.parent.children.push(new_last);
      this.curpath = new_last.children[1];
      this.path_avail.push(new_last.children[0]);
      this.refresh_arrow_transform();
      this.log.print('啊，一条岔路。生命中有无数选择，现在你的选择也多了一种。');
    };

    Game.prototype.switch_road = function() {
      if (this.curpath) {
        this.path_avail.push(this.curpath);
      }
      this.curpath = this.path_avail.shift();
      this.refresh_arrow_transform();
      this.monster_info();
    };

    Game.prototype.monster_info = function() {
      var i, mi;
      if (this.curpath.type === 'monster') {
        mi = this.curpath.minfo;
        i = '怪物';
        if (this.pigfoot.get('spd') > mi.spd) {
          i = '角色';
        }
        this.log.print("（怪物属性：生命" + mi.hp + " 攻击" + mi.atk + " 速度" + mi.spd + "） => " + i + "先攻");
      }
    };

    Game.prototype.add_node = function(type, data) {
      var final_data, k, last, v;
      if (data == null) {
        data = {};
      }
      last = this.curpath;
      final_data = {
        x: last.x + 25,
        y: last.y,
        type: type,
        parent: last.parent,
        children: []
      };
      for (k in data) {
        v = data[k];
        final_data[k] = v;
      }
      this.curpath.parent.children.push(final_data);
      this.curpath = final_data;
      this.refresh_arrow_transform();
    };

    Game.prototype.new_space = function() {
      var data, last;
      last = this.curpath;
      data = {
        x: last.x + 25,
        y: last.y,
        type: "nothing",
        parent: last.parent,
        children: []
      };
      this.curpath.parent.children.push(data);
      this.curpath = data;
      this.refresh_arrow_transform();
      this.log.print('你向洞穴深处走去，一切如此平静。什么也没有发生。');
    };

    Game.prototype.heal = function() {
      var num;
      num = rand(4);
      this.add_node("heal", {
        hp: num
      });
      this.pigfoot.inc('hp', num);
      switch (rand(2)) {
        case 1:
          this.log.print('你看到了一块闪着柔和光芒的石头，当你向它伸出手去，一股暖流传遍了你的身体。');
          return this.log.print("在最黑暗的角落，光明依旧存在。生命值回复" + num);
        case 2:
          this.log.print('一个冒险者的尸体。他为什么而来？你早已习以为常，顺手翻了一下他的包裹。');
          return this.log.print("大多数东西对你无用，除了一瓶治疗药剂。生命值回复" + num);
      }
    };

    Game.prototype.harm = function() {
      var num;
      num = rand(6);
      this.add_node("harm", {
        hp: num
      });
      this.pigfoot.inc('hp', -num);
      switch (rand(3)) {
        case 1:
          this.log.print('你继续前行，黑暗中传来窸窸窣窣的声音。你握紧了武器，屏住呼吸。一条蛇！');
          this.log.print("你手疾眼快，斩杀了这条蛇，但还是被咬了。受到了" + num + "点伤害。");
          break;
        case 2:
          this.log.print('你向前走着，忽然听到了什么声音。你努力分辨着，好像是……机括？弓弦？');
          this.log.print("陷阱！你受到了" + num + "点伤害。");
          break;
        case 3:
          this.log.print('你的火把灭了，正当你重新点火的时候，一道阴影悄无声息的穿透了你的身体。');
          this.log.print('你感到寒冷，痛苦在身体中蔓延。');
          this.log.print("你受到负能量侵袭。遭受了" + num + "点伤害");
      }
      if (this.pigfoot.get('hp') <= 0) {
        return this.dead();
      }
    };

    Game.prototype.attr_point = function() {
      this.add_node("attr_point", {
        value: 1
      });
      this.pigfoot.inc('attr_point', 1);
      switch (rand(3)) {
        case 1:
          return this.log.print('命运会给勇敢者以祝福，你获得了神力碎片，属性点加1');
        case 2:
          return this.log.print('你捡到了一张强化卷轴，属性点加1');
        case 3:
          return this.log.print('这是什么？一本冒险者的笔记，阅读一下想必有所收获。属性点加1');
      }
    };

    Game.prototype.lazy_point_inc = function() {
      this.add_node("lazy_point_inc", {
        value: 1
      });
      this.pigfoot.inc('lazy_point', 1);
      switch (rand(2)) {
        case 1:
          return this.log.print('你遇到了一池泉水，令人神清气爽。疲劳值恢复1点');
        case 2:
          return this.log.print('水流的声音……这里是地下河，看来可以休息一下了。疲劳值恢复1点');
      }
    };

    Game.prototype.lazy_point_dec = function() {
      this.add_node("lazy_point_dec", {
        value: 1
      });
      this.pigfoot.inc('lazy_point', -1);
      switch (rand(3)) {
        case 1:
          return this.log.print('路途艰难，你耗费了大量体力，疲劳值消耗1点');
        case 2:
          return this.log.print('石块密布，杂草丛生。你花了好大力气才清理出一条道路。疲劳值消耗1点');
        case 3:
          return this.log.print('一块石头挡住了你的去路，你决定将他推开。疲劳值消耗1点');
      }
    };

    Game.prototype.monster = function() {
      var atk, data, exp, hp, spd;
      this.log.print('你小心翼翼地向前走着，黑暗如影随形。忽然，你感受到了死一般的寂静。停下脚步，黑暗中出现了一双血红的眸子。');
      this.log.print('（前行则攻击，也可以换路来避开，击杀会消耗疲劳值1点）');
      hp = Math.ceil(5 * (1 + this.day / 5) + rand(8) * (1 + this.day / 5));
      spd = Math.ceil(4 * (1 + this.day / 5) + rand(4) * (1 + this.day / 5));
      atk = Math.ceil(3 * (1 + this.day / 5) + randr(2, 6) * (1 + this.day / 5));
      exp = parseFloat(((hp + spd + atk) / (1 + this.day / 5) / (9 + 6 + 4) * 0.5).toFixed(1));
      data = {
        hp: hp,
        spd: spd,
        atk: atk,
        exp: exp
      };
      this.add_node("monster", {
        minfo: data
      });
      return this.monster_info();
    };

    Game.prototype.tried = function() {
      this.log.print('搏杀与行走使你疲惫不堪，你再也无法支撑下去，只得回去。只好等到明天了。');
      return this.tomorrow();
    };

    Game.prototype.dead = function() {
      this.log.print('你受到了重创，最终拼尽全力逃了回去。这一天结束了。属性点-1');
      this.pigfoot.inc('attr_point', -1);
      return this.tomorrow();
    };

    Game.prototype.step = function() {
      var atk1, atk2, mi, self, value;
      if (this.curpath.type === 'monster') {
        switch (rand(3)) {
          case 1:
            this.log.print("你不曾迟疑，挥剑而上。");
            break;
          case 2:
            this.log.print("你摆好架势，向怪物发起了攻击");
            break;
          case 3:
            this.log.print("你迅速举起武器，横斩过去");
        }
        mi = this.curpath.minfo;
        self = this;
        atk1 = function() {
          mi.hp -= self.pigfoot.get('atk');
          if (mi.hp <= 0) {
            self.log.print("经过一番搏斗，你杀死了怪物。你感受到了深深的疲倦。");
            self.log.print("疲劳值-1，属性点+" + mi.exp);
            self.new_space();
            self.pigfoot.inc('attr_point', mi.exp);
            self.pigfoot.inc('lazy_point', -1);
            if (self.pigfoot.get('lazy_point') <= 0) {
              self.tried();
            }
            return 1;
          }
        };
        atk2 = function() {
          self.pigfoot.inc('hp', -mi.hp);
          if (self.pigfoot.get('hp') <= 0) {
            self.dead();
            return 1;
          }
        };
        if (this.pigfoot.get('spd') > mi.spd) {
          if (atk1()) {
            return;
          }
          if (atk2()) {
            return;
          }
        } else {
          if (atk2()) {
            return;
          }
          if (atk1()) {
            return;
          }
        }
        this.monster_info();
      } else {
        value = rand(18);
        switch (false) {
          case !((1 <= value && value <= 1)):
            this.dead_or_new_road();
            break;
          case !((2 <= value && value <= 2)):
            this.new_road();
            break;
          case !((3 <= value && value <= 8)):
            this.new_space();
            break;
          case !((9 <= value && value <= 9)):
            this.heal();
            break;
          case !((10 <= value && value <= 10)):
            this.harm();
            break;
          case !((11 <= value && value <= 12)):
            this.attr_point();
            break;
          case !((13 <= value && value <= 13)):
            this.lazy_point_inc();
            break;
          case !((14 <= value && value <= 14)):
            this.lazy_point_dec();
            break;
          case !((15 <= value && value <= 18)):
            this.monster();
        }
      }
    };

    Game.prototype.tomorrow = function() {
      this.day += 1;
      this.weather.next();
      this.pigfoot.refresh();
      this.path_reset();
      return this.weather_refresh();
    };

    Game.prototype.weather_refresh = function() {
      this.log.print(this.weather.today.desc);
      this.pigfoot.effect = this.weather.today.effect;
    };

    return Game;

  })();

  root.init = function() {
    var MyComponent, game, ui;
    game = new Game();
    Vue.transition('expand', {
      enter: function(e) {
        var box;
        box = document.getElementById("logbox");
        return box.scrollTop = box.scrollHeight;
      }
    });
    MyComponent = Vue.extend({
      props: ['model'],
      template: '#node-template',
      computed: {
        is_parent: function() {
          return this.model.children && this.model.children.length;
        }
      }
    });
    Vue.component('node', MyComponent);
    ui = new Vue({
      el: '#rpg',
      data: {
        game: game,
        weather: game.weather,
        charinfo: game.pigfoot,
        path: game.path,
        camera: game.camera
      },
      computed: {
        camera_box: function() {
          var c;
          c = game.camera;
          return c.minx + " " + c.miny + " " + c.width + " " + c.height;
        },
        arrow_transform: function() {
          var last, x, y;
          last = game.last();
          x = last.x;
          y = last.y - 28;
          return "translate(" + x + ", " + y + ")";
        },
        atk_txt: function() {
          var eatk;
          eatk = game.pigfoot.effect.atk || 0;
          if (eatk >= 0) {
            eatk = '+' + eatk.toString();
          }
          return "" + game.pigfoot.atk + eatk;
        },
        spd_txt: function() {
          var val;
          val = game.pigfoot.effect.spd || 0;
          if (val >= 0) {
            val = '+' + val.toString();
          }
          return "" + game.pigfoot.spd + val;
        },
        lazy_point_txt: function() {
          var val;
          val = game.pigfoot.effect.lazy_point || 0;
          if (val >= 0) {
            val = '+' + val.toString();
          }
          return "" + game.pigfoot.lazy_point + val;
        }
      },
      methods: {
        prevent: function(e) {
          return e.preventDefault();
        },
        dragStart: function(e) {
          this.drag = [e.x, e.y];
          this.startx = game.camera.minx;
          return this.starty = game.camera.miny;
        },
        dragMove: function(e) {
          var ox, oy;
          if (this.drag) {
            ox = e.x - this.drag[0];
            oy = e.y - this.drag[1];
            game.camera.minx = this.startx - ox;
            return game.camera.miny = this.starty - oy;
          }
        },
        dragEnd: function(e) {
          return this.drag = false;
        },
        step: function() {
          return game.step();
        },
        switch_road: function() {
          return game.switch_road();
        },
        seeyou: function() {
          game.log.print('带着满身的疲惫，你决定回家休息。');
          game.log.print('但是随着时间的流逝，黑暗的力量会使得怪物变得更强。');
          return game.tomorrow();
        },
        life_up: function() {
          if (game.pigfoot.get('attr_point') >= 1) {
            game.pigfoot.inc('attr_point', -1);
            game.pigfoot.inc('hp_max', 10);
            return game.pigfoot.inc('hp', 10);
          }
        },
        spd_up: function() {
          if (game.pigfoot.get('attr_point') >= 2) {
            game.pigfoot.inc('attr_point', -2);
            return game.pigfoot.inc('spd', 1);
          }
        },
        atk_up: function() {
          if (game.pigfoot.get('attr_point') >= 2) {
            game.pigfoot.inc('attr_point', -2);
            return game.pigfoot.inc('atk', 1);
          }
        },
        lazy_up: function() {
          if (game.pigfoot.get('attr_point') >= 1) {
            game.pigfoot.inc('attr_point', -1);
            return game.pigfoot.inc('lazy_point', 1);
          }
        },
        recure: function() {
          if (game.pigfoot.get('attr_point') >= 2) {
            game.pigfoot.inc('attr_point', -2);
            return game.pigfoot.inc('hp', Math.ceil(game.pigfoot.get('hp_max') * 0.5));
          }
        }
      }
    });
    return root.game = game;
  };

}).call(this);
