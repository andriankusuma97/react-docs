import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import jsPDF from 'jspdf';

function ScanPdf() {
  const webcamRef = useRef<Webcam>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [croppedSrc, setCroppedSrc] = useState<string[]>([]);
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [autoCropEnabled, setAutoCropEnabled] = useState<boolean>(true);

  // Auto crop detection function
  const detectDocumentEdges = (canvas: HTMLCanvasElement): { x: number, y: number, width: number, height: number } | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Convert to grayscale and apply edge detection
    const grayscale = new Uint8Array(width * height);
    const edges = new Uint8Array(width * height);

    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      grayscale[i / 4] = gray;
    }

    // Simple edge detection (Sobel-like)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Sobel X
        const gx = 
          -grayscale[(y - 1) * width + (x - 1)] +
          grayscale[(y - 1) * width + (x + 1)] +
          -2 * grayscale[y * width + (x - 1)] +
          2 * grayscale[y * width + (x + 1)] +
          -grayscale[(y + 1) * width + (x - 1)] +
          grayscale[(y + 1) * width + (x + 1)];

        // Sobel Y
        const gy = 
          -grayscale[(y - 1) * width + (x - 1)] +
          -2 * grayscale[(y - 1) * width + x] +
          -grayscale[(y - 1) * width + (x + 1)] +
          grayscale[(y + 1) * width + (x - 1)] +
          2 * grayscale[(y + 1) * width + x] +
          grayscale[(y + 1) * width + (x + 1)];

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[idx] = magnitude > 50 ? 255 : 0;
      }
    }

    // Find document boundaries using edge information
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let edgeCount = 0;

    // Scan for edges to find document boundaries
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > 0) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          edgeCount++;
        }
      }
    }

    // If we found enough edges and the detected area is reasonable
    if (edgeCount > 100 && maxX > minX && maxY > minY) {
      // Add some padding and ensure we don't go outside image bounds
      const padding = Math.min(20, Math.min(minX, minY, width - maxX, height - maxY));
      
      return {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(width, maxX - minX + 2 * padding),
        height: Math.min(height, maxY - minY + 2 * padding)
      };
    }

    return null;
  };

  // Enhanced image processing function with auto crop
  const processImage = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;

    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the original image
    ctx.drawImage(img, 0, 0);
    
    let cropArea = null;
    
    // Auto crop detection if enabled
    if (autoCropEnabled) {
      cropArea = detectDocumentEdges(canvas);
    }

    // Create final canvas
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return img.src;

    if (cropArea) {
      // Use detected crop area
      finalCanvas.width = cropArea.width;
      finalCanvas.height = cropArea.height;
      
      // Draw cropped image
      finalCtx.drawImage(
        canvas,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, cropArea.width, cropArea.height
      );
    } else {
      // Use full image if no crop area detected
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      finalCtx.drawImage(canvas, 0, 0);
    }
    
    // Apply image enhancement
    const imageData = finalCtx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
    const data = imageData.data;
    
    // Enhanced contrast and brightness for document scanning
    const contrast = 1.3;
    const brightness = 15;
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast and brightness
      data[i] = Math.min(255, Math.max(0, contrast * (data[i] - 128) + 128 + brightness));     // Red
      data[i + 1] = Math.min(255, Math.max(0, contrast * (data[i + 1] - 128) + 128 + brightness)); // Green
      data[i + 2] = Math.min(255, Math.max(0, contrast * (data[i + 2] - 128) + 128 + brightness)); // Blue
    }
    
    // Put processed image data back
    finalCtx.putImageData(imageData, 0, 0);
    
    return finalCanvas.toDataURL();
  };

  const handleImage = async (file: File) => {
    setIsProcessing(true);
    const img = new Image();
    img.src = URL.createObjectURL(file);
    console.log(file, "<<<ini file");
    
    img.onload = () => {
      try {
        // Process the image with auto crop and enhancement
        const processedImageSrc = processImage(img);
        setCroppedSrc(prev => [...prev, processedImageSrc]);
        setIsProcessing(false);
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback: show original image if processing fails
        setCroppedSrc(prev => [...prev, img.src]);
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
          // Process the captured image with auto crop and enhancement
          const processedImageSrc = processImage(img);
          setCroppedSrc(prev => [...prev, processedImageSrc]);
          setShowWebcam(false);
          setIsProcessing(false);
        } catch (error) {
          console.error('Error processing captured image:', error);
          // Fallback: show original captured image if processing fails
          setCroppedSrc(prev => [...prev, imageSrc]);
          setShowWebcam(false);
          setIsProcessing(false);
        }
      };
    }
  }, [webcamRef, autoCropEnabled]);

  const resetScanner = () => {
    setCroppedSrc([]);
    setShowWebcam(false);
    setIsProcessing(false);
    setSelectedImageIndex(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const removeImage = (index: number) => {
    setCroppedSrc(prev => prev.filter((_, i) => i !== index));
    if (selectedImageIndex === index) {
      setSelectedImageIndex(null);
    } else if (selectedImageIndex !== null && selectedImageIndex > index) {
      setSelectedImageIndex(prev => prev! - 1);
    }
  };

  // Drag and Drop functions
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
    
    // Add some visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = draggedIndex;
    
    if (dragIndex === null || dragIndex === dropIndex) {
      return;
    }

    // Reorder the images array
    setCroppedSrc(prev => {
      const newArray = [...prev];
      const draggedItem = newArray[dragIndex];
      
      // Remove the dragged item
      newArray.splice(dragIndex, 1);
      
      // Insert at new position
      newArray.splice(dropIndex, 0, draggedItem);
      
      return newArray;
    });

    // Update selected index if needed
    if (selectedImageIndex === dragIndex) {
      setSelectedImageIndex(dropIndex);
    } else if (selectedImageIndex !== null) {
      if (dragIndex < selectedImageIndex && dropIndex >= selectedImageIndex) {
        setSelectedImageIndex(prev => prev! - 1);
      } else if (dragIndex > selectedImageIndex && dropIndex <= selectedImageIndex) {
        setSelectedImageIndex(prev => prev! + 1);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const generatePdf = async () => {
    if (croppedSrc.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      // Process each image
      for (let i = 0; i < croppedSrc.length; i++) {
        const imgSrc = croppedSrc[i];
        
        // Create temporary image element
        const tempImg = new Image();
        tempImg.src = imgSrc;
        
        await new Promise((resolve) => {
          tempImg.onload = async () => {
            // Create canvas from image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            
            canvas.width = tempImg.width;
            canvas.height = tempImg.height;
            ctx.drawImage(tempImg, 0, 0);
            
            // Calculate dimensions to fit A4
            const a4Width = 595;
            const a4Height = 842;
            const imgRatio = tempImg.height / tempImg.width;
            
            let pdfWidth = a4Width - 40; // margins
            let pdfHeight = pdfWidth * imgRatio;
            
            if (pdfHeight > a4Height - 40) {
              pdfHeight = a4Height - 40;
              pdfWidth = pdfHeight / imgRatio;
            }
            
            const x = (a4Width - pdfWidth) / 2;
            const y = (a4Height - pdfHeight) / 2;
            
            // Add new page if not first image
            if (i > 0) {
              pdf.addPage();
            }
            
            // Add image to PDF
            pdf.addImage(
              canvas.toDataURL('image/jpeg', 0.95),
              'JPEG',
              x,
              y,
              pdfWidth,
              pdfHeight
            );
            
            resolve(null);
          };
        });
      }
      
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
        
        {/* Auto Crop Toggle */}
        <div className='mb-4 p-3 bg-gray-50 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-gray-700'>Auto Crop Detection</label>
              <p className='text-xs text-gray-500'>Automatically detect and crop document edges</p>
            </div>
            <button
              onClick={() => setAutoCropEnabled(!autoCropEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoCropEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoCropEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {!croppedSrc.length && !showWebcam && (
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
        {showWebcam && (
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
            <p className='mt-2 text-gray-600'>
              {autoCropEnabled ? 'Detecting document edges...' : 'Processing document...'}
            </p>
          </div>
        )}

        {/* Images Gallery */}
        {croppedSrc.length > 0 && !isProcessing && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Scanned Documents ({croppedSrc.length})
              </h3>
              <div className='flex gap-2'>
                <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                  📋 Drag to reorder
                </span>
                <button
                  onClick={() => setShowWebcam(true)}
                  className='bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded-lg transition-colors'
                >
                  + Add More
                </button>
              </div>
            </div>

            {/* Image Grid */}
            <div className='grid grid-cols-2 gap-3 max-h-96 overflow-y-auto'>
              {croppedSrc.map((imageSrc, index) => (
                <div 
                  key={index} 
                  className='relative group'
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div 
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImageIndex === index 
                        ? 'border-blue-500 shadow-lg' 
                        : dragOverIndex === index && draggedIndex !== index
                        ? 'border-green-400 shadow-md transform scale-105'
                        : draggedIndex === index
                        ? 'border-gray-300 opacity-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img 
                      src={imageSrc} 
                      alt={`Scanned document ${index + 1}`} 
                      className='w-full h-32 object-cover pointer-events-none'
                    />
                  </div>
                  
                  {/* Auto crop indicator */}
                  {autoCropEnabled && (
                    <div className='absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity'>
                      ✂️ Auto
                    </div>
                  )}
                  
                  {/* Drag handle */}
                  <div className='absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move'>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,15H21V13H3V15M3,19H21V17H3V19M3,11H21V9H3V11M3,5V7H21V5H3Z" />
                    </svg>
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10'
                  >
                    ×
                  </button>
                  
                  {/* Image number */}
                  <div className='absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded'>
                    {index + 1}
                  </div>

                  {/* Drop indicator */}
                  {dragOverIndex === index && draggedIndex !== index && (
                    <div className='absolute inset-0 border-2 border-green-400 bg-green-100 bg-opacity-20 rounded-lg flex items-center justify-center'>
                      <span className='bg-green-500 text-white px-2 py-1 rounded text-xs font-medium'>
                        Drop here
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Image Preview */}
            {selectedImageIndex !== null && (
              <div className='space-y-2'>
                <h4 className='text-md font-medium text-gray-700'>
                  Preview - Document {selectedImageIndex + 1}
                  {autoCropEnabled && <span className='text-xs text-blue-500 ml-2'>✂️ Auto Cropped</span>}
                </h4>
                <div className='bg-gray-100 rounded-lg p-2'>
                  <img 
                    ref={selectedImageIndex === croppedSrc.length - 1 ? imgRef : undefined}
                    src={croppedSrc[selectedImageIndex]} 
                    alt={`Preview document ${selectedImageIndex + 1}`} 
                    className='w-full rounded-lg shadow-md' 
                  />
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className='flex gap-2'>
              <button
                onClick={resetScanner}
                className='flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors'
              >
                🗑️ Clear All
              </button>
              <button
                onClick={generatePdf}
                disabled={isProcessing}
                className='flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors'
              >
                {isProcessing ? 'Creating PDF...' : `📄 Save PDF (${croppedSrc.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanPdf;