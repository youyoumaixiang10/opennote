# The story script: every spoken line (English + Chinese caption) and the
# beats the visuals hang on. build.py turns this into timing marks, captions,
# the audio mix and index.html.

NUM = ["One!", "Two!", "Three!", "Four!", "Five!"]
NUM_ZH = ["一！", "二！", "三！", "四！", "五！"]

DAYS = [
    # id, day, 中文, banner colour, item kind, n, answer, 答案, word, 单词, count line, 数量句, hungry line, 饿句
    ("mon", "Monday", "星期一", "#ffd34d", "apple", 1,
     "An apple! A red apple!", "苹果！红红的苹果！", "apple", "苹果",
     "One apple.", "一个苹果。", "But he was still hungry!", "可是他还是好饿！"),
    ("tue", "Tuesday", "星期二", "#ff9fb4", "pear", 2,
     "Pears! Green pears!", "梨！绿绿的梨！", "pear", "梨",
     "Two pears!", "两个梨！", "Still hungry!", "还是好饿！"),
    ("wed", "Wednesday", "星期三", "#c9b5f5", "plum", 3,
     "Plums! Purple plums!", "李子！紫紫的李子！", "plum", "李子",
     "Three plums!", "三个李子！", "He was still hungry!", "他还是好饿！"),
    ("thu", "Thursday", "星期四", "#9fd8ff", "strawberry", 4,
     "Strawberries! Red strawberries!", "草莓！红红的草莓！", "strawberry", "草莓",
     "Four strawberries!", "四个草莓！", "Still hungry!", "还是好饿！"),
    ("fri", "Friday", "星期五", "#b6e98a", "orange", 5,
     "Oranges! Round oranges!", "橙子！圆圆的橙子！", "orange", "橙子",
     "Five oranges!", "五个橙子！", "Still... hungry!", "还是……好饿！"),
]


