'use client'

import React, { useState, useEffect } from "react"

interface Tweet {
    avatar: string;
    text: string;
    username: string;
    date: string;
}

const Tweet = ({ avatar, text, username, date }: { avatar: string, text: string, username: string, date: string }) => {
    return (
        <div className='p-4 border border-gray-400 rounded-lg'>
            <div className='flex items-center space-x-4'>
                <div className='w-10 h-10 rounded-full flex items-center justify-center text-center bg-gray-200 text-2xl'>{avatar}</div>
                <div>
                    <span className='font-bold'>{username}</span> <span className='text-gray-500'>@{username} · {date}</span>
                </div>
            </div>
            <p className='mt-2'>{text}</p>
        </div>
    )
}

const Setting = ({ name, emoji }: { name: string, emoji: string }) => <li>{emoji} {name}</li>;

export default function Demo() {

    const [tweets, setTweets] = useState<Tweet[]>([
        { avatar: '😀', text: 'This is a sample tweet.', username: 'User1', date: '2h' },
        { avatar: '😁', text: 'Another tweet goes here.', username: 'User2', date: '3h' },
        { avatar: '😎', text: 'Yet another tweet in the feed.', username: 'User3', date: '5h' }
    ]);
    const [newTweet, setNewTweet] = useState<string>('');
    const handleTweetChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewTweet(e.target.value);
    const addTweet = () => {
        if (newTweet.trim()) {
            setTweets([{ avatar: '🪟', text: newTweet, username: 'NewUser', date: '1h' }, ...tweets]);
            setNewTweet('');
        }
    };

    return <div className='flex py-4 max-w-full bg-black text-white'>
        <div className='w-1/4 p-4'>
            <h2 className='font-bold mb-4'>Settings</h2>
            <ul className='space-y-2'>
                <Setting name='Profile' emoji='📄' />
                <Setting name='Privacy' emoji='🔒' />
                <Setting name='Notifications' emoji='🔔' />
                <Setting name='Appearance' emoji='🎨' />
            </ul>
        </div>
        <div className='w-3/4 p-4'>
            <h2 className='font-bold text-4xl mb-4'>Feed</h2>
            <div className='flex items-center space-x-4 mb-4'>
                <input type='text' value={newTweet} onChange={handleTweetChange} placeholder="What's happening?!" className='flex-1 p-3 border rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-gray-200 placeholder-gray-500' />
                <button onClick={addTweet} className='p-2 bg-blue-500 text-white rounded-full'>Tweet</button>
            </div>

            <div className='space-y-4'>
                {tweets.map((tweet, i) => (
                    <Tweet key={i} avatar={tweet.avatar} text={tweet.text} username={tweet.username} date={tweet.date} />
                ))}
            </div>
        </div>
    </div>
}