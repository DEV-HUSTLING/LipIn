class File_to_Base64:
    async def file_to_base64(file):
        from fastapi import HTTPException
        import base64
        content = await file.read()
        if len(content) > 800 * 1024:
            raise HTTPException(400, f"File too large: {file.filename}")
    
        return {
        "base64": base64.b64encode(content).decode('utf-8'),
        "filename": file.filename,
        "mime_type": file.content_type,
        "size_bytes": len(content)
            }
    def increment(self, amount=1):
        self.count += amount
        print(f"Count is now: {self.count}")
class Clean_JSON:
    def __init__(self, raw_json):
        self.raw_json = raw_json

    def clean_json_response(self):
        import re
        cleaned = re.sub(r'```json\s*|\s*```', '', self.raw_json)
        cleaned = cleaned.strip()

        cleaned = re.sub(r',(\s*[}\]])', r'\1', cleaned)

        return cleaned

class Image_Processor:
    def __init__(self, base64_img ):
        self.base64_img = base64_img
    def convert_img_to_str(self):
        import base64
        from io import BytesIO
        from PIL import Image
        import pytesseract

        # Decode the base64 string
        img_data = base64.b64decode(self.base64_img.split(",")[1])
        
        # Convert bytes data to a PIL Image
        image = Image.open(BytesIO(img_data))

        text = pytesseract.image_to_string(image)

        return text