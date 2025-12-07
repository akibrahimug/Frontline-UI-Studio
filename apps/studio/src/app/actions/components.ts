"use server";

import { auth } from "@/../../auth";
import { db } from "@refinery/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createComponentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const workspaceId = formData.get("workspaceId") as string;
  const name = formData.get("name") as string;

  if (!workspaceId || !name) {
    throw new Error("Workspace ID and component name are required");
  }

  // Verify workspace ownership
  const workspace = await db.workspace.findUnique({
    where: {
      id: workspaceId,
      ownerId: session.user.id,
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const slug = slugify(name);

  const component = await db.component.create({
    data: {
      name,
      slug,
      workspaceId,
      status: "draft",
    },
  });

  revalidatePath(`/workspaces/${workspaceId}`);
  redirect(`/components/${component.id}`);
}

export async function listComponentsAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  // Verify workspace ownership
  const workspace = await db.workspace.findUnique({
    where: {
      id: workspaceId,
      ownerId: session.user.id,
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return db.component.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getComponentAction(componentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const component = await db.component.findUnique({
    where: {
      id: componentId,
    },
    include: {
      workspace: true,
      versions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!component || component.workspace.ownerId !== session.user.id) {
    throw new Error("Component not found");
  }

  return component;
}

export async function createComponentVersionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const componentId = formData.get("componentId") as string;
  const version = formData.get("version") as string;
  const sourceCodeOriginal = formData.get("sourceCodeOriginal") as string;

  if (!componentId || !version || !sourceCodeOriginal) {
    throw new Error("Component ID, version, and source code are required");
  }

  // Verify component access
  const component = await db.component.findUnique({
    where: {
      id: componentId,
    },
    include: {
      workspace: true,
    },
  });

  if (!component || component.workspace.ownerId !== session.user.id) {
    throw new Error("Component not found");
  }

  const componentVersion = await db.componentVersion.create({
    data: {
      componentId,
      version,
      sourceCodeOriginal,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/components/${componentId}`);
  return componentVersion;
}

export async function getComponentVersionsAction(componentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify component access
  const component = await db.component.findUnique({
    where: {
      id: componentId,
    },
    include: {
      workspace: true,
    },
  });

  if (!component || component.workspace.ownerId !== session.user.id) {
    throw new Error("Component not found");
  }

  return db.componentVersion.findMany({
    where: {
      componentId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getComponentVersionAction(versionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const version = await db.componentVersion.findUnique({
    where: {
      id: versionId,
    },
    include: {
      component: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!version || version.component.workspace.ownerId !== session.user.id) {
    throw new Error("Version not found");
  }

  return version;
}
