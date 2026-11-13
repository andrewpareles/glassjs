import React, { useState } from 'react';

import Nextjs from '@/components/installation/instructions/Next.js.mdx'
import ReactNative from '@/components/installation/instructions/ReactNative.mdx'
import Rawjs from '@/components/installation/instructions/Rawjs.mdx'
import Image from 'next/image';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import InlineCode from '../landingpage/InlineCode';
import BigCode from '../landingpage/BigCode';
import { PiWarning } from 'react-icons/pi';

// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { atomOneDark, a11yDark, vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const tabNames = [
    'Next.js',
    'React App',
    // 'Raw JavaScript'
] as const;

type TabName = typeof tabNames[number]


const instructionsOfTabName: { [tabName in TabName]: React.ReactNode } = {
    'Next.js': <Nextjs />,
    'React App': <ReactNative />,
    // 'Raw JavaScript': <Rawjs />,
}

const iconOfTabName: { [tabName in TabName]: React.ReactNode } = {
    'Next.js': <Image alt='nextjs_icon' src='/nextjs.svg' fill />,
    'React App': <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348"><title>React Logo</title><circle cx="0" cy="0" r="2.05" fill="#61dafb" /><g stroke="#61dafb" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2" /><ellipse rx="11" ry="4.2" transform="rotate(60)" /><ellipse rx="11" ry="4.2" transform="rotate(120)" /></g></svg>,
    // 'Raw JavaScript': <Image alt='nextjs_icon' src='/nextjs.svg' fill />,
}



const TabLink: React.FC<{ icon, name: TabName, setCurrentTab, currentTab }> = ({ icon, name, setCurrentTab, currentTab, ...props }) => {
    return (
        <li
            className={`flex items-center space-x-1 text-sm font-bold cursor-pointer text-black p-2 rounded ${currentTab === name ? 'bg-gray-300' : 'hover:bg-gray-300'}`}
            onClick={() => setCurrentTab(name)}
            {...props}
        >
            <div className='w-4 h-4 relative mr-1'>{icon}</div>
            <span>{name}</span>
        </li>
    );
}



// const oldInstallSteps = (
//     <div className='max-w-3xl w-full mx-auto py-20 px-2'>

//         <div className='mb-6'>
//             <h2 className='font-extrabold mx-auto text-center mb-8  text-4xl tracking-tight '>
//                 Setting up Glass
//             </h2>
//             <div>
//                 {`Glass works with any VS Code and Next.js configuration. Here's how to set it up:`}
//                 <br />
//             </div>
//         </div>

//         <ol className='list-decimal'>
//             <li className='mb-4 pl-1'>
//                 Install Glass:
//                 <BigCode>{`npm install @glassjs/react @glassjs/swc`}</BigCode>
//                 {/* <InlineCode>npm install @glassjs/react @glassjs/swc</InlineCode> */}
//             </li>

//             <li className='mb-4 pl-1'>
//                 {`Add the Glass prompt bar to your project:`}
//                 <SyntaxHighlighter
//                     language="tsx"
//                     style={vscDarkPlus}
//                     className='text-[13px] rounded-lg max-w-2xl mx-auto'
//                 >
//                     {`// _app.js if pages router
// // layout.js if app router
// import GlassPromptBar from '@glassjs/react'      // <-- add this

// export default function MyApp({ children }) {
// return <>
// <GlassPromptBar />             {/* <-- and this */}
// ...
// </>
// }`}
//                 </SyntaxHighlighter>

//             </li>

//             <li className='mb-4 pl-1'>
//                 Get the Glass <a href='https://marketplace.visualstudio.com/items?itemName=glassjs.glassjs' className='underline text-blue-700'>VS Code Extension here</a>.
//             </li>

//             <li className='mb-4 pl-1'>
//                 {`Add the Glass swc plugin to `}<InlineCode>next.config.mjs</InlineCode>:
//                 <SyntaxHighlighter
//                     language="javascript"
//                     style={vscDarkPlus}
//                     className='text-[13px] rounded-lg max-w-2xl'
//                 >
//                     {`const nextConfig = {
// experimental: {
// swcPlugins: [
// // add this line:
// ...(process.env.NODE_ENV === 'development' ? [['@glassjs/swc', {}]] : []),
// ]
// }
// };
// export default nextConfig;`}
//                 </SyntaxHighlighter>
//             </li>
//         </ol>

//     </div>
// )

const InstallationSteps: React.FC<{}> = ({ }) => {

    const [currentTab, setCurrentTab] = useState<TabName>('Next.js');

    // return oldInstallSteps 

    return (
        <div className='mx-auto my-16 max-w-[300px] md:max-w-none'>

            {/* {
                typeof window !== 'undefined' ?
                    (() => { console.log('hi'); return 1 })()
                    : 1
            } */}

            <div className='mb-16'>
                <h2 className='font-extrabold mx-auto text-center mb-8 text-4xl tracking-tight text-black'>
                    Setting up Glass
                </h2>
            </div>

            <div className='flex flex-col md:flex-row gap-8'>
                <aside className='w-full md:w-[220px]'>
                    <div className='text-lg font-bold mb-4'></div>
                    <ul className='space-y-2 text-black rounded'>
                        {
                            tabNames.map(tabName => (
                                <TabLink key={tabName}
                                    name={tabName}
                                    setCurrentTab={setCurrentTab}
                                    icon={iconOfTabName[tabName]}
                                    currentTab={currentTab}
                                />
                            ))
                        }
                    </ul>
                </aside> 
                <main className='w-full md:w-[520px] -mt-6 pl-4 pr-4 text-black'>

                    <div className='flex items-center text-orange-900'><PiWarning className='mr-2' />Glass is no longer maintained. If you would like access to the source code, feel free to reach out.</div>
                    <br />

                    {instructionsOfTabName[currentTab]}

                    <div className='mt-12 text-center'>
                        🎉 Setup complete!
                    </div>

                </main>
            </div>
        </div>

    );
};

export default InstallationSteps; 