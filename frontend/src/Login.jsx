import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Login({ setToken, setRole }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const res = await axios.post('http://127.0.0.1:8000/users/login', formData)
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('role', res.data.role)
      setToken(res.data.access_token)
      setRole(res.data.role)
      navigate('/')
    } catch (err) {
      alert("Αποτυχία σύνδεσης. Ελέγξτε τα στοιχεία σας ή ίσως εκκρεμεί η έγκρισή σας.")
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <h3 className="mb-3 text-center">Σύνδεση</h3>
          <form onSubmit={handleLogin} className="card p-4 shadow-sm">
            <div className="mb-3">
              <label>Username</label>
              <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label>Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100">Είσοδος</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login