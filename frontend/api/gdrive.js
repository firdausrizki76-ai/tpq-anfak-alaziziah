import { google } from 'googleapis';
import stream from 'stream';

// Inisialisasi Google Drive dengan OAuth2 (Menggunakan kuota 15GB akun asli kamu)
const getDriveService = () => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.warn('⚠️ Google Drive OAuth2 credentials belum lengkap di .env');
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('Error inisialisasi GDrive OAuth2:', error.message);
    return null;
  }
};

/**
 * Upload file ke Google Drive menggunakan OAuth2
 */
export const uploadToGDrive = async (file, fileName) => {
  const drive = getDriveService();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!drive || !folderId) {
    console.error('GDrive tidak dikonfigurasi. Upload dibatalkan.');
    return null;
  }

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    
    const media = {
      mimeType: file.mimetype,
      body: bufferStream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id', // Kita hanya butuh ID untuk membuat link langsung
    });

    const fileId = response.data.id;

    // Buat file menjadi public
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Kembalikan Link Gambar Langsung (Bisa dibaca tag <img>)
    return `https://drive.google.com/uc?export=view&id=${fileId}`; 
  } catch (error) {
    console.error('Error upload ke GDrive:', error.message);
    return null;
  }
};

