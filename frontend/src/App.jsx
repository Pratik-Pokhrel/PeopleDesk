import LoginRegister from './pages/LoginRegister.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

function App() {
  return (
    <AuthProvider>
      <LoginRegister />
    </AuthProvider>
  )
}

export default App
