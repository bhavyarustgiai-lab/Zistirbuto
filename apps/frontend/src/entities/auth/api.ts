import { env } from "@shared/config/env";
import { http } from "@shared/api/http";
import { mockDb } from "@shared/api/mockDb";
const looseMockDb = mockDb as any;

export type AuthUser = {
  id: number;
  name: string;
  phone: string;
  birthDate?: string;
};

type AuthResponse = {
  user: AuthUser;
};

export type VerifyLoginOtpResponse = AuthResponse;

export type RequestLoginOtpResponse = {
  ok: true;
  phone: string;
  expiresAt: string;
  otp?: string;
};

export type RequestLoginOtpInput = {
  phone: string;
};

export type VerifyLoginOtpInput = {
  phone: string;
  otp: string;
};

export type UpdateProfileInput = {
  name: string;
  birthDate: string;
};

export async function requestLoginOtp(input: RequestLoginOtpInput) {
  if (env.useMocks) {
    return looseMockDb.requestLoginOtp(input);
  }
  return http<RequestLoginOtpResponse>("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyLoginOtp(input: VerifyLoginOtpInput) {
  if (env.useMocks) {
    return looseMockDb.verifyLoginOtp(input);
  }
  return http<VerifyLoginOtpResponse>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProfile(input: UpdateProfileInput) {
  if (env.useMocks) {
    return looseMockDb.updateProfile(input);
  }
  return http<AuthResponse>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function logout() {
  if (env.useMocks) {
    return looseMockDb.logout();
  }
  return http<{ ok: true }>("/auth/logout", { method: "POST" });
}
