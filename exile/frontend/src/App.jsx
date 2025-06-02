import { useState } from 'react'
import { CloudArrowUpIcon, MagnifyingGlassIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

export default function App() {
  const [file, setFile] = useState(null)
  const [searchParams, setSearchParams] = useState({ category: 'person', keyword: '' })
  const [searchResults, setSearchResults] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain')) {
      setFile(selectedFile)
      setUploadStatus('')
    } else {
      setUploadStatus('Lütfen sadece PDF veya TXT dosyası yükleyin')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Lütfen bir dosya seçin')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://192.168.1.2:8000/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setUploadStatus(`Başarılı: ${response.data.filename} yüklendi`)
      setFile(null)
    } catch (error) {
      setUploadStatus('Dosya yüklenirken bir hata oluştu')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchParams.keyword) {
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(`http://192.168.1.2:8000/query/`, {
        params: searchParams
      })
      setSearchResults(response.data)
      setShowResultModal(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const clearFile = () => {
    setFile(null)
    setUploadStatus('')
  }

  const ResultModal = () => {
    if (!searchResults || !showResultModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Arama Sonuçları ({searchResults.total_matches} eşleşme)
            </h2>
            <button
              onClick={() => setShowResultModal(false)}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-8">
              {searchResults.matches.map((result, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium text-gray-900">{result.filename}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {result.filetype.toUpperCase()}
                        </span>
                        {result.match_type === 'filename' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            DOSYA ADI EŞLEŞMESİ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-2 sm:mt-0 space-x-4">
                        <span className="text-sm text-gray-500">
                          {result.total_matches} eşleşme
                        </span>
                        <time className="text-sm text-gray-500">
                          {formatDate(result.upload_datetime)}
                        </time>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {result.matches.map((match, matchIndex) => (
                        <div 
                          key={matchIndex} 
                          className={`rounded-xl border overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                            match.match_type === 'filename' 
                              ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100' 
                              : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'
                          }`}
                        >
                          <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                match.match_type === 'filename' ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}></span>
                              {match.section}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {match.matching_lines} / {match.total_lines} satır
                            </span>
                          </div>
                          
                          <div className="px-4 py-3">
                            <ul className="space-y-2">
                              {match.matches.map((line, lineIndex) => (
                                <li 
                                  key={lineIndex}
                                  className={`text-sm text-gray-700 leading-relaxed rounded p-1 transition-colors duration-150 ${
                                    match.match_type === 'filename' 
                                      ? 'hover:bg-emerald-50' 
                                      : 'hover:bg-indigo-50'
                                  }`}
                                >
                                  {line}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Exile Doküman İşleme
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CloudArrowUpIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Dosya Yükleme
            </h2>
            
            <div className="space-y-4">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                file 
                  ? 'border-emerald-300 bg-emerald-50/50' 
                  : 'border-indigo-200 hover:border-indigo-300 bg-indigo-50/30'
              }`}>
                {!file ? (
                  <div className="space-y-3">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-indigo-400" />
                    <div className="text-sm text-gray-600">
                      PDF veya TXT dosyası yüklemek için tıklayın
                    </div>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 cursor-pointer transition-all duration-200"
                    >
                      Dosya Seç
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="h-6 w-6 text-emerald-500" />
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-all duration-200 ${
                    isUploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                  }`}
                >
                  {isUploading ? 'Yükleniyor...' : 'Yükle'}
                </button>
              )}

              {uploadStatus && (
                <div className={`p-4 rounded-lg ${
                  uploadStatus.includes('Başarılı') 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-purple-500" />
              Dokümanlarda Ara
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={searchParams.category}
                  onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
                  className="block w-full sm:w-1/3 rounded-lg border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80"
                >
                  <option value="person">Kişi</option>
                  <option value="book">Kitap</option>
                  <option value="formula">Formül</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchParams.keyword}
                    onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                    placeholder="Aranacak kelimeyi girin..."
                    className="block w-full rounded-lg border-gray-200 pl-10 focus:border-purple-500 focus:ring-purple-500 bg-white/80"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchParams.keyword}
                  className={`px-6 py-2 rounded-lg shadow-sm text-white transition-all duration-200 ${
                    isSearching || !searchParams.keyword
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                  }`}
                >
                  {isSearching ? 'Aranıyor...' : 'Ara'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ResultModal />
    </div>
  )
} 