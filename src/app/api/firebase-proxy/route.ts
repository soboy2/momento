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
    // Log the start of the request
    console.log('Starting file upload process');
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    
    // Validate the request
    if (!file) {
      console.error('File is missing from request');
      return NextResponse.json(
        { success: false, error: 'File is required' }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }
    
    if (!path) {
      console.error('Path is missing from request');
      return NextResponse.json(
        { success: false, error: 'Path is required' }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }
    
    console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}, to path: ${path}`);
    
    // Create a metadata object
    const metadata = {
      contentType: file.type || 'application/octet-stream'
    };
    
    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, path);
      
      // Upload the file
      console.log('Starting upload to Firebase Storage');
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('File uploaded successfully, getting download URL');
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      // Return success response
      return NextResponse.json(
        { success: true, url: downloadURL },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    } catch (uploadError: any) {
      // Log the specific Firebase error
      console.error('Firebase Storage upload error:', uploadError.code, uploadError.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Firebase Storage upload failed', 
          details: uploadError.message,
          code: uploadError.code
        },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
  } catch (error: any) {
    // Log the general error
    console.error('Error processing upload request:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process upload request',
        details: error.message
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 