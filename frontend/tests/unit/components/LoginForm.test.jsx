import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import LoginForm from '../../../src/components/forms/LoginForm'

// Mock do useAuth hook
const mockLogin = vi.fn()
const mockUseAuth = {
  login: mockLogin,
  loading: false
}

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}))

// Mock do Loading component
vi.mock('../../../src/components/common/Loading', () => ({
  default: ({ size }) => <div data-testid="loading">{size}</div>
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.loading = false
  })

  it('deve renderizar o formulário de login', () => {
    render(<LoginForm />)
    
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Sua senha')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('deve mostrar placeholders corretos', () => {
    render(<LoginForm />)
    
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Sua senha')).toBeInTheDocument()
  })

  it('deve mostrar/ocultar senha quando clicado no botão', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByPlaceholderText('Sua senha')
    const toggleButtons = screen.getAllByRole('button')
    const toggleButton = toggleButtons.find(btn => btn.type === 'button' && btn.querySelector('svg')) // Botão do olho
    
    // Inicialmente deve ser do tipo password
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Clicar para mostrar senha
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Clicar novamente para ocultar
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const submitButton = screen.getByText('Entrar')
    
    // Tentar submeter sem preencher campos
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
    })
  })

  it('deve validar formato do email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByPlaceholderText('seu@email.com')
    const form = emailInput.closest('form')
    
    // Inserir email inválido
    await user.type(emailInput, 'email-invalido')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
    })
  })

  it('deve validar tamanho mínimo da senha', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByPlaceholderText('Sua senha')
    const submitButton = screen.getByText('Entrar')
    
    // Inserir senha muito curta
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
    })
  })

  it('deve chamar login com dados corretos', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByPlaceholderText('seu@email.com')
    const passwordInput = screen.getByPlaceholderText('Sua senha')
    const submitButton = screen.getByText('Entrar')
    
    // Preencher formulário
    await user.type(emailInput, 'test@email.com')
    await user.type(passwordInput, '123456')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@email.com', '123456')
    })
  })

  it('deve mostrar loading quando está carregando', () => {
    mockUseAuth.loading = true
    render(<LoginForm />)
    
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeDisabled()
  })

  it('deve desabilitar botão durante loading', () => {
    mockUseAuth.loading = true
    render(<LoginForm />)
    
    const submitButton = screen.getByText('Entrar')
    expect(submitButton).toBeDisabled()
  })

  it('não deve chamar login se houver erros de validação', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByPlaceholderText('seu@email.com')
    const form = emailInput.closest('form')
    
    // Preencher apenas email inválido
    await user.type(emailInput, 'email-invalido')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
    })
    
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('deve tratar erro no login graciosamente', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Erro de login'))
    
    render(<LoginForm />)
    
    const emailInput = screen.getByPlaceholderText('seu@email.com')
    const passwordInput = screen.getByPlaceholderText('Sua senha')
    const submitButton = screen.getByText('Entrar')
    
    // Preencher formulário
    await user.type(emailInput, 'test@email.com')
    await user.type(passwordInput, '123456')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@email.com', '123456')
    })
    
    // Não deve quebrar a aplicação
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('deve limpar erros quando usuário corrige os campos', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByPlaceholderText('seu@email.com')
    const submitButton = screen.getByText('Entrar')
    
    // Causar erro de validação
    await user.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
    })
    
    // Corrigir o erro
    await user.type(emailInput, 'test@email.com')
    
    await waitFor(() => {
      expect(screen.queryByText('Email é obrigatório')).not.toBeInTheDocument()
    })
  })
})