
root = global ? window

obj_length = (o) ->
    count = 0
    for n of o
        if o.hasOwnProperty(n)
            count++
    return count


rand = (value) ->
    return Math.ceil(Math.random() * value)

randr = (a, b) ->
    return Math.ceil(a + Math.random() * (b-a))


class Character
    constructor: ->
        @hp = 70
        @hp_max = 70
        @mp = 5
        @mp_max = 5
        @atk = 5
        @spd = 7
        @attr_point = 0
        @lazy_point = 5
        @lazy_point_max = 5
        @effect = {}

    refresh: ->
        @hp = @hp_max
        @mp = @mp_max
        @lazy_point = @lazy_point_max

    inc: (key, value) ->
        if @hasOwnProperty(key)
            if key == 'hp'
                @[key] += value
                if @[key] > @hp_max
                    @[key] = @hp_max
            else if key == 'mp'
                @[key] += value
                if @[key] > @mp_max
                    @[key] = @mp_max
            else
                @[key] += value

    get: (key) ->
        if @hasOwnProperty(key)
            if @effect.hasOwnProperty(key)
                extra = @effect[key]
            else
                extra = 0
            return @[key] + extra

class Weather
    @values = {
        1: {txt:'阴', effect:{}, desc:'今天是阴天。'},
        2: {txt:'晴', effect:{lazy_point:1, atk:1}, desc:'今天是晴天，疲劳值+1，攻击力+1'},
        3: {txt:'雨', effect:{spd:1, lazy_point:-1, atk:-2}, desc:'今天是雨天，速度+1，攻击-2，疲劳值-1'},
    }

    constructor: ->
        @next()

    next: ->
        cls = Weather
        @today = cls.values[rand(obj_length(cls.values))]

class Camera
    constructor: ->
        @minx = 0
        @miny = 0
        @width = 960
        @height = 240

class Log
    constructor: ->
        @items = []

    blank: ->
        @items.push({txt:'---', color:'#7777aa'})

    print: (txt, color='black') ->
        @items.push({txt, color})
        return


