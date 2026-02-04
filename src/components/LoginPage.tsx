import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from './ui/components';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (login(email, password)) {
            navigate('/admin');
        } else {
            setError('Identifiants incorrects');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="w-full max-w-md p-10 bg-white rounded-[3rem] shadow-2xl shadow-dark-900/10 border border-neutral-100 relative z-10">
                <div className="text-center space-y-3 mb-10">
                    <div className="w-20 h-20 bg-dark-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-dark-900/10">
                        <LogIn className="w-10 h-10 text-gold-500" />
                    </div>
                    <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">ADMIN</h1>
                    <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.4em]">Accès Sécurisé</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-gold-500 transition-colors" />
                            <Input
                                required
                                type="email"
                                className="pl-12 h-14 bg-white/10 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-gold-500"
                                placeholder="contact@faubourg46.fr"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-gold-500 transition-colors" />
                            <Input
                                required
                                type={showPassword ? 'text' : 'password'}
                                className="pl-12 pr-12 h-14 bg-white/10 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-gold-500"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gold-500 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-16 text-lg font-black bg-dark-900 text-white hover:bg-gold-500 border-none transition-all shadow-xl shadow-dark-900/10 rounded-2xl tracking-widest mt-4">
                        CONNEXION
                    </Button>
                </form>

                <div className="mt-10 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[10px] text-neutral-400 font-black uppercase tracking-widest hover:text-dark-900 transition-colors"
                    >
                        Retour au site public
                    </button>
                </div>
            </div>
        </div>
    );
}
