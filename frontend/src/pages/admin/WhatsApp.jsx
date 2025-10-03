import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  PowerOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Terminal
} from 'lucide-react';
import whatsappService from '../../services/whatsapp';
import { useAuth } from '../../hooks/useAuth';

const WhatsApp = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Verificar se o usuário é admin master
  const isMasterAdmin = user?.email === 'admin@igreja.com' || user?.email === import.meta.env.VITE_MASTER_ADMIN_EMAIL;

  // Obter status da conexão
  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await whatsappService.getStatus();
      setStatus(data.status);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.error || 'Erro ao verificar status');
    }
  }, []);


  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await whatsappService.disconnect();
      setStatus('disconnected');
      setQrCode(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.error || 'Erro ao desconectar');
    } finally {
      setLoading(false);
    }
  };

  // Reconectar WhatsApp
  const handleReconnect = async () => {
    try {
      setError(null);
      setLoading(true);
      await whatsappService.reconnect();
      await fetchStatus();
    } catch (err) {
      setError(err.error || 'Erro ao reconectar');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status automaticamente
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Renderizar status
  const renderStatus = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle size={20} />
            <span>Conectado</span>
          </div>
        );
      case 'awaiting_qr':
        return (
          <div className="flex items-center space-x-2 text-yellow-600">
            <Clock size={20} />
            <span>Aguardando QR Code</span>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle size={20} />
            <span>Desconectado</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 text-gray-600">
            <AlertCircle size={20} />
            <span>Status desconhecido</span>
          </div>
        );
    }
  };

  // Se não for admin master, mostrar acesso negado
  if (!isMasterAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle size={20} />
            <span>Acesso negado. Apenas o administrador master pode acessar esta página.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <MessageSquare size={28} />
          <span>Conexão WhatsApp</span>
        </h1>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Status Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Status da Conexão</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              {renderStatus()}
            </div>
            
            {lastUpdated && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Última atualização:</span>
                <span className="text-sm text-gray-500">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Actions Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Ações</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-3">
            {status === 'connected' && (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="btn btn-danger flex items-center space-x-2"
              >
                <PowerOff size={16} />
                <span>Desconectar</span>
              </button>
            )}

            <button
              onClick={handleReconnect}
              disabled={loading}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Reconectar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <Terminal size={20} />
            <span>Instruções de Conexão</span>
          </h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Como conectar o WhatsApp (via Terminal/Docker):
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>
                  <strong>Limpar sessão:</strong>
                  <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">
                    docker compose down -v
                  </code>
                </li>
                <li>
                  <strong>Iniciar containers (modo interativo):</strong>
                  <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">
                    docker compose up --build
                  </code>
                </li>
                <li>Aguardar o QR Code aparecer no terminal</li>
                <li>Escanear o QR Code com o WhatsApp do celular</li>
                <li>
                  Quando aparecer "🎉 WhatsApp Web conectado e pronto para uso", pressionar{' '}
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">Ctrl+C</code>
                </li>
                <li>
                  <strong>Subir em modo detached:</strong>
                  <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">
                    docker compose up -d
                  </code>
                </li>
              </ol>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Status "Aguardando QR Code":</strong> O sistema está pronto para receber a conexão.
              </p>
              <p>
                <strong>Status "Conectado":</strong> O WhatsApp está conectado e pronto para enviar mensagens.
              </p>
              <p>
                <strong>Para desconectar:</strong> Clique em "Desconectar" para finalizar a sessão.
              </p>
              <p>
                <strong>Para reconectar:</strong> Use o botão "Reconectar" ou siga os passos de conexão acima.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;