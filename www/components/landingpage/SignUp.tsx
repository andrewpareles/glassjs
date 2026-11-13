import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { logUserEmail } from "./landingpage_logging";

export const SignUp = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);


    return <section className="relative pt-40 pb-80 overflow-hidden bg-white">
        <div className="mx-auto w-fit px-8 py-8 lg:px-32 text-center flex flex-col gap-4 outline outline-1 hover:outline-4 transition-all duration-800 outline-gray-300 rounded-lg">
            <h2 className="text-2xl lg:text-3xl px-4 font-bold text-gray-700">Join the waitlist</h2>
            <p className="text-sm text-gray-600 px-2 -mt-2 pb-1">{`We'll notify you when you get access.`}</p>
            <form className="flex flex-row items-center gap-2 mx-auto"
                onSubmit={async (e: React.FormEvent) => {
                    e.preventDefault();
                    try {
                        await logUserEmail(email);
                        setIsSubmitted(true);
                    } catch (error) {
                        console.error('Error submitting email:', error);
                        alert('Failed to submit email. Please try again.');
                    }
                }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="px-4 py-2 w-full max-w-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
                    disabled={isSubmitted}
                />

                <button
                    type="submit"
                    className=" flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-200"
                    disabled={isSubmitted}
                >
                    {!isSubmitted ?
                        'Submit'
                        : <>
                            <span className='bg-gradient-to-tl from-blue-500 to-cyan-500 bg-clip-text text-transparent'>Success</span>
                            <FaCheck className="text-blue-500 " />
                        </>
                    }
                </button>
            </form>
        </div>
    </section>
}
