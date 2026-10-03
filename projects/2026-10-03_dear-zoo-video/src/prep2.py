from PIL import Image, ImageDraw
import numpy as np
from collections import deque
WALL=(253,247,234); FLOOR=(254,226,145)
def bgmask(a):
    h,w,_=a.shape
    def near(c,t,tol): return abs(int(c[0])-t[0])+abs(int(c[1])-t[1])+abs(int(c[2])-t[2])<tol
    m=np.zeros((h,w),bool); q=deque([(y,x) for x in range(w) for y in (0,h-1)]+[(y,x) for y in range(h) for x in (0,w-1)])
    while q:
        y,x=q.popleft()
        if m[y,x]: continue
        c=a[y,x]
        if not (near(c,WALL,38) or near(c,FLOOR,60)): continue
        m[y,x]=True
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<h and 0<=nx<w and not m[ny,nx]: q.append((ny,nx))
    return m
def component(fg, seed):
    h,w=fg.shape; c=np.zeros_like(fg); q=deque([seed])
    while q:
        y,x=q.popleft()
        if c[y,x] or not fg[y,x]: continue
        c[y,x]=True
        for dy in (-1,0,1):
            for dx in (-1,0,1):
                ny,nx=y+dy,x+dx
                if 0<=ny<h and 0<=nx<w and not c[ny,nx] and fg[ny,nx]: q.append((ny,nx))
    return c
def save(a,m,name,box=None):
    rgba=np.dstack([a,np.where(m,255,0)]).astype(np.uint8)
    im=Image.fromarray(rgba,'RGBA')
    bb=im.getbbox(); print(name,bb); im.save(name)
# P2 boy
a=np.array(Image.open('ref/c2.png').convert('RGB'))
fg=~bgmask(a)
boy=component(fg,(700,90))
save(a,boy,'ref/boy2.png')
# P3 crate+monkey: repaint fingers
im=Image.open('ref/c3.png').convert('RGB')
red=im.getpixel((200,700)); print('red',red)
d=ImageDraw.Draw(im); d.rectangle((182,540,218,610),fill=red); d.line((180,540,180,610),fill=(30,20,20),width=3)
a=np.array(im); a[:, :176]=WALL  # wipe boy side
a[656:, :176]=FLOOR
fg=~bgmask(a)
save(a,fg,'ref/monkeycrate.png')
# P1 split: crate only (x>=168 region with boy hands kept) -> keep whole p1_cut; also boy1 = component
a=np.array(Image.open('ref/c1.png').convert('RGB')); fg=~bgmask(a)
