'use client'

import React, { useState } from 'react';
import { Folder, File, ChevronRight } from 'lucide-react';

type item = { name: string, children?: item[], };


const initialFileSystem: item[] = [
    {
        name: 'Documents',
        children: [
            { name: 'report.docx' },
            { name: 'budget.xlsx' },
            {
                name: 'Projects',
                children: [
                    {
                        name: 'Project A',
                        children: [
                            { name: 'proposal.pdf' },
                            { name: 'timeline.xlsx' },
                        ],
                    },
                    {
                        name: 'Project B',
                        children: [
                            { name: 'design.psd' },
                            { name: 'mockup.jpg' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        name: 'Pictures',
        children: [
            { name: 'vacation.jpg' },
            { name: 'family.png' },
            {
                name: 'Events',
                children: [
                    {
                        name: 'Wedding',
                        children: [
                            { name: 'ceremony.jpg' },
                            { name: 'reception.jpg' },
                        ],
                    },
                ],
            },
        ],
    },
    { name: 'todo.txt' },
];

const FileExplorer = () => {
    return (
        <>
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">File Explorer</h2>
                <Items items={initialFileSystem} level={0} />
            </div>
            <div className="p-4 mt-4 rounded-lg bg-gray-800 text-white">
                <h2 className="text-2xl font-bold mb-4">Additional Section</h2>
                <p className='text-xl text-white'>Sale</p>
            </div>
        </>
    );
};

const Items = ({ items, level }) => {
    return (
        <ul className="list-none">
            {items.map((item, index) => (
                <li key={index} className="my-1">
                    {item.children ? (
                        <FolderItem item={item} level={level} />
                    ) : (
                        <FileItem item={item} level={level} />
                    )}
                </li>
            ))}
        </ul>
    );
};

const FolderItem = ({ item, level }) => {
    const [isOpen, setIsOpen] = useState(level <= 1);

    const toggleOpen = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="select-none">
            <div
                className="flex items-center hover:bg-gray-100 relative"
                style={{ paddingLeft: `${level * 20 + 20}px` }}
            >
                <span
                    className={`absolute left-0 ${isOpen ? 'rotate-90' : ''}`}
                    style={{ marginLeft: `${level * 20}px` }}
                    onClick={toggleOpen}
                >
                    <ChevronRight size={12} className="cursor-pointer text-gray-400 hover:text-gray-800" />
                </span>
                <Folder size={16} className="mr-2" />
                <span>{item.name}</span>
            </div>
            {isOpen && item.children && (
                <Items items={item.children} level={level + 1} />
            )}
        </div>
    );
};

const FileItem = ({ item, level }) => {
    return (
        <div
            className="flex items-center hover:bg-gray-100 select-none"
            style={{ paddingLeft: `${level * 20 + 20}px` }}
        >
            <File size={16} className="mr-2" />
            <span>{item.name}</span>
        </div>
    );
};

export default FileExplorer;