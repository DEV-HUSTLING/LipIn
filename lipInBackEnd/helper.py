import json
import re
class File_to_Base64:
    async def file_to_base64(self, file):
        from fastapi import HTTPException
        import base64
        content = await file.read()
        if len(content) > 800 * 1024:
            raise HTTPException(400, f"File too large: {file.filename}")
        
        # Reset file position for potential reuse
        await file.seek(0)
    
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
    def __init__(self, raw_response):
        self.raw_response = raw_response

    def clean_json_response(self):
        """Clean and extract JSON from AI response"""
        response = self.raw_response.strip()
        
        # Remove markdown code blocks if present
        response = re.sub(r'^```json\s*|\s*```$', '', response, flags=re.MULTILINE)
        response = re.sub(r'^```\s*|\s*```$', '', response, flags=re.MULTILINE)
        
        # Remove any leading/trailing whitespace
        response = response.strip()
        
        # Find JSON content between first { and last }
        start = response.find('{')
        end = response.rfind('}')
        
        if start != -1 and end != -1:
            response = response[start:end+1]
        
        # Also check for JSON arrays starting with [
        if response.startswith('['):
            end = response.rfind(']')
            if end != -1:
                response = response[:end+1]
        
        # Fix common control character issues
        # Replace unescaped newlines within strings
        # This is a simple fix - more robust parsing would be better
        try:
            # Try parsing first
            parsed = json.loads(response)
            return json.dumps(parsed)  # Return as properly formatted JSON string
        except json.JSONDecodeError:
            # If it fails, try to fix control characters
            # Replace literal newlines with \n
            response = response.replace('\r\n', '\\n').replace('\n', '\\n').replace('\r', '\\n')
            # Replace literal tabs with \t
            response = response.replace('\t', '\\t')
            
            return response

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

class Simple_File_Handler:
    """Simplified file processing for attachments"""
    
    @staticmethod
    def get_file_summary(file, file_size):
        """Simple file summary without complex content extraction"""
        try:
            content_type = getattr(file, 'content_type', None) or "unknown"
            filename = getattr(file, 'filename', 'unknown') or "unknown"
            
            # Simple file type detection
            if filename.lower().endswith('.pdf'):
                file_type = "PDF Document"
            elif filename.lower().endswith(('.docx', '.doc')):
                file_type = "Word Document"
            elif filename.lower().endswith(('.txt', '.md')):
                file_type = "Text Document"
            elif filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                file_type = "Image"
            else:
                file_type = "File"
            
            # Simple size formatting
            if file_size > 1024 * 1024:
                size_str = f"{file_size / (1024*1024):.1f}MB"
            else:
                size_str = f"{file_size / 1024:.1f}KB"
            
            return f"{file_type}: {filename} ({size_str}). Consider this attachment for context in post generation."
            
        except Exception as e:
            return f"Attachment: {getattr(file, 'filename', 'unknown file')}. Use for context in post generation."
    
    @staticmethod
    def should_use_base64(file_size):
        """Simple check if file should be base64 encoded"""
        # Limit to 2MB for base64 to avoid issues
        return file_size <= (2 * 1024 * 1024)