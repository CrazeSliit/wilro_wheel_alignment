"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { verifyPassword, hashPassword, generateTempPassword } from "@/lib/password";
import { getSession, setSession, clearSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";

export type AuthState = {
  error?: string;
  success?: boolean;
};

export type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(errorMessage)), ms);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let user;
  try {
    // Neon's serverless compute can take a few seconds to wake from
    // auto-suspend, so give a single attempt a generous timeout rather than
    // firing a second overlapping query at an already-slow connection.
    user = await withTimeout(
      prisma.user.findUnique({ where: { email } }),
      20000,
      "The database is taking too long to respond. Please try again."
    );
  } catch {
    return { error: "The database is taking too long to respond. Please try again." };
  }

  if (!user || !verifyPassword(password, user.password)) {
    return { error: "Invalid email or password." };
  }

  if (!user.isActive) {
    return { error: "Your account has been deactivated. Contact an administrator." };
  }

  await setSession({ userId: user.id, role: user.role, name: user.name });

  if (user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (user.isFirstLogin) {
    redirect("/change-password");
  }

  redirect("/dashboard/employee");
}

type CreateEmployeeInput = {
  name: string;
  email: string;
  phone?: string;
  department?: "SALES" | "SERVICE" | "PARTS" | "ADMINISTRATION";
  jobTitle?: string;
  role: "EMPLOYEE" | "MANAGER";
};

export async function createEmployeeAccount(input: CreateEmployeeInput): Promise<ActionResult<{ id: string; email: string; name: string }>> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const department = input.department || null;
  const jobTitle = input.jobTitle?.trim() || null;
  const role = input.role;

  if (!name || !email || !role) {
    return { success: false, error: "Name, email and role are required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Email already in use." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      department,
      jobTitle,
      role,
      password: passwordHash,
      isFirstLogin: true,
      emailStatus: "PENDING",
      isActive: true,
    },
    select: { id: true, name: true, email: true },
  });

  const emailResult = await sendWelcomeEmail({
    to: user.email,
    name: user.name,
    loginEmail: user.email,
    tempPassword,
  });

  if (emailResult.success) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailStatus: "SENT", emailSentAt: new Date() },
    });

    await prisma.emailLog.create({
      data: {
        userId: user.id,
        type: "WELCOME",
        recipient: user.email,
        status: "SUCCESS",
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailStatus: "FAILED" },
    });

    await prisma.emailLog.create({
      data: {
        userId: user.id,
        type: "WELCOME",
        recipient: user.email,
        status: "FAILED",
        errorMsg: emailResult.error,
      },
    });
  }

  return { success: true, data: user };
}

export async function resendCredentials(userId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  const employee = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!employee || employee.role === "ADMIN") {
    return { success: false, error: "Employee not found." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = hashPassword(tempPassword);

  await prisma.user.update({
    where: { id: employee.id },
    data: {
      password: passwordHash,
      isFirstLogin: true,
      emailStatus: "PENDING",
    },
  });

  const emailResult = await sendWelcomeEmail({
    to: employee.email,
    name: employee.name,
    loginEmail: employee.email,
    tempPassword,
  });

  if (emailResult.success) {
    await prisma.user.update({
      where: { id: employee.id },
      data: { emailStatus: "SENT", emailSentAt: new Date() },
    });

    await prisma.emailLog.create({
      data: {
        userId: employee.id,
        type: "RESEND",
        recipient: employee.email,
        status: "SUCCESS",
      },
    });

    return { success: true };
  }

  await prisma.user.update({
    where: { id: employee.id },
    data: { emailStatus: "FAILED" },
  });

  await prisma.emailLog.create({
    data: {
      userId: employee.id,
      type: "RESEND",
      recipient: employee.email,
      status: "FAILED",
      errorMsg: emailResult.error,
    },
  });

  return { success: false, error: emailResult.error };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ActionResult<{ redirect: string }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated." };
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All fields are required." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }

  if (newPassword === currentPassword) {
    return { success: false, error: "New password must be different from current password." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { success: false, error: "User not found." };
  }

  if (!verifyPassword(currentPassword, user.password)) {
    return { success: false, error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashPassword(newPassword),
      isFirstLogin: false,
    },
  });

  return {
    success: true,
    data: { redirect: user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/employee" },
  };
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/login");
}
