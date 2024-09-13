'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const UiGenerator = dynamic(() => import('./ui-generator'), { 
  ssr: false,
  loading: () => <p>Loading...</p>
})

const UiGeneratorWrapper: React.FC = () => {
  return <UiGenerator />
}

export default UiGeneratorWrapper