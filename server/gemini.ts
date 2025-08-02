import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";
import { db } from "./db";
import { apiUsage } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Helper function to log API usage
async function logApiUsage(
  operation: string,
  model: string,
  estimatedCost: number,
  metadata?: any,
) {
  try {
    await db.insert(apiUsage).values({
      provider: "gemini",
      operation,
      model,
      cost: estimatedCost.toString(),
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });
    console.log(
      `API Usage: ${operation} with ${model} - estimated cost: $${estimatedCost}`,
    );
  } catch (error) {
    console.error("Failed to log API usage:", error);
  }
}

interface GenerateStoryParams {
  theme: {
    name: string;
    description: string;
  };
  character: {
    name: string;
    description: string;
  };
  length?: {
    id: string;
    name: string;
    description: string;
    estimatedTime: string;
    bytes: string;
  };
  message?: string;
  language?: string;
}

export interface GeneratedStory {
  title: string;
  content: string;
  imagePrompt: string;
  tags: string[];
  readingTime: number;
}

export interface GeneratedStoryIllustration {
  imageBuffer: Buffer;
  prompt: string;
}

export async function generateStory({
  theme,
  character,
  length,
  message,
  language = "en",
}: GenerateStoryParams): Promise<GeneratedStory> {
  try {
    // Language-specific prompts
    const isKorean = language === "ko";

    // Generate length-specific instructions based on selected length
    const getLengthInstructions = (length?: any) => {
      if (!length) {
        // Default to medium length if not specified
        return isKorean
          ? "당신의 동화는 항상 4000 ~ 6000 byte 분량이며, 최소한 4,000byte는 넘어야 합니다."
          : "Your fairy tales should be 4,000 to 6,000 bytes in length, and must be at least 4,000 bytes.";
      }

      switch (length.id) {
        case "short":
          return isKorean
            ? "당신의 동화는 항상 3000 ~ 4000 byte 분량이며, 최소한 3,000byte는 넘어야 합니다. 간결하면서도 완성도 있는 이야기여야 합니다."
            : "Your fairy tales should be 3,000 to 4,000 bytes in length, and must be at least 3,000 bytes. concise yet complete stories.";
        case "medium":
          return isKorean
            ? "당신의 동화는 항상 4000 ~ 6000 byte 분량이며, 최소한 4,000byte는 넘어야 합니다."
            : "Your fairy tales should be 5,000 to 6,000 bytes in length, and must be at least 4,000 bytes.";
        case "long":
          return isKorean
            ? "당신의 동화는 항상 6000 ~ 8000 byte 분량이며, 최소한 6,000byte는 넘어야 합니다."
            : "Your fairy tales should be 6,000 to 8,000 bytes in length, and must be at least 6,000 bytes.";
        default:
          return isKorean
            ? "당신의 동화는 항상 4000 ~ 6000 byte 분량이며, 최소한 4,000byte는 넘어야 합니다."
            : "Your fairy tales should be 4,000 to 6,000 bytes in length, and must be at least 4,000 bytes.";
      }
    };

    const lengthInstructions = getLengthInstructions(length);

    const systemPrompt = isKorean
      ? `당신은 최고의 동화 작가입니다. 0~3세 이하의 아동을 대상으로 하는 몰입감 있는 동화를 만들어냅니다. 일상 속 작고 소소한 소재부터 상상력 넘치는 배경과 사건까지 다양한 주제를 통해서, 아이들의 정서에 도움이 되고 소중한 가치들을 배울 수 있도록 작성해주세요. 하지만 교훈이 억지스럽게 전달되지는 않고, 동화의 내용을 통해 자연스럽게 전달되어야 합니다. 재미있는 상황 설정으로 몰입감을 더해주세요.\n\n모든 동화는 기승전결을 갖추고 있습니다. 상황이나 사건을 제시하고 이를 주인공이 해결하거나 경험해나가는 과정이 완결적으로 동화 안에 담겨야 합니다.\n동화는 중간 제목을 사용하지 않고, 하나의 흐름으로 몰입감 있게 이야기를 이끌어 나갑니다.\n분량을 맞추는 것은 매우 중요합니다. ${lengthInstructions}\n\n**중요한 서식 규칙:**\n- 각 문단은 2-4개의 문장으로 구성\n- 문단과 문단 사이에는 반드시 빈 줄(\\n\\n)을 삽입\n- 대화가 있을 때는 새로운 문단으로 시작\n- 장면이 바뀔 때마다 새로운 문단으로 구분\n- 문단 내에서는 한 줄로 이어서 작성`
      : `You are the best fairy tale writer. You create immersive fairy tales for children aged 0-3 years old. Through a variety of themes, from small, everyday subjects to imaginative settings and events, your stories help children's emotional development and teach them valuable lessons. However, the moral of the story should not be forced; it should be conveyed naturally through the content of the fairy tale. Enhance immersion with engaging scenarios.\n\nEvery fairy tale has a complete narrative arc (introduction, development, climax, and conclusion). The story should present a situation or event and show the protagonist resolving it or experiencing it in a complete, self-contained narrative.\nFairy tales do not use subheadings; they lead the story in a single, immersive flow.\nLength is very important. ${lengthInstructions}\n\n**Important formatting rules:**\n- Each paragraph should contain 2-4 sentences\n- Always insert a blank line (\\n\\n) between paragraphs\n- Start a new paragraph for dialogue\n- Start a new paragraph when scenes change\n- Within a paragraph, write in a continuous flow`;

    const userPrompt = isKorean
      ? `다음 매개변수로 동화를 만들어주세요:
            - 다음에 관련된 요소를 포함: ${theme.name} - ${theme.description}
            - 주인공의 이름: ${character.name}
            - 동화에 자연스럽게 포함되어야 하는 메시지 (선택사항): ${message || "제공되지 않음"}
            
            다음을 포함한 JSON 객체로 응답해주세요:
            - title: 동화 제목
            - content: 전체 동화 내용
            - imagePrompt: 이 동화의 삽화를 생성하기 위한 간단한 설명
            - tags: 3-5개의 관련 태그 배열 (# 기호 없이)
            - readingTime: 예상 읽기 시간(몇 분인지 숫자로만 표시할 것. 초 단위는 표시하지 않음. ex. 5)`
      : `Please create a fairy tale with these parameters:
            - Theme: ${theme.name} - ${theme.description}
            - Main character: ${character.name}
            - Personal message to include (optional): ${message || "None provided"}
            
            Respond with a JSON object containing:
            - title: The story title
            - content: The full story text
            - imagePrompt: A brief description to generate an illustration for this story
            - tags: An array of 3-5 relevant tags (without the # symbol)
            - readingTime: Estimated reading time in minutes(Display only the number of minutes, no seconds. e.g., 5)`;

    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            imagePrompt: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            readingTime: { type: "number" },
          },
          required: ["title", "content", "imagePrompt", "tags", "readingTime"],
        },
      },
      contents: userPrompt,
    });

    // Log API usage (estimated cost for text generation: ~$0.001 per 1000 tokens)
    const duration = Date.now() - startTime;
    await logApiUsage(
      "story_generation",
      "gemini-2.5-flash",
      0.002, // Estimated cost for story generation
      {
        theme: theme.name,
        character: character.name,
        language,
        duration,
        promptLength: userPrompt.length,
      },
    );

    const result = JSON.parse(response.text || "{}") as GeneratedStory;

    if (!result.title || !result.content) {
      throw new Error("Invalid response from Gemini API");
    }

    // Fix line break formatting: convert literal \n\n to actual line breaks
    if (result.content) {
      result.content = result.content
        .replace(/\\n\\n/g, "\n\n")
        .replace(/\\n/g, "\n");
    }

    return result;
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error(`Failed to generate story: ${error}`);
  }
}

