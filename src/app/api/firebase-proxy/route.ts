import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../../../lib/firebase/firebase';

// Initialize Firebase Storage
const storage = getStorage(app);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');
  
  if (!path) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  }
  
  // Construct the Firebase Storage URL
  const firebaseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/momento-4142e.firebasestorage.app/o/${encodeURIComponent(path)}?alt=media`;
  
  try {
    const response = await fetch(firebaseStorageUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Firebase Storage responded with ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Create a new response with the same body but with CORS headers
    const newResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
    return newResponse;
  } catch (error) {
    console.error('Error proxying to Firebase Storage:', error);
    return NextResponse.json({ error: 'Failed to fetch from Firebase Storage' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    
    if (!file || !path) {
      return NextResponse.json(
        { success: false, error: 'File and path are required' }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Create a metadata object
    const metadata = {
      contentType: file.type
    };
    
    // Upload the file to Firebase Storage
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return NextResponse.json(
      { success: true, url: downloadURL },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 