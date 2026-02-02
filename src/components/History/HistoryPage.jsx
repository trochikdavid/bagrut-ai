import React from 'react';
import { useAuth } from '../../context/AuthContext';

const HistoryPage = () => {
    const { user } = useAuth();

    return (
        <div className="history-page">
            <h1>Practice History</h1>
            <p>Welcome, {user?.email}</p>
            <p>Your practice history will appear here.</p>
        </div>
    );
};

export default HistoryPage;
