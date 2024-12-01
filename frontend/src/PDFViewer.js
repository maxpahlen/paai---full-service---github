import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from './axiosConfig';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

function PDFViewer() {
  const { documentId } = useParams();
  const [pdfData, setPdfData] = useState(null);

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        const response = await axiosInstance.get(`/api/file/pdf/${documentId}`, {
          responseType: 'blob',
        });
        setPdfData(response.data);
      } catch (error) {
        console.error("Error fetching PDF:", error);
      }
    };
    fetchPDF();
  }, [documentId]);

  return (
    <div className="pdf-viewer">
      <h2>PDF Document</h2>
      {pdfData ? (
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js`}>
          <Viewer fileUrl={URL.createObjectURL(pdfData)} />
        </Worker>
      ) : (
        <p>Loading PDF...</p>
      )}
    </div>
  );
}

export default PDFViewer;
