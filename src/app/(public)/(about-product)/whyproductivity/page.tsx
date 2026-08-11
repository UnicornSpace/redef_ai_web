import type { Metadata } from 'next'
import React from 'react'
import { NOINDEX_METADATA } from '@/lib/seo'

export const metadata: Metadata = NOINDEX_METADATA;

const page = () => {
  return (
    <div>page</div>
  )
}

export default page