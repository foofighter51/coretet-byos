import { IStorageProvider, StorageQuota, UploadResult } from '../../../types/storage';

interface GoogleAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  parents: string[];
}

interface GoogleDriveFolder {
  id: string;
  name: string;
  parents: string[];
}

export class GoogleDriveProvider implements IStorageProvider {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    // Automatically restore tokens from localStorage on initialization
    this.restoreStoredTokens();
  }

  private restoreStoredTokens(): void {
    const storedToken = localStorage.getItem('google_access_token');
    const storedRefreshToken = localStorage.getItem('google_refresh_token');
    const storedExpiry = localStorage.getItem('google_token_expiry');

    if (storedToken && storedExpiry) {
      this.accessToken = storedToken;
      this.refreshToken = storedRefreshToken;
      this.tokenExpiry = parseInt(storedExpiry);
      
      console.log('[GoogleDriveProvider] Restored tokens from localStorage');
    }
  }

  async connect(): Promise<boolean> {
    try {
      // Google OAuth 2.0 flow
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      // Open popup for OAuth
      const popup = window.open(
        authUrl.toString(),
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for OAuth callback
      const authCode = await this.waitForAuthCode(popup);
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(authCode);
      
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token || null;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

      // Store tokens securely (in production, use encrypted storage)
      localStorage.setItem('google_access_token', this.accessToken);
      if (this.refreshToken) {
        localStorage.setItem('google_refresh_token', this.refreshToken);
      }
      localStorage.setItem('google_token_expiry', this.tokenExpiry.toString());

      return true;
    } catch (error) {
      console.error('Google Drive connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Revoke tokens
    if (this.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error revoking Google token:', error);
      }
    }

    // Clear stored tokens
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('google_token_expiry');

    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  async isConnected(): Promise<boolean> {
    // Check if we have valid tokens
    const storedToken = localStorage.getItem('google_access_token');
    const storedExpiry = localStorage.getItem('google_token_expiry');

    console.log('Checking connection:', { 
      hasToken: !!storedToken, 
      hasExpiry: !!storedExpiry, 
      currentToken: this.accessToken,
      storedToken: storedToken?.substring(0, 20) + '...' 
    });

    if (!storedToken || !storedExpiry) {
      return false;
    }

    const expiry = parseInt(storedExpiry);
    if (Date.now() >= expiry) {
      // Token expired, try to refresh
      console.log('Token expired, attempting refresh');
      return this.refreshAccessToken();
    }

    this.accessToken = storedToken;
    this.tokenExpiry = expiry;
    console.log('Connection verified, tokens loaded');
    return true;
  }

  async uploadFile(file: File, path?: string): Promise<UploadResult> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    await this.ensureValidToken();

    try {
      // Create folder if path is specified
      let parentId = 'root';
      if (path) {
        parentId = await this.createFolderPath(path);
      }

      // Upload file metadata first
      const metadata = {
        name: file.name,
        parents: [parentId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const uploadedFile: GoogleDriveFile = await response.json();

      return {
        fileId: uploadedFile.id,
        url: uploadedFile.webContentLink,
        path: path || '/',
        size: parseInt(uploadedFile.size),
      };
    } catch (error) {
      console.error('Google Drive upload error:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    await this.ensureValidToken();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  }

  async getQuota(): Promise<StorageQuota> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    await this.ensureValidToken();

    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get quota: ${response.statusText}`);
    }

    const data = await response.json();
    const quota = data.storageQuota;

    return {
      total: parseInt(quota.limit),
      used: parseInt(quota.usage),
      available: parseInt(quota.limit) - parseInt(quota.usage),
    };
  }

  private async waitForAuthCode(popup: Window): Promise<string> {
    return new Promise((resolve, reject) => {
      // Timeout after 5 minutes - no popup closed detection due to COOP
      const timeout = setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        try {
          popup.close();
        } catch (error) {
          // Ignore COOP errors when closing
        }
        reject(new Error('OAuth timeout - please try again'));
      }, 5 * 60 * 1000);

      // Listen for message from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          // Don't try to close popup - let it close itself to avoid COOP errors
          resolve(event.data.code);
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          // Don't try to close popup - let it close itself to avoid COOP errors  
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  private async exchangeCodeForTokens(code: string): Promise<GoogleAuthResponse> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    const redirectUri = `${window.location.origin}/auth/google/callback`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('google_refresh_token');
    if (!refreshToken) {
      return false;
    }

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        return false;
      }

      const tokens: GoogleAuthResponse = await response.json();
      
      this.accessToken = tokens.access_token;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

      localStorage.setItem('google_access_token', this.accessToken);
      localStorage.setItem('google_token_expiry', this.tokenExpiry.toString());

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        throw new Error('Token expired and refresh failed');
      }
    }
  }

  private async createFolderPath(path: string): Promise<string> {
    const parts = path.split('/').filter(Boolean);
    let parentId = 'root';

    for (const part of parts) {
      parentId = await this.createOrGetFolder(part, parentId);
    }

    return parentId;
  }

  private async createOrGetFolder(name: string, parentId: string): Promise<string> {
    // First, check if folder exists
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    const searchData = await searchResponse.json();
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create folder if it doesn't exist
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    });

    const createData = await createResponse.json();
    return createData.id;
  }

  // New methods for browsing existing files
  async browseFolders(parentId: string = 'root'): Promise<GoogleDriveFolder[]> {
    console.log('browseFolders called with:', { parentId, hasToken: !!this.accessToken });
    
    // Try to check/load connection first
    const isConnected = await this.isConnected();
    console.log('Connection check result:', isConnected);
    
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    await this.ensureValidToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${parentId}' in parents and mimeType='application/vnd.google-apps.folder'&fields=files(id,name,parents)`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to browse folders: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  async discoverAudioFiles(folderId: string): Promise<GoogleDriveFile[]> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    await this.ensureValidToken();

    // Audio MIME types to search for
    const audioTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 
      'audio/aac', 'audio/ogg', 'audio/flac', 'audio/m4a'
    ];

    const audioQuery = audioTypes.map(type => `mimeType='${type}'`).join(' or ');
    const query = `'${folderId}' in parents and (${audioQuery})`;

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,mimeType,webViewLink,webContentLink,parents)`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to discover audio files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  async getStreamUrl(fileId: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    await this.ensureValidToken();

    // For audio streaming, we need to use the download API with authentication
    // This creates a temporary authenticated URL that can be used for streaming
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${this.accessToken}`;
  }

  async getFolderPath(folderId: string): Promise<string> {
    if (folderId === 'root') return '/';

    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    await this.ensureValidToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name,parents`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get folder path: ${response.statusText}`);
    }

    const folder = await response.json();
    
    if (!folder.parents || folder.parents.length === 0) {
      return `/${folder.name}`;
    }

    const parentPath = await this.getFolderPath(folder.parents[0]);
    return `${parentPath}${folder.name}/`;
  }
}