import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function toResponsePortfolio(p: any) {
  const expiresAt = p.expires_at ? new Date(p.expires_at) : null
  const now = new Date()
  const remainingDays = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

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
}

// GET /api/portfolios?phone=XXX — fetch portfolios (with photos/videos) by phone
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const all = searchParams.get('all') === 'true'

  if (all) {
    const { data: portfolios, error: portError } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false })

    if (portError) {
      console.error('Error fetching all portfolios:', portError)
      return NextResponse.json({ error: 'Failed to fetch portfolios' }, { status: 500 })
    }

    if (!portfolios || portfolios.length === 0) {
      return NextResponse.json({ portfolios: [], photos: {}, videos: {} })
    }

    const portfolioIds = portfolios.map(p => p.id)

    const [{ data: photos }, { data: videos }] = await Promise.all([
      supabase
        .from('portfolio_photos')
        .select('*')
        .in('portfolio_id', portfolioIds)
        .order('sort_order', { ascending: true }),
      supabase
        .from('portfolio_videos')
        .select('*')
        .in('portfolio_id', portfolioIds),
    ])

    const photosMap: Record<string, string[]> = {}
    for (const photo of (photos || [])) {
      if (!photosMap[photo.portfolio_id]) photosMap[photo.portfolio_id] = []
      photosMap[photo.portfolio_id].push(photo.url)
    }

    const videosMap: Record<string, string> = {}
    for (const video of (videos || [])) {
      videosMap[video.portfolio_id] = video.url
    }

    return NextResponse.json({
      portfolios: portfolios.map(toResponsePortfolio),
      photos: photosMap,
      videos: videosMap,
    })
  }

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
    portfolios: portfolios.map(toResponsePortfolio),
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

// PATCH /api/portfolios?id=UUID
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
    }

    const body = await request.json()
    const action = body?.action as string | undefined

    if (action === 'set_status') {
      const status = body?.status
      if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

      const { error } = await supabase
        .from('portfolios')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error updating portfolio status:', error)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    if (action === 'add_photos') {
      const photosUrls = Array.isArray(body?.photosUrls) ? body.photosUrls : []
      if (photosUrls.length === 0) return NextResponse.json({ ok: true })

      const { data: existing } = await supabase
        .from('portfolio_photos')
        .select('id')
        .eq('portfolio_id', id)

      const start = existing?.length || 0
      const rows = photosUrls.map((url: string, i: number) => ({
        portfolio_id: id,
        url,
        sort_order: start + i,
      }))

      const { error } = await supabase.from('portfolio_photos').insert(rows)
      if (error) {
        console.error('Error adding photos:', error)
        return NextResponse.json({ error: 'Failed to add photos' }, { status: 500 })
      }

      if (start === 0 && photosUrls[0]) {
        await supabase.from('portfolios').update({ image: photosUrls[0] }).eq('id', id)
      }

      return NextResponse.json({ ok: true })
    }

    if (action === 'replace_photos') {
      const photosUrls = Array.isArray(body?.photosUrls) ? body.photosUrls : []

      const { error: delError } = await supabase
        .from('portfolio_photos')
        .delete()
        .eq('portfolio_id', id)

      if (delError) {
        console.error('Error deleting photos:', delError)
        return NextResponse.json({ error: 'Failed to replace photos' }, { status: 500 })
      }

      if (photosUrls.length > 0) {
        const rows = photosUrls.map((url: string, i: number) => ({
          portfolio_id: id,
          url,
          sort_order: i,
        }))
        const { error: insError } = await supabase.from('portfolio_photos').insert(rows)
        if (insError) {
          console.error('Error inserting photos:', insError)
          return NextResponse.json({ error: 'Failed to replace photos' }, { status: 500 })
        }
      }

      await supabase.from('portfolios').update({ image: photosUrls[0] || null }).eq('id', id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'set_video') {
      const videoUrl = body?.videoUrl as string | undefined
      if (!videoUrl) return NextResponse.json({ error: 'videoUrl required' }, { status: 400 })

      await supabase.from('portfolio_videos').delete().eq('portfolio_id', id)
      const { error } = await supabase.from('portfolio_videos').insert({ portfolio_id: id, url: videoUrl })
      if (error) {
        console.error('Error setting video:', error)
        return NextResponse.json({ error: 'Failed to set video' }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === 'remove_video') {
      const { error } = await supabase.from('portfolio_videos').delete().eq('portfolio_id', id)
      if (error) {
        console.error('Error removing video:', error)
        return NextResponse.json({ error: 'Failed to remove video' }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    const updates: Record<string, any> = {}
    if (typeof body?.clientName === 'string') updates.client_name = body.clientName
    if (typeof body?.phone === 'string') updates.phone = body.phone.replace(/\D/g, '')
    if (typeof body?.status === 'string') updates.status = body.status
    updates.updated_at = new Date().toISOString()

    const { error } = await supabase.from('portfolios').update(updates).eq('id', id)
    if (error) {
      console.error('Error updating portfolio:', error)
      return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error in PATCH /api/portfolios:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/portfolios?id=UUID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
    }

    const { error } = await supabase.from('portfolios').delete().eq('id', id)
    if (error) {
      console.error('Error deleting portfolio:', error)
      return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error in DELETE /api/portfolios:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
