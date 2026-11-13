/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState } from 'react';

import { FaCheck, FaChevronLeft, FaChevronRight, FaGithub } from 'react-icons/fa';
import InlineCode from './InlineCode';
// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { atomOneDark, a11yDark, vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Link from 'next/link';
import InstallationSteps from '../installation/InstallationSteps';
import BigCode from './BigCode';
import { logUserEmail } from './landingpage_logging';
import FAQComponent from './FAQComponent';
import { SignUp } from './SignUp';
import { GetStartedButton } from '@/app/GetStartedButton';
import Image from 'next/image';

const DemoSection = ({ title, desc, src, children, reverse, fadeIn, className }: { children?: React.ReactNode, title: string, desc: string, src?: string, reverse?: boolean, fadeIn?: boolean, className?: string }) => {
    return (
        <section className={`relative overflow-hidden ${fadeIn ? 'shadow-inner' : ''}`}>
            <div className={`relative py-32 ${reverse ? 'bg-gray-50/50' : 'bg-gray-50/50'}`}>
                <div className={`mx-auto px-8 lg:px-12 flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} lg:gap-12 gap-6 items-start max-w-6xl`}>
                    <div className='flex-1 p-4 lg:p-6 mx-auto max-w-md'>
                        <h2 className='text-4xl font-bold text-black'>
                            {title}
                        </h2>
                        <p className='text-gray-500 mt-4'>
                            {desc}
                        </p>
                    </div>
                    <div className='flex-1 p-0 rounded-lg overflow-hidden w-full max-w-xl mx-auto'>
                        {children}

                        {src && <video width={1200} height={600} autoPlay loop muted playsInline>
                            <source src={src} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>}
                    </div>
                </div>
            </div>
        </section>
    );
};


const Q = () => {
    return <svg className="flex-shrink-0 mr-2 w-5 h-5 text-gray-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
}

const oldFAQs = <div className="flex flex-col py-8 text-left border-t border-gray-200 md:gap-16 mx-auto">



    <div className="mb-4 max-w-[550px] mx-auto w-full">
        <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
            <Q />

        </h3>
        <p className="ml-3 text-gray-500">
            Glass locates the component you clicked on in your source code. Glass is allowed to edit the component it belongs to and all of its descendants.
        </p>
    </div>

    <div className="mb-4 max-w-[550px] mx-auto w-full">
        <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
            <Q />
            Does Glass show up in production?
        </h3>
        <p className="ml-3 text-gray-500">

        </p>
    </div>

</div>