def build_story(S):
    # ---------- title ----------
    S.scene("title", "title")
    S.wait(0.4)
    S.fx("sparkle", 0.2)
    S.say("t", "The Hungry Little Caterpillar.", "好饿的小毛毛虫", gap=1.2)

    # ---------- egg ----------
    S.scene("egg", "egg")
    S.mark("drop")
    S.fx("boing", 0.4)
    S.say("egg", "Look! A little egg, on a leaf.", "看！叶子上有一颗小小的蛋。", gap=0.6)
    S.mark("sunrise")
    S.fx("sparkle", 0.5)
    S.say("sun", "The sun came up.", "太阳出来了。", gap=0.5)
    S.mark("wobble")
    for i in range(3):
        S.fx("tick", 0.1 + i * 0.3)
    S.wait(1.1)
    S.mark("hatch")
    S.fx("pop", 0.05)
    S.say("pop", "Pop! Out came a tiny caterpillar.", "啵！钻出来一只小小的毛毛虫。", gap=0.4)
    S.mark("hello")
    S.say("hello", "Hello! I'm so hungry!", "你好！我好饿呀！", gap=0.4)
    S.fx("grumble", -0.2)
    S.wait(0.8)

    # ---------- Monday .. Friday ----------
    for d in DAYS:
        day_scene(S, *d)

    # ---------- Saturday ----------
    S.scene("sat", "sat", day="Saturday", color="#ffb366")
    S.say("day", "On Saturday, he ate...", "星期六，他吃了……", gap=0.3)
    for k, en, zh in (("cake", "Cake!", "蛋糕！"), ("icecream", "Ice cream!", "冰淇淋！"), ("melon", "And watermelon!", "还有西瓜！")):
        S.mark("drop_" + k)
        S.fx("boing", 0.33)
        S.wait(0.5)
        S.mark("word_" + k)
        S.fx("chime", 0.05)
        S.say(k, en, zh, gap=0.6)
    S.mark("crawl")
    S.wait(1.0)
    S.mark("munch")
    for b in range(3):
        S.fx("crunch", 0.12 + b * 0.5)
    S.say("munch", "Munch, munch, munch!", "啊呜，啊呜，啊呜！", gap=0.3)
    S.mark("ache")
    S.fx("grumble", 0.1)
    S.say("ohno", "Oh no! Too much!", "哎呀！吃太多啦！", gap=0.3)
    S.mark("ouch")
    S.fx("sad", 0.3)
    S.say("ouch", "He had a tummy ache. Ouch!", "他肚子疼。哎哟！", gap=0.9)

    # ---------- Sunday ----------
    S.scene("sun", "sun", day="Sunday", color="#ffe08a")
    S.mark("drop", 1.2)
    S.fx("boing", 1.55)
    S.say("day", "On Sunday, he ate one nice green leaf.", "星期天，他吃了一片绿绿的叶子。", gap=0.4)
    S.mark("word")
    S.fx("chime", 0.05)
    S.say("w", "Leaf.", "叶子。", gap=0.6)
    S.mark("crawl")
    S.wait(1.0)
    S.mark("munch")
    for b in range(3):
        S.fx("crunch", 0.12 + b * 0.5)
    S.say("munch", "Munch, munch, munch!", "啊呜，啊呜，啊呜！", gap=0.3)
    S.mark("better")
    S.fx("sparkle", 0.6)
    S.say("better", "Ahh... much better!", "啊……舒服多啦！", gap=0.5)
    S.mark("grow")
    S.fx("grow", 0.1)
    S.say("big", "Now he was big and fat!", "现在他变得又大又胖！", gap=0.4)
    S.mark("bigword")
    S.fx("chime", 0.05)
    S.say("bigw", "Big!", "大！", gap=1.0)

    # ---------- cocoon + butterfly ----------
    S.scene("fly", "fly")
    S.mark("house")
    S.fx("grow", 0.6)
    S.say("house", "He built a little house.", "他给自己造了一个小房子。", gap=0.6)
    S.mark("night")
    S.say("sleep", "He went to sleep. Shh...", "他睡着了。嘘……", gap=0.4)
    S.mark("zzz")
    S.wait(2.6)
    S.mark("day")
    S.say("oneday", "Then, one day...", "后来有一天……", gap=0.3)
    S.mark("push")
    S.say("push", "Push, push... Pop!", "用力，用力……啵！", gap=0.2)
    S.fx("pop", -0.55)
    S.mark("hatch", -0.55)
    S.mark("wow")
    S.fx("sparkle", 0.0)
    S.say("wow", "Wow! A beautiful butterfly!", "哇！一只美丽的蝴蝶！", gap=0.4)
    S.mark("word")
    S.fx("chime", 0.05)
    S.say("w", "Butterfly.", "蝴蝶。", gap=0.5)
    S.mark("flyaway")
    S.say("flyl", "Fly, butterfly, fly!", "飞吧，蝴蝶，飞吧！", gap=2.4)

    # ---------- review: flash cards ----------
    S.scene("play", "play")
    S.mark("title")
    S.fx("sparkle", 0.1)
    S.say("intro", "Let's play! What did he eat?", "我们来玩游戏吧！他吃了什么呀？", gap=0.6)
    for kind, word, zh in (("apple", "Apple!", "苹果！"), ("pear", "Pear!", "梨！"), ("plum", "Plum!", "李子！"),
                           ("strawberry", "Strawberry!", "草莓！"), ("orange", "Orange!", "橙子！")):
        S.mark("card_" + kind)
        S.fx("whoosh", 0.0, gain=0.5)
        S.wait(0.5)
        S.say("q_" + kind, "What's this?", "这是什么？", gap=0.1)
        S.mark("dots_" + kind)
        for i in range(3):
            S.fx("tick", 0.2 + i * 0.55)
        S.wait(1.9)
        S.mark("ans_" + kind)
        S.fx("chime", 0.0)
        S.say("a_" + kind, word, zh, gap=0.7)

    # ---------- review: counting ----------
    S.scene("count", "count")
    S.mark("drop")
    for i in range(4):
        S.fx("pop", 0.2 + i * 0.2, gain=0.6)
    S.wait(0.9)
    S.say("q", "How many strawberries?", "有几个草莓？", gap=0.1)
    S.mark("dots")
    for i in range(3):
        S.fx("tick", 0.2 + i * 0.55)
    S.wait(1.9)
    S.say("lets", "Let's count!", "我们来数一数！", gap=0.3)
    for i in range(4):
        S.fx("ding", 0.0, n=i)
        S.say("c%d" % i, NUM[i], NUM_ZH[i], gap=0.4)
    S.mark("total")
    S.fx("chime", 0.0)
    S.say("n", "Four strawberries!", "四个草莓！", gap=1.0)

    # ---------- review: point at it ----------
    S.scene("point", "point")
    S.wait(0.4)
    S.say("q1", "Where is the red apple?", "红红的苹果在哪里？", gap=0.1)
    S.mark("dots1")
    for i in range(3):
        S.fx("tick", 0.2 + i * 0.75)
    S.wait(2.6)
    S.mark("here1")
    S.fx("chime", 0.0)
    S.say("a1", "Here it is!", "在这里！", gap=1.0)
    S.mark("reset")
    S.wait(0.4)
    S.say("q2", "Where is the butterfly?", "蝴蝶在哪里？", gap=0.1)
    S.mark("dots2")
    for i in range(3):
        S.fx("tick", 0.2 + i * 0.75)
    S.wait(2.6)
    S.mark("here2")
    S.fx("chime", 0.0)
    S.say("a2", "Here it is!", "在这里！", gap=1.0)

    # ---------- bye ----------
    S.scene("bye", "bye")
    S.fx("sparkle", 0.3)
    S.say("bye", "Bye-bye, butterfly! See you next time!", "再见啦，蝴蝶！下次见！", gap=0.6)
    S.mark("end")
    S.say("end", "The end.", "讲完啦。", gap=2.0)


