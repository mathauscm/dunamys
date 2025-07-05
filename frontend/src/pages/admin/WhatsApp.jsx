import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  QrCode, 
  Power, 
  PowerOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle 
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import whatsappService from '../../services/whatsapp';
import { useAuth } from '../../hooks/useAuth';

const WhatsApp = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
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

  // Obter QR Code
  const fetchQRCode = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await whatsappService.getQRCode();
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setShowQrModal(true);
      } else {
        setError(data.message || 'QR Code não disponível');
      }
      
      setStatus(data.status);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.error || 'Erro ao obter QR Code');
    } finally {
      setLoading(false);
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
      setStatus('awaiting_qr');
      setQrCode(null);
      setLastUpdated(new Date());
      
      // Aguardar um pouco e tentar obter o QR Code
      setTimeout(() => {
        fetchQRCode();
      }, 2000);
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
            {status === 'disconnected' && (
              <button
                onClick={handleReconnect}
                disabled={loading}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Power size={16} />
                <span>Conectar</span>
              </button>
            )}

            {status === 'awaiting_qr' && (
              <button
                onClick={fetchQRCode}
                disabled={loading}
                className="btn btn-primary flex items-center space-x-2"
              >
                <QrCode size={16} />
                <span>Mostrar QR Code</span>
              </button>
            )}

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
          <h2 className="text-lg font-semibold">Instruções</h2>
        </div>
        <div className="card-body">
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Para conectar:</strong> Clique em "Conectar" e escaneie o QR Code com o WhatsApp do celular.
            </p>
            <p>
              <strong>Status "Aguardando QR Code":</strong> Significa que o sistema está pronto para receber a conexão.
            </p>
            <p>
              <strong>Status "Conectado":</strong> O WhatsApp está conectado e pronto para enviar mensagens.
            </p>
            <p>
              <strong>Para desconectar:</strong> Clique em "Desconectar" para finalizar a sessão.
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="QR Code WhatsApp"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Escaneie o QR Code abaixo com o WhatsApp do seu celular:
            </p>
            {qrCode && (
              <div className="flex justify-center">
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="max-w-full h-auto border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Como conectar:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque no menu (3 pontos) → Dispositivos conectados</li>
                <li>Toque em "Conectar um dispositivo"</li>
                <li>Escaneie o QR Code acima</li>
              </ol>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowQrModal(false)}
              className="btn btn-secondary"
            >
              Fechar
            </button>
            <button
              onClick={fetchQRCode}
              disabled={loading}
              className="btn btn-primary"
            >
              Atualizar QR Code
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WhatsApp;