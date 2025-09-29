const express = require('express');
const multer = require('multer');
const app = express();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.use(express.json());
app.use(express.text());

// Your ESQL to XSD conversion function (from your n8n code)
function convertESQLToXSD(esqlCode, originalFileName = 'converted_file.esql') {
    // Insert your complete conversion logic here from the Code node
    // (The same function we created earlier)
    
    if (!esqlCode || esqlCode.trim() === '') {
        throw new Error('ESQL content is empty');
    }
    
    const lines = esqlCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://esql.conversion.schema"
           xmlns:tns="http://esql.conversion.schema"
           elementFormDefault="qualified">
    
    <!-- Generated from ESQL file: ${originalFileName} -->
    <!-- Generated on: ${new Date().toISOString()} -->
    
    <xs:element name="TransformedMessage" type="tns:TransformedMessageType"/>
    <!-- Add the rest of your XSD generation logic -->
    
</xs:schema>`;

    return xsdContent;
}

// API Routes
app.post('/api/convert', upload.single('file'), (req, res) => {
    try {
        let esqlContent = '';
        let fileName = 'unknown.esql';
        
        if (req.file) {
            // File upload
            esqlContent = req.file.buffer.toString('utf8');
            fileName = req.file.originalname;
        } else if (req.body) {
            // Raw text in body
            esqlContent = typeof req.body === 'string' ? req.body : req.body.content;
            fileName = req.body.filename || 'input.esql';
        }
        
        const xsdContent = convertESQLToXSD(esqlContent, fileName);
        const outputFileName = fileName.replace(/\.esql$/i, '.xsd');
        
        res.json({
            success: true,
            originalFileName: fileName,
            convertedFileName: outputFileName,
            xsdContent: xsdContent,
            conversionDate: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', service: 'ESQL to XSD Converter' });
});

// Root endpoint with usage info
app.get('/', (req, res) => {
    res.json({
        service: 'ESQL to XSD Conversion API',
        endpoints: {
            'POST /api/convert': 'Convert ESQL to XSD (file upload or raw text)',
            'GET /api/health': 'Service health check'
        },
        usage: {
            file_upload: 'Send ESQL file as multipart/form-data with field name "file"',
            raw_text: 'Send JSON with "content" field containing ESQL code'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ESQL to XSD Converter API running on port ${PORT}`);
});

module.exports = app;
