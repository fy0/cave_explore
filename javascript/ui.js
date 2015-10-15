(function() {
  var root, ui_init;

  root = typeof global !== "undefined" && global !== null ? global : window;

  ui_init = function() {
    var ui;
    return ui = new vue({
      el: '#rpg',
      data: {
        message: 'Hello Vue.js!'
      }
    });
  };

}).call(this);
