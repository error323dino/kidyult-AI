'use client'; 

import React, { useState, DragEvent } from 'react';

interface WordCount {
  user: string;
  words: number;
}

interface FileWordCounts {
  file: string;
  wordCounts: WordCount[];
}

const WordCounter: React.FC = () => {
  const [wordCounts, setWordCounts] = useState<FileWordCounts[]>([]);
  const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const BACKEND_URL = 'http://localhost:5000/api/upload';

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const newFileContents = new Map<string, string>();
    const newFiles = [...files];

    for (const file of droppedFiles) {
      if (file.type === 'text/plain') {
        const content = await readFileContent(file);
        newFiles.push(file);
        newFileContents.set(file.name, content);
      } else {
        setErrorMessage('Only .txt files are allowed. PDF or other files are not accepted.'); // Set error message for invalid file type
      }
    }

    setFiles(newFiles);
    setFileContents(newFileContents);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFileContents = new Map<string, string>();
    const newFiles = [...files];

    for (const file of selectedFiles) {
      if (file.type === 'text/plain') {
        const content = await readFileContent(file);
        newFiles.push(file);
        newFileContents.set(file.name, content);
      } else {
        setErrorMessage('Only .txt files are allowed. PDF or other files are not accepted.'); // Set error message for invalid file type
      }
    }

    setFiles(newFiles);
    setFileContents(newFileContents);
  };

  const combineFileContents = (): string => {
    return Array.from(fileContents.values()).join('\n');
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    const combinedContent = combineFileContents();
    const formData = new FormData();
    formData.append('files', new Blob([combinedContent], { type: 'text/plain' }));

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result: FileWordCounts[] = await response.json();
      setWordCounts(result);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', border: '1px solid black' }}>
      <div
        style={{
          border: `1px dashed ${isDragging ? 'blue' : 'black'}`,
          padding: '20px',
          width: '50%',
          backgroundColor: isDragging ? '#e0f7fa' : 'white'
        }}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
      >
        <h3>Drag and drop log files (.txt)</h3>
        <input
          type="file"
          multiple
          onChange={handleFileInputChange}
          accept=".txt"
          style={{ display: 'none' }}
        />
        {Array.from(fileContents.entries()).map(([fileName, content]) => (
          <div key={fileName} style={{ marginTop: '20px', border: '1px solid gray', padding: '10px' }}>
            <h4>{fileName}</h4>
            <pre>{content}</pre>
          </div>
        ))}
        <button
          onClick={uploadFiles}
          disabled={files.length === 0}
          style={{ marginTop: '20px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Update
        </button>
        {errorMessage && (
          <div style={{ color: 'red', marginTop: '20px' }}>
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
      </div>
      <div style={{ border: '1px solid orange', padding: '20px', width: '30%' }}>
        <h3>Results:</h3>
        {wordCounts.length === 0 ? (
          <p>No results to display</p>
        ) : (
          wordCounts.map(({ file, wordCounts }, fileIndex) => (
            <div key={fileIndex} style={{ marginBottom: '20px' }}>

              <ul>
                {wordCounts.map((item, index) => (
                  <li key={index}>
                    {item.user} - {item.words} words
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WordCounter;
