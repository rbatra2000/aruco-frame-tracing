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
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config['CORS_HEADERS'] = 'Content-Type'

@app.route("/api/process", methods=['POST'])
@cross_origin(headers=['Content- Type','Authorization'])
def process():
    try:
        
        # Get input file from request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Get image data directly from file object
        img_data = file.read()

        print("STEP 1", flush=True)
        
        # Load config file
        try:
            with open("config.json", 'r') as f:
                config_json = json.load(f)
        except FileNotFoundError:
            return jsonify({'error': 'Configuration file not found'}), 500
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid configuration file'}), 500
        
        print("STEP 2", flush=True)
        # Process image
        try:
            img, dpi = arucoFrame.process_frame(img_data, config_json)
        except Exception as e:
            return jsonify({'error': f'Image processing failed: {str(e)}'}), 500
        print("STEP 3", flush=True)

        # Convert bytes to PIL Image
        try:
            pil_img = Image.open(io.BytesIO(img))
            bitmap = potrace.Bitmap(pil_img)
            path = bitmap.trace()
        except Exception as e:
            return jsonify({'error': f'Image conversion failed: {str(e)}'}), 500
        
        # Convert to bitmap for potrace
        bitmap = potrace.Bitmap(pil_img)

        print("STEP 4", flush=True)

        
        # Create path object from bitmap
        path = bitmap.trace()


        print("STEP 5", flush=True)
        
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

        print("STEP 6", flush=True)


        return jsonify({'svg': svg_data}), 200
            
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500
    
@app.route('/')
def hello_world():
    return 'Hello, World!'


if __name__ == '__main__':
    # context = ('local.crt', 'local.key')#certificate and key files
    app.run(host="0.0.0.0", port="8000", debug=True)#, ssl_context=context)
