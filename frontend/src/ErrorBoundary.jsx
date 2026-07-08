import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Erro capturado pelo ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: "#F4F4F5", background: "#0E0E13", height: "100vh" }}>
          <h1>Ocorreu um erro inesperado.</h1>
          <p>Recarregue a página para continuar.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
