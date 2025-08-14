// Mock Storage Provider for Development and Testing

import { IStorageProvider, FileReference, StorageQuota, StorageProviderName } from '../../../types/storage';

export class MockProvider implements IStorageProvider {
  public name: StorageProviderName;
  private connected: boolean = false;
  private files: Map<string, FileReference> = new Map();

  constructor(name: StorageProviderName = 'google_drive') {
    this.name = name;
  }

  async connect(): Promise<void> {
    console.log(`[Mock${this.name}] Connecting...`);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.connected = true;
    console.log(`[Mock${this.name}] Connected successfully`);
  }

  async disconnect(): Promise<void> {
    console.log(`[Mock${this.name}] Disconnecting...`);
    this.connected = false;
    this.files.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async uploadFile(file: File, path?: string): Promise<FileReference> {
    if (!this.connected) {
      throw new Error(`${this.name} is not connected`);
    }

    console.log(`[Mock${this.name}] Uploading file: ${file.name}`);
    
    // Simulate upload progress
    await new Promise(resolve => setTimeout(resolve, 1000));

    const fileRef: FileReference = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider: this.name,
      providerId: `${this.name}-file-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      url: URL.createObjectURL(file), // Create blob URL for testing
      streamUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      path: path || `music/${file.name}`
    };

    this.files.set(fileRef.id, fileRef);
    
    console.log(`[Mock${this.name}] Upload complete:`, fileRef.providerId);
    return fileRef;
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.connected) {
      throw new Error(`${this.name} is not connected`);
    }

    const fileRef = this.files.get(fileId);
    if (!fileRef) {
      throw new Error(`File ${fileId} not found`);
    }

    // Revoke blob URL if it exists
    if (fileRef.url && fileRef.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileRef.url);
    }

    this.files.delete(fileId);
    console.log(`[Mock${this.name}] Deleted file: ${fileId}`);
  }

  async getStreamUrl(fileId: string): Promise<string> {
    if (!this.connected) {
      throw new Error(`${this.name} is not connected`);
    }

    const fileRef = this.files.get(fileId);
    if (!fileRef) {
      throw new Error(`File ${fileId} not found`);
    }

    // In real implementation, this might refresh expired URLs
    if (fileRef.streamUrl) {
      return fileRef.streamUrl;
    }

    // Generate new stream URL if needed
    return fileRef.url || '';
  }

  async getQuota(): Promise<StorageQuota> {
    if (!this.connected) {
      throw new Error(`${this.name} is not connected`);
    }

    // Mock quota based on provider type
    const quotas = {
      google_drive: { total: 15 * 1024 * 1024 * 1024 }, // 15GB
      dropbox: { total: 2 * 1024 * 1024 * 1024 },      // 2GB
      onedrive: { total: 5 * 1024 * 1024 * 1024 },     // 5GB
      supabase: { total: 10 * 1024 * 1024 * 1024 }     // 10GB
    };

    const totalQuota = quotas[this.name] || quotas.google_drive;
    const usedSpace = Array.from(this.files.values()).reduce((total, file) => total + file.fileSize, 0);
    
    // Add some random usage for realism
    const mockUsed = usedSpace + (Math.random() * 2 * 1024 * 1024 * 1024); // + up to 2GB
    
    const percentage = Math.min((mockUsed / totalQuota.total) * 100, 100);

    return {
      used: mockUsed,
      total: totalQuota.total,
      percentage,
      warning: percentage > 80,
      critical: percentage > 95
    };
  }

  async listFiles(path?: string): Promise<FileReference[]> {
    if (!this.connected) {
      throw new Error(`${this.name} is not connected`);
    }

    const allFiles = Array.from(this.files.values());
    
    if (path) {
      return allFiles.filter(file => file.path?.startsWith(path));
    }
    
    return allFiles;
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.connected;
    } catch (error) {
      console.error(`[Mock${this.name}] Connection test failed:`, error);
      return false;
    }
  }

  // Mock-specific methods for testing
  public getMockFileCount(): number {
    return this.files.size;
  }

  public simulateError(shouldError: boolean = true): void {
    if (shouldError) {
      this.connected = false;
    }
  }

  public getMockFiles(): FileReference[] {
    return Array.from(this.files.values());
  }
}