class Game
    constructor: ->
        @day = 1
        @weather = new Weather()
        @camera = new Camera()
        @log = new Log()
        @pigfoot = new Character()
        @focus = null
        @path = {children:[]}
        @path.children.push({x:20, y:120, type:"nothing", parent: @path, children:[]})
        @curpath = @path.children[0]
        @path_avail = []
        @refresh_arrow_transform()
        @weather_refresh()

    path_reset: ->
        @path.children = []
        @path.children.push({x:20, y:150, type:"nothing", parent: @path, children:[]})
        @curpath = @path.children[0]
        @path_avail = []
        @refresh_arrow_transform()

    refresh_arrow_transform: ->
        last = @curpath
        x = last.x
        y = last.y - 28
        @arrow_transform = "translate(#{x}, #{y})"

    last: ->
        p = @curpath.parent
        p.children[p.children.length - 1]

    dead_or_new_road: ->
        if @path_avail.length
            @add_node("dead_road")
            @curpath = null
            @switch_road()
            @log.print('前路被巨大的石块封死了，看来只有换一条路了。')
        else
            @new_road()

    new_road: ->
        last = @curpath
        new_last = {children:[]}
        new_last.children = [
            {x: last.x+20, y:last.y-23, type:"nothing", parent: new_last, children:[]},
            {x: last.x+20, y:last.y+23, type:"nothing", parent: new_last, children:[]},
        ]
        @curpath.parent.children.push(new_last)
        @curpath = new_last.children[1]
        @path_avail.push(new_last.children[0])
        @refresh_arrow_transform()
        @log.print('啊，一条岔路。生命中有无数选择，现在你的选择也多了一种。')
        return

    switch_road: ->
        @path_avail.push(@curpath) if @curpath
        @curpath = @path_avail.shift()
        @refresh_arrow_transform()
        @monster_info()
        return

    monster_info: ->
        if @curpath.type == 'monster'
            mi = @curpath.minfo
            i = '怪物'
            i = '角色' if @pigfoot.get('spd') > mi.spd
            @log.print("（怪物属性：生命#{mi.hp} 攻击#{mi.atk} 速度#{mi.spd}） => #{i}先攻")
        return

    add_node: (type, data={}) ->
        last = @curpath
        final_data = {x: last.x+25, y:last.y, type:type, parent: last.parent, children:[]}
        final_data[k] = v for k, v of data
        @curpath.parent.children.push(final_data)
        @curpath = final_data
        @refresh_arrow_transform()
        return

    new_space: ->
        last = @curpath
        data = {x: last.x+25, y:last.y, type:"nothing", parent: last.parent, children:[]}
        @curpath.parent.children.push(data)
        @curpath = data
        @refresh_arrow_transform()
        @log.print('你向洞穴深处走去，一切如此平静。什么也没有发生。')
        return

    heal: ->
        num = rand(4/70*@pigfoot.get('hp_max'))
        @add_node("heal", {hp:num})
        @pigfoot.inc('hp', num)
        switch rand(2)
            when 1
                @log.print('你看到了一块闪着柔和光芒的石头，当你向它伸出手去，一股暖流传遍了你的身体。')
                @log.print("在最黑暗的角落，光明依旧存在。生命值回复#{num}")
            when 2
                @log.print('一个冒险者的尸体。他为什么而来？你早已习以为常，顺手翻了一下他的包裹。')
                @log.print("大多数东西对你无用，除了一瓶治疗药剂。生命值回复#{num}")

    harm: ->
        num = rand(6/70*@pigfoot.get('hp_max'))
        @add_node("harm", {hp:num})
        @pigfoot.inc('hp', -num)
        switch rand(3)
            when 1
                @log.print('你继续前行，黑暗中传来窸窸窣窣的声音。你握紧了武器，屏住呼吸。一条蛇！')
                @log.print("你手疾眼快，斩杀了这条蛇，但还是被咬了。受到了#{num}点伤害。")
            when 2
                @log.print('你向前走着，忽然听到了什么声音。你努力分辨着，好像是……机括？弓弦？')
                @log.print("陷阱！你受到了#{num}点伤害。")
            when 3
                @log.print('你的火把灭了，正当你重新点火的时候，一道阴影悄无声息的穿透了你的身体。')
                @log.print('你感到寒冷，痛苦在身体中蔓延。')
                @log.print("你受到负能量侵袭。遭受了#{num}点伤害")

        if @pigfoot.get('hp') <= 0
            @dead()

    attr_point: ->
        @add_node("attr_point", {value:1})
        @pigfoot.inc('attr_point', 1)
        switch rand(3)
            when 1 then @log.print('命运会给勇敢者以祝福，你获得了神力碎片，属性点加1')
            when 2 then @log.print('你捡到了一张强化卷轴，属性点加1')
            when 3 then @log.print('这是什么？一本冒险者的笔记，阅读一下想必有所收获。属性点加1')

    lazy_point_inc: ->
        @add_node("lazy_point_inc", {value:1})
        @pigfoot.inc('lazy_point', 1)
        switch rand(2)
            when 1 then @log.print('你遇到了一池泉水，令人神清气爽。疲劳值恢复1点')
            when 2 then @log.print('水流的声音……这里是地下河，看来可以休息一下了。疲劳值恢复1点')

    lazy_point_dec: ->
        @add_node("lazy_point_dec", {value:1})
        @pigfoot.inc('lazy_point', -1)
        switch rand(3)
            when 1 then @log.print('路途艰难，你耗费了大量体力，疲劳值消耗1点')
            when 2 then @log.print('石块密布，杂草丛生。你花了好大力气才清理出一条道路。疲劳值消耗1点')
            when 3 then @log.print('一块石头挡住了你的去路，你决定将他推开。疲劳值消耗1点')

        if @pigfoot.get('lazy_point') <= 0
            @tried()

    monster: ->
        @log.print('你小心翼翼地向前走着，黑暗如影随形。忽然，你感受到了死一般的寂静。停下脚步，黑暗中出现了一双血红的眸子。')
        @log.print('（前行则攻击，也可以换路来避开，击杀会消耗疲劳值1点）')
        hp = Math.ceil(5*(1+@day/5) + rand(8)*(1+@day/5))
        spd = Math.ceil(4*(1+@day/5) + rand(4*(1+@day/5)))
        atk = Math.ceil(3*(1+@day/5) + randr(2,6)*(1+@day/5))
        exp = parseFloat(((hp + spd + atk) / (1+@day/5) / (9 + 6 + 4) * 0.5).toFixed(1))
        data = {hp, spd, atk, exp}
        @add_node("monster", {minfo: data})
        @monster_info()

    tried: ->
        @log.print('搏杀与行走使你疲惫不堪，你再也无法支撑下去，只得回去。只好等到明天了。')
        @tomorrow()

    dead: ->
        @log.print('你受到了重创，最终拼尽全力逃了回去。这一天结束了。属性点-1')
        @pigfoot.inc('attr_point', -1)
        @tomorrow()

    step: ->
        if @curpath.type == 'monster'
            switch rand(3)
                when 1 then @log.print("你不曾迟疑，挥剑而上。")
                when 2 then @log.print("你摆好架势，向怪物发起了攻击")
                when 3 then @log.print("你迅速举起武器，横斩过去")
            mi = @curpath.minfo
            self = @

            atk1 = ->
                mi.hp -= self.pigfoot.get('atk')
                if mi.hp <= 0
                    self.log.print("经过一番搏斗，你杀死了怪物。你感受到了深深的疲倦。")
                    self.log.print("疲劳值-1，属性点+#{mi.exp}")
                    self.new_space()

                    self.pigfoot.inc('attr_point', mi.exp)
                    self.pigfoot.inc('lazy_point', -1)
                    if self.pigfoot.get('lazy_point') <= 0
                        self.tried()
                    return 1
                return

            atk2 = ->
                self.pigfoot.inc('hp', -mi.hp)
                if self.pigfoot.get('hp') <= 0
                    self.dead()
                    return 1
                return

            if @pigfoot.get('spd') > mi.spd
                return if atk1()
                return if atk2()
            else
                return if atk2()
                return if atk1()

            @monster_info()
        else
            value = rand(18)
            switch
                when 1<=value<=1 then @dead_or_new_road() # 死路/新路
                when 2<=value<=2 then @new_road() # 新路
                when 3<=value<=8 then @new_space() # 空白
                when 9<=value<=9 then @heal() # D4回血
                when 10<=value<=10 then @harm() # D6扣血
                when 11<=value<=12 then @attr_point() # 属性点
                when 13<=value<=13 then @lazy_point_inc() # 疲劳+1
                when 14<=value<=14 then @lazy_point_dec() # 疲劳-1
                when 15<=value<=18 then @monster() # 怪物
        return

    tomorrow: ->
        @day += 1
        @weather.next()
        @pigfoot.refresh()
        @path_reset()
        @weather_refresh()

    weather_refresh: ->
        @log.print(@weather.today.desc)
        @pigfoot.effect = @weather.today.effect
        return



