'use client'

// copied from https://us.posthog.com/project/76603/onboarding/product_analytics?step=install

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import React, { useEffect, useId, useState } from 'react'


const useInitPosthog = () => {
    useEffect(() => {
        posthog.init('phc_yHu2u0vkNWZuviupyRWYPVUBgBP7wChD8MMch9NjXRU', {
            api_host: 'https://us.i.posthog.com',
            person_profiles: 'always', // or 'always' to create profiles for anonymous users as well
            loaded: (posthog) => {
                // posthog.debug(false)
                // this is ONLY run in development - don't run debug mode there! Their development is our production.
                // if (process.env.NODE_ENV === 'development') posthog.debug() // debug mode in development
            },
            ip: true,
            debug: undefined, // setting this to false still debugs!!!
        })
    }, [])
}


const useIdentifyPostHogUser = () => {
    const new_id = useId() // the potential new id of the user if one doesn't exist, using this instead of uuid to avoid another import
    useEffect(() => {
        const current_id = window.localStorage.getItem('glass-user-id')
        if (current_id === undefined)
            window.localStorage.setItem('glass-user-id', new_id)

        const uid = current_id ?? new_id
        posthog.identify(uid)
    }, [new_id])
}

function PHProvider_({ children }) {
    useInitPosthog()
    useIdentifyPostHogUser()
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>

}

export function PHProvider({ children, trackingDisabled }) {
    if (trackingDisabled)
        return children
    return <PHProvider_>{children}</PHProvider_>
}
