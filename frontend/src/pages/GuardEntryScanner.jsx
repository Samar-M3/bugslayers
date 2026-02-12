import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const GuardEntryScanner = () => {
    const navigate = useNavigate();
    const [parkingLots, setParkingLots] = useState([]);
    const [selectedLot, setSelectedLot] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const isScannerRendered = useRef(false);

    useEffect(() => {
        // Fetch parking lots for selection
        const fetchLots = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/parking/lots');
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

        // Initialize QR Scanner
        const initScanner = async () => {
            // Wait a tiny bit to ensure any previous instance is fully cleared from DOM
            await new Promise(r => setTimeout(r, 100));
            
            const readerElement = document.getElementById('reader');
            if (!readerElement || isScannerRendered.current) return;

            // Force clear the container before starting
            readerElement.innerHTML = '';

            const scanner = new Html5QrcodeScanner('reader', {
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    return {
                        width: viewfinderWidth * 0.7,
                        height: viewfinderWidth * 0.7
                    };
                },
                fps: 20,
                rememberLastUsedCamera: true,
                showTorchButtonIfSupported: true,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                },
                supportedScanTypes: [0] // Force camera only
            });

            const onScanSuccess = (result) => {
                scanner.clear().then(() => {
                    isScannerRendered.current = false;
                    handleEntry(result);
                }).catch(err => {
                    console.error("Failed to clear scanner:", err);
                    handleEntry(result);
                });
            };

            const onScanError = (err) => {
                // Ignore errors
            };

            try {
                scanner.render(onScanSuccess, onScanError);
                scannerRef.current = scanner;
                isScannerRendered.current = true;
            } catch (err) {
                console.error("Scanner render error:", err);
            }
        };

        initScanner();

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                const scanner = scannerRef.current;
                scannerRef.current = null;
                isScannerRendered.current = false;
                
                scanner.clear().catch(error => {
                    console.error("Cleanup error:", error);
                }).finally(() => {
                    const readerElement = document.getElementById('reader');
                    if (readerElement) readerElement.innerHTML = '';
                });
            }
        };
    }, []);

    const handleEntry = async (userId) => {
        if (!selectedLot) {
            setError('Please select a parking lot first');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/v1/parking/guard/entry', {
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
        window.location.reload(); // Quick way to re-init scanner
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="header-left">
                    <button onClick={() => navigate('/admin')} className="back-btn" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <h1>Guard Entry Point</h1>
                </div>
            </header>

            <main className="admin-main">
                <div className="stats-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
                    <div className="stat-card">
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Your Parking Lot:</label>
                            <select 
                                value={selectedLot} 
                                onChange={(e) => setSelectedLot(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                {parkingLots.map(lot => (
                                    <option key={lot._id} value={lot._id}>{lot.name} ({lot.location})</option>
                                ))}
                            </select>
                        </div>

                        {!scanResult ? (
                            <div className="scanner-card">
                                <div id="reader" style={{ width: '100%' }}></div>
                                <div className="scanner-hint" style={{ textAlign: 'center', marginTop: '15px', color: '#64748b', fontSize: '14px' }}>
                                    Align the QR code within the square to scan
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                {scanResult === 'success' ? (
                                    <>
                                        <CheckCircle size={80} color="#10b981" style={{ marginBottom: '20px' }} />
                                        <h2 style={{ color: '#10b981' }}>Entry Authorized!</h2>
                                        <p>User has been checked in. One slot is now occupied.</p>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={80} color="#ef4444" style={{ marginBottom: '20px' }} />
                                        <h2 style={{ color: '#ef4444' }}>Access Denied</h2>
                                        <p>{error}</p>
                                    </>
                                )}
                                <button 
                                    onClick={resetScanner}
                                    className="add-btn"
                                    style={{ marginTop: '30px', width: '100%' }}
                                >
                                    Scan Next User
                                </button>
                            </div>
                        )}

                        {loading && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', borderRadius: '15px' }}>
                                <Loader2 className="animate-spin" size={40} color="#2563eb" />
                                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Processing Entry...</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuardEntryScanner;