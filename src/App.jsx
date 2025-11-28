import { useState } from 'react'

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
  // Adicione mais estabelecimentos aqui
]

const STORAGE_KEY = 'neocontrole_estabelecimentos_nomes'

function carregarEstabelecimentos() {
  try {
    const salvos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(salvos) || salvos.length === 0) return ESTABELECIMENTOS_PADRAO

    // Mesclar padrão com nomes salvos por id
    return ESTABELECIMENTOS_PADRAO.map((padrao) => {
      const custom = salvos.find((e) => e.id === padrao.id)
      return custom && custom.nome
        ? { ...padrao, nome: custom.nome }
        : padrao
    })
  } catch {
    return ESTABELECIMENTOS_PADRAO
  }
}

function App() {
  const [estabelecimentos, setEstabelecimentos] = useState(() => carregarEstabelecimentos())
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')

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
            Selecione o estabelecimento para aceder ao PDV
          </p>
          <div className="mt-2">
            <span className="text-sm font-medium text-blue-900">Neotrix</span>
            <span className="text-xs text-gray-500 italic ml-1">- Tecnologias ao seu alcance</span>
          </div>
        </div>

        <div className="space-y-3">
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
