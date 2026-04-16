import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/portfolios?phone=XXX — fetch portfolios (with photos/videos) by phone
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: 'phone parameter required' }, { status: 400 })
  }

  // Normalize phone: strip non-digits
  const normalizedPhone = phone.replace(/\D/g, '')

  // Fetch portfolios matching this phone (exclude expired)
  const { data: portfolios, error: portError } = await supabase
    .from('portfolios')
    .select('*')
    .or(`phone.eq.${normalizedPhone},phone.eq.${phone}`)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (portError) {
    console.error('Error fetching portfolios:', portError)
    return NextResponse.json({ error: 'Failed to fetch portfolios' }, { status: 500 })
  }

  if (!portfolios || portfolios.length === 0) {
    return NextResponse.json({ portfolios: [], photos: {}, videos: {} })
  }

  const portfolioIds = portfolios.map(p => p.id)

  // Fetch photos for all portfolios
  const { data: photos, error: photosError } = await supabase
    .from('portfolio_photos')
    .select('*')
    .in('portfolio_id', portfolioIds)
    .order('sort_order', { ascending: true })

  if (photosError) {
    console.error('Error fetching photos:', photosError)
  }

  // Fetch videos for all portfolios
  const { data: videos, error: videosError } = await supabase
    .from('portfolio_videos')
    .select('*')
    .in('portfolio_id', portfolioIds)

  if (videosError) {
    console.error('Error fetching videos:', videosError)
  }

  // Group photos by portfolio_id
  const photosMap: Record<string, string[]> = {}
  for (const photo of (photos || [])) {
    if (!photosMap[photo.portfolio_id]) photosMap[photo.portfolio_id] = []
    photosMap[photo.portfolio_id].push(photo.url)
  }

  // Group videos by portfolio_id (one per portfolio)
  const videosMap: Record<string, string> = {}
  for (const video of (videos || [])) {
    videosMap[video.portfolio_id] = video.url
  }

  return NextResponse.json({
    portfolios: portfolios.map(p => {
      const expiresAt = new Date(p.expires_at)
      const now = new Date()
      const remainingDays = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      return {
        id: p.id,
        image: p.image,
        clientName: p.client_name,
        phone: p.phone,
        status: p.status,
        commission: Number(p.commission),
        date: p.date,
        invoiceCode: p.invoice_code,
        source: p.source,
        turno: p.turno,
        photographerName: p.photographer_name,
        createdAt: new Date(p.created_at).getTime(),
        remainingDays,
      }
    }),
    photos: photosMap,
    videos: videosMap,
  })
}

// POST /api/portfolios — create a new portfolio with photos and optional video
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientName, phone, invoiceCode, source, turno, photographerName, photos, video } = body

    if (!clientName || !phone) {
      return NextResponse.json({ error: 'clientName and phone are required' }, { status: 400 })
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, '')

    const date = new Date().toLocaleDateString('es-DO', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })

    // Calculate expiration (15 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 15)

    // Insert portfolio
    const { data: portfolio, error: portError } = await supabase
      .from('portfolios')
      .insert({
        client_name: clientName,
        phone: normalizedPhone,
        status: 'Pendiente',
        commission: 0,
        date,
        invoice_code: invoiceCode || null,
        source: source || 'photographer',
        turno: turno || null,
        photographer_name: photographerName || null,
        image: photos?.[0] || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (portError) {
      console.error('Error inserting portfolio:', portError)
      return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 })
    }

    // Insert photos
    if (photos && photos.length > 0) {
      const photoRows = photos.map((url: string, i: number) => ({
        portfolio_id: portfolio.id,
        url,
        sort_order: i,
      }))

      const { error: photosError } = await supabase
        .from('portfolio_photos')
        .insert(photoRows)

      if (photosError) {
        console.error('Error inserting photos:', photosError)
      }
    }

    // Insert video
    if (video) {
      const { error: videoError } = await supabase
        .from('portfolio_videos')
        .insert({
          portfolio_id: portfolio.id,
          url: video,
        })

      if (videoError) {
        console.error('Error inserting video:', videoError)
      }
    }

    return NextResponse.json({
      id: portfolio.id,
      clientName: portfolio.client_name,
      phone: portfolio.phone,
      status: portfolio.status,
      createdAt: new Date(portfolio.created_at).getTime(),
    })
  } catch (err) {
    console.error('Error in POST /api/portfolios:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
