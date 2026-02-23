import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wifi, WifiOff, Globe, Server, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getApiBaseUrl } from '@/services/api';

export const NetworkDiagnosticsView: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<{
    localNetwork: boolean | null;
    internet: boolean | null;
    server: boolean | null;
    serverMessage: string | null; // Added for error detail
    serverLatency: number | null;
    publicIp: string | null;
    debugData: any | null; // For debug.php output
  }>({
    localNetwork: null,
    internet: null,
    server: null,
    serverMessage: null,
    serverLatency: null,
    publicIp: null,
    debugData: null
  });

  const checkConnection = async () => {
    setIsChecking(true);
    const newResults = { ...results, debugData: null };

    // 1. Check Local Network / Internet (basic ping)
    try {
        newResults.localNetwork = navigator.onLine;
    } catch { newResults.localNetwork = false; }

    // 2. Check Internet (fetch a public resource)
    try {
        const start = performance.now();
        await fetch('https://api.ipify.org?format=json', { mode: 'cors' });
        newResults.internet = true;
    } catch {
        newResults.internet = false;
    }

    // 3. Get Public IP
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        newResults.publicIp = data.ip;
    } catch {
        newResults.publicIp = "Indisponível";
    }

    // 4. Check Server (Backend)
    const apiUrl = getApiBaseUrl();
    try {
        const start = performance.now();
        // Try to fetch a lightweight endpoint or OPTIONS
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // We use debug.php for full diagnostics
        const res = await fetch(`${apiUrl}/debug.php`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const end = performance.now();
        newResults.server = res.ok;
        newResults.serverLatency = Math.round(end - start);

        if (res.ok) {
            try {
                const json = await res.json();
                newResults.debugData = json;
                // If DB connection failed in debug.php, mark server as warning/error
                if (json.database_connection !== "OK") {
                     newResults.server = false;
                     newResults.serverMessage = json.database_connection;
                }
            } catch (e) {
                newResults.serverMessage = "JSON inválido do debug.php";
            }
        } else {
            newResults.serverMessage = `Status: ${res.status} ${res.statusText}`;
        }
    } catch (e: any) {
        console.error(e);
        newResults.server = false;
        newResults.serverLatency = null;
        newResults.serverMessage = e.message || "Erro desconhecido";
    }

    setResults(newResults);
    setIsChecking(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const StatusIcon = ({ status }: { status: boolean | null }) => {
      if (status === null) return <Clock className="text-slate-400 animate-pulse" />;
      if (status) return <CheckCircle className="text-green-500" />;
      return <XCircle className="text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Diagnóstico de Rede</h2>
        <Button onClick={checkConnection} disabled={isChecking}>
            {isChecking ? 'Verificando...' : 'Executar Diagnóstico'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Wifi size={20} /> Conectividade Local
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <span>Conexão Navegador</span>
                      <StatusIcon status={results.localNetwork} />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <span>Acesso à Internet</span>
                      <StatusIcon status={results.internet} />
                  </div>
                  {results.publicIp && (
                      <div className="text-xs text-slate-500 text-right">
                          IP Público: {results.publicIp}
                      </div>
                  )}
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Server size={20} /> Servidor Backend (XAMPP)
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <div className="text-xs text-slate-500 mb-1">URL Configurada</div>
                      <code className="text-xs bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded block overflow-hidden text-ellipsis">
                          {getApiBaseUrl()}
                      </code>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <span>Status do Servidor</span>
                      <StatusIcon status={results.server} />
                  </div>

                  {results.serverLatency && (
                      <div className="text-xs text-slate-500 text-right">
                          Latência: {results.serverLatency}ms
                      </div>
                  )}

                  {!results.server && results.server !== null && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                          <strong>Erro de Conexão:</strong> {results.serverMessage || "O sistema não conseguiu contatar o servidor."}
                          <ul className="list-disc ml-4 mt-2 space-y-1">
                              <li>Verifique se o XAMPP está rodando (Apache e MySQL).</li>
                              <li>Confirme se o IP nas Configurações está correto.</li>
                              <li>Se estiver usando WiFi, verifique se está na mesma rede.</li>
                              <li>Tente acessar a URL acima no navegador.</li>
                          </ul>
                      </div>
                  )}

                  {results.debugData && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estado do Banco de Dados (Servidor)</h4>
                          <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                  <span>PHP: {results.debugData.php_version}</span>
                                  <span>MySQL Driver: {results.debugData.mysql_extension}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span>Conexão DB:</span>
                                  <span className={results.debugData.database_connection === "OK" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{results.debugData.database_connection}</span>
                              </div>

                              {results.debugData.tables && (
                                  <div className="mt-2 bg-slate-100 dark:bg-slate-900 p-2 rounded max-h-40 overflow-y-auto">
                                      <table className="w-full text-left">
                                          <thead>
                                              <tr className="text-slate-500 border-b border-slate-200">
                                                  <th className="pb-1">Tabela</th>
                                                  <th className="pb-1 text-right">Status / Registros</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {Object.entries(results.debugData.tables).map(([table, status]: [string, any]) => (
                                                  <tr key={table} className="border-b border-slate-200/50 last:border-0">
                                                      <td className="py-1">{table}</td>
                                                      <td className={`py-1 text-right ${String(status).includes("ERROR") || String(status).includes("MISSING") ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                                                          {status}
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>
    </div>
  );
};
