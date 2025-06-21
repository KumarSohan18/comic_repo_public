import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // For testing, allow empty body and use default planType
    let body;
    try {
      body = await request.json();
      console.log("Request body:", body);
    } catch (e) {
      console.log("No request body provided, using default");
      body = { planType: 'BASIC' };
    }
    
    // Forward the request to our backend server
    const backendUrl = `${process.env.NODE_ENV === 'production' ? 'https://api.sohankumar.com' : 'http://localhost:8000'}/payments/create-order`;
    
    // Get all cookies from the request to pass along for authentication
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    // Extract token from cookies for explicit Authorization header
    const tokenCookie = allCookies.find(cookie => cookie.name === 'token');
    const authHeader = tokenCookie ? `Bearer ${tokenCookie.value}` : '';
    
    console.log("Forwarding create-order request to backend:", backendUrl);
    console.log("With cookies:", cookieHeader);
    console.log("With Authorization:", authHeader ? 'Bearer token present' : 'No Bearer token');
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'Authorization': authHeader,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    
    console.log("Backend response status:", response.status);
    console.log("Backend response headers:", Object.fromEntries(response.headers.entries()));
    
    // Check if response is empty or not valid JSON
    const responseText = await response.text();
    console.log("Raw backend response:", responseText);
    
    // Only try to parse JSON if there's actual content
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (err) {
      console.error("Invalid JSON response:", responseText);
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      console.error("Backend returned error:", responseData);
      return NextResponse.json(
        { error: responseData.error || 'Failed to create order' },
        { status: response.status }
      );
    }
    
    console.log("Order created successfully:", responseData);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error in create-order API route:", error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 