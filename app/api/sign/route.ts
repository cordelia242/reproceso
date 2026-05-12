import { type NextRequest } from "next/server";
import { httpsPost } from "../../lib/https-proxy";

const UPSTREAM = "https://bsol-business-api-signature-prod.bsol.com.bo/test/loan/sign";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await httpsPost(UPSTREAM, body);
  return new Response(upstream.text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.contentType },
  });
}