root.init = ->
    game = new Game()

    Vue.transition('expand', {
        enter: (e) ->
            box = document.getElementById("logbox")
            box.scrollTop = box.scrollHeight
    })

    MyComponent = Vue.extend({
        props: ['model'],
        template: '#node-template',
        computed: {
            is_parent: ->
                return @model.children and @model.children.length
        }
    })

    Vue.component('node', MyComponent)

    ui = new Vue({
        el: '#rpg',
        data: {
            game: game,
            weather: game.weather,
            charinfo: game.pigfoot,
            path: game.path,
            camera: game.camera,
        },
        computed: {
            camera_box: ->
                c = game.camera
                return "#{c.minx} #{c.miny} #{c.width} #{c.height}"

            arrow_transform: ->
                last = game.last()
                x = last.x
                y = last.y - 28
                return "translate(#{x}, #{y})"

            atk_txt: ->
                eatk = game.pigfoot.effect.atk || 0
                if eatk >= 0
                    eatk = '+' + eatk.toString()
                return "#{game.pigfoot.atk}#{eatk}"

            spd_txt: ->
                val = game.pigfoot.effect.spd || 0
                val = '+' + val.toString() if val >= 0
                return "#{game.pigfoot.spd}#{val}"

            lazy_point_txt: ->
                val = game.pigfoot.effect.lazy_point || 0
                val = '+' + val.toString() if val >= 0
                return "#{game.pigfoot.lazy_point}#{val}"
        },
        methods: {
            prevent: (e) ->
                e.preventDefault()
            dragStart: (e) ->
                if e.touches
                    @drag = [e.touches[0].clientX, e.touches[0].clientY]
                else
                    @drag = [e.x, e.y]
                @startx = game.camera.minx
                @starty = game.camera.miny
            dragMove: (e) ->
                if @drag
                    if e.touches
                        ox = e.touches[0].clientX - @drag[0]
                        oy = e.touches[0].clientY - @drag[1]
                        e.preventDefault()
                    else
                        ox = e.x - @drag[0]
                        oy = e.y - @drag[1]
                    game.camera.minx = @startx - ox
                    game.camera.miny = @starty - oy
            dragEnd: (e) ->
                @drag = false
            step: ->
                game.step()
            switch_road: ->
                game.switch_road()
            seeyou: ->
                game.log.print('带着满身的疲惫，你决定回家休息。')
                game.log.print('但是随着时间的流逝，黑暗的力量会使得怪物变得更强。')
                game.tomorrow()

            life_up: ->
                if game.pigfoot.get('attr_point') >= 1
                    game.pigfoot.inc('attr_point', -1)
                    game.pigfoot.inc('hp_max', 10)
                    game.pigfoot.inc('hp', 10)

            spd_up: ->
                if game.pigfoot.get('attr_point') >= 2
                    game.pigfoot.inc('attr_point', -2)
                    game.pigfoot.inc('spd', 1)

            atk_up: ->
                if game.pigfoot.get('attr_point') >= 2
                    game.pigfoot.inc('attr_point', -2)
                    game.pigfoot.inc('atk', 1)

            lazy_up: ->
                if game.pigfoot.get('attr_point') >= 1
                    game.pigfoot.inc('attr_point', -1)
                    game.pigfoot.inc('lazy_point_max', 1)

            recure: ->
                if game.pigfoot.get('attr_point') >= 2
                    game.pigfoot.inc('attr_point', -2)
                    game.pigfoot.inc('hp', Math.ceil(game.pigfoot.get('hp_max') * 0.5))
        }
    })
