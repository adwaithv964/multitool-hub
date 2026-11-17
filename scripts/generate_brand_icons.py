import os
from PIL import Image, ImageDraw, ImageFilter

def create_gradient_card(w, h, r, color1, color2):
    """Draw a rounded rectangle with a linear gradient from top-left to bottom-right."""
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for y in range(h):
        for x in range(w):
            t = (x / float(w) + y / float(h)) / 2.0
            t = max(0.0, min(1.0, t))
            r_c = int(color1[0] * (1 - t) + color2[0] * t)
            g_c = int(color1[1] * (1 - t) + color2[1] * t)
            b_c = int(color1[2] * (1 - t) + color2[2] * t)
            base.putpixel((x, y), (r_c, g_c, b_c, 255))
    
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    base.putalpha(mask)
    return base

def render_symbol_canvas(canvas_size=1024, pad_factor=0.15, bg_color=None, maskable=False):
    """Render the canonical MultiTool Hub brand symbol at high resolution."""
    img = Image.new("RGBA", (canvas_size, canvas_size), bg_color if bg_color else (0, 0, 0, 0))
    
    actual_pad = canvas_size * (0.22 if maskable else pad_factor)
    avail = canvas_size - (actual_pad * 2)
    card_size = int(avail * 0.65)
    radius = int(card_size * 0.28)
    
    # Canonical brand colors
    c_back1 = (255, 148, 31)
    c_back2 = (234, 88, 12)
    c_front1 = (254, 215, 170)
    c_front2 = (251, 146, 60)
    
    back_card = create_gradient_card(card_size, card_size, radius, c_back1, c_back2)
    front_card = create_gradient_card(card_size, card_size, radius, c_front1, c_front2)
    
    # Inner translucent plate
    inner_size = int(card_size * 0.62)
    inner_radius = int(radius * 0.65)
    inner_plate = Image.new("RGBA", (inner_size, inner_size), (255, 255, 255, 80))
    inner_mask = Image.new("L", (inner_size, inner_size), 0)
    ImageDraw.Draw(inner_mask).rounded_rectangle([0, 0, inner_size - 1, inner_size - 1], radius=inner_radius, fill=255)
    inner_plate.putalpha(inner_mask)
    front_card.alpha_composite(inner_plate, (int(card_size * 0.19), int(card_size * 0.19)))
    
    x_back = int(actual_pad + avail * 0.05)
    y_back = int(actual_pad + avail * 0.25)
    
    x_front = int(actual_pad + avail * 0.33)
    y_front = int(actual_pad + avail * 0.09)
    
    # Rotate back card slightly (-7 deg)
    rotated_back = back_card.rotate(-7, resample=Image.Resampling.BICUBIC, expand=True)
    
    # Soft shadow for back card
    s_back_mask = rotated_back.split()[3].filter(ImageFilter.GaussianBlur(radius=int(canvas_size * 0.025)))
    s_back = Image.new("RGBA", rotated_back.size, (0, 0, 0, 100))
    s_back.putalpha(s_back_mask)
    
    # Soft shadow for front card
    s_front_mask = front_card.split()[3].filter(ImageFilter.GaussianBlur(radius=int(canvas_size * 0.03)))
    s_front = Image.new("RGBA", front_card.size, (0, 0, 0, 120))
    s_front.putalpha(s_front_mask)
    
    # Composite layers
    img.alpha_composite(s_back, (x_back + 10, y_back + 16))
    img.alpha_composite(rotated_back, (x_back, y_back))
    img.alpha_composite(s_front, (x_front + 12, y_front + 18))
    img.alpha_composite(front_card, (x_front, y_front))
    
    return img

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"[-] Generating MultiTool Hub Brand Identity & Favicon Suite in {root_dir}...")
    
    master_transparent = render_symbol_canvas(1024, pad_factor=0.10, bg_color=None)
    charcoal_bg = (13, 17, 23, 255)
    master_charcoal = render_symbol_canvas(1024, pad_factor=0.18, bg_color=charcoal_bg)
    master_maskable = render_symbol_canvas(1024, pad_factor=0.22, bg_color=charcoal_bg, maskable=True)
    
    # PNG Favicons
    fav16 = master_transparent.resize((16, 16), Image.Resampling.LANCZOS)
    fav32 = master_transparent.resize((32, 32), Image.Resampling.LANCZOS)
    fav48 = master_transparent.resize((48, 48), Image.Resampling.LANCZOS)
    
    fav16.save(os.path.join(root_dir, "favicon-16x16.png"))
    fav32.save(os.path.join(root_dir, "favicon-32x32.png"))
    fav48.save(os.path.join(root_dir, "favicon-48x48.png"))
    
    # Multi-Resolution favicon.ico
    fav48.save(os.path.join(root_dir, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    
    # PWA App Icons
    icon192 = master_charcoal.resize((192, 192), Image.Resampling.LANCZOS)
    icon192.save(os.path.join(root_dir, "icon-192.png"))
    
    icon512 = master_charcoal.resize((512, 512), Image.Resampling.LANCZOS)
    icon512.save(os.path.join(root_dir, "icon-512.png"))
    
    icon_maskable = master_maskable.resize((512, 512), Image.Resampling.LANCZOS)
    icon_maskable.save(os.path.join(root_dir, "icon-maskable-512.png"))
    
    # Apple Touch Icon (180x180)
    apple180 = master_charcoal.resize((180, 180), Image.Resampling.LANCZOS)
    apple180.save(os.path.join(root_dir, "apple-touch-icon.png"))
    
    print("[SUCCESS] All Brand & Favicon Assets Generated Successfully in root!")

if __name__ == "__main__":
    main()
