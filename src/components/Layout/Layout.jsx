import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import './Layout.css'

export default function Layout() {
    const location = useLocation()
    const isSimulation = location.pathname.includes('/simulation')

    return (
        <div className="layout">
            {!isSimulation && <Header />}
            <main className="layout-main" style={isSimulation ? { height: '100vh', padding: 0 } : {}}>
                <Outlet />
            </main>
            {!isSimulation && <BottomNav />}
        </div>
    )
}