export async function generateStoryIllustration(
  storyTitle: string,
  storyContent: string,
  storyTheme?: string,
  customImagePrompt?: string,
): Promise<GeneratedStoryIllustration> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Always use imagePrompt from story generation - it's required
    if (!customImagePrompt) {
      throw new Error("imagePrompt is required for illustration generation");
    }

    const illustrationPrompt = createIllustrationPromptFromImagePrompt(
      storyTitle,
      customImagePrompt,
      storyTheme,
    );

    console.log("🎨 Generating illustration for story:", storyTitle);
    console.log(
      "📝 Using prompt:",
      illustrationPrompt.substring(0, 200) + "...",
    );

    const startTime = Date.now();

    // IMPORTANT: only this gemini model supports image generation
    console.log("🚀 Calling Gemini API for image generation...");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: illustrationPrompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    console.log("📡 Gemini API response received, processing...");

    // Log API usage (official Google pricing: $0.039 per 1024x1024 image)
    const duration = Date.now() - startTime;
    await logApiUsage(
      "image_generation",
      "gemini-2.0-flash-exp",
      0.039, // Official Google pricing: $30 per 1M tokens, 1290 tokens per image
      {
        storyTitle,
        duration,
        promptLength: illustrationPrompt.length,
      },
    );

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No image candidates generated");
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("No content parts in response");
    }

    // Find the image part
    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageBuffer = Buffer.from(part.inlineData.data, "base64");
        console.log("✅ Story illustration generated successfully");

        return {
          imageBuffer,
          prompt: illustrationPrompt,
        };
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("❌ Failed to generate story illustration:", error);
    throw new Error(`Failed to generate story illustration: ${error}`);
  }
}

