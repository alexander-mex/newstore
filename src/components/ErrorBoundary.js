// src/components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-5">
          <h4>Щось пішло не так.</h4>
          <p>Будь ласка, спробуйте ще раз або зверніться до адміністратора.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;