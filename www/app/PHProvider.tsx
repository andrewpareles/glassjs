'use client'

// copied from https://us.posthog.com/project/76603/onboarding/product_analytics?step=install

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'


export function PHProvider({ children }) {
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
                person_profiles: 'always', // or 'always' to create profiles for anonymous users as well
                // loaded: (posthog) => {
                //     if (process.env.NODE_ENV === 'development') posthog.debug() // debug mode in development
                // },
                ip: true,
                session_recording: {},
                // debug: false,
            })
        }
    }, [])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
