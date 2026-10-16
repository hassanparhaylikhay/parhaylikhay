import sys, glob, os
from PIL import Image, ImageDraw
src, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 4
files = sorted(glob.glob(os.path.join(src, "*.png")))
per = int(sys.argv[4]) if len(sys.argv) > 4 else 16
for k in range(0, len(files), per):
    chunk = files[k:k+per]
    ims = [Image.open(f) for f in chunk]
    w, h = ims[0].size
    s = 0.42 if w > 600 else 0.6
    tw, th = int(w*s), int(h*s)
    rows = (len(ims)+cols-1)//cols
    sheet = Image.new("RGB", (cols*tw, rows*(th+18)), (40,40,40))
    d = ImageDraw.Draw(sheet)
    for i, (im, f) in enumerate(zip(ims, chunk)):
        x, y = (i%cols)*tw, (i//cols)*(th+18)
        sheet.paste(im.resize((tw, th)), (x, y+18))
        d.text((x+4, y+3), os.path.basename(f)[:-4], fill=(255,255,255))
    sheet.save(f"{out}-{k//per+1}.png")
    print(f"{out}-{k//per+1}.png")
