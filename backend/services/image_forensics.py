import os
import cv2
import numpy as np
from PIL import Image, ImageChops, ExifTags
import io
import base64

def perform_ela(filepath, quality=95, scale=15):
    """
    Performs Error Level Analysis (ELA) on an image to detect modifications.
    Returns a base64 encoded ELA heatmap and extracted EXIF metadata.
    """
    try:
        # Load image using PIL
        original = Image.open(filepath).convert('RGB')
        
        # Extract EXIF metadata
        exif_data = {}
        info = original.getexif()
        if info:
            for tag_id, value in info.items():
                tag = ExifTags.TAGS.get(tag_id, tag_id)
                # Convert bytes or un-serializable objects to string
                if isinstance(value, bytes):
                    try:
                        value = value.decode('utf-8', errors='ignore')
                    except:
                        value = str(value)
                exif_data[str(tag)] = str(value)
                
        # Save original to a temporary JPEG buffer at a specific quality
        temp_buffer = io.BytesIO()
        original.save(temp_buffer, 'JPEG', quality=quality)
        temp_buffer.seek(0)
        
        # Open the recompressed image
        recompressed = Image.open(temp_buffer).convert('RGB')
        
        # Calculate absolute difference (Error Level)
        ela_image = ImageChops.difference(original, recompressed)
        
        # Get the extrema (min, max) to calculate a dynamic scale if needed, 
        # but we use a fixed scale (e.g., 15) to exaggerate the differences
        extrema = ela_image.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        if max_diff == 0:
            max_diff = 1 # Avoid division by zero
            
        # Scale the difference image to make it visible
        # Using fixed scale as standard for ELA
        ela_image = ImageChops.multiply(ela_image, scale)
        
        # Enhance brightness programmatically
        enhancer = Image.eval(ela_image, lambda x: x * 255.0 / max_diff if max_diff > 0 else x)
        
        # We can apply a pseudo-color map using cv2 to make it a heatmap
        ela_np = np.array(ela_image)
        # Convert RGB to Grayscale for heatmap application
        gray = cv2.cvtColor(ela_np, cv2.COLOR_RGB2GRAY)
        heatmap = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
        
        # Convert heatmap back to PIL Image
        heatmap_img = Image.fromarray(cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB))
        
        # Encode result to base64
        output_buffer = io.BytesIO()
        heatmap_img.save(output_buffer, format='JPEG')
        base64_ela = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
        
        return {
            "status": "success",
            "ela_base64": base64_ela,
            "exif_metadata": exif_data
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
