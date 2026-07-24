"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginInput,
} from "@/lib/validators/auth";
import { appConfig } from "@/config/app";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setServerError(data?.error ?? "Connexion impossible.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-4"
      noValidate
    >
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-stone-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          className="touch-target w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900 outline-none ring-teal-700/30 transition focus:border-teal-700 focus:ring-2"
          placeholder="owner@coloclean.demo"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
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
          type="password"
          autoComplete="current-password"
          className="touch-target w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900 outline-none ring-teal-700/30 transition focus:border-teal-700 focus:ring-2"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="touch-target mt-1 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-base font-semibold text-white transition hover:bg-teal-800 active:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm leading-snug text-stone-500">
        Compte démo
        <span className="mt-0.5 block break-all font-medium text-stone-700">
          owner@coloclean.demo
        </span>
      </p>
      <p className="sr-only">Application {appConfig.name}</p>
    </form>
  );
}
