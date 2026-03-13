
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ProductAnalysis, UGCPrompt, AspectRatio, VoiceStyle, CampaignGoal, TargetPlatform, VideoDuration, ScriptStyle } from "../types";

const getAIClient = (apiKey: string) => {
  return new GoogleGenerativeAI(apiKey);
};

// Model yang tersedia untuk API Key ini (verified dari listModels)
const TEXT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro'
];

const IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-exp'
];

export const testConnection = async (apiKey: string): Promise<boolean> => {
  const genAI = getAIClient(apiKey);
  const errors: string[] = [];
  
  for (const modelName of TEXT_MODELS) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Respond with "OK".');
      const response = await result.response;
      const text = response.text();

      if (text.toLowerCase().includes('ok')) {
        console.log(`✓ Connected using model: ${modelName}`);
        return true;
      }
    } catch (err: any) {
      const msg = err.message || JSON.stringify(err);
      console.error(`✗ Model ${modelName} failed:`, msg);
      errors.push(`${modelName}: ${msg}`);
      continue;
    }
  }
  
  throw new Error(`Koneksi Gagal ke Semua Model:\n\n${errors.join('\n')}\n\nSaran: Pastikan API Key Anda aktif dan Anda memiliki akses ke Gemini API di Google AI Studio.`);
};

export const analyzeProduct = async (url: string, apiKey: string): Promise<ProductAnalysis> => {
  const genAI = getAIClient(apiKey);
  
  // Coba model yang tersedia secara berurutan
  for (const modelName of TEXT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              brand: { type: SchemaType.STRING },
              keyFeatures: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              sellingPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              targetAudience: { type: SchemaType.STRING },
              painPointsSolved: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              viralAngle: { type: SchemaType.STRING },
              toneRecommendation: { type: SchemaType.STRING },
            },
            required: ["name", "brand", "keyFeatures", "sellingPoints", "targetAudience", "painPointsSolved", "viralAngle", "toneRecommendation"]
          }
        }
      });

      const prompt = `Analyze this product from the URL: ${url}.
    Focus on creating UGC content. Identify: product name, brand, key features, core selling points, target audience,
    specific pain points it solves, a "Viral Angle" (what makes it trend-worthy), and a tone recommendation.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ analyzeProduct using model: ${modelName}`);
      
      if (!text) {
        throw new Error('Empty response from API');
      }
      
      try {
        const parsed = JSON.parse(text) as ProductAnalysis;
        console.log('✅ Product analysis:', {
          name: parsed.name,
          brand: parsed.brand,
          featuresCount: parsed.keyFeatures?.length || 0,
          sellingPointsCount: parsed.sellingPoints?.length || 0
        });
        return parsed;
      } catch (parseErr: any) {
        console.error('JSON Parse Error:', parseErr.message);
        console.error('Raw response:', text.substring(0, 500));
        throw new Error(`Failed to parse product analysis: ${parseErr.message}`);
      }
    } catch (err: any) {
      console.log(`⚠️ Model ${modelName} failed:`, err.message);
      continue;
    }
  }
  
  throw new Error('No available model for product analysis');
};

