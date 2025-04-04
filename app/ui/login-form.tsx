'use client';
import { useState } from 'react';
import { authenticateAction } from '@/lib/actions/server-actions';
import { useForm } from 'react-hook-form';
import { RegisterUser, registerUserSchema } from '@/lib/register-user';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';


export default function LoginForm() {
    const [serverError, setServerError] = useState('');
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterUser>({
        resolver: zodResolver(registerUserSchema),
    });

    const onSubmit = async (registerUser: RegisterUser) => {
        const result = await authenticateAction(registerUser);
        if (result.success) {
            window.location.href = '/';

        } else {
            setServerError(result.serverError);
        }
    };

    return (
        <div className="formCard">
            <h1>Log In</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    {serverError && <p className="error">{serverError}</p>}
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        {...register('email')}
                        type="email"
                        placeholder="Enter your email address"
                    />
                    {errors.email && (
                        <p className="error">{errors.email.message}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        {...register('password')}
                        type="password"
                        placeholder="Enter password"
                    />
                    {errors.password && (
                        <p className="error">{errors.password.message}</p>
                    )}
                </div>
                <button className="btn btnPrimary">Log in </button>
            </form>
            <div className="mt-4">
                Don&apos;t have an account? <Link href="/register">Register</Link>
            </div>
        </div>
    );
}