export default function Component() {


    const bottomRef = React.useRef<HTMLDivElement>(null);


    return (<>
        {/* <Diff /> */}
        {/* <X /> */}
        <div className='relative bg-gradient-to-b from-blue-50 via-white to-blue-50 '>

            <div className='bg-gradient-to-r from-blue-50 to-cyan-50 p-8 overflow-hidden shadow-sm'>
                <div className='min-h-screen flex items-center justify-center gap-12 relative '>

                    <div className='absolute top-[20%] left-[45%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-80 drop-shadow-lg pointer-events-none'></div>
                    <div className='absolute top-1/4 left-[70%] w-96 h-96 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animation-delay-2000 drop-shadow-lg pointer-events-none'></div>
                    <div className='absolute z-100 top-[70%] left-[30%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animation-delay-4000 drop-shadow-lg'></div>

                    <div className='max-w-7xl flex flex-1 flex-col items-center justify-center lg:flex-row lg:gap-16 gap-4'>
                        {/* left */}
                        <div className='flex-1 flex-grow-[.75] flex flex-col items-center justify-center text-center p-6 max-w-[500px]'>

                            {/* <Sidebar /> */}
                            <div className='max-w-[500px] text-center lg:pl-20 lg:text-left space-y-16'>
                                <h1 className='text-7xl font-extrabold tracking-tighter leading-tight hover:brightness-110 transition duration-200 cursor-default text-blue-500'>
                                    <span className='text-black'>Glass.js
                                        {/* <span className=' text-3xl tracking-tight'>.js</span> */}
                                    </span>
                                </h1>
                                <div className='max-w-[600px] min-w-[350px] max-sm:text-2xl text-3xl font-extrabold tracking-tight leading-tight text-black drop-shadow-xl'>
                                    An AI copilot for React and Next.js developers.
                                </div>
                                <div className='inline-flex flex-col gap-3'
                                // onClick={() => { console.log('scrolling'); if (bottomRef.current) { bottomRef.current.scrollIntoView({ behavior: 'smooth' }); } }}
                                >
                                    <GetStartedButton variant={0} />
                                    <a draggable={false} href='https://github.com/andrewpareles/glassjs' target='_blank' className='flex items-center justify-center gap-2 py-3 px-8 rounded-lg whitespace-nowrap bg-gray-200 text-gray-700 text-base font-medium hover:bg-gray-300 active:scale-95 duration-200'>
                                        <FaGithub className='size-[26px]' />
                                        GitHub
                                    </a>
                                </div>
                            </div>
                        </div>


                        {/* right */}
                        <div className='flex flex-grow-[10] items-center justify-center w-full'>
                            <div className='max-w-5xl w-full h-full flex items-center justify-center overflow-hidden rounded-xl shadow-lg '>

                                <div className='relative pb-[56.25%] w-full h-0'>
                                    <iframe
                                        className='absolute top-0 left-0 w-full h-full rounded-lg aspect-video shadow-lg'
                                        allow="autoplay"
                                        src="https://www.youtube.com/embed/r86aTdEQZAo?autoplay=1&rel=0&loop=1&mute=1&showinfo=0&disablekb=1&color=white&playsinline=true&iv_load_policy=3&playlist=r86aTdEQZAo&hq=1&vq=hd1080&start=32"
                                    />
                                </div>

                            </div>

                        </div>
                    </div>

                </div>

                {/* Backed by YC */}
                <div className=' flex flex-col items-center w-full mb-14'>
                    <div className='inline-flex items-center relative px-5 rounded-full '>
                        <span className="relative inline-flex items-center text-black font-semibold">
                            Backed by
                            <img src="/yc.svg" className="h-5 w-auto ml-2" alt="Y Combinator Logo" />
                        </span>
                    </div>
                </div>



            </div>

            {/* <SignUp /> */}


            {/* TODO!!! write more of a story with copy below
                No more fishing through source code.

                No more digging through endless tailwind styles.

                All you have to do is click on what you want to edit, and say what it should look like.


                Shadcn? We've got you covered
                */}

            {/* Users spend 100% of their time on your website, well, looking at it. So why do you spend almost none? */}
            {/* You're building out your website. Why do you only spend 20% of your time looking at it? */}
            {/* Glass lets you spend more time in your browser, and less time looking at code. */}



            {/* Write your React code, without looking at it. */}
            {/* Build your React website, visually. */}
            {/* A visual editor for React websites. */}


            {/* Build your React website, visually. */}
            {/* Build your React website, visually. */}

            {/* Build your React site, visually. */}

            {/* Build your React website, without the code. */}

            {/* Build your React website, without the code. */}

            {/* AI Copilot your React development. */}

            {/* A no-code way to build React websites. */}
            {/* Write React code, without looking at it. */}
            {/* Write React, without code. */}
            {/* Build your React website, without the code. */}
            {/* Build your React website, without the code. */}
            {/* Build in React, without the code. */}
            {/* Build your React project, without the code. */}
            {/* React and Next.js, but without the code. */}
            {/* Build your React project like it's no-code. */}


            {/* A Next.js tool that edits your source code for you.  */}

            {/* <br/>
                    Done. */}





            {/* Glass lets you edit your React source code from the browser */}

            {/* Glass edits your React source code based on your instructions, so you never have to leave the browser. */}


            {/* Tell an AI how you want your website to look, without you ever leaving the browser. */}


            {/* [mention that its iterative changes so its not just shit] */}


            {/* <span className='my-5 block text-center mx-auto max-sm:text-4xl text-6xl font-bold tracking-tight leading-tight'>
                    Edit your source code straight from the browser.
                </span> */}

            {/* Plaintext sucks: it makes no sense to edit the appearance of your website using characters like {`<>`}. */}
            {/* <br /> */}









            {/* // In future, 1. npm i @glassjs/react @glassjs/swc 2. get VS Code Extension which auto-imports react and adds @glassjs/swc to extensions list */}

            {/* TODO make this --save-dev once we make @glassjs/swc auto-import @glassjs/react */}
            <div className='relative overflow-hidden'>
                <div className="absolute top-[20%] left-[45%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-80 drop-shadow-lg pointer-events-none"></div>
                <div className="absolute top-1/4 left-[70%] w-96 h-96 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animation-delay-2000 drop-shadow-lg pointer-events-none"></div>
                <div className="absolute z-100 top-[70%] left-[30%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animation-delay-4000 drop-shadow-lg"></div>

                {/* <DemoSection
                    title="Edit straight from the browser."
                    desc="Edit your codebase straight from the browser using AI (experimental). Glass's AI can create components, work with state, modify props, and write tailwind for you."
                    src="/path/to/another/image.jpg"
                /> */}
                <DemoSection
                    title="Edit straight from the browser using AI."
                    desc="Glass's AI can create components, modify props, and write tailwind for you. Stop scavenging your codebase and writing tailwind by hand."
                    className='pt-64 pb-64'
                >
                    <div className='relative pb-[56.25%] w-full h-0'>
                        <iframe
                            className='absolute top-0 left-0 w-full h-full rounded-lg aspect-video shadow-lg'
                            allow="autoplay"
                            src="https://www.youtube.com/embed/bbUAlh_IxDY?autoplay=1&rel=0&loop=1&mute=1&controls=0&showinfo=0&disablekb=1&color=white&playsinline=true&iv_load_policy=3&playlist=bbUAlh_IxDY"
                        />

                    </div>
                </DemoSection>
                <DemoSection
                    title="Visualize your component structure."
                    desc="Hover to see the component that each element is from."
                    src="/video/demo1.mp4"
                    className='pt-64'
                    reverse
                />
                <DemoSection
                    title="Jump to the code."
                    desc="Instantly jump to the sourcecode of the element you clicked on. Glass is more precise than other click-to-code tools."
                    src="/video/demo2.mp4"
                />

            </div>


            <section className="relative pt-20 pb-40  bg-white overflow-hidden shadow-inner">

                <div className="mx-auto max-w-7xl px-8 lg:px-12">
                    <FAQComponent />
                    <div className='w-fit mx-auto mt-12 flex flex-col items-center'>
                        <div
                        //  onClick={() => { console.log('scrolling'); if (bottomRef.current) { bottomRef.current.scrollIntoView({ behavior: 'smooth' }); } }}
                        >
                            <GetStartedButton variant={1} />
                        </div>
                        {/* <span className='mt-1 text-xs text-gray-500'>(No signup required)</span> */}
                    </div>
                </div>
            </section>

            <div ref={bottomRef}>
                <section className="relative pt-40 pb-80 overflow-hidden bg-white">

                    <a href='https://voideditor.com' className=" group mx-auto w-fit px-8 py-8 lg:px-32 text-center flex flex-col gap-4 outline outline-1 transition-all duration-800 outline-gray-300 rounded-lg">
                        <h2 className="text-2xl lg:text-3xl px-4 font-bold text-gray-700">Glass is now Void.</h2>
                        <p className="text-sm text-gray-600 px-2 -mt-2 pb-1 max-w-80 mx-auto">{`
                        Glass is now part of our code editor, Void.
                        We hope to see you over in the Void community! 
                        `}</p>
                        <Image height={120} width={120} className='mx-auto group-hover:brightness-150  transition-all' src='/slice_of_void.png' alt='Void Logo' />
                    </a>
                </section>
                {/* <SignUp /> */}
            </div>


            {/* <section className=" py-20 min-h-screen"> */}

            {/* <MyForm /> */}
            {/* </section> */}
        </div >


    </>)
}

