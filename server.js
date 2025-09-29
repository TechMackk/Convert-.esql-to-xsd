const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    abortOnLimit: true
}));

// Your ESQL to XSD conversion function
function convertESQLToXSD(esqlCode, originalFileName = 'converted_file.esql') {
    if (!esqlCode || esqlCode.trim() === '') {
        throw new Error('ESQL content is empty');
    }
    
    const lines = esqlCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://esql.conversion.schema"
           xmlns:tns="http://esql.conversion.schema"
           elementFormDefault="qualified"
           attributeFormDefault="unqualified">
    
    <!-- Generated from ESQL file: ${originalFileName} -->
    <!-- Generated on: ${new Date().toISOString()} -->
    
    <!-- Root element definition -->
    <xs:element name="TransformedMessage" type="tns:TransformedMessageType"/>
    
    <!-- Main complex type for transformed message -->
    <xs:complexType name="TransformedMessageType">
        <xs:sequence>
            <xs:element name="Header" type="tns:HeaderType" minOccurs="0"/>
            <xs:element name="Body" type="tns:BodyType" minOccurs="0"/>
            <xs:element name="ProcessingInfo" type="tns:ProcessingInfoType" minOccurs="0"/>
        </xs:sequence>
    </xs:complexType>
    
    <!-- Header type definition -->
    <xs:complexType name="HeaderType">
        <xs:sequence>
            <xs:element name="MessageID" type="xs:string" minOccurs="0"/>
            <xs:element name="Timestamp" type="xs:dateTime" minOccurs="0"/>
            <xs:element name="Source" type="xs:string" minOccurs="0"/>
            <xs:element name="Destination" type="xs:string" minOccurs="0"/>
        </xs:sequence>
    </xs:complexType>
    
    <!-- Processing info type -->
    <xs:complexType name="ProcessingInfoType">
        <xs:sequence>
            <xs:element name="Timestamp" type="xs:dateTime" minOccurs="0"/>
            <xs:element name="ProcessedBy" type="xs:string" minOccurs="0"/>
            <xs:element name="Status" type="tns:ProcessingStatusType" minOccurs="0"/>
        </xs:sequence>
    </xs:complexType>
    
    <!-- Processing status enumeration -->
    <xs:simpleType name="ProcessingStatusType">
        <xs:restriction base="xs:string">
            <xs:enumeration value="SUCCESS"/>
            <xs:enumeration value="PROCESSING"/>
            <xs:enumeration value="ERROR"/>
            <xs:enumeration value="COMPLETED"/>
        </xs:restriction>
    </xs:simpleType>

    <!-- Body type definition -->
    <xs:complexType name="BodyType">
        <xs:sequence>
            <xs:element name="ProcessingResult" type="xs:string" minOccurs="0"/>
            <xs:element name="ProcessedElements" type="xs:integer" minOccurs="0"/>
        </xs:sequence>
    </xs:complexType>

</xs:schema>`;

    return xsdContent;
}

// API Routes
app.post('/api/convert', (req, res) => {
    try {
        let esqlContent = '';
        let fileName = 'unknown.esql';
        
        if (req.files && req.files.file) {
            // File upload using express-fileupload
            esqlContent = req.files.file.data.toString('utf8');
            fileName = req.files.file.name;
        } else if (req.body) {
            // Raw text/JSON in body
            esqlContent = typeof req.body === 'string' ? req.body : req.body.content || req.body.esqlContent;
            fileName = req.body.filename || 'input.esql';
        }
        
        if (!esqlContent) {
            throw new Error('No ESQL content provided');
        }
        
        const xsdContent = convertESQLToXSD(esqlContent, fileName);
        const outputFileName = fileName.replace(/\.esql$/i, '.xsd');
        
        res.json({
            success: true,
            originalFileName: fileName,
            convertedFileName: outputFileName,
            xsdContent: xsdContent,
            esqlContentLength: esqlContent.length,
            xsdContentLength: xsdContent.length,
            conversionDate: new Date().toISOString
