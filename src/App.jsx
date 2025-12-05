import { useEffect, useState } from 'react'

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'https://backendcontrole-production.up.railway.app'

const ESTABELECIMENTOS_PADRAO = [
  {
    id: 'neopdv1',
    nome: 'NeoPDV 1',
    descricao: 'Primeiro estabelecimento',
    url: 'https://neopdv1.vercel.app/',
  },
  {
    id: 'neopdv2',
    nome: 'NeoPDV 2',
    descricao: 'Segundo estabelecimento',
    url: 'https://neopdv2.vercel.app/',
  },
  {
    id: 'neopdv3',
    nome: 'NeoPDV 3',
    descricao: 'Terceiro estabelecimento',
    url: 'https://neopdv3.vercel.app/',
  },
  {
    id: 'neopdv4',
    nome: 'NeoPDV 4',
    descricao: 'Quarto estabelecimento',
    url: 'https://neopdv4.vercel.app/',
  },
  {
    id: 'neopdv5',
    nome: 'NeoPDV 5',
    descricao: 'Quinto estabelecimento',
    url: 'https://neopdv5.vercel.app/',
  },
]

function carregarEstabelecimentos() {
  return [...ESTABELECIMENTOS_PADRAO].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt', { sensitivity: 'base' }))
}

function App() {
  const [estabelecimentos, setEstabelecimentos] = useState(() => carregarEstabelecimentos())
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [showUserModal, setShowUserModal] = useState(false)
  const [userNomeEdit, setUserNomeEdit] = useState('')
  const [userSenhaEdit, setUserSenhaEdit] = useState('')
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [userSaveError, setUserSaveError] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  // Restaurar sessão a partir do localStorage (caso o utilizador volte de um PDV)
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('neocontrole_token')
      const storedUser = localStorage.getItem('neocontrole_usuario')
      const storedUsername = localStorage.getItem('neocontrole_username')
      if (storedToken) {
        setToken(storedToken)
      }
      if (storedUser) {
        setUsuario(storedUser)
      }
      if (storedUsername) {
        setUsername(storedUsername)
      }
    } catch {
      // ignorar erros de leitura do storage
    }
  }, [])

  // Sincronizar token/usuario com localStorage
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('neocontrole_token', token)
      } else {
        localStorage.removeItem('neocontrole_token')
      }

      if (usuario) {
        localStorage.setItem('neocontrole_usuario', usuario)
      } else {
        localStorage.removeItem('neocontrole_usuario')
      }

      if (username) {
        localStorage.setItem('neocontrole_username', username)
      } else {
        localStorage.removeItem('neocontrole_username')
      }
    } catch {
      // ignorar erros de escrita no storage
    }
  }, [token, usuario, username])

  // Carregar estabelecimentos do banco de dados quando o usuário estiver autenticado
  useEffect(() => {
    const carregarEstabelecimentosDoBanco = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${AUTH_API_URL}/estabelecimentos`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Atualiza a lista de estabelecimentos com os dados do banco
          setEstabelecimentos(data);
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
      }
    };

    carregarEstabelecimentosDoBanco();
  }, [token]); // Executa quando o token mudar

  const handleSelect = (url, nomeEstab) => {
    if (!url) return
    setIsNavigating(true)
    try {
      const target = new URL(url, window.location.origin)
      if (nomeEstab) {
        target.searchParams.set('launcher_estab_nome', nomeEstab)
      }
      window.location.href = target.toString()
    } catch {
      // fallback simples caso a URL não seja válida
      window.location.href = url
    }
  }

  const handleRename = (id) => {
    const atual = estabelecimentos.find((e) => e.id === id)
    if (!atual) return
    setRenameTarget(atual)
    setRenameValue(atual.nome)
  }

  const handleConfirmRename = async () => {
    if (!renameTarget) return
    const novoNome = renameValue.trim()
    if (!novoNome) {
      setRenameTarget(null)
      return
    }

    // Tentar persistir no backend central (auth)
    try {
      const response = await fetch(`${AUTH_API_URL}/estabelecimentos/${encodeURIComponent(renameTarget.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nome: novoNome }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar nome do estabelecimento')
      }

      // Recarrega os estabelecimentos do banco de dados após a atualização
      const reloadResponse = await fetch(`${AUTH_API_URL}/estabelecimentos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (reloadResponse.ok) {
        const data = await reloadResponse.json();
        setEstabelecimentos(data);
      }

      setRenameTarget(null)
    } catch (err) {
      alert((err && err.message) || 'Falha ao atualizar nome do estabelecimento no servidor')
    }
  }

  const handleCancelRename = () => {
    setRenameTarget(null)
  }

  const handleLogout = () => {
    setToken(null)
    setUsuario(null)
    setUsername('')
    setPassword('')
    try {
      localStorage.removeItem('neocontrole_token')
      localStorage.removeItem('neocontrole_usuario')
      localStorage.removeItem('neocontrole_username')
    } catch {
      // ignore storage errors
    }
    // Carrega os estabelecimentos padrão quando o usuário faz logout
    setEstabelecimentos(carregarEstabelecimentos())
  }

  const openUserModal = () => {
    setUserNomeEdit(usuario || '')
    setUserSenhaEdit('')
    setUserSaveError('')
    setShowUserModal(true)
  }

  const closeUserModal = () => {
    setShowUserModal(false)
  }

  const handleSaveUser = async () => {
    if (!username) {
      setUserSaveError('Usuário base não encontrado para atualização.')
      return
    }

    if (!userNomeEdit.trim() && !userSenhaEdit.trim()) {
      setUserSaveError('Altere o nome e/ou a senha para salvar.')
      return
    }

    setIsSavingUser(true)
    setUserSaveError('')

    try {
      const payload = {}
      if (userNomeEdit.trim()) {
        payload.nome = userNomeEdit.trim()
      }
      if (userSenhaEdit.trim()) {
        payload.password = userSenhaEdit.trim()
      }

      const response = await fetch(`${AUTH_API_URL}/users/${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let message = 'Falha ao atualizar dados do usuário.'
        try {
          const data = await response.json()
          if (data?.detail) {
            message = data.detail
          }
        } catch (e) {
          // ignore parse errors
        }
        throw new Error(message)
      }

      const data = await response.json()
      if (data?.nome) {
        setUsuario(data.nome)
      }

      if (userSenhaEdit.trim()) {
        setPassword('')
      }

      setShowUserModal(false)
    } catch (err) {
      setUserSaveError(err?.message || 'Erro ao atualizar usuário.')
    } finally {
      setIsSavingUser(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    const user = username.trim()
    const pass = password

    if (!user || !pass) {
      setLoginError('Preencha usuário e senha.')
      return
    }

    setIsLoggingIn(true)
    setLoginError('')

    try {
      const response = await fetch(`${AUTH_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user, password: pass }),
      })

      if (!response.ok) {
        let message = 'Falha ao iniciar sessão.'
        try {
          const data = await response.json()
          if (data?.detail) {
            message = data.detail
          }
        } catch (e) {
          // ignore JSON parse errors
        }
        throw new Error(message)
      }

      const data = await response.json()

      setToken(data.access_token)
      setUsuario(data.usuario)
      // O useEffect acima irá cuidar de carregar os estabelecimentos

      setPassword('')
    } catch (err) {
      setLoginError(err?.message || 'Erro ao fazer login.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-gray-200 p-6 sm:p-8">
        {/* Header com logo, inspirado no login do Android-pdv3 */}
        <div className="mb-6 text-center">
          <div className="mx-auto h-20 w-20 bg-blue-900 rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-lg">
            <img
              src="/nelson.jpg"
              alt="Nelson"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">
            Sistema de Gestão
          </h1>
          <p className="text-sm text-gray-700">
            {token ? 'Selecione o estabelecimento para aceder ao PDV' : 'Faça login para aceder aos estabelecimentos'}
          </p>
          <div className="mt-2">
            <span className="text-sm font-medium text-blue-900">Neotrix</span>
            <span className="text-xs text-gray-500 italic ml-1">- Tecnologias ao seu alcance</span>
          </div>
        </div>

        {!token && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="username">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="username"
              />
            </div>
            <div className="text-left">
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8S1 12 1 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-xs text-red-600">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        )}

        {token && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-gray-600">
              <div>
                <span>Utilizador: </span>
                <span className="font-medium text-blue-900">{usuario}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openUserModal}
                  className="px-2 py-1 rounded border border-blue-200 text-[11px] text-blue-700 hover:bg-blue-50 flex items-center justify-center"
                  aria-label="Editar dados do utilizador"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2 py-1 rounded border border-gray-200 text-[11px] text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Terminar sessão"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="relative space-y-3">
              {isNavigating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                  <div className="flex flex-col items-center gap-2 text-gray-700 text-xs">
                    <div className="h-6 w-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    <span>A abrir o estabelecimento…</span>
                  </div>
                </div>
              )}
              {estabelecimentos.map((estab) => (
                <div
                  key={estab.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !isNavigating && handleSelect(estab.url, estab.nome)}
                  onKeyDown={(e) => {
                    if (!isNavigating && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      handleSelect(estab.url, estab.nome)
                    }
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-blue-500/70 hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-blue-900">
                        {estab.nome}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRename(estab.id)
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 underline underline-offset-2"
                      >
                        Renomear
                      </button>
                    </div>
                    {estab.descricao && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {estab.descricao}
                      </div>
                    )}
                  </div>
                  <span className="ml-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                    Entrar
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[11px] text-center text-gray-500">
              Depois de selecionar, será redirecionado para o estabelecimento escolhido.
            </p>
          </>
        )}
      </div>

      {renameTarget && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Renomear estabelecimento</h2>
            <p className="text-xs text-gray-600 mb-4">
              Altere o nome exibido para este estabelecimento. Isso não muda a URL, apenas o nome que aparece na lista.
            </p>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={handleCancelRename}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-slate-900/30 border border-gray-200 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">Dados do utilizador</h2>
                <p className="mt-1 text-[11px] text-gray-600">
                  Atualize o nome e/ou a senha usada para iniciar sessão no NeoControle.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="user-username-view">
                  Usuário
                </label>
                <input
                  id="user-username-view"
                  type="text"
                  value={username}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div className="h-px bg-gray-100" />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="user-nome-edit">
                  Nome a exibir
                </label>
                <input
                  id="user-nome-edit"
                  type="text"
                  value={userNomeEdit}
                  onChange={(e) => setUserNomeEdit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="user-senha-edit">
                  Nova senha
                </label>
                <input
                  id="user-senha-edit"
                  type="password"
                  value={userSenhaEdit}
                  onChange={(e) => setUserSenhaEdit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="new-password"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Deixe em branco se não quiser alterar a senha.
                </p>
              </div>
            </div>

            {userSaveError && (
              <p className="mb-3 text-xs text-red-600">
                {userSaveError}
              </p>
            )}

            <div className="flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={closeUserModal}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                disabled={isSavingUser}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                disabled={isSavingUser}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingUser ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
