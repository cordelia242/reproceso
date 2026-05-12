"use client";

import { useState } from "react";
import type { SigningRequest } from "../types/signing-request";
import { useSigningRequests } from "../context/signing-requests";
import { DocumentsTable } from "./documents-table";
import { CopyButton } from "./copy-button";
import { SpinnerIcon, CheckIcon, XIcon, ChevronDownIcon, PenIcon } from "./icons";

type SignStatus = "idle" | "loading" | "success" | "error";

const SIGN_BUTTON_CLASS: Record<SignStatus, string> = {
  idle: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50",
  loading: "bg-indigo-600 text-white disabled:opacity-50",
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700 hover:bg-red-200",
};

const SIGN_LABEL: Record<SignStatus, string> = {
  idle: "Firmar",
  loading: "Firmando…",
  success: "Firmado",
  error: "Reintentar",
};

export function RequestCard({
  request,
  index,
  onRemove,
}: {
  request: SigningRequest;
  index: number;
  onRemove: () => void;
}) {
  const { expandedMap, setExpanded: setGlobalExpanded, rawJsonMap } = useSigningRequests();
  const expanded = expandedMap[request.DocumentDirectoryId] ?? false;
  const setExpanded = (val: boolean) => setGlobalExpanded(request.DocumentDirectoryId, val);

  const [signStatus, setSignStatus] = useState<SignStatus>("idle");
  const [signError, setSignError] = useState<string | null>(null);

  async function handleSign() {
    const rawJson = rawJsonMap[request.DocumentDirectoryId] ?? JSON.stringify(request);
    setSignStatus("loading");
    setSignError(null);
    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawJson,
      });
      if (res.ok) {
        setSignStatus("success");
      } else {
        setSignStatus("error");
        setSignError((await res.text()) || `Error ${res.status}`);
      }
    } catch (err) {
      setSignStatus("error");
      setSignError(err instanceof Error ? err.message : "Error de red");
    }
  }

  const titularId =
    request.Documents.flatMap((d) => d.SingSetting.Signatories)
      .find((s) => s.SigningRepresentative === 2)?.ClientGuid ?? "—";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center gap-4 flex-1 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
            {index + 1}
          </span>
          <div>
            <p className="font-mono text-xs text-gray-500 mb-0.5">Dir: {request.DocumentDirectoryId}</p>
            <p className="text-sm font-semibold text-gray-800">
              Canal {request.Channel} — Flujo {request.FlowType}
              <span className="ml-3 text-xs font-normal text-gray-500">
                {request.Documents.length} {request.Documents.length === 1 ? "documento" : "documentos"}
              </span>
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 ml-4">
          <button
            type="button"
            onClick={handleSign}
            disabled={signStatus === "loading"}
            title="Firmar préstamo"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${SIGN_BUTTON_CLASS[signStatus]}`}
          >
            {signStatus === "loading" ? <SpinnerIcon className="h-3.5 w-3.5 animate-spin" /> :
             signStatus === "success" ? <CheckIcon className="h-3.5 w-3.5" /> :
             signStatus === "error" ? <XIcon className="h-3.5 w-3.5" /> :
             <PenIcon className="h-3.5 w-3.5" />}
            {SIGN_LABEL[signStatus]}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors"
            title={expanded ? "Colapsar" : "Expandir"}
          >
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
            title="Eliminar solicitud"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {signStatus === "error" && signError && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 font-mono">
          {signError}
        </div>
      )}

      {expanded && (
        <div className="px-5 py-4 space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-gray-400">Id titular</dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-gray-600 truncate">{titularId}</span>
                <CopyButton text={titularId} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Dir. documentos</dt>
              <dd className="font-mono text-xs text-gray-600 truncate">{request.DocumentDirectoryId}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Owner completo</dt>
              <dd>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${request.DocumentOwnerComplete ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {request.DocumentOwnerComplete ? "Sí" : "No"}
                </span>
              </dd>
            </div>
          </dl>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Documentos ({request.Documents.length})
            </p>
            <DocumentsTable docs={request.Documents} directoryId={request.DocumentDirectoryId} />
          </div>
        </div>
      )}
    </div>
  );
}
