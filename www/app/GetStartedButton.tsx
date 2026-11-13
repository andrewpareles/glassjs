import Link from "next/link"
import { FiChevronsRight } from 'react-icons/fi'

export const GetStartedButton = ({ variant }) => {
    // <div className="shadow hover:shadow-lg bg-white w-20 h-20 duration-[.5s] ease-out active:scale-90"></div>
    // return <div draggable={false} className='inline-block'>
    //     <button type='button' className="group flex gap-2 p-2 py-3 rounded-lg btn px-8 opacity-90 whitespace-nowrap border-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-700 active:scale-95 duration-200 border-none outline-none">
    //         {variant === 0 && <img width={26} height={26} alt='Join the waitlist' src='/glass-white.svg' className='group-active:scale-95 group-hover:scale-105 brightness-[110%] duration-200 pointer-events-none rounded-sm ' />}
    //         <span className='text-white text-base font-medium' >Join the waitlist</span>
    //         {/* <span className='text-white text-base font-medium' >Join the waitlist {variant === 0 ? `Free` : ''}</span> */}
    //         {variant === 1 && <FiChevronsRight className='stroke-white size-6' />}
    //     </button>
    // </div>

    return <Link draggable={false} href={'/get-started'} className='inline-block'>
        <button type='button' className="group flex gap-2 p-2 py-3 rounded-lg btn px-8 opacity-90 whitespace-nowrap border-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-700 active:scale-95 duration-200 border-none outline-none">
            {variant === 0 && <img width={26} height={26} alt='Join the waitlist' src='/glass-white.svg' className='group-active:scale-95 group-hover:scale-105 brightness-[110%] duration-200 pointer-events-none rounded-sm ' />}
            <span className='text-white text-base font-medium' >Get started</span>
            {/* <span className='text-white text-base font-medium' >Join the waitlist {variant === 0 ? `Free` : ''}</span> */}
            {variant === 1 && <FiChevronsRight className='stroke-white size-6' />}
        </button>
    </Link>

}
