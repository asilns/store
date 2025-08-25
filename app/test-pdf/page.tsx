"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAndDownloadPDF, generatePDFBlob, downloadPDFFromBlob } from "@/lib/utils/pdfGenerator";

export default function TestPDFPage() {
  const testRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTestPDF = async () => {
    if (!testRef.current) return;

    setIsGenerating(true);
    try {
      console.log("Testing PDF generation...");
      
      // Test 1: Generate and save directly
      const invoiceData = {
        invoiceNumber: "TEST-001",
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        billTo: {
          name: "Test Customer",
          address: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
          country: "Test Country"
        },
        shipTo: {
          name: "Test Customer",
          address: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
          country: "Test Country"
        },
        items: [
          {
            name: "Test Item",
            description: "A test item for PDF generation",
            quantity: 1,
            unitPrice: 99.99
          }
        ],
        subtotal: 99.99,
        tax: 9.99,
        total: 109.98,
        notes: "This is a test invoice"
      };
      
      await generateAndDownloadPDF(invoiceData, 'en');
      
      console.log("Direct PDF generation successful");
    } catch (error) {
      console.error('Error in direct PDF generation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestBlob = async () => {
    if (!testRef.current) return;

    setIsGenerating(true);
    try {
      console.log("Testing PDF blob generation...");
      
      // Test 2: Generate blob and download
      const invoiceData = {
        invoiceNumber: "TEST-001",
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        billTo: {
          name: "Test Customer",
          address: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
          country: "Test Country"
        },
        shipTo: {
          name: "Test Customer",
          address: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
          country: "Test Country"
        },
        items: [
          {
            name: "Test Item",
            description: "A test item for PDF generation",
            quantity: 1,
            unitPrice: 99.99
          }
        ],
        subtotal: 99.99,
        tax: 9.99,
        total: 109.98,
        notes: "This is a test invoice"
      };
      
      const blob = await generatePDFBlob(invoiceData, 'en');
      
      console.log("Blob generated, size:", blob.size);
      
      if (blob.size > 0) {
        downloadPDFFromBlob(blob, 'test-invoice-blob.pdf');
        console.log("Blob download successful");
      } else {
        console.error("Generated blob is empty");
      }
    } catch (error) {
      console.error('Error in blob PDF generation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">PDF Generation Test</h1>
      
      <div className="flex gap-4">
        <Button onClick={handleTestPDF} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Test Direct PDF'}
        </Button>
        <Button onClick={handleTestBlob} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Test Blob PDF'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={testRef}
            className="bg-white border rounded-lg p-6 max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Test Invoice</h2>
            <div className="space-y-2">
              <div><strong>Invoice #:</strong> TEST-001</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Amount:</strong> $99.99</div>
            </div>
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p>This is a test invoice to verify PDF generation functionality.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Console Output</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Check the browser console for detailed logs and any error messages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
