import { NextResponse } from 'next/server'

// Stubbed for demo - 0G Compute Network initialization available
export async function POST(): Promise<Response> {
  return NextResponse.json({ 
    success: true, 
    message: '0G Compute demo - full integration requires @0glabs/0g-serving-broker',
    providerAddress: '0x0',
    deposit0g: '0',
    transfer0g: '0',
  })
}
