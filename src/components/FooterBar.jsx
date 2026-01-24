import React from 'react';
import { useLocation } from 'react-router-dom';
import { Zap, Footprints, ClipboardList, Dumbbell } from 'lucide-react';
import './FooterBar.css';

const BadmintonIcon = ({ size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="16" cy="8" r="5" />
        <line x1="12.5" y1="11.5" x2="4" y2="20" />
        <line x1="13" y1="5" x2="19" y2="11" strokeWidth="1" />
        <line x1="19" y1="5" x2="13" y2="11" strokeWidth="1" />
        <path d="M8 6L5 10H11L8 6Z" strokeWidth="1.5" />
        <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
);

const FooterBar = () => {
    const location = useLocation();

    if (location.pathname !== '/') {
        return null;
    }

    return (
        <div className="footer-bar">
            <div className="footer-item">
                <Zap size={20} fill="currentColor" />
                <span>Smash Analysis</span>
            </div>
            <div className="footer-item">
                <BadmintonIcon size={20} />
                <span>Net Play</span>
            </div>
            <div className="footer-item">
                <Footprints size={20} fill="currentColor" />
                <span>Footwork</span>
            </div>
            <div className="footer-item">
                <ClipboardList size={20} />
                <span>Tactics</span>
            </div>
            <div className="footer-item">
                <Dumbbell size={20} fill="currentColor" />
                <span>Drills</span>
            </div>
        </div>
    );
};

export default FooterBar;
