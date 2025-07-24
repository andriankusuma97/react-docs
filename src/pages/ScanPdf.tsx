import  { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function ScanPdf() {
  const webcamRef = useRef<Webcam>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Simple image processing function to enhance document appearance
  const processImage = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;

    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the image
    ctx.drawImage(img, 0, 0);
    
    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple contrast and brightness adjustment for document scanning effect
    const contrast = 1.2;
    const brightness = 10;
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast and brightness
      data[i] = Math.min(255, Math.max(0, contrast * (data[i] - 128) + 128 + brightness));     // Red
      data[i + 1] = Math.min(255, Math.max(0, contrast * (data[i + 1] - 128) + 128 + brightness)); // Green
      data[i + 2] = Math.min(255, Math.max(0, contrast * (data[i + 2] - 128) + 128 + brightness)); // Blue
    }
    
    // Put processed image data back
    ctx.putImageData(imageData, 0, 0);
    
    return canvas.toDataURL();
  };

  const handleImage = async (file: File) => {
    setIsProcessing(true);
    const img = new Image();
    img.src = URL.createObjectURL(file);
    console.log(file, "<<<ini file");
    
    img.onload = () => {
      try {
        // Process the image to enhance document appearance
        const processedImageSrc = processImage(img);
        setCroppedSrc(processedImageSrc);
        setIsProcessing(false);
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback: show original image if processing fails
        setCroppedSrc(img.src);
        setIsProcessing(false);
      }
    };
  };

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return;
    
    setIsProcessing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      
      img.onload = () => {
        try {
          // Process the captured image to enhance document appearance
          const processedImageSrc = processImage(img);
          setCroppedSrc(processedImageSrc);
          setShowWebcam(false);
          setIsProcessing(false);
        } catch (error) {
          console.error('Error processing captured image:', error);
          // Fallback: show original captured image if processing fails
          setCroppedSrc(imageSrc);
          setShowWebcam(false);
          setIsProcessing(false);
        }
      };
    }
  }, [webcamRef]);

  const resetScanner = () => {
    setCroppedSrc(null);
    setShowWebcam(false);
    setIsProcessing(false);
  };

  const generatePdf = async () => {
    if (!imgRef.current) return;
    
    try {
      setIsProcessing(true);
      
      // Create canvas from the image element
      const canvas = await html2canvas(imgRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      // Calculate PDF dimensions based on image aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgHeight / imgWidth;
      
      // A4 size in points (595 x 842)
      const pdfWidth = 595;
      const pdfHeight = pdfWidth * ratio;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'pt',
        format: [pdfWidth, pdfHeight],
      });
      
      // Add image to PDF
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95), 
        'JPEG', 
        0, 
        0, 
        pdfWidth, 
        pdfHeight
      );
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `scanned-document-${timestamp}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsProcessing(false);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className='bg-sky-500 m-auto min-h-screen flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl p-6 max-w-md w-full shadow-lg'>
        <h2 className='text-2xl font-bold text-center mb-6 text-gray-800'>
          Document Scanner
        </h2>
        
        {!croppedSrc && !showWebcam && (
          <div className='space-y-4'>
            {/* File Upload */}
            <div className='bg-red-400 rounded-xl p-4'>
              <label className='block text-white font-medium mb-2'>
                Upload Image
              </label>
              <input 
                className='w-full p-2 rounded-lg' 
                type="file" 
                accept="image/*" 
                onChange={(e) => e.target.files && handleImage(e.target.files[0])} 
              />
            </div>
            
            {/* Camera Button */}
            <button
              onClick={() => setShowWebcam(true)}
              className='w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl transition-colors'
            >
              📷 Use Camera
            </button>
          </div>
        )}

        {/* Webcam View */}
        {showWebcam && !croppedSrc && (
          <div className='space-y-4'>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className='w-full rounded-lg'
              videoConstraints={{
                facingMode: { ideal: "environment" } // Use rear camera on mobile
              }}
            />
            <div className='flex gap-2'>
              <button
                onClick={capturePhoto}
                disabled={isProcessing}
                className='flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors'
              >
                {isProcessing ? 'Processing...' : '📸 Capture'}
              </button>
              <button
                onClick={() => setShowWebcam(false)}
                className='flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className='text-center py-4'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
            <p className='mt-2 text-gray-600'>Processing document...</p>
          </div>
        )}

        {/* Scanned Result */}
        {croppedSrc && !isProcessing && (
          <div className='space-y-4'>
            <div className='bg-gray-100 rounded-lg p-2'>
              <img 
                ref={imgRef} 
                src={croppedSrc} 
                alt="Scanned document" 
                className='w-full rounded-lg shadow-md' 
              />
            </div>
            
            <div className='flex gap-2'>
              <button
                onClick={resetScanner}
                className='flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors'
              >
                🔄 Scan New
              </button>
              <button
                onClick={generatePdf}
                disabled={isProcessing}
                className='flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors'
              >
                {isProcessing ? 'Creating PDF...' : '📄 Save PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanPdf;