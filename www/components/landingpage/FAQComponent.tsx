import { useState } from "react";


const FAQs = [
    // {
    //     Q: `Is Glass an agent?`,
    //     A: `Not really. Glass doesn't make sweeping changes, and is made for.`,
    // },
    // {
    //     Q: `What problem does Glass solve?`,
    //     A: `We know how annoying it is to fish through source code 🎣 or endlessly edit tailwind styles 😵‍💫. We made Glass to fix that. Glass lets you edit the look and feel of your website the natural way - visually.`,
    //     // A: `We know how annoying it is to fish through source code 🎣 or endlessly edit tailwind styles 😵‍💫. We made Glass to fix that. Glass lets you escape the grunt work and focus on what matters - the look and feel of your website.`,
    // },
    {
        Q: `Should I use Glass?`,
        A: `Glass lets you write React code quickly 🚀. If that sounds like your thing, Glass is for you!`,
    },
    {
        Q: `Does Glass show up in production?`,
        A: `No. Glass only runs in development environments (when process.env.NODE_ENV === "development").`,
    },
    {
        Q: `Can Glass install packages?`,
        A: `Glass only edits files in your project, and cannot install packages.`,
    },
    {
        Q: `What does Glass edit?`,
        A: `When you click on an HTML element, Glass is allowed to edit the component it belongs to, and all of its descendant components. Glass gives you a list of all the edits it makes.`,
    },
    {
        Q: `Does Glass support app or pages router?`,
        A: `Yes - both!`,
    },
    {
        Q: `What stage are you in?`,
        A: `Glass is in open beta for startups. Our AI is still experimental, but quickly improving 💪.`,
    },
    // {
    //     Q: `Common Problems`,
    //     A: `
    //     - Remove --turbo
    //     - if a 3rd party component can't be selected, wrap it in a div
    //     `,
    // },
]


const FAQItem = ({ item }: { item: { Q: React.ReactNode, A: React.ReactNode } }) => {
    const [opened, setOpened] = useState<boolean>(false)
    const toggleCollapse = () => setOpened(!opened);



    return <div>
        <div className="cursor-pointer" onClick={() => toggleCollapse()}>

            {/* <Divider /> */}
            <div className='flex items-center justify-between gap-4'>
                <div className={` my-4 text-lg font-medium select-none duration-200 ${opened ? 'text-primary text-blue-500' : 'text-black'}`}>
                    {item.Q}
                </div>
                <svg className="flex-shrink-0 w-4 h-4 fill-black " viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <rect y="7" width="16" height="2" rx="1" className={`transform origin-center transition duration-200 ease-out rotate-90 ${opened && 'hidden'} ${opened ? 'fill-blue-500' : 'fill-black'}`}></rect>
                    <rect y="7" width="16" height="2" rx="1" className={`transform origin-center transition duration-200 ease-out ${opened ? 'rotate-180 fill-blue-500' : 'rotate-0 fill-black'}`}></rect>
                </svg>
            </div>
        </div>

        <div className={`m-0 text-base transition-all duration-500 ${opened ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            {item.A}
        </div>
        {/* <Collapse in={opened} transitionDuration={200} animateOpacity={false} transitionTimingFunction='ease-out'>
        </Collapse> */}
    </div>
}


const FAQComponent = () => {
    return <div className="flex flex-row max-lg:flex-col max-xl:px-8 px-32 py-20 gap-x-20 gap-y-20">
        <div className='basis-1/2 flex flex-col gap-y-6 pl-3'>
            <h2 className='text-3xl lg:text-4xl font-bold text-black'>
                {`Frequently Asked Questions`}
            </h2>

            {/* <span className='text-[16px] opacity-80'>
                Have another question? Contact us on{' '}
                <span className='underline text-black'>
                    Discord
                </span>
                or by{' '}
                <Link href='mailto:andrew@deriveit.org'>
                    <span className='underline text-black opacity-100'>
                        email
                    </span>
                </Link>.

            </span> */}
        </div>
        <div className="basis-1/2 flex flex-col w-full gap-4 text-black">
            {FAQs.map((item, i) => <FAQItem key={i} item={item} />)}
        </div>
    </div>
}

export default FAQComponent