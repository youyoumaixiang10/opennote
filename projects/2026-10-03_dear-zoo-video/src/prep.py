from PIL import Image, ImageDraw
import numpy as np
from collections import deque
WALL=(253,247,234); FLOOR=(254,226,145)
def clean(i, boxes):
    im=Image.open(f'ref/p{i}.png').convert('RGB'); d=ImageDraw.Draw(im)
    for b in boxes: d.rectangle(b, fill=WALL)
    return im
p1=clean(1,[(0,0,582,330)])
p2=clean(2,[(40,70,345,242)])
p3=clean(3,[(40,70,470,252)])
for i,p in ((1,p1),(2,p2),(3,p3)): p.save(f'ref/c{i}.png')
# cutout of p1 (boy+crate) -> transparent
a=np.array(p1).astype(int); h,w,_=a.shape
def near(c,t,tol=38): return abs(c[0]-t[0])+abs(c[1]-t[1])+abs(c[2]-t[2])<tol
mask=np.zeros((h,w),bool); q=deque()
for x in range(w):
    for y in (0,h-1): q.append((y,x))
for y in range(h):
    for x in (0,w-1): q.append((y,x))
while q:
    y,x=q.popleft()
    if mask[y,x]: continue
    c=a[y,x]
    if not (near(c,WALL) or near(c,FLOOR,60)): continue
    mask[y,x]=True
    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny,nx=y+dy,x+dx
        if 0<=ny<h and 0<=nx<w and not mask[ny,nx]: q.append((ny,nx))
rgba=np.dstack([a,np.where(mask,0,255)]).astype(np.uint8)
Image.fromarray(rgba,'RGBA').save('ref/p1_cut.png')
print(mask.sum(), h*w)