export const generateUGCPrompt = async (
  analysis: ProductAnalysis,
  language: 'en' | 'id',
  voiceStyle: VoiceStyle,
  scriptStyle: ScriptStyle,
  goal: CampaignGoal,
  platform: TargetPlatform,
  duration: VideoDuration,
  apiKey: string
): Promise<UGCPrompt> => {
  const genAI = getAIClient(apiKey);
  
  // Script style descriptions
  const styleDescriptions: Record<ScriptStyle, string> = {
    pain_killer: 'The Pain Killer: "Masalah [A] membuat saya stres, tapi [Produk] menyelamatkan saya." - Focus pada masalah yang menyakitkan dan bagaimana produk menjadi solusi.',
    skeptic_disarmer: 'The Skeptic Disarmer: "Saya belum pernah coba ini sebelumnya, percaya atau tidak..." - Pendekatan skeptis yang jujur untuk membangun kepercayaan.',
    social_proof: 'The Social Proof: "[Orang terdekat] saya baru pakai ini [X hari], dan hasilnya..." - Gunakan testimoni dan bukti sosial.',
    bold_promise: 'The Bold Promise: "Bagaimana jika saya katakan Anda bisa [Hasil Besar]? Ini buktinya." - Janji hasil yang berani dengan bukti.',
    redemption_story: 'The Redemption Story: "Saya sudah coba semua cara [Daftar Kegagalan], sampai saya temukan ini." - Cerita perjalanan dari kegagalan ke kesuksesan.'
  };

  // Coba model yang tersedia secara berurutan
  for (const modelName of TEXT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              hook: { type: SchemaType.STRING },
              body: { type: SchemaType.STRING },
              cta: { type: SchemaType.STRING },
              scenes: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    visual_action: { type: SchemaType.STRING },
                    voice_over: { type: SchemaType.STRING },
                    tempo: { type: SchemaType.STRING },
                    camera_settings: { type: SchemaType.STRING }
                  },
                  required: ["visual_action", "voice_over", "tempo", "camera_settings"]
                }
              }
            },
            required: ["hook", "body", "cta", "scenes"]
          }
        }
      });

      const langText = language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English';
      const prompt = `Based on this product analysis: ${JSON.stringify(analysis)}, generate a high-converting UGC script.

    CAMPAIGN SPECIFICATIONS:
    - Goal: ${goal}
    - Platform: ${platform}
    - Duration: ${duration}
    - Voice Style: ${voiceStyle}
    - Language: ${langText} (Use slang/natural terms common in UGC if suitable)
    - SCRIPT STYLE: ${scriptStyle.toUpperCase()} - ${styleDescriptions[scriptStyle]}

    INSTRUCTIONS:
    1. Create a "Hook" that stops the scroll in the first 3 seconds using the ${scriptStyle} approach.
    2. The "Body" should follow the ${scriptStyle} formula while focusing on the ${goal} aspect.
    3. The "CTA" should be direct and natural, matching the ${scriptStyle} tone.
    4. Provide exactly 4-6 scenes.
    5. Make it authentic, relatable, and scroll-stopping!`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ generateUGCPrompt using model: ${modelName}`);
      console.log('📝 Raw response:', text.substring(0, 200) + '...');
      
      if (!text) {
        throw new Error('Empty response from API');
      }
      
      try {
        const parsed = JSON.parse(text) as UGCPrompt;
        
        // Validate required fields
        if (!parsed.hook || !parsed.body || !parsed.cta || !parsed.scenes) {
          console.error('Invalid response structure:', parsed);
          throw new Error('Response missing required fields (hook, body, cta, or scenes)');
        }
        
        if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
          console.error('Scenes is not an array or empty:', parsed.scenes);
          throw new Error('Response scenes is invalid or empty');
        }
        
        console.log('✅ Validated UGC prompt:', {
          hook: parsed.hook.substring(0, 50),
          body: parsed.body.substring(0, 50),
          cta: parsed.cta.substring(0, 50),
          scenesCount: parsed.scenes.length
        });
        
        return parsed;
      } catch (parseErr: any) {
        console.error('JSON Parse Error:', parseErr.message);
        console.error('Raw response that failed to parse:', text);
        throw new Error(`Failed to parse response as JSON: ${parseErr.message}`);
      }
    } catch (err: any) {
      console.log(`⚠️ Model ${modelName} failed:`, err.message);
      continue;
    }
  }
  
  throw new Error('No available model for UGC prompt generation');
};

export const generateCoverImage = async (
  ugcPrompt: UGCPrompt,
  analysis: ProductAnalysis,
  aspectRatio: AspectRatio,
  referenceImage: string | undefined,
  characterImage: string | undefined,
  customInstruction: string | undefined,
  apiKey: string
): Promise<string> => {
  const genAI = getAIClient(apiKey);

  // Note: @google/generative-ai package doesn't support image generation directly
  // Instead, we generate a detailed image prompt that can be used with image generation tools
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    let visualPrompt = `Create a detailed image generation prompt for a viral TikTok/Reels thumbnail.
    
    Product: ${analysis.name}
    Brand: ${analysis.brand}
    Concept: ${ugcPrompt.hook}
    Style: UGC aesthetic, authentic, high-quality mobile cinematography
    Vibe: ${analysis.toneRecommendation}
    
    Requirements:
    - NO TEXT on image
    - One single focus shot
    - No collage
    - Vertical format (9:16 aspect ratio for TikTok/Reels)
    - Eye-catching, scroll-stopping visual
    - Natural, authentic UGC style`;

    if (customInstruction) visualPrompt += `\n\nAdditional Instructions: ${customInstruction}`;

    const result = await model.generateContent(visualPrompt);
    const response = await result.response;
    const imagePrompt = response.text();
    
    console.log('✅ Generated image prompt');
    
    // Return as data URL with the prompt (since we can't generate actual images)
    // In production, you would call an image generation API here
    throw new Error('Image generation requires external service. Use this prompt with Midjourney, DALL-E, or Stable Diffusion:\n\n' + imagePrompt);
    
  } catch (err: any) {
    console.error('❌ Image generation failed:', err.message);
    throw err;
  }
};
