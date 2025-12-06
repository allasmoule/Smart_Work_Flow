// Client-side example: Upload file and attach to task
export async function uploadFileAndAttach(
  taskId: string,
  file: File
): Promise<{ fileUrl: string; fileId: string }> {
  // 1. Get presigned URL
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  });

  if (!presignRes.ok) {
    throw new Error('Failed to get upload URL');
  }

  const { uploadUrl, fileUrl, fileKey } = await presignRes.json();

  // 2. Upload to S3
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload file');
  }

  // 3. Save file record to database
  const attachRes = await fetch(`/api/tasks/${taskId}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileKey,
    }),
  });

  if (!attachRes.ok) {
    throw new Error('Failed to attach file to task');
  }

  const { id: fileId } = await attachRes.json();

  return { fileUrl, fileId };
}

