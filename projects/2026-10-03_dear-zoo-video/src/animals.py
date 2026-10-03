import math, os
K='#1d1714'
ST=f'stroke="{K}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"'
def svg(body, ident):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 583 887" width="583" height="887" id="{ident}">{body}</svg>'
def eye(cx,cy,rx=6.5,ry=9):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{K}"/><circle cx="{cx+2}" cy="{cy-3.5}" r="2.4" fill="#fff"/>'
def cheek(cx,cy,rx=11,ry=6.5):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#F3968C" opacity=".55"/>'
def scallop(cx,cy,r,n,amp,rot=0):
    pts=[]
    for i in range(n):
        a=rot+2*math.pi*i/n
        pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    d=f'M{pts[0][0]:.1f},{pts[0][1]:.1f} '
    for i in range(n):
        a0=rot+2*math.pi*i/n; a1=rot+2*math.pi*(i+1)/n; am=(a0+a1)/2
        cx1=cx+(r+amp)*math.cos(am); cy1=cy+(r+amp)*math.sin(am)
        x1,y1=pts[(i+1)%n]
        d+=f'Q{cx1:.1f},{cy1:.1f} {x1:.1f},{y1:.1f} '
    return d+'Z'
def paw(cx,cy,w=50,fill='#F4BC4C'):
    h=w*0.62
    return (f'<path d="M{cx-w/2},{cy+h/2} C{cx-w/2},{cy-h*0.75} {cx+w/2},{cy-h*0.75} {cx+w/2},{cy+h/2} Z" fill="{fill}" {ST}/>'
            f'<path d="M{cx-w/6},{cy+h/2} l0,-{h*0.38} M{cx+w/6},{cy+h/2} l0,-{h*0.38}" fill="none" stroke="{K}" stroke-width="2.6" stroke-linecap="round"/>')

