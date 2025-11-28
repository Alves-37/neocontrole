import { useState } from 'react'

const STORAGE_KEY = 'neocontrole_estabelecimentos_nomes'
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://127.0.0.1:8001'

function aplicarNomesPersonalizados(lista) {
  try {
    const salvos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(salvos) || salvos.length === 0) return lista

    return lista.map((e) => {
      const custom = salvos.find((c) => c.id === e.id)
      return custom && custom.nome ? { ...e, nome: custom.nome } : e
    })
  } catch {
    return lista
  }
}

function App() {
  const [step, setStep] = useState('login') // 'login' | 'select'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [usuarioNome, setUsuarioNome] = useState('')
  const [token, setToken] = useState('')
  const [estabelecimentos, setEstabelecimentos] = useState([])
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  async function handleLoginSubmit(e) {
    e.preventDefault()
    if (!username || !password) return
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const msg = data?.detail || `Falha no login (HTTP ${res.status})`
        throw new Error(msg)
      }
      const data = await res.json()

      const lista = (data.estabelecimentos || []).map((e) => ({
        id: e.id,
        nome: e.nome,
        descricao: '',
        url: e.url_front,
      }))

      const comNomes = aplicarNomesPersonalizados(lista)

      setToken(data.access_token || '')
      setUsuarioNome(data.usuario || username)
      setEstabelecimentos(comNomes)
      setStep('select')
    } catch (err) {
      setLoginError(err.message || 'Falha ao autenticar')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSelect = (url) => {
    if (!url) return
    window.location.href = url
  }

  const handleRename = (id) => {
    const atual = estabelecimentos.find((e) => e.id === id)
    if (!atual) return
    setRenameTarget(atual)
    setRenameValue(atual.nome)
  }

  const handleConfirmRename = () => {
    if (!renameTarget) return
    const novoNome = renameValue.trim()
    if (!novoNome) {
      setRenameTarget(null)
      return
    }

    const atualizados = estabelecimentos.map((e) =>
      e.id === renameTarget.id ? { ...e, nome: novoNome } : e,
    )
    setEstabelecimentos(atualizados)

    // Persistir apenas id e nome
    const paraSalvar = atualizados.map((e) => ({ id: e.id, nome: e.nome }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paraSalvar))

    setRenameTarget(null)
  }

  const handleCancelRename = () => {
    setRenameTarget(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3 py-6 relative">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-gray-200 p-5 sm:p-7">
        {/* Header com logo, inspirado no login do Android-pdv3 */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-blue-900 rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-lg">
            <img
              src="/nelson.jpg"
              alt="Nelson"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-blue-900 mb-1">
            Sistema de Gestão
          </h1>
          {step === 'login' ? (
            <p className="text-sm text-gray-700">
              Faça login para aceder aos estabelecimentos NeoPDV
            </p>
          ) : (
            <p className="text-sm text-gray-700">
              Selecione o estabelecimento para aceder ao PDV
            </p>
          )}
          <div className="mt-2">
            <span className="text-sm font-medium text-blue-900">Neotrix</span>
            <span className="text-xs text-gray-500 italic ml-1">- Tecnologias ao seu alcance</span>
          </div>
          {step === 'select' && usuarioNome && (
            <p className="mt-2 text-xs text-gray-500">
              Sessão de: <span className="font-medium text-blue-900">{usuarioNome}</span>
            </p>
          )}
        </div>

        {step === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="username">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nelson ou Neotrix"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite a senha"
              />
            </div>
            <button
              type="submit"
              disabled={!username || !password || loginLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4">
              {estabelecimentos.map((estab) => (
                <div
                  key={estab.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(estab.url)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelect(estab.url)
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
    </div>
  )
}

export default App
