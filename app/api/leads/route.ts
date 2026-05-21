import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received lead submission:', data);
    
    // Process lead data here (e.g. save to database, send email)
    return NextResponse.json({ success: true, message: 'Lead submitted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
