"use client";

import { useState } from "react";
import { useSigningRequests } from "../context/signing-requests";
import { RequestCard } from "../components/request-card";
import { parseJson } from "../lib/parse-json";

export default function SigningRequestPage() {
  const { requests, addRequest, removeRequest, clearAll } = useSigningRequests();
  const [rawJson, setRawJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleLoad() {
    setError(null);
    try {
      const trimmed = rawJson.trim();
      addRequest(parseJson(trimmed), trimmed);
      setRawJson("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON inválido.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de firma</h1>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Cargar JSON</h2>
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder="Pega aquí el JSON con el formato SigningRequest…"
            rows={8}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</p>
          )}
          <button
            type="button"
            onClick={handleLoad}
            disabled={!rawJson.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Agregar a lista
          </button>
        </section>

        {requests.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Lista de solicitudes ({requests.length})
              </h2>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                Limpiar todo
              </button>
            </div>
            {requests.map((req, i) => (
              <RequestCard key={i} request={req} index={i} onRemove={() => removeRequest(i)} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
