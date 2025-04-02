import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faPause } from '@fortawesome/free-solid-svg-icons'
import { useDispatch, useSelector } from 'react-redux';

import { toggleVisibility, sideBarVisSelector } from '../store/sideBarSlice'
const SideBar = () => {
    const { visible } = useSelector(sideBarVisSelector);
    const dispatch = useDispatch();
    return (
        <aside
            className="duration-500 transition-all fixed inset-x-0 bottom-0 z-40 w-[30vw] h-full shrink-0 border-t border-white bg-[#121212] px-2 py-2 "
            style={{ translate: visible ? "0%" : '-100%' }}
        >
            <div className="m-4 w-12 flex shrink-0 ">
                <button className="group w-6 peer flex shrink-0 flex-wrap gap-y-1 py-2 mr-1.5">
                    <FontAwesomeIcon icon={faBars} size='lg' style={{ color: "#f7f7f7", cursor: 'pointer ' }} onClick={() => dispatch(toggleVisibility())} />
                </button>
                <div className='flex  p-1.5 justify-center items-center h-[90%] bg-red-600 box-content rounded-lg font-[900]'>
                    <div className='flex justify-center items-center mr-1.5'>meTube </div> <FontAwesomeIcon icon={faPause} style={{ color: "#f0f2f4", }} />
                </div>
            </div>
            <ul className="flex flex-col justify-start gap-y-2 ">
                {/* Home Button */}
                <li className="w-full" key="home">
                    <button className="flex w-full items-center justify-start gap-x-4 border border-white px-4 py-1.5 text-left hover:bg-[#ae7aff]
                     hover:text-black focus:border-[#ae7aff] focus:bg-[#ae7aff] focus:text-black">
                        <span className="inline-block w-5 shrink-0 ">
                            <svg
                                style={{ width: "100%" }}
                                viewBox="0 0 20 21"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6 15.9997H14M9.0177 1.76375L2.23539 7.03888C1.78202 7.3915 1.55534 7.56781 1.39203 7.78861C1.24737 7.9842 1.1396 8.20454 1.07403 8.43881C1 8.70327 1 8.99045 1 9.56481V16.7997C1 17.9198 1 18.4799 1.21799 18.9077C1.40973 19.284 1.71569 19.59 2.09202 19.7818C2.51984 19.9997 3.07989 19.9997 4.2 19.9997H15.8C16.9201 19.9997 17.4802 19.9997 17.908 19.7818C18.2843 19.59 18.5903 19.284 18.782 18.9077C19 18.4799 19 17.9198 19 16.7997V9.56481C19 8.99045 19 8.70327 18.926 8.43881C18.8604 8.20454 18.7526 7.9842 18.608 7.78861C18.4447 7.56781 18.218 7.3915 17.7646 7.03888L10.9823 1.76376C10.631 1.4905 10.4553 1.35388 10.2613 1.30136C10.0902 1.25502 9.9098 1.25502 9.73865 1.30136C9.54468 1.35388 9.36902 1.4905 9.0177 1.76375Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        <span className="block ">
                            Home
                        </span>
                    </button>
                </li>

                {/* Liked Videos Button */}
                <li className="w-full" key="liked-videos">
                    <button className="flex w-full items-center justify-start gap-x-4 border border-white px-4 py-1.5 text-left hover:bg-[#ae7aff]
                     hover:text-black focus:border-[#ae7aff] focus:bg-[#ae7aff] focus:text-black">
                        <span className="inline-block w-5 shrink-0 sm:group-hover:mr-4 lg:mr-4">
                            <svg
                                style={{ width: "100%" }}
                                viewBox="0 0 22 22"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6 21V10M1 12V19C1 20.1046 1.89543 21 3 21H16.4262C17.907 21 19.1662 19.9197 19.3914 18.4562L20.4683 11.4562C20.7479 9.6389 19.3418 8 17.5032 8H14C13.4477 8 13 7.55228 13 7V3.46584C13 2.10399 11.896 1 10.5342 1C10.2093 1 9.91498 1.1913 9.78306 1.48812L6.26394 9.40614C6.10344 9.76727 5.74532 10 5.35013 10H3C1.89543 10 1 10.8954 1 12Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        <span className="block sm:hidden sm:group-hover:inline lg:inline">
                            Liked Videos
                        </span>
                    </button>
                </li>

                {/* Additional Buttons (Repeat for other menu items) */}
                {/* Example: History, My Content, Collections, Subscribers, Support, etc. */}

                <li className="w-full" key="my-content">
                    <button className="flex w-full items-center justify-start gap-x-4 border border-white px-4 py-1.5 text-left hover:bg-[#ae7aff]
                     hover:text-black focus:border-[#ae7aff] focus:bg-[#ae7aff] focus:text-black">
                        <span className="inline-block w-full max-w-[20px] group-hover:mr-4 lg:mr-4">
                            <svg
                                style={{ width: "100%" }}
                                viewBox="0 0 22 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M21 4.93137C21 4.32555 21 4.02265 20.8802 3.88238C20.7763 3.76068 20.6203 3.69609 20.4608 3.70865C20.2769 3.72312 20.0627 3.93731 19.6343 4.36569L16 8L19.6343 11.6343C20.0627 12.0627 20.2769 12.2769 20.4608 12.2914C20.6203 12.3039 20.7763 12.2393 20.8802 12.1176C21 11.9774 21 11.6744 21 11.0686V4.93137Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M1 5.8C1 4.11984 1 3.27976 1.32698 2.63803C1.6146 2.07354 2.07354 1.6146 2.63803 1.32698C3.27976 1 4.11984 1 5.8 1H11.2C12.8802 1 13.7202 1 14.362 1.32698C14.9265 1.6146 15.3854 2.07354 15.673 2.63803C16 3.27976 16 4.11984 16 5.8V10.2C16 11.8802 16 12.7202 15.673 13.362C15.3854 13.9265 14.9265 14.3854 14.362 14.673C13.7202 15 12.8802 15 11.2 15H5.8C4.11984 15 3.27976 15 2.63803 14.673C2.07354 14.3854 1.6146 13.9265 1.32698 13.362C1 12.7202 1 11.8802 1 10.2V5.8Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        <span>My Content</span>
                    </button>
                </li>

                <li className="w-full" key="support">
                    <button className="flex w-full items-center justify-start gap-x-4 border border-white px-4 py-1.5 text-left
                     hover:bg-[#ae7aff] hover:text-black focus:border-[#ae7aff] focus:bg-[#ae7aff] focus:text-black">
                        <span className="inline-block w-full max-w-[20px] group-hover:mr-4 ">
                            <svg
                                style={{ width: "100%" }}
                                viewBox="0 0 22 22"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M8.09 8C8.3251 7.33167 8.78915 6.76811 9.39995 6.40913C10.0108 6.05016 10.7289 5.91894 11.4272 6.03871C12.1255 6.15849 12.7588 6.52152 13.2151 7.06353C13.6713 7.60553 13.9211 8.29152 13.92 9C13.92 11 10.92 12 10.92 12M11 16H11.01"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        <span>Support</span>
                    </button>
                </li>
            </ul>
        </aside>
    )
}

export default SideBar
