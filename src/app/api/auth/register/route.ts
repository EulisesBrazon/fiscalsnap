import { registerAdminController } from "@/backend/modules/auth/auth.controller";

export async function POST(request: Request) {
  const body = await request.json();
  return registerAdminController(body);
}
