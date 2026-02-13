import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, Loader2, Camera, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const GuardEntryScanner = () => {
    const navigate = useNavigate();
    const [parkingLots, setParkingLots] = useState([]);
    const [selectedLot, setSelectedLot] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const html5QrCodeRef = useRef(null);
    const scannerContainerId = "reader";

    useEffect(() => {
        const fetchLots = async () => {
            try {
                const response = await fetch('https://parkfasto-backend-2.onrender.com/api/v1/parking/lots');
                const data = await response.json();
                if (data.success) {
                    setParkingLots(data.data);
                    if (data.data.length > 0) setSelectedLot(data.data[0]._id);
                }
            } catch (err) {
                console.error('Failed to fetch lots:', err);
            }
        };
        fetchLots();

        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            setError(null);
            
            // Ensure the element exists in DOM before initializing
            const element = document.getElementById(scannerContainerId);
            if (!element) {
                console.error(`Scanner container #${scannerContainerId} not found in DOM`);
                setError("Scanner initialization failed. Please refresh the page.");
                return;
            }

            const html5QrCode = new Html5Qrcode(scannerContainerId);
            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: 20,
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    handleScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Ignore constant scan errors
                }
            );
            setIsScanning(true);
        } catch (err) {
            console.error("Failed to start scanner:", err);
            setError("Could not access camera. Please ensure permissions are granted.");
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }
    };

    const handleScanSuccess = async (decodedText) => {
        await stopScanner();
        
        try {
            // Try to parse if it's a JSON string (from Profile.jsx)
            const parsedData = JSON.parse(decodedText);
            if (parsedData.userId) {
                handleEntry(parsedData.userId);
            } else {
                handleEntry(decodedText);
            }
        } catch (e) {
            // If not JSON, assume it's the raw ID
            handleEntry(decodedText);
        }
    };

    const handleEntry = async (userId) => {
        if (!selectedLot) {
            setError('Please select a parking lot first');
            return;
        }
        
        console.log("Processing entry for:", { userId, parkingLotId: selectedLot });
        
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://parkfasto-backend-2.onrender.com/api/v1/parking/guard/entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, parkingLotId: selectedLot })
            });

            const data = await response.json();
            if (data.success) {
                setScanResult('success');
            } else {
                setError(data.message || 'Failed to process entry');
                setScanResult('error');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            setScanResult('error');
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setError(null);
        // Remove direct startScanner() call to avoid race condition with React rendering
    };

    // Auto-start scanner when scanResult is cleared
    useEffect(() => {
        if (!scanResult && !isScanning && !loading) {
            // Give React a moment to render the #reader div
            const timer = setTimeout(() => {
                const element = document.getElementById(scannerContainerId);
                if (element) {
                    startScanner();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [scanResult]);

    return (
        <div className="admin-container">
            <div className="admin-main" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <button onClick={() => navigate('/guard')} className="back-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Guard Entry Point</h1>
                        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Scan user QR code for check-in</p>
                    </div>
                </header>

                <div className="scanner-section" style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Select Your Parking Lot:</label>
                        <select 
                            value={selectedLot} 
                            onChange={(e) => setSelectedLot(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                        >
                            {parkingLots.map(lot => (
                                <option key={lot._id} value={lot._id}>{lot.name} ({lot.totalSpots - lot.occupiedSpots} spots free)</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ position: 'relative', background: '#f1f5f9', borderRadius: '15px', overflow: 'hidden', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {!scanResult ? (
                            <>
                                <div id={scannerContainerId} style={{ width: '100%', maxWidth: '400px' }}></div>
                                {!isScanning && (
                                    <button 
                                        onClick={startScanner}
                                        style={{ padding: '15px 30px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                    >
                                        <Camera size={20} />
                                        Start Camera
                                    </button>
                                )}
                                {isScanning && (
                                    <>
                                        <div className="scanner-overlay">
                                            <div className="scanner-line"></div>
                                        </div>
                                        <div style={{ padding: '15px', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>
                                            <RefreshCw size={16} className="spin" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                            Scanning for QR code...
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                {scanResult === 'success' ? (
                                    <>
                                        <CheckCircle2 size={80} color="#10b981" style={{ marginBottom: '20px' }} />
                                        <h2 style={{ color: '#10b981' }}>Entry Successful!</h2>
                                        <p>User has been checked in. Slot occupied.</p>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={80} color="#ef4444" style={{ marginBottom: '20px' }} />
                                        <h2 style={{ color: '#ef4444' }}>Entry Failed</h2>
                                        <p>{error || 'An error occurred during entry.'}</p>
                                    </>
                                )}
                                <button 
                                    onClick={resetScanner}
                                    style={{ marginTop: '25px', padding: '12px 25px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Scan Next User
                                </button>
                            </div>
                        )}
                    </div>

                    {error && !scanResult && (
                        <div style={{ marginTop: '20px', padding: '15px', background: '#fef2f2', color: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <XCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .spin { animation: spin 2s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default GuardEntryScanner;

