"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";

export function ReceiptScanner({ onScanComplete }) { // onScanComplete is a callback function that will be called with the scanned data once the scanning is complete
  // onscanComplete allows the parent component to handle the scanned data, such as displaying it or processing it further.
  const fileInputRef = useRef(null); // Reference to the hidden file input i.e it is used to trigger file selection

  const {
    loading: scanReceiptLoading, // Loading state for the receipt scanning process
    fn: scanReceiptFn,
    data: scannedData,
  } = useFetch(scanReceipt); // Custom hook to handle the receipt scanning function

  const handleReceiptScan = async (file) => { 
    if (file.size > 5 * 1024 * 1024) { // Check if the file size exceeds 5MB
      toast.error("File size should be less than 5MB");
      return;
    }

    await scanReceiptFn(file); // Call the function to scan the receipt with the selected file
  };

  useEffect(() => { // This effect runs when the scanning process is complete
    if (scannedData && !scanReceiptLoading) { // Check if scanned data is available and scanning is not in progress
      onScanComplete(scannedData); // Call the onScanComplete callback with the scanned data
      toast.success("Receipt scanned successfully");
    }
  }, [scanReceiptLoading, scannedData]); // watch for changes in scanReceiptLoading and scannedData

  return (
    <div className="flex items-center gap-4">
      <input // Hidden file input for scanning receipts
        type="file"
        ref={fileInputRef} //  Reference to the file input
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]; // Get the selected file
          if (file) handleReceiptScan(file); // Call the function to handle receipt scanning if a file is selected
        }}
      />
      <Button
        type="button"
        variant="outline"
       className="w-full h-10 bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 hover:opacity-90 transition-opacity text-white hover:text-white rounded-md shadow-md"

        onClick={() => fileInputRef.current?.click()} // Trigger the file input click to open the file selection dialog
        disabled={scanReceiptLoading}   // Disable the button while scanning is in progress
      >
        {scanReceiptLoading ? ( // Show loading state when scanning
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : ( // else show the button to scan receipt
          <> 
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
}
