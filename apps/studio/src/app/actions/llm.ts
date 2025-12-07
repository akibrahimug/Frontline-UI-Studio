"use server";

import { auth } from "@/../../auth";
import { db } from "@refinery/core";
import { refactorComponent, type LLMRefactorResult } from "@refinery/llm";
import { revalidatePath } from "next/cache";
import { incrementVersion } from "@/lib/version";

export async function refactorComponentAction(
  componentId: string,
  sourceCodeOriginal: string
): Promise<{ success: boolean; versionId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify component access
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
      return { success: false, error: "Component not found" };
    }

    // Get Groq API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Groq API key not configured" };
    }

    // Call LLM to refactor
    let refactorResult: LLMRefactorResult;
    try {
      refactorResult = await refactorComponent(sourceCodeOriginal, apiKey);
    } catch (llmError) {
      console.error("LLM refactor error:", llmError);
      return {
        success: false,
        error: `AI refactor failed: ${llmError instanceof Error ? llmError.message : "Unknown error"}`,
      };
    }

    // Determine next version number
    const latestVersion = component.versions[0];
    const nextVersion = latestVersion
      ? incrementVersion(latestVersion.version)
      : "0.1.0";

    // Create new component version with refactored code
    const newVersion = await db.componentVersion.create({
      data: {
        componentId,
        version: nextVersion,
        sourceCodeOriginal,
        sourceCodeTransformed: refactorResult.transformedCode,
        docsMarkdown: refactorResult.docsMarkdown,
        createdById: session.user.id,
      },
    });

    revalidatePath(`/components/${componentId}`);

    return { success: true, versionId: newVersion.id };
  } catch (error) {
    console.error("Refactor component error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
