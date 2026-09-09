"use server";

import prisma from "@/lib/db";
import { getSession, setSession } from "@/lib/session";
import { verifyPassword, hashPassword } from "@/lib/password";
import { Department, Prisma, Role } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

export type ProfileState = {
  error?: string;
  success?: string;
};

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const jobTitle = formData.has("jobTitle") ? ((formData.get("jobTitle") as string)?.trim() || null) : undefined;
  const department = formData.has("department")
    ? (((formData.get("department") as string) as Department) || null)
    : undefined;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { id: session.userId } });
  } catch {
    return { error: "Database error. Please try again." };
  }

  if (!user) return { error: "User not found." };

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "That email is already in use." };
  }

  let passwordHash = user.password;
  if (newPassword) {
    if (!currentPassword) return { error: "Please enter your current password to change it." };
    if (!verifyPassword(currentPassword, user.password)) {
      return { error: "Current password is incorrect." };
    }
    if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };
    if (newPassword !== confirmPassword) return { error: "Passwords do not match." };
    passwordHash = hashPassword(newPassword);
  }

  try {
    const updateData: {
      name: string;
      email: string;
      phone: string | null;
      bio: string | null;
      password: string;
      jobTitle?: string | null;
      department?: Department | null;
    } = {
      name,
      email,
      phone,
      bio,
      password: passwordHash,
    };

    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (department !== undefined) updateData.department = department;

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });
  } catch {
    return { error: "Failed to save changes. Please try again." };
  }

  await setSession({ userId: session.userId, role: session.role, name });

  return { success: "Profile updated successfully." };
}

export async function updateAvatar(
  base64: string
): Promise<{ error?: string; avatarUrl?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  if (!base64.startsWith("data:image/"))
    return { error: "Invalid image format." };

  // ~500 KB limit (base64 string is ~4/3 the binary size)
  if (base64.length > 700_000)
    return { error: "Image is too large. Please keep it under 500 KB." };

  try {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryUrl) {
      cloudinary.config({
        cloudinary_url: cloudinaryUrl,
        secure: true,
      });
    } else if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      return { error: "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET." };
    }

    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: "iruka-motors/avatars",
      resource_type: "image",
      public_id: `user_${session.userId}`,
      overwrite: true,
      invalidate: true,
    });

    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: uploaded.secure_url },
    });

    return { avatarUrl: uploaded.secure_url };
  } catch {
    return { error: "Failed to save photo. Please try again." };
  }
}

export async function getAllEmployees(searchQuery = "", page = 1, limit = 20) {
  await ensureAdmin();

  const search = searchQuery.trim();
  const employeeRoles: Role[] = ["EMPLOYEE", "MANAGER"];
  const where: Prisma.UserWhereInput = {
    role: { in: employeeRoles },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        jobTitle: true,
        role: true,
        isActive: true,
        isFirstLogin: true,
        emailStatus: true,
        emailSentAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    success: true,
    employees,
    total,
    page,
    limit,
  };
}

export async function getEmployeeById(id: string) {
  await ensureAdmin();

  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      jobTitle: true,
      role: true,
      isActive: true,
      isFirstLogin: true,
      emailStatus: true,
      emailSentAt: true,
      createdAt: true,
      emailLogs: {
        orderBy: { sentAt: "desc" },
        take: 5,
      },
    },
  });

  if (!employee || employee.role === "ADMIN") {
    return { success: false, error: "Not found" };
  }

  return { success: true, employee };
}

type UpdateEmployeeInput = {
  name: string;
  phone?: string;
  department?: Department | "";
  jobTitle?: string;
  role: "EMPLOYEE" | "MANAGER";
  isActive: boolean;
};

export async function updateEmployee(id: string, data: UpdateEmployeeInput) {
  await ensureAdmin();

  if (!data.name?.trim()) {
    return { success: false, error: "Name is required." };
  }

  const updateData: {
    name: string;
    phone: string | null;
    jobTitle: string | null;
    role: "EMPLOYEE" | "MANAGER";
    isActive: boolean;
    department?: Department | null;
  } = {
    name: data.name.trim(),
    phone: data.phone?.trim() || null,
    jobTitle: data.jobTitle?.trim() || null,
    role: data.role,
    isActive: data.isActive,
  };

  if (data.department !== undefined) {
    updateData.department = (data.department as Department) || null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      jobTitle: true,
      role: true,
      isActive: true,
      emailStatus: true,
      createdAt: true,
    },
  });

  return { success: true, employee: updated };
}

export async function deactivateEmployee(id: string) {
  await ensureAdmin();

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return { success: true };
}

export async function activateEmployee(id: string) {
  await ensureAdmin();

  await prisma.user.update({
    where: { id },
    data: { isActive: true },
  });

  return { success: true };
}

export async function getAdminDashboardStats() {
  await ensureAdmin();

  const employeeRoles: Role[] = ["EMPLOYEE", "MANAGER"];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [totalEmployees, newThisMonth, emailFailed, deactivated] = await Promise.all([
    prisma.user.count({ where: { role: { in: employeeRoles }, isActive: true } }),
    prisma.user.count({ where: { role: { in: employeeRoles }, createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { role: { in: employeeRoles }, emailStatus: "FAILED" } }),
    prisma.user.count({ where: { role: { in: employeeRoles }, isActive: false } }),
  ]);

  return { totalEmployees, newThisMonth, emailFailed, deactivated };
}

export async function getRecentEmployees(limit = 5) {
  await ensureAdmin();

  const employeeRoles: Role[] = ["EMPLOYEE", "MANAGER"];

  return prisma.user.findMany({
    where: { role: { in: employeeRoles } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      emailStatus: true,
    },
  });
}
