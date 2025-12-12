"use server";

import { auth } from "@/../../auth";
import { db, assertWorkspaceMember, assertComponentAccess } from "@refinery/core";
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

  // Verify workspace membership
  await assertWorkspaceMember(workspaceId, session.user.id);

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

  // Verify workspace membership
  await assertWorkspaceMember(workspaceId, session.user.id);

  return db.component.findMany({
    where: {
      workspaceId,
    },
    include: {
      versions: {
        select: {
          id: true,
          version: true,
          isCanonical: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
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

  // Verify component access via workspace membership
  await assertComponentAccess(componentId, session.user.id);

  // Fetch component with versions (access already verified)
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

  if (!component) {
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

  // Verify component access via workspace membership
  await assertComponentAccess(componentId, session.user.id);

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

  // Verify component access via workspace membership
  await assertComponentAccess(componentId, session.user.id);

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

  if (!version) {
    throw new Error("Version not found");
  }

  // Verify component access via workspace membership
  await assertComponentAccess(version.componentId, session.user.id);

  return version;
}

export async function setCanonicalVersionAction(versionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the version and verify access
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

  if (!version) {
    throw new Error("Version not found");
  }

  // Verify component access via workspace membership
  await assertComponentAccess(version.componentId, session.user.id);

  // Unset all other canonical versions for this component
  await db.componentVersion.updateMany({
    where: {
      componentId: version.componentId,
      isCanonical: true,
    },
    data: {
      isCanonical: false,
    },
  });

  // Set this version as canonical
  const updatedVersion = await db.componentVersion.update({
    where: {
      id: versionId,
    },
    data: {
      isCanonical: true,
    },
  });

  revalidatePath(`/components/${version.componentId}`);
  revalidatePath(`/workspaces/${version.component.workspaceId}`);

  return updatedVersion;
}
