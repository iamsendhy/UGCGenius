
import { GoogleGenAI, Type } from "@google/genai";
import { ProductAnalysis, UGCPrompt, AspectRatio, VoiceStyle, CampaignGoal, TargetPlatform, VideoDuration } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const analyzeProduct = async (url: string): Promise<ProductAnalysis> => {
  const ai = getAIClient();
  const modelName = 'gemini-3-flash-preview';

  const prompt = `Analyze this product from the URL: ${url}. 
    Focus on creating UGC content. Identify: product name, brand, key features, core selling points, target audience, 
    specific pain points it solves, a "Viral Angle" (what makes it trend-worthy), and a tone recommendation.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          brand: { type: Type.STRING },
          keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
          sellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetAudience: { type: Type.STRING },
          painPointsSolved: { type: Type.ARRAY, items: { type: Type.STRING } },
          viralAngle: { type: Type.STRING },
          toneRecommendation: { type: Type.STRING },
        },
        required: ["name", "brand", "keyFeatures", "sellingPoints", "targetAudience", "painPointsSolved", "viralAngle", "toneRecommendation"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as ProductAnalysis;
};

export const generateUGCPrompt = async (
  analysis: ProductAnalysis, 
  language: 'en' | 'id', 
  voiceStyle: VoiceStyle,
  goal: CampaignGoal,
  platform: TargetPlatform,
  duration: VideoDuration
): Promise<UGCPrompt> => {
  const ai = getAIClient();
  const modelName = 'gemini-3-flash-preview';

  const langText = language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English';
  const prompt = `Based on this product analysis: ${JSON.stringify(analysis)}, generate a high-converting UGC script.
    
    CAMPAIGN SPECIFICATIONS:
    - Goal: ${goal}
    - Platform: ${platform}
    - Duration: ${duration}
    - Voice Style: ${voiceStyle}
    - Language: ${langText} (Use slang/natural terms common in UGC if suitable)

    INSTRUCTIONS:
    1. Create a "Hook" that stops the scroll in the first 3 seconds.
    2. The "Body" should focus on the ${goal} aspect using the ${analysis.viralAngle}.
    3. The "CTA" should be direct and natural.
    4. Provide exactly 4-6 scenes.
    5. Each scene must have:
       - visual_action: What the creator is doing on camera.
       - voice_over: The actual script to speak.
       - tempo: (Fast, Moderate, Slow)
       - camera_settings: (Close-up, POV, Wide, etc.)`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING },
          body: { type: Type.STRING },
          cta: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                visual_action: { type: Type.STRING },
                voice_over: { type: Type.STRING },
                tempo: { type: Type.STRING },
                camera_settings: { type: Type.STRING }
              },
              required: ["visual_action", "voice_over", "tempo", "camera_settings"]
            }
          }
        },
        required: ["hook", "body", "cta", "scenes"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as UGCPrompt;
};

export const generateCoverImage = async (
  ugcPrompt: UGCPrompt, 
  analysis: ProductAnalysis, 
  aspectRatio: AspectRatio,
  referenceImage?: string,
  characterImage?: string,
  customInstruction?: string
): Promise<string> => {
  const ai = getAIClient();
  const modelName = 'gemini-2.5-flash-image';

  let visualPrompt = `Viral TikTok/Reels thumbnail for "${analysis.name}". 
    Style: UGC aesthetic, authentic, high-quality mobile cinematography.
    Concept: ${ugcPrompt.hook}.
    Vibe: ${analysis.toneRecommendation}.
    NO TEXT. One single focus shot. No collage.`;

  if (customInstruction) visualPrompt += `\nInstructions: ${customInstruction}`;

  const parts: any[] = [{ text: visualPrompt }];

  if (referenceImage) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: referenceImage } });
  }

  if (characterImage) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: characterImage } });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      imageConfig: { aspectRatio: aspectRatio as any }
    }
  });

  const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (imgPart?.inlineData) {
    return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
  }

  throw new Error("Failed to generate image.");
};
