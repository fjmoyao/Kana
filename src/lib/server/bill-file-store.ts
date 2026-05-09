export type StoredBillFile = {
  fileId: string;
  fileName: string;
  buffer: Buffer;
  uploadedAt: Date;
};

const billFileStore = new Map<string, StoredBillFile>();

export function storeBillFile(fileName: string, buffer: Buffer): StoredBillFile {
  const fileId = crypto.randomUUID();
  const storedFile = {
    fileId,
    fileName,
    buffer,
    uploadedAt: new Date(),
  };

  billFileStore.set(fileId, storedFile);
  return storedFile;
}

export function getBillFile(fileId: string): StoredBillFile | null {
  return billFileStore.get(fileId) ?? null;
}
