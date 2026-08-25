import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      const response = await axios.post(`${baseUrl}/api/auth/login`, { username: 'admin', password: 'admin123!' });
      if (response.data.token) {
        localStorage.setItem('tracescope_token', response.data.token);
        localStorage.setItem('tracescope_user', response.data.username);
        localStorage.setItem('user_role', response.data.role || 'Admin');
        onLogin(true);
        navigate('/');
      }
    } catch (err) {
      setError('Demo login failed. Admin account might not be initialized yet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5000' : '');
      if (isRegistering) {
        await axios.post(`${baseUrl}/api/auth/register`, { username, password });
        setSuccessMsg('Account created successfully! You can now log in.');
        setIsRegistering(false);
        setPassword('');
      } else {
        const response = await axios.post(`${baseUrl}/api/auth/login`, { username, password });
        if (response.data.token) {
          localStorage.setItem('tracescope_token', response.data.token);
          localStorage.setItem('tracescope_user', response.data.username);
          localStorage.setItem('user_role', response.data.role || 'Investigator');
          onLogin(true);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ts-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-ts-blue/10 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-ts-purple/10 blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ts-purple to-ts-blue flex items-center justify-center text-white shadow-xl shadow-ts-blue/20">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-ts-text">
          TraceScope <span className="font-light">v2.0</span>
        </h2>
        <p className="mt-2 text-center text-sm text-ts-text-muted uppercase tracking-wider font-semibold">
          Digital Forensics Investigation Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-4 shadow-premium sm:rounded-2xl sm:px-10 border border-ts-border">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-50 border-l-4 border-ts-red p-4 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                <p className="text-sm text-green-700">{successMsg}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-ts-text">
                Investigator ID
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-ts-border rounded-lg focus:ring-ts-blue focus:border-ts-blue sm:text-sm transition-colors"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ts-text">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-ts-border rounded-lg focus:ring-ts-blue focus:border-ts-blue sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-ts-blue focus:ring-ts-blue border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-ts-text-muted">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-ts-blue hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-ts-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ts-blue transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isRegistering ? 'Create Account' : 'Secure Login'} <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
              className="text-sm text-ts-blue hover:text-blue-500 font-medium w-full mb-3"
            >
              {isRegistering ? 'Already have an account? Log in' : 'Need access? Register here'}
            </button>
            
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-white px-3 text-xs text-gray-400 font-medium">OR</span>
              <div className="border-t border-gray-200 w-full"></div>
            </div>

            <button 
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-ts-border rounded-lg shadow-sm text-sm font-medium text-ts-text bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
            >
              Quick Demo Access
            </button>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-ts-text-muted">
          Warning: Authorized Access Only. All actions are logged.
        </p>
      </div>
    </div>
  );
};

export default Login;
