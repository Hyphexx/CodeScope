import { useRef } from "react";
import FileTree from "./FileTree.jsx";

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadBox({ files, onFilesChange, onSubmit, isLoading }) {
  const fileInputRef = useRef(null);

  function addFiles(fileList) {
    const newFiles = Array.from(fileList || []);
    const existingKeys = new Set(
      files.map((file) => `${file.name}-${file.size}`)
    );
    const uniqueFiles = newFiles.filter((file) => {
      const key = `${file.name}-${file.size}`;
      return !existingKeys.has(key);
    });

    onFilesChange([...files, ...uniqueFiles]);
  }

  function handleDrop(event) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  return (
    <div className="upload-card">
      <div
        className="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <h2>Upload code files</h2>
        <p>
          Pick one or more text/code files. The scan keeps the write up concise:
          overview, purpose, issues, security, quality notes, and ELI5.
        </p>

        <div className="upload-actions">
          <button type="button" onClick={() => fileInputRef.current.click()}>
            Choose files
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(event) => addFiles(event.target.files)}
          hidden
        />
      </div>

      <div className="selected-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Selected project</p>
            <h3>{files.length ? `${files.length} files ready` : "No files selected"}</h3>
          </div>
          {files.length > 0 && (
            <button type="button" className="text-button" onClick={() => onFilesChange([])}>
              Clear
            </button>
          )}
        </div>

        <FileTree files={files} />

        {files.length > 0 && (
          <div className="file-strip">
            {files.slice(0, 8).map((file) => (
              <span key={`${file.name}-${file.size}`}>
                {file.name} · {formatSize(file.size)}
              </span>
            ))}
            {files.length > 8 && <span>+ {files.length - 8} more</span>}
          </div>
        )}

        <button
          type="button"
          className="submit-button"
          onClick={onSubmit}
          disabled={!files.length || isLoading}
        >
          {isLoading ? "Analyzing files..." : "Analyze files"}
        </button>
      </div>
    </div>
  );
}
