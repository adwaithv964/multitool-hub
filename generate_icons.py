import math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np

def create_multitool_icon(size=512):
    SCALE = 4
    W = size * SCALE
    H = size * SCALE
    
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    PAD = int(W * 0.04)
    RADIUS = int(W * 0.22)
    
    bg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    
    for y in range(H):
        t = y / float(H)
        r = int(22 * (1 - t * 0.55))
        g = int(25 * (1 - t * 0.55))
        b = int(52 * (1 - t * 0.50))
        bg_draw.line([(0, y), (W, y)], fill=(r, g, b, 255))
        
    mask = Image.new("L", (W, H), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([PAD, PAD, W - PAD, H - PAD], radius=RADIUS, fill=255)
    
    bg.putalpha(mask)
    img.alpha_composite(bg)
    
    BORDER_W = int(W * 0.024)
    grad_border = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gb_draw = ImageDraw.Draw(grad_border)
    for i in range(W + H):
        t = i / float(W + H)
        if t < 0.4:
            s = t / 0.4
            r = int(0 * (1 - s) + 99 * s)
            g = int(240 * (1 - s) + 102 * s)
            b = int(255 * (1 - s) + 241 * s)
        elif t < 0.75:
            s = (t - 0.4) / 0.35
            r = int(99 * (1 - s) + 168 * s)
            g = int(102 * (1 - s) + 85 * s)
            b = int(241 * (1 - s) + 247 * s)
        else:
            s = (t - 0.75) / 0.25
            r = int(168 * (1 - s) + 236 * s)
            g = int(85 * (1 - s) + 72 * s)
            b = int(247 * (1 - s) + 153 * s)
        gb_draw.line([(i, 0), (0, i)], fill=(r, g, b, 255), width=3)
    
    stroke_mask = Image.new("L", (W, H), 0)
    sm_draw = ImageDraw.Draw(stroke_mask)
    sm_draw.rounded_rectangle([PAD, PAD, W - PAD, H - PAD], radius=RADIUS, outline=255, width=BORDER_W)
    grad_border.putalpha(stroke_mask)
    
    border_glow = grad_border.filter(ImageFilter.GaussianBlur(radius=int(BORDER_W * 1.5)))
    img.alpha_composite(border_glow)
    img.alpha_composite(grad_border)
    
    gloss = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gloss)
    g_draw.ellipse([int(-W * 0.2), int(-H * 0.4), int(W * 1.2), int(H * 0.55)], fill=(255, 255, 255, 20))
    gloss_mask = Image.new("L", (W, H), 0)
    gm_draw = ImageDraw.Draw(gloss_mask)
    gm_draw.rounded_rectangle([PAD + BORDER_W, PAD + BORDER_W, W - PAD - BORDER_W, H - PAD - BORDER_W], radius=RADIUS - BORDER_W, fill=255)
    gloss_r, gloss_g, gloss_b, gloss_a = gloss.split()
    gloss_a = Image.fromarray(np.minimum(np.array(gloss_a), np.array(gloss_mask)))
    gloss.putalpha(gloss_a)
    img.alpha_composite(gloss)
    
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gl_draw = ImageDraw.Draw(glow_layer)
    gl_draw.ellipse([int(W * 0.15), int(H * 0.25), int(W * 0.65), int(H * 0.75)], fill=(0, 240, 255, 120))
    gl_draw.ellipse([int(W * 0.35), int(H * 0.25), int(W * 0.85), int(H * 0.75)], fill=(236, 72, 153, 120))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=int(W * 0.12)))
    img.alpha_composite(glow_layer)
    
    THICK = int(W * 0.11)
    p_left_foot = (W * 0.25, H * 0.68)
    p_left_peak = (W * 0.35, H * 0.30)
    p_center_val = (W * 0.50, H * 0.58)
    p_right_peak = (W * 0.65, H * 0.30)
    p_right_foot = (W * 0.75, H * 0.68)
    
    def bezier_point(p0, p1, p2, t):
        return (
            (1-t)**2 * p0[0] + 2*(1-t)*t * p1[0] + t**2 * p2[0],
            (1-t)**2 * p0[1] + 2*(1-t)*t * p1[1] + t**2 * p2[1]
        )
    
    points = []
    for i in range(100):
        t = i / 100.0
        ctrl = (W * 0.29, H * 0.45)
        points.append(bezier_point(p_left_foot, ctrl, p_left_peak, t))
    for i in range(100):
        t = i / 100.0
        ctrl = (W * 0.42, H * 0.44)
        points.append(bezier_point(p_left_peak, ctrl, p_center_val, t))
    for i in range(100):
        t = i / 100.0
        ctrl = (W * 0.58, H * 0.44)
        points.append(bezier_point(p_center_val, ctrl, p_right_peak, t))
    for i in range(100):
        t = i / 100.0
        ctrl = (W * 0.71, H * 0.45)
        points.append(bezier_point(p_right_peak, ctrl, p_right_foot, t))
    points.append(p_right_foot)
    
    m_shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(m_shadow)
    for p in points:
        s_draw.ellipse([p[0] - THICK//2, p[1] - THICK//2 + int(W * 0.04), p[0] + THICK//2, p[1] + THICK//2 + int(W * 0.04)], fill=(0, 0, 0, 160))
    m_shadow = m_shadow.filter(ImageFilter.GaussianBlur(radius=int(THICK * 0.45)))
    img.alpha_composite(m_shadow)
    
    m_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    m_draw = ImageDraw.Draw(m_layer)
    total_pts = len(points)
    
    for idx, p in enumerate(points):
        t = idx / float(total_pts)
        if t < 0.28:
            s = t / 0.28
            r = int(0 * (1 - s) + 40 * s)
            g = int(235 * (1 - s) + 120 * s)
            b = int(255 * (1 - s) + 245 * s)
        elif t < 0.50:
            s = (t - 0.28) / 0.22
            r = int(40 * (1 - s) + 99 * s)
            g = int(120 * (1 - s) + 70 * s)
            b = int(245 * (1 - s) + 240 * s)
        elif t < 0.75:
            s = (t - 0.50) / 0.25
            r = int(99 * (1 - s) + 168 * s)
            g = int(70 * (1 - s) + 85 * s)
            b = int(240 * (1 - s) + 247 * s)
        else:
            s = (t - 0.75) / 0.25
            r = int(168 * (1 - s) + 244 * s)
            g = int(85 * (1 - s) + 63 * s)
            b = int(247 * (1 - s) + 94 * s)
            
        rad = THICK // 2
        m_draw.ellipse([p[0] - rad, p[1] - rad, p[0] + rad, p[1] + rad], fill=(r, g, b, 255))
        
    highlight = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    h_draw = ImageDraw.Draw(highlight)
    
    for idx, p in enumerate(points):
        t = idx / float(total_pts)
        rad = int(THICK * 0.35)
        hx = p[0] - int(THICK * 0.16)
        hy = p[1] - int(THICK * 0.18)
        
        if 0.15 <= t <= 0.35:
            alpha = int(220 * math.sin((t - 0.15) / 0.20 * math.pi))
            h_draw.ellipse([hx - rad, hy - rad, hx + rad, hy + rad], fill=(255, 255, 255, alpha))
        elif t < 0.15:
            alpha = int(100 * (t / 0.15))
            h_draw.ellipse([hx - rad, hy - rad, hx + rad, hy + rad], fill=(200, 245, 255, alpha))
        elif 0.65 <= t <= 0.85:
            alpha = int(140 * math.sin((t - 0.65) / 0.20 * math.pi))
            h_draw.ellipse([hx - rad, hy - rad, hx + rad, hy + rad], fill=(255, 215, 240, alpha))
            
    highlight = highlight.filter(ImageFilter.GaussianBlur(radius=int(THICK * 0.22)))
    m_layer.alpha_composite(highlight)
    img.alpha_composite(m_layer)
    
    res = img.resize((size, size), Image.Resampling.LANCZOS)
    return res

print("Generating pristine icon set...")
icon512 = create_multitool_icon(512)
icon512.save("icon-512.png", "PNG")
icon512.save("assets/icon-512.png", "PNG")

icon192 = create_multitool_icon(192)
icon192.save("icon-192.png", "PNG")
icon192.save("assets/icon-192.png", "PNG")

icon180 = create_multitool_icon(180)
icon180.save("apple-touch-icon.png", "PNG")
icon180.save("assets/apple-touch-icon.png", "PNG")

icon32 = create_multitool_icon(32)
icon32 = icon32.filter(ImageFilter.UnsharpMask(radius=1, percent=130, threshold=1))
icon32.save("favicon-32.png", "PNG")
icon32.save("assets/favicon-32.png", "PNG")

icon16 = create_multitool_icon(16)
icon48 = create_multitool_icon(48)
icon32.save("favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

print("Pristine icons created successfully!")
