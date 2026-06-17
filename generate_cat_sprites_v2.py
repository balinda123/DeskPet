from PIL import Image, ImageDraw
import math, os

# --- Configuration ---
FRAME_COLS = 4
FRAME_ROWS = 2
FRAME_W = 256
FRAME_H = 256
CELL_PAD = 8
BG_COLOR = (240, 248, 255)

CAT_WHITE = (255, 255, 255)
CAT_SHADOW = (240, 240, 245)
CAT_OUTLINE = (180, 185, 195)
CAT_NOSE = (255, 170, 170)
CAT_EYE = (120, 170, 200)
CAT_EYE_HIGHLIGHT = (220, 240, 255)
CAT_PINK = (255, 210, 210)
CAT_PINK_INNER = (255, 180, 180)
GROUND_COLOR = (210, 220, 235)
FRAME_BG = (255, 255, 255)

NUM_FRAMES = FRAME_COLS * FRAME_ROWS

total_w = FRAME_COLS * FRAME_W + (FRAME_COLS + 1) * CELL_PAD
total_h = FRAME_ROWS * FRAME_H + (FRAME_ROWS + 1) * CELL_PAD

canvas = Image.new('RGB', (total_w, total_h), BG_COLOR)

def draw_cat_frame(frame_img, frame_idx, num_frames=8):
    draw = ImageDraw.Draw(frame_img)
    
    cx = FRAME_W // 2
    cy = FRAME_H // 2 + 10
    s = 1.6
    
    t = frame_idx / num_frames
    angle = t * 2 * math.pi
    
    leg_swing = 12 * s
    body_bounce = 3 * s * abs(math.cos(angle * 0.5))
    tail_wag = math.sin(angle * 2) * 8 * s
    ear_perk = math.sin(angle * 4) * 2 * s
    head_tilt = math.sin(angle) * 2 * s
    
    body_cx = cx
    body_cy = cy - int(15 * s) - int(body_bounce)
    body_w = int(40 * s)
    body_h = int(26 * s)
    
    back_leg_base_x = body_cx - int(16 * s)
    front_leg_base_x = body_cx + int(16 * s)
    leg_bottom_y = cy + int(10 * s)
    
    back_leg1_angle = angle
    back_leg2_angle = angle + math.pi
    front_leg1_angle = angle + math.pi
    front_leg2_angle = angle
    
    back_leg1_x = back_leg_base_x + int(leg_swing * math.sin(back_leg1_angle))
    back_leg1_bottom = leg_bottom_y - int(8 * s * abs(math.cos(back_leg1_angle)))
    back_leg2_x = back_leg_base_x + int(leg_swing * math.sin(back_leg2_angle))
    back_leg2_bottom = leg_bottom_y - int(8 * s * abs(math.cos(back_leg2_angle)))
    
    front_leg1_x = front_leg_base_x + int(leg_swing * math.sin(front_leg1_angle))
    front_leg1_bottom = leg_bottom_y - int(8 * s * abs(math.cos(front_leg1_angle)))
    front_leg2_x = front_leg_base_x + int(leg_swing * math.sin(front_leg2_angle))
    front_leg2_bottom = leg_bottom_y - int(8 * s * abs(math.cos(front_leg2_angle)))
    
    leg_w = int(6 * s)
    leg_h = int(18 * s)
    
    for lx, lb in [(back_leg1_x, back_leg1_bottom), (back_leg2_x, back_leg2_bottom),
                    (front_leg1_x, front_leg1_bottom), (front_leg2_x, front_leg2_bottom)]:
        draw.ellipse([lx - leg_w//2, lb - leg_h//2, lx + leg_w//2, lb + leg_h//2],
                    CAT_WHITE, CAT_OUTLINE, 1)
    
    tail_base_x = body_cx - int(20 * s)
    tail_base_y = body_cy - int(5 * s)
    tail_mid_x = tail_base_x - int(15 * s) + int(tail_wag * 0.5)
    tail_mid_y = tail_base_y - int(12 * s)
    tail_tip_x = tail_base_x - int(25 * s) + int(tail_wag)
    tail_tip_y = tail_base_y - int(25 * s)
    
    draw.line([(tail_base_x, tail_base_y), (tail_mid_x, tail_mid_y), (tail_tip_x, tail_tip_y)],
                CAT_WHITE, width=int(6 * s))
    draw.ellipse([tail_tip_x - int(4*s), tail_tip_y - int(4*s),
                  tail_tip_x + int(4*s), tail_tip_y + int(4*s)],
                CAT_WHITE, CAT_OUTLINE, 1)
    
    body_bbox = [body_cx - body_w//2, body_cy - body_h//2, body_cx + body_w//2, body_cy + body_h//2]
    draw.ellipse(body_bbox, CAT_WHITE, CAT_OUTLINE, 1)
    
    shadow_offset = int(3 * s)
    draw.ellipse(
       [body_cx - body_w//2 + shadow_offset, body_cy + body_h//2 - int(8*s),
        body_cx + body_w//2 + shadow_offset, body_cy + body_h//2],
       CAT_SHADOW)
    
    head_cx = body_cx + int(28 * s)
    head_cy = body_cy - int(12 * s) + int(head_tilt)
    head_r = int(20 * s)
    
    head_bbox = [head_cx - head_r, head_cy - head_r, head_cx + head_r, head_cy + head_r]
    draw.ellipse(head_bbox, CAT_WHITE, CAT_OUTLINE, 1)
    
    ear_w = int(14 * s)
    ear_h = int(18 * s + ear_perk)
    
    le_cx = head_cx - int(10 * s)
    le_cy = head_cy - int(16 * s)
    left_ear_pts = [
        (le_cx - int(6*s), le_cy + int(6*s)),
        (le_cx - int(10*s), le_cy - int(12*s)),
        (le_cx + int(6*s), le_cy + int(4*s))
    ]
    draw.polygon(left_ear_pts, CAT_WHITE, CAT_OUTLINE)
    inner_left = [
        (le_cx - int(4*s), le_cy + int(4*s)),
        (le_cx - int(7*s), le_cy - int(8*s)),
        (le_cx + int(3*s), le_cy + int(3*s))
    ]
    draw.polygon(inner_left, CAT_PINK_INNER)
    
    re_cx = head_cx + int(10 * s)
    re_cy = head_cy - int(16 * s)
    right_ear_pts = [
        (re_cx - int(6*s), re_cy + int(4*s)),
        (re_cx + int(10*s), re_cy - int(12*s)),
        (re_cx + int(6*s), re_cy + int(6*s))
    ]
    draw.polygon(right_ear_pts, CAT_WHITE, CAT_OUTLINE)
    inner_right = [
        (re_cx - int(3*s), re_cy + int(3*s)),
        (re_cx + int(7*s), re_cy - int(8*s)),
        (re_cx + int(4*s), re_cy + int(4*s))
    ]
    draw.polygon(inner_right, CAT_PINK_INNER)
    
    eye_r = int(4 * s)
    leye_x = head_cx - int(7 * s)
    leye_y = head_cy - int(2 * s)
    draw.ellipse([leye_x - eye_r, leye_y - eye_r, leye_x + eye_r, leye_y + eye_r], CAT_EYE)
    shine_r = int(1.5 * s)
    draw.ellipse([leye_x - eye_r + int(1*s), leye_y - eye_r - int(1*s),
                  leye_x - eye_r + int(1*s) + shine_r*2, leye_y - eye_r - int(1*s) + shine_r*2],
                 CAT_EYE_HIGHLIGHT)
    
    reye_x = head_cx + int(7 * s)
    reye_y = head_cy - int(2 * s)
    draw.ellipse([reye_x - eye_r, reye_y - eye_r, reye_x + eye_r, reye_y + eye_r], CAT_EYE)
    draw.ellipse([reye_x - eye_r + int(1*s), reye_y - eye_r - int(1*s),
                  reye_x - eye_r + int(1*s) + shine_r*2, reye_y - eye_r - int(1*s) + shine_r*2],
                 CAT_EYE_HIGHLIGHT)
    
    nose_x = head_cx
    nose_y = head_cy + int(4 * s)
    nose_r = int(3 * s)
    draw.ellipse([nose_x - nose_r, nose_y - nose_r, nose_x + nose_r, nose_y + nose_r], CAT_NOSE)
    
    mouth_y = nose_y + int(3 * s)
    draw.arc([nose_x - int(5*s), mouth_y, nose_x + int(5*s), mouth_y + int(5*s)],
            start=0, end=180, fill=CAT_OUTLINE, width=int(1*s))
    
    whisker_y = nose_y + int(2 * s)
    for i, offset in enumerate([-2, 0, 2]):
        w_start_x = head_cx - int(5*s)
        w_end_x = head_cx - int(25*s) + int(offset * 3*s)
        w_end_y = whisker_y + int(offset * 4*s)
        draw.line([(w_start_x, whisker_y), (w_end_x, w_end_y)], fill=CAT_OUTLINE, width=int(1*s))
    
    for i, offset in enumerate([-2, 0, 2]):
        w_start_x = head_cx + int(5*s)
        w_end_x = head_cx + int(25*s) + int(offset * 3*s)
        w_end_y = whisker_y + int(offset * 4*s)
        draw.line([(w_start_x, whisker_y), (w_end_x, w_end_y)], fill=CAT_OUTLINE, width=int(1*s))
    
    ground_y = FRAME_H - 30
    draw.line([(15, ground_y), (FRAME_W - 15, ground_y)], fill=GROUND_COLOR, width=2)
    
    for dx in range(20, FRAME_W - 20, 15):
        draw.ellipse([dx, ground_y + 4, dx + 2, ground_y + 6], fill=GROUND_COLOR)
    
    draw.text((FRAME_W - 40, 8), f"Frame {frame_idx+1}", fill=(160, 170, 190))
    draw.rectangle([0, 0, FRAME_W-1, FRAME_H-1], outline=(220, 225, 235), width=2)


for row in range(FRAME_ROWS):
    for col in range(FRAME_COLS):
        frame_idx = row * FRAME_COLS + col
        if frame_idx >= NUM_FRAMES:
            break
            
        fx = CELL_PAD + col * (FRAME_W + CELL_PAD)
        fy = CELL_PAD + row * (FRAME_H + CELL_PAD)
        
        frame_img = Image.new('RGB', (FRAME_W, FRAME_H), FRAME_BG)
        draw_cat_frame(frame_img, frame_idx)
        canvas.paste(frame_img, (fx, fy))

output_path = r'E:\self-study\whiteCat\assets\white_cat_walk_sprites.png'
canvas.save(output_path, 'PNG')
fsize = os.path.getsize(output_path)
print(f'Saved: {output_path}')
print(f'Total size: {canvas.size[0]}x{canvas.size[1]}')
print(f'Frame size: {FRAME_W}x{FRAME_H}')
print(f'Grid: {FRAME_COLS}x{FRAME_ROWS} = {NUM_FRAMES} frames')
print(f'File size: {fsize} bytes ({fsize/1024:.1f} KB)')
