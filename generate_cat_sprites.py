from PIL import Image, ImageDraw
import math, random

random.seed(42)

# Configuration
FRAME_COLS = 4
FRAME_ROWS = 2
FRAME_W = 128
FRAME_H = 128
CELL_PAD = 4
BG_COLOR = (240, 245, 255)
CAT_BODY = (255, 255, 255)
CAT_NOSE = (255, 180, 180)
CAT_EYE = (100, 140, 180)
CAT_PINK = (255, 200, 200)
LINE_COLOR = (200, 210, 230)

total_w = FRAME_COLS * FRAME_W + (FRAME_COLS + 1) * CELL_PAD
total_h = FRAME_ROWS * FRAME_H + (FRAME_ROWS + 1) * CELL_PAD

canvas = Image.new('RGB', (total_w, total_h), BG_COLOR)
draw = ImageDraw.Draw(canvas)

def draw_cat(draw_obj, cx, cy, frame_idx, scale=1.0):
    s = scale
    leg_phase = frame_idx * (math.pi / 4)
    leg_offset_x = int(6 * s * math.sin(leg_phase))
    body_bounce = int(2 * s * abs(math.cos(leg_phase * 0.5)))
    tail_angle = math.sin(frame_idx * math.pi / 2) * 0.4
    
    bl1_x, bl1_y = cx - int(14*s) + leg_offset_x, cy + int(18*s) + body_bounce
    bl2_x, bl2_y = cx - int(14*s) - leg_offset_x, cy + int(18*s) - body_bounce
    fl1_x, fl1_y = cx + int(14*s) - leg_offset_x, cy + int(18*s) + body_bounce
    fl2_x, fl2_y = cx + int(14*s) + leg_offset_x, cy + int(18*s) - body_bounce
    
    leg_w, leg_h = int(5*s), int(8*s)
    for lx, ly in [(bl1_x, bl1_y), (bl2_x, bl2_y), (fl1_x, fl1_y), (fl2_x, fl2_y)]:
        draw_obj.ellipse([lx-leg_w//2, ly-leg_h//2, lx+leg_w//2, ly+leg_h//2], fill=CAT_BODY, outline=LINE_COLOR)
    
    tail_start_x = cx - int(16*s)
    tail_start_y = cy - int(5*s) + body_bounce
    tail_end_x = tail_start_x - int(12*s) + int(tail_angle * 10 * s)
    tail_end_y = tail_start_y - int(15*s)
    draw_obj.line([(tail_start_x, tail_start_y), (tail_end_x, tail_end_y)], fill=CAT_BODY, width=int(4*s))
    draw_obj.ellipse([tail_end_x-int(2*s), tail_end_y-int(2*s), tail_end_x+int(2*s), tail_end_y+int(2*s)], fill=CAT_BODY, outline=LINE_COLOR)
    
    body_w, body_h = int(28*s), int(20*s)
    draw_obj.ellipse([cx-body_w//2, cy-body_h//2+body_bounce, cx+body_w//2, cy+body_h//2+body_bounce], fill=CAT_BODY, outline=LINE_COLOR)
    
    head_x = cx + int(20*s)
    head_y = cy - int(10*s) + body_bounce
    head_r = int(14*s)
    draw_obj.ellipse([head_x-head_r, head_y-head_r, head_x+head_r, head_y+head_r], fill=CAT_BODY, outline=LINE_COLOR)
    
    ear_size = int(8*s)
    draw_obj.polygon([(head_x-int(8*s), head_y-int(10*s)+body_bounce), (head_x-int(14*s), head_y-int(22*s)+body_bounce), (head_x-int(2*s), head_y-int(16*s)+body_bounce)], fill=CAT_BODY, outline=LINE_COLOR)
    draw_obj.polygon([(head_x+int(8*s), head_y-int(10*s)+body_bounce), (head_x+int(14*s), head_y-int(22*s)+body_bounce), (head_x+int(2*s), head_y-int(16*s)+body_bounce)], fill=CAT_BODY, outline=LINE_COLOR)
    
    draw_obj.polygon([(head_x-int(7*s), head_y-int(11*s)+body_bounce), (head_x-int(12*s), head_y-int(20*s)+body_bounce), (head_x-int(3*s), head_y-int(15*s)+body_bounce)], fill=CAT_PINK)
    draw_obj.polygon([(head_x+int(7*s), head_y-int(11*s)+body_bounce), (head_x+int(12*s), head_y-int(20*s)+body_bounce), (head_x+int(3*s), head_y-int(15*s)+body_bounce)], fill=CAT_PINK)
    
    eye_r = int(2*s)
    draw_obj.ellipse([head_x-int(5*s)-eye_r, head_y-int(3*s)+body_bounce-eye_r, head_x-int(5*s)+eye_r, head_y-int(3*s)+body_bounce+eye_r], fill=CAT_EYE)
    draw_obj.ellipse([head_x+int(3*s)-eye_r, head_y-int(3*s)+body_bounce-eye_r, head_x+int(3*s)+eye_r, head_y-int(3*s)+body_bounce+eye_r], fill=CAT_EYE)
    
    shine_r = int(1*s)
    draw_obj.ellipse([head_x-int(6*s)-shine_r, head_y-int(4*s)+body_bounce-shine_r, head_x-int(6*s)+shine_r, head_y-int(4*s)+body_bounce+shine_r], fill=(255,255,255))
    draw_obj.ellipse([head_x+int(2*s)-shine_r, head_y-int(4*s)+body_bounce-shine_r, head_x+int(2*s)+shine_r, head_y-int(4*s)+body_bounce+shine_r], fill=(255,255,255))
    
    nose_r = int(2*s)
    draw_obj.ellipse([head_x-nose_r, head_y+int(2*s)+body_bounce-nose_r, head_x+nose_r, head_y+int(2*s)+body_bounce+nose_r], fill=CAT_NOSE)
    
    draw_obj.arc([head_x-int(4*s), head_y+int(2*s)+body_bounce, head_x+int(4*s), head_y+int(6*s)+body_bounce], start=0, end=180, fill=LINE_COLOR, width=int(1*s))

frame_idx = 0
for row in range(FRAME_ROWS):
    for col in range(FRAME_COLS):
        if frame_idx >= 8:
            break
        fx = CELL_PAD + col * (FRAME_W + CELL_PAD)
        fy = CELL_PAD + row * (FRAME_H + CELL_PAD)
        
        frame_img = Image.new('RGB', (FRAME_W, FRAME_H), (255, 255, 255))
        frame_draw = ImageDraw.Draw(frame_img)
        
        ground_y = 85
        frame_draw.line([(10, ground_y), (FRAME_W-10, ground_y)], fill=(220, 225, 235), width=1)
        
        draw_cat(frame_draw, 64, 55, frame_idx, scale=1.0)
        
        frame_draw.text((FRAME_W-25, 5), str(frame_idx+1), fill=(150, 160, 180), font_size=10)
        
        canvas.paste(frame_img, (fx, fy))
        frame_idx += 1

output_path = r'E:\self-study\whiteCat\assets\white_cat_walk_sprites.png'
canvas.save(output_path, 'PNG')
print(f'Saved: {output_path}')
print(f'Size: {canvas.size}')
print(f'Frame: {FRAME_W}x{FRAME_H}, Grid: {FRAME_COLS}x{FRAME_ROWS} = {FRAME_COLS*FRAME_ROWS} frames')
