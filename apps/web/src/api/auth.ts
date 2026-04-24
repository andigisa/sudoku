import type {
  AuthResponseDto,
  UserProfileDto,
  RegisterRequestDto,
  LoginRequestDto,
  UpdateProfileRequestDto
} from "@sudoku/contracts";

export async function register(body: RegisterRequestDto): Promise<AuthResponseDto> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? `Registration failed: ${res.status}`);
  }
  return res.json() as Promise<AuthResponseDto>;
}

export async function login(body: LoginRequestDto): Promise<AuthResponseDto> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? `Login failed: ${res.status}`);
  }
  return res.json() as Promise<AuthResponseDto>;
}

export async function logout(): Promise<void> {
  await fetch("/api/v1/auth/logout", { method: "POST" });
}

export async function fetchMe(): Promise<AuthResponseDto | null> {
  const res = await fetch("/api/v1/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
  return res.json() as Promise<AuthResponseDto>;
}

export async function updateProfile(body: UpdateProfileRequestDto): Promise<UserProfileDto> {
  const res = await fetch("/api/v1/auth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? `Profile update failed: ${res.status}`);
  }
  return res.json() as Promise<UserProfileDto>;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await fetch("/api/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
}
