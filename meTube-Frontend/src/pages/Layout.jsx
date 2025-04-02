import React from 'react'
// import { Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faPause } from '@fortawesome/free-solid-svg-icons'

import VideoListing from './VideoListing.jsx'
import SideBar from '../components/SideBar.jsx'
import Navbar from '../components/Navbar.jsx'

const Layout = () => {

    return (
        <div className="h-[100%] w-[100%] overflow-y-auto bg-[#121212] text-white">
            <Navbar />
            <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">

                <SideBar />
                {/* <Outlet/> */}  <VideoListing />
            </div>
        </div >
    )
}

export default Layout