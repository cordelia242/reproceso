"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { SigningDocument, ReprocessJob } from "../types/signing-request";
import { saveJob, getJob } from "../lib/reprocess-jobs";
import { useSigningRequests } from "../context/signing-requests";
import { DOCUMENT_NAMES, PARTICIPANT_LABELS, API_BASE } from "../lib/constants";
import { SpinnerIcon, CheckIcon, XIcon } from "./icons";

type CellJobs = Record<string, string>; // `${documentId}::${signingRepresentative}` → jobId

const cellKey = (docId: string, type: number) => `${docId}::${type}`;

export function DocumentsTable({ docs, directoryId }: { docs: SigningDocument[]; directoryId: string }) {
  const { cellJobsMap, setCellJobs: setGlobalCellJobs } = useSigningRequests();

  const sortedTypes = [
    ...new Set(docs.flatMap((doc) => doc.SingSetting.Signatories.map((s) => s.SigningRepresentative))),
  ].sort((a, b) => a - b);


  const cellJobs: CellJobs = cellJobsMap[directoryId] ?? {};
  const cellJobsRef = useRef(cellJobs);
  cellJobsRef.current = cellJobs;

  const [jobStates, setJobStates] = useState<Record<string, ReprocessJob>>({});

  useEffect(() => {
    function refresh() {
      const ids = Object.values(cellJobsRef.current);
      if (ids.length === 0) return;
      setJobStates((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const jobId of ids) {
          const j = getJob(jobId);
          if (j && (prev[jobId]?.status !== j.status || prev[jobId]?.manualResult !== j.manualResult)) {
            next[jobId] = j;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, []);



  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-3 text-xs font-semibold text-gray-600 border border-gray-200">Documento</th>
            {sortedTypes.map((type) => (
              <th key={type} className="py-2 px-3 text-xs font-semibold text-gray-600 border border-gray-200 text-center whitespace-nowrap">
                {PARTICIPANT_LABELS[type] ?? "Firma"} ({type})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {docs.map((doc, i) => (
            <tr key={doc.DocumentId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="py-2 px-3 border border-gray-200 font-medium text-gray-800">
                {DOCUMENT_NAMES[doc.DocumentType] || doc.TopicName || `Tipo ${doc.DocumentType}`}
              </td>
              {sortedTypes.map((type) => {
                const hasSignatory = doc.SingSetting.Signatories.some((s) => s.SigningRepresentative === type);
                const jobId = cellJobs[cellKey(doc.DocumentId, type)];

                if (jobId) {
                  const j = jobStates[jobId];
                  const isLoading = !j || (j.status === "loading" && !j.manualResult);
                  const isSuccess = j?.manualResult === "success" || (j?.status === "completed" && !j.manualResult);
                  return (
                    <td key={type} className="py-2 px-3 border border-gray-200 text-center">
                      <Link href={`/reprocess/${jobId}`} title="Ver detalle del reproceso" className="inline-flex items-center justify-center">
                        {isLoading ? (
                          <SpinnerIcon className="h-4 w-4 animate-spin text-blue-500" />
                        ) : isSuccess ? (
                          <CheckIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <XIcon className="h-4 w-4 text-red-500" />
                        )}
                      </Link>
                    </td>
                  );
                }

                return (
                  <td key={type} className={`py-2 px-3 border border-gray-200 text-center ${!hasSignatory ? "bg-red-50" : ""}`}>
                    <input
                      type="checkbox"
                      disabled={!hasSignatory}
                      className={`h-4 w-4 rounded border-gray-300 ${hasSignatory ? "text-blue-600 focus:ring-blue-500 cursor-pointer" : "cursor-not-allowed opacity-30"}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
