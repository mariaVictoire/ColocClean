"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/login";
import { appConfig } from "@/config/app";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-stone-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          required
          defaultValue="arnold@coloclean.com"
          className="touch-target w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900 outline-none ring-teal-700/30 transition focus:border-teal-700 focus:ring-2"
          placeholder="arnold@coloclean.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-stone-700"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="touch-target w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900 outline-none ring-teal-700/30 transition focus:border-teal-700 focus:ring-2"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="touch-target mt-1 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-base font-semibold text-white transition hover:bg-teal-800 active:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm leading-snug text-stone-500">
        Comptes
        <span className="mt-0.5 block break-all font-medium text-stone-700">
          Arnold : arnold@coloclean.com
        </span>
        <span className="mt-0.5 block break-all font-medium text-stone-700">
          Ralph : ralph@coloclean.com
        </span>
      </p>
      <p className="sr-only">Application {appConfig.name}</p>
    </form>
  );
}