// Removed createIllustrationPrompt function as it's no longer needed
// Story generation always provides imagePrompt, so we don't need to extract visual elements from content

function createIllustrationPromptFromImagePrompt(
  title: string,
  imagePrompt: string,
  theme?: string,
): string {
  const basePrompt = `Generate an image for a children's book illustration, designed with a sophisticated and artistic appeal suitable for adults without any text or writing. Use elegant flat design with soft textures and harmonious colors.

STORY CONTEXT:
Title: "${title}"
${theme ? `Theme: ${theme}` : ""}
Image Description: ${imagePrompt}

STYLE REQUIREMENTS:
- Elegant flat design with soft textures and harmonious colors
- Simplified yet expressive shapes for sophisticated visual storytelling
- Professional children's book illustration quality
- Size: 800 x 600 pixels
- Warm, inviting color palette suitable for prenatal storytelling

STRICT PROHIBITION - NEVER INCLUDE:
- No Korean text (한국어 텍스트 절대 금지)
- No English text 
- No numbers or symbols
- No letters of any alphabet
- No written characters whatsoever
- No speech bubbles or text areas
- No signs with writing
- No books with visible text
- No labels or captions

FOCUS ON: FLAT DESIGN. Pure visual storytelling through characters, scenes, colors and composition only. Elegant flat design with soft textures and harmonious colors.

Create a beautiful, serene illustration based on the provided image description while maintaining a sophisticated artistic style perfect for expectant parents.`;

  return basePrompt;
}

// Simplified image generation process - uses imagePrompt directly from story generation

export async function saveGeneratedImageToSupabase(
  imageBuffer: Buffer,
  uniqueId: string,
): Promise<string> {
  const filename = `${uniqueId}.png`;

  try {
    // Save to local tmp first
    const localPath = `/tmp/${filename}`;
    fs.writeFileSync(localPath, imageBuffer);
    console.log(`✅ Generated image saved locally as ${localPath}`);

    // Upload to Supabase Storage
    const supabaseUrl = await uploadToSupabaseStorage(imageBuffer, filename);
    console.log(`✅ Image uploaded to Supabase: ${supabaseUrl}`);

    return supabaseUrl;
  } catch (error) {
    console.error("❌ Failed to save generated image:", error);
    throw new Error(`Failed to save generated image: ${error}`);
  }
}

async function uploadToSupabaseStorage(
  imageBuffer: Buffer,
  filename: string,
): Promise<string> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL environment variable is not set");
    }

    if (!supabaseKey) {
      throw new Error(
        "SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable is not set",
      );
    }

    // Upload to Supabase Storage using REST API
    const uploadUrl = `${supabaseUrl}/storage/v1/object/images/${filename}`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "image/png",
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Supabase upload error details:");
      console.error("- Status:", response.status);
      console.error("- Error text:", error);
      console.error("- Upload URL:", uploadUrl);
      console.error("- Filename:", filename);
      throw new Error(`Supabase upload failed: ${response.status} - ${error}`);
    }

    // Return the public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/images/${filename}`;
    return publicUrl;
  } catch (error) {
    console.error("Error uploading to Supabase:", error);
    throw error;
  }
}
