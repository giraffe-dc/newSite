import React from 'react'
import HomePageClient from '@/components/HomePageClient'
import { headers } from 'next/headers'

async function getHomeData() {
    const heads = headers()
    const host = (await heads).get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const res = await fetch(`${protocol}://${host}/api/data/home`, {
        cache: 'no-store',
    })
    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
    }

    return res.json()
}

const Home = async () => {
    const homeData = await getHomeData()

    return <HomePageClient homeData={homeData} />
}

export default Home
