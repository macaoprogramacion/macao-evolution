import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Connect to PostgreSQL when DB credentials are configured
  // For now, return a placeholder response
  try {
    return NextResponse.json({
      status: 'OK',
      database: 'Not configured',
      message: 'Configure DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD environment variables',
      serverTime: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { status: 'ERROR', message: error.message },
      { status: 500 }
    )
  }
}