def day_scene(S, sid, day, day_zh, color, kind, n, ans, ans_zh, word, word_zh, n_en, n_zh, h_en, h_zh):
    S.scene(sid, "day", day=day, color=color, item=kind, n=n, word=word)
    S.say("day", "On %s, he found..." % day, "%s，他找到了……" % day_zh, gap=0.2)
    S.mark("drop")
    for i in range(n):
        S.fx("boing", 0.33 + i * 0.25)
    S.wait(0.9 + 0.25 * (n - 1) + 0.2)
    if n == 1:
        S.say("q", "What's this?", "这是什么？", gap=0.1)
    else:
        S.say("q", "What are these?", "这些是什么？", gap=0.1)
    S.mark("dots")
    for i in range(3):
        S.fx("tick", 0.2 + i * 0.6)
    S.wait(2.2)
    S.mark("word", 0.4)
    S.fx("chime", 0.4)
    S.say("a", ans, ans_zh, gap=0.4)
    S.say("w", word.capitalize() + ".", word_zh + "。", gap=0.5)
    if n > 1:
        S.say("count", "Let's count!", "我们来数一数！", gap=0.3)
    for i in range(n):
        S.fx("ding", 0.0, n=i)
        S.say("c%d" % i, NUM[i], NUM_ZH[i], gap=0.4)
    S.say("n", n_en, n_zh, gap=0.5)
    S.mark("crawl")
    S.wait(1.0)
    S.mark("munch")
    for b in range(3):
        S.fx("crunch", 0.12 + b * 0.5)
    if n > 1:
        S.fx("crunch", 1.4, gain=0.7)
    S.say("munch", "Munch, munch, munch!", "啊呜，啊呜，啊呜！", gap=0.3)
    S.mark("h")
    S.fx("sad", 0.3)
    S.say("h", h_en, h_zh, gap=1.0)
