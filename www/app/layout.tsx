import type { Metadata } from "next";

// import GlassProvider from "glass-js";
// import GlassPromptBar from "glass-js-test";
import GlassProvider from "../_src/GlassProvider";
// import GlassPromptBar from "@/_src";

// import { Inter } from "next/font/google";

import "./globals.css";
import { PHProvider } from "./PHProvider";
import Link from "next/link";
import { FaDiscord } from "react-icons/fa";
import Image from "next/image";

// const inter = Inter({ subsets: ["latin"] });

// I guess this is the default if a page doesn't specify metadata?
export const metadata: Metadata = {
  title: "Glass",
  description: "Glass is an AI copilot for React and Next.js developers that makes frontend development fast. Stop wasting time switching between the browser and your code, and make visual changes from the browser in realtime.  ",
  // icons: [{ url: process.env.BASE_URL + '/glass.svg' }], // no idea what this is for, icon.svg just existing should be fine 
};



const Header = () => {

  return <>
    {/* header */}
    <h2 className='h-12 py-2 px-4 sticky top-0 flex items-center justify-between bg-white shadow-sm overflow-hidden z-10'>

      {/* logo */}
      <Link draggable={false} href='/'>
        <div className='flex items-center justify-center hover:cursor-pointer hover:brightness-110 duration-200 gap-1'>
          {/* <Image src='/void-sm.svg' alt="Void" /> */}
          <img draggable={false} src='/glass-sm.svg' alt='Glass Logo' className='inline-block size-8' />
          <span className='hover:brightness-110 duration-200 font-extrabold bg-clip-text text-transparent bg-gradient-to-tl from-blue-500 to-cyan-500 text-[20px] whitespace-nowrap'>
            Glass
          </span>
        </div>
      </Link>

      {/*  rightmost button */}
      <div className='flex items-center gap-4'>
        {/* <a className="ml-6 text-blue-500 hover:underline">Get in Touch</a> */}
        {/* <Link href={calendly} draggable={false} className='outline-none'>
          <button type='button' className='ml-4 px-4 py-1 outline-none bg-gray-400 text-white tracking-tight font-medium rounded-3xl hover:brightness-105 duration-200 hover:scale-105 active:scale-95'>
            Book Demo
          </button>
        </Link> */}
      </div>
    </h2>
  </>
}


const Footer = () => {

  const support_email = 'support@useglass.ai'
  return (<footer className='relative bg-gray-50 text-gray-800 py-6 px-6 border-t'>
    <div className='flex flex-col lg:flex-row justify-center lg:justify-between items-center gap-2 '>

      <div className="text-sm">
        <p className='text-sm text-center lg:text-left'>Copyright &copy; 2024 Glass Devtools, Inc. All rights reserved.</p>
      </div>

      {/* Built with Glass.js when large */}
      {/* <div className=' max-lg:hidden justify-center items-center flex absolute right-0 left-0 gap-2 pointer-events-none'>
        <img src='/glass.svg' alt='Glass Logo' className='h-4 w-4' />
        <span className='text-xs text-gray-600'>Built with Glass.js</span>
      </div> */}

      <div className="text-center lg:text-right flex items-center justify-center lg:justify-end gap-2 mt-4 lg:mt-0">
        <p className='text-sm flex  items-center gap-4 '>
          {/* <a href={'https://discord.gg/rNbU5Byw'} className='group'>
            <FaDiscord className='mt-1 size-5 group-hover:fill-blue-500 fill-blue-700' />
          </a> */}
          {/* <a href='email' className='text-blue-500 hover:underline'>Get updates</a> */}
          <a href={`mailto:${support_email}`} className="text-black hover:underline">{support_email}</a>
        </p>
      </div>
    </div>



  </footer>
  )
}

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (<>

    <html lang="en">

      <head>
        {/*  trying to replace this with metadata */}
        {/* <link rel="shortcut icon" href="/glass.svg" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/glass.svg" /> */}
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>

      <PHProvider>
        {/*  in dark mode, text-black is not the default */}
        <body className='text-black'>
          <GlassProvider>
            <Header />
            {children}
            <Footer />
          </GlassProvider>
        </body>
      </PHProvider>
    </html>
  </>
  );
}
