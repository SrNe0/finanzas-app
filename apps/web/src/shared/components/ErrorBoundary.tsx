import { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorMensaje } from './ErrorMensaje'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Evita que un error de renderizado deje la pantalla en blanco: muestra el error y permite reintentar. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de renderizado:', error, info.componentStack)
  }

  reintentar = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    return <ErrorMensaje titulo="Algo salió mal" mensaje={this.state.error.message} onReintentar={this.reintentar} />
  }
}