# ---------- GIRAFFE ----------
G='#F7C548'; GS='#D4822F'
neck='M352,560 C350,440 356,300 366,190 L414,190 C422,300 430,440 432,560 Z'
giraffe=f'''
<defs><clipPath id="gneck"><path d="{neck}"/></clipPath></defs>
<path d="M414,194 Q436,204 418,216 Q436,226 419,238 Q436,248 420,260 Q436,270 421,282 Q436,292 422,304 Q436,314 424,326 Q436,336 425,348 Q436,358 426,370 Q436,380 427,392 Q436,402 428,414 Q436,424 429,436 Q436,446 430,458 Q436,468 431,480 Q436,490 432,502 Q436,512 433,524 Q436,534 434,546 Q436,556 436,568 L432,560 C428,440 422,300 414,194 Z" fill="#B4652B" {ST}/>
<path d="{neck}" fill="{G}" {ST}/>
<g clip-path="url(#gneck)" fill="{GS}">
<path d="M370,214 c14,-7 30,1 26,14 c-4,13 -24,13 -28,1 Z"/><path d="M400,248 c12,-5 24,6 17,17 c-6,9 -21,7 -21,-5 Z"/>
<path d="M352,262 c12,-7 26,0 23,13 c-2,13 -20,13 -25,0 Z"/><path d="M384,296 c15,-5 28,6 22,19 c-6,11 -26,9 -26,-6 Z"/>
<path d="M412,318 c9,-3 16,6 11,13 c-4,7 -14,4 -14,-4 Z"/><path d="M356,326 c13,-7 26,2 22,15 c-4,11 -22,9 -24,-4 Z"/>
<path d="M392,350 c14,-6 28,4 22,16 c-5,10 -24,9 -24,-4 Z"/></g>
<path d="M338,108 C312,92 286,96 276,110 C292,126 318,130 342,124 Z" fill="{G}" {ST}/>
<path d="M331,112 C314,104 298,106 290,112 C302,120 318,121 332,118 Z" fill="#E9A15A"/>
<path d="M442,108 C468,92 494,96 504,110 C488,126 462,130 438,124 Z" fill="{G}" {ST}/>
<path d="M449,112 C466,104 482,106 490,112 C478,120 462,121 448,118 Z" fill="#E9A15A"/>
<path d="M366,84 L360,54 L372,52 L378,82 Z" fill="#E8B13F" {ST}/><ellipse cx="365" cy="48" rx="11" ry="10" fill="#8A4A1E" {ST}/>
<path d="M414,82 L420,52 L432,54 L426,84 Z" fill="#E8B13F" {ST}/><ellipse cx="427" cy="48" rx="11" ry="10" fill="#8A4A1E" {ST}/>
<path d="M346,96 C346,68 434,68 434,96 C436,118 440,140 440,160 C440,202 340,202 340,160 C340,140 344,118 346,96 Z" fill="{G}" {ST}/>
<path d="M380,82 c8,-5 19,0 17,8 c-2,8 -16,8 -18,1 Z" fill="{GS}"/><path d="M350,104 c5,-3 11,1 9,6 c-2,5 -9,4 -10,0 Z" fill="{GS}"/>
<path d="M350,162 C350,140 430,140 430,162 C430,198 350,198 350,162 Z" fill="#FBE1A6" {ST}/>
<ellipse cx="374" cy="160" rx="4.5" ry="3.5" fill="#6B3A1A"/><ellipse cx="406" cy="160" rx="4.5" ry="3.5" fill="#6B3A1A"/>
<path d="M372,178 Q390,190 408,178" fill="none" {ST}/>
{eye(368,118)}{eye(412,118)}{cheek(352,140)}{cheek(428,140)}
'''
# ---------- LION ----------
lion_back=f'''
<path d="{scallop(385,262,98,16,22,0.1)}" fill="#D9792A" {ST}/>
<path d="{scallop(385,264,80,14,14,0.3)}" fill="#E8973A" stroke="none"/>
<circle cx="326" cy="196" r="22" fill="#F4BC4C" {ST}/><circle cx="326" cy="196" r="11" fill="#E59B57"/>
<circle cx="444" cy="196" r="22" fill="#F4BC4C" {ST}/><circle cx="444" cy="196" r="11" fill="#E59B57"/>
<ellipse cx="385" cy="266" rx="72" ry="66" fill="#F4BC4C" {ST}/>
<ellipse cx="364" cy="292" rx="27" ry="20" fill="#FCE6B4"/><ellipse cx="406" cy="292" rx="27" ry="20" fill="#FCE6B4"/>
<path d="M364,306 Q385,346 406,306 Q385,314 364,306 Z" fill="#8B2622" {ST}/>
<path d="M376,324 Q385,334 394,324 Q385,318 376,324 Z" fill="#F07A86"/>
<path d="M367,308 l5,10 l4,-9 Z M403,308 l-5,10 l-4,-9 Z" fill="#fff" stroke="{K}" stroke-width="1.5"/>
<path d="M371,276 Q385,268 399,276 Q393,290 385,292 Q377,290 371,276 Z" fill="#5E3220" {ST}/>
<g fill="{K}"><circle cx="352" cy="292" r="2"/><circle cx="346" cy="300" r="2"/><circle cx="358" cy="300" r="2"/><circle cx="418" cy="292" r="2"/><circle cx="424" cy="300" r="2"/><circle cx="412" cy="300" r="2"/></g>
<path d="M343,228 L372,240 M427,228 L398,240" fill="none" stroke="{K}" stroke-width="5" stroke-linecap="round"/>
{eye(362,250,6,8)}{eye(408,250,6,8)}{cheek(338,276,9,5)}{cheek(432,276,9,5)}
<path d="M240,300 q-10,-14 0,-28 M228,312 q-16,-18 0,-40 M530,300 q10,-14 0,-28 M542,312 q16,-18 0,-40" fill="none" stroke="{K}" stroke-width="3" stroke-linecap="round"/>
'''
lion_front=paw(318,352)+paw(452,348)
# ---------- CAMEL ----------
C='#D8A468'; CS='#BE884C'
camel=f'''
<path d="M200,400 C206,300 262,276 286,330 C300,282 356,280 368,336 C374,356 376,380 376,400 Z" fill="{C}" {ST}/>
<path d="M226,318 C240,296 258,296 266,312 M300,318 C312,298 334,298 346,316" fill="none" stroke="{CS}" stroke-width="6" stroke-linecap="round"/>
<path d="M300,400 C320,350 360,334 410,326 L470,326 L470,400 Z" fill="{C}" {ST}/>
<path d="M406,400 C400,330 410,270 420,222 L472,222 C474,270 474,340 478,400 Z" fill="{C}" {ST}/>
<path d="M422,230 C426,260 424,300 420,330" fill="none" stroke="{CS}" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="398" cy="140" rx="16" ry="9" transform="rotate(-25 398 140)" fill="{C}" {ST}/>
<ellipse cx="494" cy="140" rx="16" ry="9" transform="rotate(25 494 140)" fill="{C}" {ST}/>
<path d="M402,150 C400,108 492,108 490,150 C492,182 488,214 482,236 C472,266 420,266 410,236 C404,214 400,182 402,150 Z" fill="{C}" {ST}/>
<path d="M420,114 c4,-14 14,-16 18,-6 c4,-12 16,-12 18,0 c4,-10 14,-8 14,4 c-16,4 -34,6 -50,2 Z" fill="#A86F3A" {ST}/>
<path d="M412,224 C412,200 480,200 480,224 C480,256 412,256 412,224 Z" fill="#EBC795" {ST}/>
<path d="M428,214 q5,-5 10,0 M454,214 q5,-5 10,0" fill="none" stroke="{K}" stroke-width="3" stroke-linecap="round"/>
<path d="M430,244 Q446,234 462,244" fill="none" {ST}/>
<path d="M434,248 Q446,258 458,248" fill="#C98F84" {ST}/>
<ellipse cx="431" cy="160" rx="11" ry="9" fill="#fff" {ST}/><ellipse cx="461" cy="160" rx="11" ry="9" fill="#fff" {ST}/>
<circle cx="433" cy="163" r="5" fill="{K}"/><circle cx="459" cy="163" r="5" fill="{K}"/>
<path d="M419,160 C419,146 443,146 443,160 Z" fill="{CS}" {ST}/><path d="M449,160 C449,146 473,146 473,160 Z" fill="{CS}" {ST}/>
<path d="M414,141 L442,149 M478,141 L450,149" fill="none" stroke="{K}" stroke-width="5" stroke-linecap="round"/>
{cheek(416,190,9,5)}{cheek(476,190,9,5)}
<path d="M500,206 c10,-8 22,-4 22,6 c10,0 12,14 2,16 c-6,8 -20,6 -22,-2 c-10,-2 -10,-16 -2,-20 Z" fill="#fff" {ST} opacity=".95"/>
'''
# ---------- SNAKE ----------
sk='M330,420 C326,330 456,334 452,262 C448,212 380,222 392,176'
snake=f'''
<path d="{sk}" fill="none" stroke="{K}" stroke-width="48" stroke-linecap="round"/>
<path d="{sk}" fill="none" stroke="#6CBD45" stroke-width="41" stroke-linecap="round"/>
<path d="{sk}" fill="none" stroke="#4E9A30" stroke-width="41" stroke-dasharray="9 24"/>
<path d="{sk}" fill="none" stroke="#C9E58A" stroke-width="10" stroke-linecap="round" transform="translate(-8 0)"/>
<path d="M395,184 L395,206 L386,218 M395,206 L404,218" fill="none" stroke="#E2302B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M346,152 C346,112 446,112 446,152 C446,186 346,186 346,152 Z" fill="#6CBD45" {ST}/>
<path d="M360,128 c8,-4 16,-2 20,2 M412,130 c6,-4 14,-6 22,-2" fill="none" stroke="#4E9A30" stroke-width="5" stroke-linecap="round"/>
<circle cx="374" cy="138" r="13" fill="#fff" {ST}/><circle cx="418" cy="138" r="13" fill="#fff" {ST}/>
<ellipse cx="376" cy="140" rx="4" ry="8" fill="{K}"/><ellipse cx="416" cy="140" rx="4" ry="8" fill="{K}"/>
<path d="M376,166 Q396,176 416,166" fill="none" {ST}/>
<circle cx="389" cy="153" r="2" fill="{K}"/><circle cx="403" cy="153" r="2" fill="{K}"/>
{cheek(360,160,8,5)}{cheek(432,160,8,5)}
'''
# ---------- FROG ----------
F='#7DC44B'
frog=f'''
<path d="M342,250 C310,270 296,300 288,330 M438,250 C470,270 484,300 492,330" fill="none" stroke="{K}" stroke-width="27" stroke-linecap="round"/>
<path d="M342,250 C310,270 296,300 288,330 M438,250 C470,270 484,300 492,330" fill="none" stroke="{F}" stroke-width="20" stroke-linecap="round"/>
<path d="M270,336 l12,-12 l8,10 l10,-6 l2,14 Z M510,336 l-12,-12 l-8,10 l-10,-6 l-2,14 Z" fill="{F}" {ST}/>
<ellipse cx="390" cy="210" rx="74" ry="60" fill="{F}" {ST}/>
<ellipse cx="390" cy="230" rx="46" ry="34" fill="#D6EC9C"/>
<path d="M330,226 C312,214 304,200 300,186 M450,226 C468,214 476,200 480,186" fill="none" stroke="{K}" stroke-width="20" stroke-linecap="round"/>
<path d="M330,226 C312,214 304,200 300,186 M450,226 C468,214 476,200 480,186" fill="none" stroke="{F}" stroke-width="13" stroke-linecap="round"/>
<circle cx="298" cy="182" r="7" fill="{F}" {ST}/><circle cx="482" cy="182" r="7" fill="{F}" {ST}/>
<circle cx="352" cy="158" r="26" fill="{F}" {ST}/><circle cx="428" cy="158" r="26" fill="{F}" {ST}/>
<circle cx="352" cy="156" r="16" fill="#fff"/><circle cx="428" cy="156" r="16" fill="#fff"/>
<circle cx="355" cy="157" r="8.5" fill="{K}"/><circle cx="425" cy="157" r="8.5" fill="{K}"/>
<circle cx="357" cy="153" r="2.6" fill="#fff"/><circle cx="427" cy="153" r="2.6" fill="#fff"/>
<path d="M346,200 Q390,232 434,200" fill="none" {ST}/>
<circle cx="380" cy="186" r="2" fill="{K}"/><circle cx="400" cy="186" r="2" fill="{K}"/>
{cheek(338,206)}{cheek(442,206)}
<path d="M300,380 q10,-14 0,-28 M390,392 l0,-30 M480,380 q-10,-14 0,-28" fill="none" stroke="{K}" stroke-width="3" stroke-linecap="round" opacity=".7"/>
'''
# ---------- PUPPY ----------
W='#FFFBF3'
puppy_back=f'''
<g id="ptail"><path d="M470,350 C482,320 500,300 518,290 C526,288 530,296 524,302 C508,314 494,330 486,356 Z" fill="{W}" {ST}/></g>
<path d="M346,290 C344,320 338,345 334,372 L436,372 C432,345 426,320 424,290 Z" fill="{W}" {ST}/>
<path d="M330,210 C298,204 280,246 292,296 C306,310 330,290 338,256 Z" fill="#A86A3A" {ST}/>
<path d="M320,252 C318,186 452,186 450,252 C452,318 318,318 320,252 Z" fill="{W}" {ST}/>
<path d="M440,210 C472,204 490,246 478,296 C464,310 440,290 432,256 Z" fill="#D9A46E" {ST}/>
<ellipse cx="410" cy="244" rx="23" ry="21" fill="#E2B07E"/>
<path d="M378,200 c6,-12 18,-12 20,0" fill="#E2B07E" {ST}/>
{eye(362,246,7,9.5)}{eye(410,246,7,9.5)}
<ellipse cx="385" cy="284" rx="32" ry="21" fill="#fff" {ST}/>
<ellipse cx="385" cy="272" rx="12" ry="8.5" fill="{K}"/><ellipse cx="381" cy="269" rx="3.5" ry="2" fill="#fff" opacity=".8"/>
<path d="M385,280 L385,290 M371,290 Q385,300 399,290" fill="none" {ST}/>
<path d="M378,294 Q385,314 393,294 Z" fill="#F27C8A" {ST}/>
{cheek(344,276,10,6)}{cheek(428,276,10,6)}
'''
puppy_front=paw(318,352,48,W)+paw(452,348,48,W)
out='dz/assets/svg'
files={'giraffe':(giraffe,''),'lion':(lion_back,lion_front),'camel':(camel,''),'snake':(snake,''),'frog':('',frog),'puppy':(puppy_back,puppy_front)}
for k,(b,f) in files.items():
    open(f'{out}/{k}_back.svg','w').write(svg(b,k+'b'))
    open(f'{out}/{k}_front.svg','w').write(svg(f,k+'f'))
print('ok')
