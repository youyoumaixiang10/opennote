# Cut the ChatGPT illustration sheet into layers (transparent poses + backgrounds)
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage
src = Image.open("art/sheet2.png").convert("RGB")
A = np.array(src).astype(int)
BG = np.array([252, 243, 222])

def cutout(box, name, pad=6):
    x0, y0, x1, y1 = box
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), x1 + pad, y1 + pad
    a = A[y0:y1, x0:x1]
    diff = np.abs(a - BG).sum(-1)
    bgish = diff < 75
    lab, n = ndimage.label(bgish)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    outside = np.isin(lab, list(border))
    alpha = np.ones(diff.shape)
    alpha[outside] = np.clip((diff[outside] - 25) / 50, 0, 1)
    # keep only the monkey: the largest solid component (drops badges, motion lines, floor marks)
    solid, m = ndimage.label(alpha > 0.5)
    if m > 1:
        sizes = ndimage.sum(np.ones_like(alpha), solid, range(1, m + 1))
        keep = ndimage.binary_dilation(solid == (np.argmax(sizes) + 1), iterations=3)
        alpha = np.where(keep, alpha, 0)
    # soften the edge
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    rgba = Image.fromarray(a.astype(np.uint8)).convert("RGBA"); rgba.putalpha(al)
    # trim to content
    bb = rgba.getbbox(); rgba = rgba.crop(bb)
    rgba = rgba.resize((rgba.width * 2, rgba.height * 2), Image.LANCZOS)
    rgba.save(f"art/{name}.png"); return rgba.size

poses = {
    "red":    [(12, 332, 168, 513), (189, 334, 346, 530), (397, 395, 527, 552)],
    "yellow": [(586, 337, 738, 524), (762, 334, 917, 539), (958, 397, 1088, 552)],
    "green":  [(1141, 337, 1295, 530), (1318, 330, 1458, 534), (1519, 394, 1642, 548)],
    "blue":   [(36, 567, 190, 731), (223, 569, 353, 745), (404, 607, 516, 739)],
    "purple": [(598, 566, 747, 733), (777, 568, 914, 733), (965, 606, 1082, 743)],
}
for c, (j, f, h) in poses.items():
    print(c, cutout(j, f"{c}_jump"), cutout(f, f"{c}_fall"), cutout(h, f"{c}_hurt"))

def bg(box, name, w=1920, h=1080):
    im = src.crop(box).resize((w, h), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    im.save(f"art/{name}.jpg", quality=92)
# bedroom: 548x308 window centred on the bed (avoids the panel number badge)
bg((995, 0, 1543, 308), "bedroom")
# ending: crop away badges / neighbouring panel
bg((1165, 598, 1672, 883), "goodnight")
# portraits for the phone call (circles)
src.crop((168, 748, 430, 938)).resize((524, 380), Image.LANCZOS).save("art/mama.png")
src.crop((641, 749, 948, 938)).resize((614, 378), Image.LANCZOS).save("art/doctor.png")
print("done")
