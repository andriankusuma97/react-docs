import React, { useRef, useState } from 'react';
// import jscanify from 'jscanify';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';

function ScanPdf(){
    const imgRef = useRef<HTMLImageElement>(null);
    const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
    // const [dataImage, setDataImage] = useState()

    const handleImage = async (file: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    console.log(file,"<<<ini file");
    setCroppedSrc(img.src)
    img.onload = () => {
    //   const scanner = new jscanify();
    //   const canvas = scanner.extractPaper(img, 800, 1000);
    //   setCroppedSrc(canvas.toDataURL());
    };
  };

//   const generatePdf = async () => {
//     if (!imgRef.current) return;
//     const canvas = await html2canvas(imgRef.current);
//     const pdf = new jsPDF({
//       orientation: 'portrait',
//       unit: 'pt',
//       format: [canvas.width, canvas.height],
//     });
//     pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0);
//     pdf.save('scanned.pdf');
//   };

    return(
    <div className='bg-sky-500 m-auto h-screen flex items-center justify-center '>
        <div className='bg-red-400 w-48 rounded-2xl h-22 '> 
            <input 
            className='w-full h-full' 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={(e) => e.target.files && handleImage(e.target.files[0])} />
            {croppedSrc && (
                <>
                <img ref={imgRef} src={croppedSrc} alt="cropped" style={{ maxWidth: '100%' }} />
                {/* <button onClick={generatePdf}>Generate PDF</button> */}
                </>
            )}
      </div>
     
    </div>
    )
}

export default ScanPdf