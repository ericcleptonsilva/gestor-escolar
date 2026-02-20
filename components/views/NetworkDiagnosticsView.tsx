import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Globe, Monitor, Download, RefreshCw, Smartphone, Laptop, AlertTriangle } from 'lucide-react';

interface NetworkMetrics {
    isOnline: boolean;
    localLatency: number | null;
    internetLatency: number | null;
    ipInfo: {
        ip: string;
        isp: string;
        city: string;
        country: string;
    } | null;
    deviceInfo: {
        userAgent: string;
        platform: string;
        screen: string;
        language: string;
    };
    downloadSpeed: number | null; // Mbps
}

export const NetworkDiagnosticsView = () => {
    const [metrics, setMetrics] = useState<NetworkMetrics>({
        isOnline: navigator.onLine,
        localLatency: null,
        internetLatency: null,
        ipInfo: null,
        deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        },
        downloadSpeed: null
    });

    const [isTesting, setIsTesting] = useState(false);
    const [testProgress, setTestProgress] = useState(0);

    const runDiagnostics = async () => {
        setIsTesting(true);
        setTestProgress(0);

        // 1. Basic Connection & Device Info
        const newMetrics = { ...metrics };
        newMetrics.isOnline = navigator.onLine;
        setTestProgress(10);

        // 2. Local Latency (Ping API)
        try {
            const start = performance.now();
            // Try to hit the API root or a lightweight endpoint
            // We use the configured API URL from localStorage or default
            const apiUrl = localStorage.getItem('escola360_api_url') || 'http://localhost/sistema_escolar_api';
            await fetch(apiUrl + '/conexao.php', { method: 'HEAD', mode: 'no-cors' });
            // Note: no-cors returns opaque response but promise resolves if reachable
            const end = performance.now();
            newMetrics.localLatency = Math.round(end - start);
        } catch (e) {
            newMetrics.localLatency = -1; // Error
        }
        setTestProgress(30);

        // 3. Internet Latency (Ping Google)
        try {
            const start = performance.now();
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
            const end = performance.now();
            newMetrics.internetLatency = Math.round(end - start);
        } catch (e) {
            newMetrics.internetLatency = -1;
        }
        setTestProgress(50);

        // 4. IP Info
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.ip) {
                newMetrics.ipInfo = {
                    ip: data.ip,
                    isp: data.org || data.asn,
                    city: data.city,
                    country: data.country_name
                };
            }
        } catch (e) {
            console.warn("Failed to fetch IP info", e);
        }
        setTestProgress(70);

        // 5. Download Speed Test
        try {
            const start = performance.now();
            // Use a ~2MB image from Wikimedia (Public Domain)
            const response = await fetch('https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg?t=' + Date.now(), { cache: 'no-store' });
            const blob = await response.blob();
            const end = performance.now();

            const durationInSeconds = (end - start) / 1000;
            const sizeInBits = blob.size * 8;
            const speedBps = sizeInBits / durationInSeconds;
            const speedMbps = speedBps / (1024 * 1024);

            newMetrics.downloadSpeed = parseFloat(speedMbps.toFixed(2));
        } catch (e) {
            console.warn("Speed test failed", e);
            newMetrics.downloadSpeed = 0;
        }
        setTestProgress(100);

        setMetrics(newMetrics);
        setIsTesting(false);
    };

    useEffect(() => {
        // Run once on mount
        runDiagnostics();

        const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }));
        const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getLatencyColor = (ms: number | null) => {
        if (ms === null) return 'text-slate-400';
        if (ms === -1) return 'text-red-500';
        if (ms < 50) return 'text-green-500';
        if (ms < 150) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-indigo-500" />
                        Diagnóstico de Rede
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Verifique a conectividade e desempenho da sua rede em tempo real.
                    </p>
                </div>
                <button
                    onClick={runDiagnostics}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={18} className={isTesting ? "animate-spin" : ""} />
                    {isTesting ? 'Testando...' : 'Atualizar Diagnóstico'}
                </button>
            </div>

            {/* Progress Bar */}
            {isTesting && (
                <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 overflow-hidden">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${testProgress}%` }}></div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Connection Status */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Estado da Conexão</h3>
                        {metrics.isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                        {metrics.isOnline ? 'Online' : 'Offline'}
                    </div>
                    <div className="text-xs text-slate-400">
                        {metrics.isOnline ? 'Conectado à internet' : 'Verifique seu cabo ou Wi-Fi'}
                    </div>
                </div>

                {/* Local Latency */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Latência Local (API)</h3>
                        <Activity className="text-indigo-500" />
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${getLatencyColor(metrics.localLatency)}`}>
                        {metrics.localLatency === null ? '--' : metrics.localLatency === -1 ? 'Erro' : `${metrics.localLatency} ms`}
                    </div>
                    <div className="text-xs text-slate-400">
                        {metrics.localLatency === -1 ? (
                            <span className="flex items-center text-red-400 gap-1">
                                <AlertTriangle size={10} />
                                Verifique Configurações
                            </span>
                        ) : 'Tempo de resposta do servidor local'}
                    </div>
                </div>

                {/* Internet Latency */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Latência Internet</h3>
                        <Globe className="text-blue-500" />
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${getLatencyColor(metrics.internetLatency)}`}>
                        {metrics.internetLatency === null ? '--' : metrics.internetLatency === -1 ? 'Erro' : `${metrics.internetLatency} ms`}
                    </div>
                    <div className="text-xs text-slate-400">Tempo de resposta (Google)</div>
                </div>

                {/* Download Speed */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Velocidade Download</h3>
                        <Download className="text-teal-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                        {metrics.downloadSpeed === null ? '--' : `${metrics.downloadSpeed} Mbps`}
                    </div>
                    <div className="text-xs text-slate-400">Estimativa baseada em teste HTTP</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* IP Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                        <Globe size={18} className="text-slate-500" />
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Informações de IP Público</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {metrics.ipInfo ? (
                            <>
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <span className="text-slate-500">Endereço IP</span>
                                    <span className="font-mono font-medium text-slate-800 dark:text-white">{metrics.ipInfo.ip}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <span className="text-slate-500">Provedor (ISP)</span>
                                    <span className="font-medium text-slate-800 dark:text-white">{metrics.ipInfo.isp}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-slate-500">Localização</span>
                                    <span className="font-medium text-slate-800 dark:text-white">{metrics.ipInfo.city}, {metrics.ipInfo.country}</span>
                                </div>
                            </>
                        ) : (
                             <div className="text-center py-4 text-slate-500">
                                 {isTesting ? 'Obtendo informações...' : 'Não foi possível obter informações do IP.'}
                             </div>
                        )}
                    </div>
                </div>

                {/* Device Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                     <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                        {/Mobi|Android/i.test(metrics.deviceInfo.userAgent) ? <Smartphone size={18} className="text-slate-500" /> : <Laptop size={18} className="text-slate-500" />}
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Informações do Dispositivo</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                            <span className="text-slate-500">Sistema Operacional</span>
                            <span className="font-medium text-slate-800 dark:text-white">{metrics.deviceInfo.platform}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                            <span className="text-slate-500">Resolução de Tela</span>
                            <span className="font-medium text-slate-800 dark:text-white">{metrics.deviceInfo.screen}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                            <span className="text-slate-500">Idioma</span>
                            <span className="font-medium text-slate-800 dark:text-white">{metrics.deviceInfo.language}</span>
                        </div>
                         <div className="text-xs text-slate-400 mt-2 truncate" title={metrics.deviceInfo.userAgent}>
                            {metrics.deviceInfo.userAgent}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
