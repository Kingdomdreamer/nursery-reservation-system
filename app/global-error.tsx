'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // グローバルエラーログを記録
    console.error('Global application error:', error)
    
    // 本番環境では外部のエラー追跡サービスに送信
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentry等のエラー追跡サービスに送信
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6 col-lg-4">
                <div className="card shadow-sm">
                  <div className="card-body text-center p-5">
                    <div className="mb-4">
                      <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3rem' }}></i>
                    </div>
                    
                    <h2 className="h4 fw-bold text-dark mb-3">
                      システムエラー
                    </h2>
                    
                    <p className="text-muted mb-4">
                      申し訳ございません。システムに問題が発生しました。
                      しばらく時間をおいてから再度お試しください。
                    </p>

                    <div className="mb-4">
                      <details className="collapse-details">
                        <summary className="btn btn-link text-muted p-0 mb-2">
                          <small>詳細情報</small>
                        </summary>
                        <div className="alert alert-light text-start">
                          <small className="text-muted">
                            <strong>エラー:</strong> {error.message}
                            {error.digest && (
                              <>
                                <br />
                                <strong>エラーID:</strong> {error.digest}
                              </>
                            )}
                          </small>
                        </div>
                      </details>
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        onClick={reset}
                        className="btn btn-primary"
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        システムを再起動
                      </button>
                      
                      <button
                        onClick={() => window.location.href = '/'}
                        className="btn btn-outline-secondary"
                      >
                        <i className="bi bi-house me-2"></i>
                        ホームに戻る
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}