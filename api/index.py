from flask import Flask, request, jsonify
import subprocess
import arucoFrame
import json
    
# Write PNG to temp file
import tempfile
import os
import subprocess

import potrace
from PIL import Image
import io


app = Flask(__name__)

@app.route("/api/process", methods=['POST'])
def process():
    
    # Call aruco-frame.py with input and output parameters
    # input_file = request.json.get('input_file')
    # output_file = request.json.get('output_file', '')  # Optional output filename
    input_file = "api/examples/sample.jpg"
    # output_file = "test"


    # Read image file as bytes
    with open(input_file, 'rb') as f:
        img_data = f.read()
    
    # Load config file
    with open("api/config.json", 'r') as f:
        config_json = json.load(f)
        
    img, dpi = arucoFrame.process_frame(img_data, config_json)

    # Convert bytes to PIL Image
    pil_img = Image.open(io.BytesIO(img))
    
    # Convert to bitmap for potrace
    bitmap = potrace.Bitmap(pil_img)
    
    # Create path object from bitmap
    path = bitmap.trace()
    
    # Get SVG from path

    svg_data = f'''<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{pil_img.width}" height="{pil_img.height}" viewBox="0 0 {pil_img.width} {pil_img.height}">'''
    parts = []
    for curve in path:
        fs = curve.start_point
        parts.append(f"M{fs.x},{fs.y}")
        for segment in curve.segments:
            if segment.is_corner:
                a = segment.c
                b = segment.end_point
                parts.append(f"L{a.x},{a.y}L{b.x},{b.y}")
            else:
                a = segment.c1
                b = segment.c2
                c = segment.end_point
                parts.append(f"C{a.x},{a.y} {b.x},{b.y} {c.x},{c.y}")
        parts.append("z")
    svg_data += f'<path stroke="none" fill="black" fill-rule="evenodd" d="{"".join(parts)}"/>'
    svg_data += "</svg>"

    return svg_data