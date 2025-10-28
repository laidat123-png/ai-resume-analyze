import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "../lib/utils";

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] || null;

      // update parent and local selected file state
      onFileSelect?.(file);
      setSelectedFile(file);
    },
    [onFileSelect]
  );

  const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

  const { getRootProps, getInputProps, isDragActive, acceptedFiles, inputRef } =
    useDropzone({
      onDrop,
      multiple: false,
      accept: { "application/pdf": [".pdf"] },
      maxSize: maxFileSize,
    });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // prefer our controlled selectedFile (so remove/X reliably updates UI)
  const file = selectedFile || acceptedFiles[0] || null;

  return (
    <div className="w-full gradient-border">
      <div {...getRootProps()}>
        {/* attach dropzone's inputRef so dropzone behavior remains intact */}
        <input {...getInputProps()} ref={inputRef} />

        <div className="space-y-4 cursor-pointer">
          {file ? (
            <div
              className="uploader-selected-file"
              onClick={(e) => e.stopPropagation()}
            >
              <img src="/images/pdf.png" alt="pdf" className="size-10" />
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                className="p-2 cursor-pointer"
                onClick={(e) => {
                  // prevent parent handlers
                  e.stopPropagation();
                  // notify parent and clear our controlled state
                  onFileSelect?.(null);
                  setSelectedFile(null);

                  // clear the native file input so react-dropzone acceptedFiles resets
                  try {
                    const ref = inputRef && (inputRef as any).current;
                    if (ref) {
                      // clear the value
                      try {
                        ref.value = "";
                      } catch (err) {
                        // ignore
                      }

                      // dispatch change event so react-dropzone notices the mutation
                      try {
                        const ev = new Event("change", { bubbles: true });
                        ref.dispatchEvent(ev);
                      } catch (err) {
                        // ignore
                      }
                    }
                  } catch (err) {
                    // ignore
                  }
                }}
              >
                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                <img src="/icons/info.svg" alt="upload" className="size-20" />
              </div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-lg text-gray-500">
                PDF (max {formatSize(maxFileSize)})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FileUploader;
