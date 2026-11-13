import InstallationSteps from "@/components/installation/InstallationSteps"
import Link from "next/link"
import { useState } from "react"
import { GetStartedButton } from "../GetStartedButton"
import { SignUp } from "@/components/landingpage/SignUp"

const calendly = 'https://cal.com/andrew-pareles/meet'








export default function GetStarted() {
    return <div className='min-h-screen bg-blue-50'>
        <div className="w-full flex flex-col justify-center text-sm px-4 py-20">

            <InstallationSteps />

        </div>


        {/* <div className='space-y-1 pb-20'>
            <div className='text-center text-sm text-gray-700 '>
                {`Or, feel free to `}
            </div>
            <div className='flex'>
                <a draggable={false} href={calendly} target='_blank' className="bg-gray-200 text-gray-700 w-fit px-4 py-2 rounded-full shadow-md font-bold hover:bg-gray-300 transition-all duration-200 transform hover:scale-105 active:scale-95 mx-auto block text-center">
                    Book a Demo
                </a>

            </div>
        </div> */}



    </div>
}