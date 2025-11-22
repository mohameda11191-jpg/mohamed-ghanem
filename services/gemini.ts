
import { GoogleGenAI, Type } from "@google/genai";
import { BoothRequirements } from "../types";

// Helper for exponential backoff retries
async function retryWithExponentialBackoff<T>(
  asyncOperation: () => Promise<T>,
  retries: number = 3,
  delay: number = 500, // Initial delay in ms
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await asyncOperation();
    } catch (error: any) {
      console.warn(`Attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`, error);
      if (i < retries - 1) {
        // Only retry for 500 errors, or if the error structure is not clearly defined
        if (error?.error?.code === 500 || error?.error?.status === "INTERNAL" || !error?.error?.code) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          // For client-side errors (e.g., 4xx) or other non-retryable errors, re-throw immediately
          throw error;
        }
      } else {
        throw error; // Last attempt failed, re-throw
      }
    }
  }
  throw new Error("Retry mechanism failed to execute operation."); // Should not be reached
}

// Helper to refine the prompt using a text model first for better image results
export const generateOptimizedPrompt = async (requirements: BoothRequirements): Promise<{ imagePrompt: string; rationale: string }> => {
  // Always instantiate GoogleGenAI right before an API call to ensure it uses the most up-to-date API key.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set. Please ensure process.env.API_KEY is defined in your environment.");
    throw new Error("Configuration Error: API Key is missing. Cannot call Gemini API.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey }); 
  const systemInstruction = `You are a world-class exhibition designer and 3D architectural visualizer. 
  Your task is to take user requirements for a trade show booth and convert them into a highly detailed, 
  photorealistic image generation prompt. 
  
  Also provide a brief "Design Rationale" explaining why this design works.`;

  const sizeDescription = `${requirements.length}${requirements.unit} x ${requirements.width}${requirements.unit} floor space, with a maximum height of ${requirements.height}${requirements.unit}.`;
  
  const purposeDescription = requirements.purpose.length > 0 
    ? `Main purposes include: ${requirements.purpose.join(', ')}. ${requirements.otherPurpose ? `Additional purpose: ${requirements.otherPurpose}.` : ''}`
    : `General purpose. ${requirements.otherPurpose ? `Additional purpose: ${requirements.otherPurpose}.` : ''}`;

  const elementsDescription = requirements.elements.length > 0
    ? `Key elements to include: ${requirements.elements.join(', ')}. ${requirements.otherElements ? `Other specific elements: ${requirements.otherElements}.` : ''}`
    : `${requirements.otherElements ? `Specific elements: ${requirements.otherElements}.` : ''}`;

  const storageDescription = requirements.storageRoomRequired 
    ? `A dedicated storage room is required. ${requirements.storageAreaNotes ? `Specific notes for storage: ${requirements.storageAreaNotes}.` : ''}`
    : 'No dedicated storage room.';

  let brandColorsDescription = `Primary brand colors: ${requirements.primaryBrandColors}.`;
  if (requirements.secondaryBrandColors) {
    brandColorsDescription += ` Secondary brand colors: ${requirements.secondaryBrandColors}.`;
  }
  
  let brandGuidelineNote = '';
  if (requirements.logoFileName && requirements.brandGuidelineAvailable) {
    brandGuidelineNote = ` A company logo has been provided separately, integrate it into the design following strict brand guidelines.`;
  } else if (requirements.logoFileName) {
    brandGuidelineNote = ` A company logo has been provided separately, integrate it into the design prominently.`;
  } else if (requirements.brandGuidelineAvailable) {
    brandGuidelineNote = ` Strict adherence to brand guidelines is essential.`;
  }
  
  const graphicsDescription = requirements.graphics.length > 0
    ? `Required graphics: ${requirements.graphics.join(', ')}. ${requirements.otherGraphics ? `Other graphic needs: ${requirements.otherGraphics}.` : ''}`
    : `${requirements.otherGraphics ? `Specific graphic needs: ${requirements.otherGraphics}.` : ''}`;

  const lightingDescription = requirements.lightingStyle.length > 0
    ? `Lighting style should feature: ${requirements.lightingStyle.join(', ')}. ${requirements.otherLighting ? `Other lighting specifics: ${requirements.otherLighting}.` : ''}`
    : `${requirements.otherLighting ? `Specific lighting: ${requirements.otherLighting}.` : ''}`;
  
  const materialsDescription = requirements.preferredMaterials.length > 0
    ? `Preferred materials: ${requirements.preferredMaterials.join(', ')}. ${requirements.otherMaterials ? `Other materials: ${requirements.otherMaterials}.` : ''}`
    : `${requirements.otherMaterials ? `Specific materials: ${requirements.otherMaterials}.` : ''}`;

  // Make these optional in the prompt
  const budgetPromptPart = requirements.estimatedBudget.trim() ? `- Budget Consideration: ${requirements.estimatedBudget.trim()}\n` : '';
  const referencesPromptPart = requirements.references.trim() ? `- References: ${requirements.references.trim()}\n` : '';
  const additionalNotesPromptPart = requirements.additionalNotes.trim() ? `- Additional Notes: ${requirements.additionalNotes.trim()}\n` : '';

  const userPrompt = `
    Design a photorealistic exhibition booth concept based on the following detailed requirements:
    - Industry: ${requirements.industry}
    - Booth Dimensions: ${sizeDescription}
    - ${storageDescription}
    - Purpose: ${purposeDescription}
    - Elements: ${elementsDescription}
    - Design Style: ${requirements.style}
    - Branding: ${brandColorsDescription}${brandGuidelineNote}
    - Graphics: ${graphicsDescription}
    - Lighting: ${lightingDescription}
    - Materials: ${materialsDescription}
    ${budgetPromptPart}
    ${referencesPromptPart}
    ${additionalNotesPromptPart}

    High-resolution 3D booth render, sharp details, realistic shadows, polished exhibition hall floor with reflections.  
    Include exhibition hall context and human figures to show booth scale. Unreal Engine 5 style.
    
    Return a JSON object with:
    1. "imagePrompt": A detailed descriptive prompt for an AI image generator (mentioning lighting, materials, perspective, 4k render, unreal engine 5 style).
    2. "rationale": A 2-sentence explanation of the design concept.
  `;

  let jsonText: string | undefined;
  try {
    const response = await retryWithExponentialBackoff(async () => {
      return ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              imagePrompt: { type: Type.STRING },
              rationale: { type: Type.STRING },
            },
            required: ['imagePrompt', 'rationale'],
          }
        }
      });
    });
    jsonText = response.text;
  } catch (apiError) {
    console.error("API error during prompt optimization:", apiError);
    throw apiError; // Re-throw the API error directly
  }

  if (!jsonText) {
    console.warn("No text returned from prompt optimization API, falling back to generic prompt.");
    return {
      imagePrompt: `Photorealistic trade show booth, ${requirements.length}${requirements.unit}x${requirements.width}${requirements.unit}, ${requirements.style} style, ${requirements.industry} industry, primary colors ${requirements.primaryBrandColors}. High quality 3d render, unreal engine 5.`,
      rationale: "Prompt optimization failed to return text, generated based on direct requirements, with detailed considerations for elements and aesthetics."
    };
  }

  try {
    const parsedResponse = JSON.parse(jsonText);
    // REMOVED: Prompt truncation logic
    return parsedResponse;
  } catch (parseError) {
    console.error("JSON parsing error for optimized prompt:", parseError, "Raw text:", jsonText);
    // Fallback if JSON parsing fails, but API call succeeded and returned some text
    return {
      imagePrompt: `Photorealistic trade show booth, ${requirements.length}${requirements.unit}x${requirements.width}${requirements.unit}, ${requirements.style} style, ${requirements.industry} industry, primary colors ${requirements.primaryBrandColors}. High quality 3d render, unreal engine 5.`,
      rationale: "Prompt optimization returned invalid JSON, generated based on direct requirements, with detailed considerations for elements and aesthetics."
    };
  }
};

export const generateBoothImage = async (
  imagePrompt: string,
  logoImage?: { data: string; mimeType: string } | null
): Promise<string> => {
  // Always instantiate GoogleGenAI right before an API call to ensure it uses the most up-to-date API key.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set. Please ensure process.env.API_KEY is defined in your environment.");
    throw new Error("Configuration Error: API Key is missing. Cannot call Gemini API.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey }); 
  
  try {
    const contents: (string | { inlineData: { data: string; mimeType: string; } } | { text: string; })[] = [];

    // Add logo image as the first part if provided
    if (logoImage) {
      contents.push({
        inlineData: {
          data: logoImage.data,
          mimeType: logoImage.mimeType,
        },
      });
    }

    // Add the text prompt
    contents.push({ text: imagePrompt });

    const response = await retryWithExponentialBackoff(async () => {
      return ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Using a model that does not require API key selection for billing
        contents: {
          parts: contents,
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9", // Set a common aspect ratio
          },
        }
      });
    });

    // Extract image from response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error, "Prompt used:", imagePrompt); // Log prompt on error
    throw error;
  }
};