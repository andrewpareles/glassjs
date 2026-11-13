import Link from "next/link";

export default function NotFound() {
  return (
    <section className='min-h-screen flex flex-col justify-center items-center'>
      <img src='/glass.svg' className='size-10 grayscale' />
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter ">
        404 - Page Not Found
      </h1>
      <p className="mb-4">
        {`Apologies - we couldn't find that page. `}
        Try our{' '}<Link href='/' className='underline'>
          homepage
        </Link> or get in touch!
      </p>
    </section>
  )
}