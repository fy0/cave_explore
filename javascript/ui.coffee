
root = global ? window

ui_init = ->
    ui = new vue({
        el: '#rpg',
        data: {
            message: 'Hello Vue.js!'
        },
    })
