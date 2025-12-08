import { LLMRefactorResultSchema, type LLMRefactorResult } from "./types";

const REFACTOR_PROMPT = `You are an expert React/Next.js developer and technical writer. Your task is to refactor and modernize React components while generating comprehensive documentation.

When refactoring components:
1. Use modern React patterns (hooks, functional components)
2. Apply TypeScript best practices with proper typing
3. Follow Tailwind CSS conventions if styling is present
4. Improve code readability and maintainability
5. Add proper prop validation
6. Remove unnecessary code and optimize performance
7. Ensure accessibility (a11y) best practices

Please refactor the following React component:

\`\`\`tsx
{CODE}
\`\`\`

Provide your response as a JSON object with these fields:
- transformedCode: The complete refactored component code
- commentary: Markdown explanation of changes made and why
- docsMarkdown: Full component documentation with usage examples in markdown
- props: Array of objects with {name, type, required, description, defaultValue}
- breakingChanges: Array of breaking changes as strings
- suggestions: Array of improvement suggestions as strings
- testIdeas: Array of test case ideas as strings

Focus on practical, production-ready improvements.`;

export async function refactorComponent(
  sourceCode: string,
  apiKey: string
): Promise<LLMRefactorResult> {
  if (!apiKey) {
    throw new Error("Groq API key is required");
  }

  if (!sourceCode || sourceCode.trim().length === 0) {
    throw new Error("Source code is required");
  }

  const prompt = REFACTOR_PROMPT.replace("{CODE}", sourceCode);

  try {
    // Using Groq API - Fast, free, and reliable
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.3,
          top_p: 0.9,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Handle chat completions format
    let generatedText: string;

    if (result.choices && result.choices[0]?.message?.content) {
      // OpenAI-compatible format
      generatedText = result.choices[0].message.content;
    } else if (Array.isArray(result)) {
      // Array format
      generatedText = result[0]?.generated_text || "";
    } else if (result.generated_text) {
      // Direct generated_text
      generatedText = result.generated_text;
    } else {
      console.error("Unexpected response format:", result);
      throw new Error("No generated text in response");
    }

    if (!generatedText) {
      throw new Error("No generated text in response");
    }

    // With JSON mode enabled, the response should be valid JSON
    const trimmedText = generatedText.trim();

    // Parse the JSON (should be valid since we're using JSON mode)
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(trimmedText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.log("Response text (first 500 chars):", trimmedText.substring(0, 500));
      throw new Error("Failed to parse LLM response. The model may not have returned valid JSON.");
    }

    // Validate against our schema
    const validatedResult = LLMRefactorResultSchema.parse(parsedResult);

    return validatedResult;
  } catch (error) {
    console.error("Error refactoring component:", error);

    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse LLM response as JSON. The model may not have returned valid JSON.");
    }

    throw new Error(
      `Failed to refactor component: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
